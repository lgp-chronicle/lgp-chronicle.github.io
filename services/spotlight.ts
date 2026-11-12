import type { DatabaseSync } from "node:sqlite";
import type { Member } from "../features/types.ts";
import { describeMembers } from "./member-strengths.ts";
import { awards } from "../features/analytics.ts";
import { hasEntrancePortrait } from "../features/portrait-availability.ts";

export function guildSpotlight(
  db: DatabaseSync,
  members: Member[],
  stamp: string,
) {
  const roster = describeMembers(members);
  const day = stamp.slice(0, 10);
  db.exec(`CREATE TABLE IF NOT EXISTS guild_spotlights (
    day TEXT NOT NULL, member_id TEXT NOT NULL, PRIMARY KEY(day, member_id)
  )`);
  db.exec("BEGIN IMMEDIATE");
  try {
    const rows = db
      .prepare(
        "SELECT member_id, MAX(day) AS last FROM guild_spotlights WHERE day <= ? GROUP BY member_id",
      )
      .all(day);
    const last = new Map(
      rows.map((r) => [String(r.member_id), String(r.last)]),
    );
    const published = db
      .prepare(
        "SELECT member_id FROM guild_spotlights WHERE day=? ORDER BY rowid",
      )
      .all(day);
    const selected = published.flatMap((r) =>
      roster.filter((m) => m.id === r.member_id),
    );
    const remaining = roster.filter((m) => last.get(m.id) !== day);
    if (selected.length < 4 && remaining.length) {
      const medals = new Map<string, number>();
      for (const award of awards(roster, Date.parse(stamp)))
        for (const id of award.memberIds)
          medals.set(id, (medals.get(id) ?? 0) + 1);
      const insert = db.prepare(
        "INSERT INTO guild_spotlights(day,member_id) VALUES(?,?)",
      );
      while (selected.length < 4 && remaining.length) {
        const used = new Set(selected.map((m) => m.strength!.icon));
        remaining.sort(
          (a, b) =>
            (last.get(a.id) ?? "").localeCompare(last.get(b.id) ?? "") ||
            Number(used.has(a.strength!.icon)) -
              Number(used.has(b.strength!.icon)) ||
            (medals.get(a.id) ?? 0) - (medals.get(b.id) ?? 0) ||
            Number(hasEntrancePortrait(b)) - Number(hasEntrancePortrait(a)) ||
            a.id.localeCompare(b.id),
        );
        const m = remaining.shift()!;
        selected.push(m);
        insert.run(day, m.id);
      }
    }
    db.exec("COMMIT");
    return { day, members: selected.slice(0, 4).map((m) => m.id) };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
