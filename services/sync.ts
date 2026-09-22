import { readGuild } from "./guild";
import { overtakeEvents } from "../features/observations";
import { characters, characterId, campaigns } from "../config/characters";
import { database, settings } from "../db/client";
import { blizzard } from "../providers/blizzard";
import { warcraftLogs } from "../providers/warcraft-logs";
import { ProviderError } from "../providers/http";
import { changedEvents } from "../features/analytics";
import type { Profile, Logs, Activity } from "../features/types";
export function stable(value: any): string {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .filter(
          (k) =>
            !["observedAt", "resourceTimes", "sourceModified"].includes(k) &&
            value[k] !== undefined,
        )
        .sort()
        .map((k) => JSON.stringify(k) + ":" + stable(value[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
async function hash(value: any) {
  const b = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(stable(value)),
  );
  return Array.from(new Uint8Array(b))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function sync(force = false) {
  const db = database(),
    s = settings(),
    owner = crypto.randomUUID(),
    now = Date.now();
  const minutes = Math.max(
    5,
    Number(s.SYNC_INTERVAL_MINUTES) ||
      (Number(s.SYNC_INTERVAL_HOURS) || 3) * 60,
  );
  await db
    .prepare("INSERT OR IGNORE INTO sync_state(id) VALUES (?)")
    .bind("guild")
    .run();
  const lock = await db
    .prepare(
      "UPDATE sync_state SET owner=?, lease_until=? WHERE id=? AND lease_until<? AND (?=1 OR last_run<?)",
    )
    .bind(
      owner,
      now + 900000,
      "guild",
      now,
      force ? 1 : 0,
      now - minutes * 60000,
    )
    .run();
  if (!lock.meta.changes)
    return { status: "skipped", reason: "not-due-or-running" };
  const before = (await readGuild()).members;
  const result: { name: string; status: string; errors: string[] }[] = [];
  let blizzardBlocked = false,
    logsBlocked = false,
    cooldownSeconds = 0;
  try {
    await db.batch(
      Object.entries(campaigns).map(([id, c]) =>
        db
          .prepare(
            "INSERT INTO campaigns(id,name,active) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, active=excluded.active",
          )
          .bind(id, c.name, c.active ? 1 : 0),
      ),
    );
    for (const c of characters) {
      if (!campaigns[c.campaign].active) continue;
      const id = characterId(c),
        at = new Date().toISOString();
      await db
        .prepare("UPDATE sync_state SET lease_until=? WHERE id=? AND owner=?")
        .bind(Date.now() + 900000, "guild", owner)
        .run();
      await db
        .prepare(
          "INSERT INTO characters(id,campaign_id,name,realm,region,added_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name",
        )
        .bind(id, c.campaign, c.name, c.realm, c.region, at)
        .run();
      const row = await db
        .prepare("SELECT profile,logs FROM characters WHERE id=?")
        .bind(id)
        .first<{ profile: string; logs: string | null }>();
      const old: Profile = JSON.parse(row?.profile ?? "{}");
      let profile = old,
        logs: Logs | undefined = row?.logs ? JSON.parse(row.logs) : undefined;
      let profileOk = false,
        logsOk = false;
      const errors: string[] = [];
      try {
        if (blizzardBlocked) throw new ProviderError("deferred-rate-limit");
        const p = await blizzard(c, s, old);
        profile = p.data;
        errors.push(...p.errors.map((x) => "blizzard:" + x));
        profileOk = true;
        cooldownSeconds = Math.max(cooldownSeconds, p.retryAfter);
        if (p.errors.some((x) => x.includes("rate-limited")))
          blizzardBlocked = true;
      } catch (e) {
        if (e instanceof ProviderError && e.code === "rate-limited") {
          blizzardBlocked = true;
          cooldownSeconds = Math.max(cooldownSeconds, e.retryAfter);
        }
        errors.push(
          "blizzard:" +
            (e instanceof ProviderError ? e.code : "invalid-response"),
        );
      }
      try {
        if (logsBlocked) throw new ProviderError("deferred-rate-limit");
        logs = await warcraftLogs(c, s, logs);
        logsOk = true;
        errors.push(...(logs.errors ?? []).map((x) => "logs:" + x));
      } catch (e) {
        if (e instanceof ProviderError && e.code === "rate-limited") {
          logsBlocked = true;
          cooldownSeconds = Math.max(cooldownSeconds, e.retryAfter);
        }
        errors.push(
          "logs:" + (e instanceof ProviderError ? e.code : "invalid-response"),
        );
      }
      const statements: D1PreparedStatement[] = [];
      const status =
        profileOk || logsOk
          ? errors.length
            ? "partial"
            : "ok"
          : old.observedAt || logs
            ? "stale"
            : "pending";
      statements.push(
        db
          .prepare(
            "UPDATE characters SET profile=?,logs=?,checked_at=?,status=?,errors=? WHERE id=?",
          )
          .bind(
            JSON.stringify(profile),
            logs ? JSON.stringify(logs) : null,
            at,
            status,
            JSON.stringify(errors),
            id,
          ),
      );
      if (profileOk) {
        const h = await hash(profile);
        const prev = await db
          .prepare(
            "SELECT hash,at FROM character_snapshots WHERE character_id=? ORDER BY at DESC LIMIT 1",
          )
          .bind(id)
          .first<{ hash: string; at: string }>();
        if (
          !prev ||
          prev.hash !== h ||
          Date.parse(at) - Date.parse(prev.at) >= 6 * 3600000
        ) {
          statements.push(
            db
              .prepare(
                "INSERT INTO character_snapshots(character_id,at,hash,data) VALUES(?,?,?,?)",
              )
              .bind(id, at, h, JSON.stringify(profile)),
          );
          for (const e of changedEvents(id, c.name, old, profile, at))
            statements.push(
              db
                .prepare(
                  "INSERT OR IGNORE INTO activity_events(id,character_id,at,kind,data) VALUES(?,?,?,?,?)",
                )
                .bind(e.id, id, at, e.kind, JSON.stringify(e)),
            );
        }
      }
      if (logsOk && logs) {
        const h = await hash(logs),
          prev = await db
            .prepare(
              "SELECT hash FROM warcraft_logs_snapshots WHERE character_id=? ORDER BY at DESC LIMIT 1",
            )
            .bind(id)
            .first<{ hash: string }>();
        if (!prev || prev.hash !== h) {
          statements.push(
            db
              .prepare(
                "INSERT INTO warcraft_logs_snapshots(character_id,at,hash,data) VALUES(?,?,?,?)",
              )
              .bind(id, at, h, JSON.stringify(logs)),
          );
          if (row?.logs) {
            const previous: Logs = JSON.parse(row.logs);
            const codes = new Set(previous.reports.map((r) => r.code));
            const count = logs.reports.filter((r) => !codes.has(r.code)).length;
            if (count) {
              const e: Activity = {
                id: `${id}:${at}:logs`,
                at,
                characterId: id,
                kind: "logs",
                text: `${c.name} tiene ${count} nuevos informes públicos de Warcraft Logs.`,
              };
              statements.push(
                db
                  .prepare(
                    "INSERT OR IGNORE INTO activity_events(id,character_id,at,kind,data) VALUES(?,?,?,?,?)",
                  )
                  .bind(e.id, id, at, e.kind, JSON.stringify(e)),
              );
            }
          }
        }
      }
      await db.batch(statements);
      result.push({ name: c.name, status, errors });
    }
    const at = new Date().toISOString(),
      day = at.slice(0, 10);
    const after = (await readGuild()).members;
    const overtakes = overtakeEvents(before, after, at);
    if (overtakes.length)
      await db.batch(
        overtakes.map((e) =>
          db
            .prepare(
              "INSERT OR IGNORE INTO activity_events(id,character_id,at,kind,data) VALUES(?,?,?,?,?)",
            )
            .bind(e.id, e.characterId, e.at, e.kind, JSON.stringify(e)),
        ),
      );
    const events = await db
      .prepare(
        "SELECT data FROM activity_events WHERE at>=? AND at<? ORDER BY at DESC",
      )
      .bind(`${day}T00:00:00.000Z`, `${day}T23:59:59.999Z`)
      .all<{ data: string }>();
    await db
      .prepare(
        "INSERT INTO daily_editions(day,updated_at,data) VALUES(?,?,?) ON CONFLICT(day) DO UPDATE SET updated_at=excluded.updated_at,data=excluded.data",
      )
      .bind(
        day,
        at,
        JSON.stringify(events.results.map((x) => JSON.parse(x.data))),
      )
      .run();
    await db
      .prepare("UPDATE sync_state SET last_run=? WHERE id=? AND owner=?")
      .bind(
        Date.now() + Math.max(0, cooldownSeconds * 1000 - minutes * 60000),
        "guild",
        owner,
      )
      .run();
    return { status: "complete", characters: result };
  } finally {
    await db
      .prepare(
        "UPDATE sync_state SET lease_until=0,owner=NULL WHERE id=? AND owner=?",
      )
      .bind("guild", owner)
      .run();
  }
}
