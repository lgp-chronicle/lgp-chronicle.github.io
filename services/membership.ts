import type { DatabaseSync } from "node:sqlite";
import type { Activity, Member } from "../features/types.ts";
import { groupArrivals, hasArmory, membershipStart, originalCensusEnd } from "../features/membership.ts";

function prepare(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS guild_membership (
    id TEXT PRIMARY KEY, joined_at TEXT, missing_since TEXT, left_at TEXT,
    eligible INTEGER NOT NULL, last_survey TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS guild_welcomes (
    member_id TEXT NOT NULL, joined_at TEXT NOT NULL, cover_id TEXT NOT NULL, day TEXT NOT NULL,
    size INTEGER NOT NULL, position INTEGER NOT NULL, PRIMARY KEY(member_id, joined_at)
  );
  CREATE TABLE IF NOT EXISTS guild_departures (
    member_id TEXT NOT NULL, left_at TEXT NOT NULL, PRIMARY KEY(member_id, left_at)
  )`);
  db.prepare(`INSERT OR IGNORE INTO guild_departures
    SELECT id, left_at FROM guild_membership WHERE eligible = 1 AND left_at >= ?`).run(membershipStart);
}

type Row = {
  id: string;
  joined_at: string | null;
  missing_since: string | null;
  left_at: string | null;
  eligible: number;
  last_survey: string;
};
export function recordRoster(
  db: DatabaseSync,
  members: Member[],
  ids: Set<string>,
  survey: string,
  initial = false,
) {
  if (!ids.size) return;
  prepare(db);
  db.exec("BEGIN IMMEDIATE");
  try {
    const rows = new Map(
      (db.prepare("SELECT * FROM guild_membership").all() as Row[]).map((r) => [
        r.id,
        r,
      ]),
    );
    const save = db.prepare(
      "INSERT OR REPLACE INTO guild_membership(id,joined_at,missing_since,left_at,eligible,last_survey) VALUES(?,?,?,?,?,?)",
    );
    const knownWelcome = db.prepare(
      "SELECT 1 FROM guild_welcomes WHERE member_id=? AND joined_at=?",
    );
    const arrivals: Member[] = [];
    for (const member of members) {
      const row = rows.get(member.id);
      if (row && row.last_survey >= survey) continue;
      if (ids.has(member.id)) {
        const first =
          !initial && member.addedAt && member.addedAt > originalCensusEnd
            ? member.addedAt
            : null;
        const joined = row ? (row.left_at ? survey : row.joined_at) : first;
        save.run(
          member.id,
          joined,
          null,
          null,
          Number(hasArmory(member)),
          survey,
        );
        if (
          joined &&
          hasArmory(member) &&
          !knownWelcome.get(member.id, joined)
        ) {
          arrivals.push({ ...member, membership: { joinedAt: joined } });
        }
      } else if (row && !row.left_at) {
        if (row.eligible && row.missing_since && row.missing_since >= membershipStart) {
          db.prepare("INSERT OR IGNORE INTO guild_departures VALUES (?,?)").run(member.id, row.missing_since);
        }
        save.run(
          member.id,
          row.joined_at,
          row.missing_since ?? survey,
          row.missing_since,
          row.eligible,
          survey,
        );
      }
    }
    const saveWelcome = db.prepare(
      "INSERT INTO guild_welcomes VALUES(?,?,?,?,?,?)",
    );
    for (const party of groupArrivals(arrivals)) {
      const exists = db
        .prepare("SELECT 1 FROM guild_welcomes WHERE cover_id=?")
        .get(party.id);
      const id = exists ? party.id + "-" + Date.parse(survey) : party.id;
      party.members.forEach((m, i) =>
        saveWelcome.run(
          m.id,
          m.membership!.joinedAt!,
          id,
          party.day,
          party.members.length,
          i,
        ),
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function membershipNews(db: DatabaseSync): Activity[] {
  prepare(db);
  const rows = db.prepare(`SELECT member_id, joined_at AS at, 'join' AS kind
      FROM guild_welcomes WHERE joined_at >= ?
    UNION ALL SELECT member_id, left_at AS at, 'leave' AS kind FROM guild_departures WHERE left_at >= ?
    ORDER BY at DESC, member_id, kind`).all(membershipStart, membershipStart) as
    { member_id: string; at: string; kind: "join" | "leave" }[];
  return rows.map(({ member_id, at, kind }) => ({
    id: [kind, member_id, at].join("/"), characterId: member_id, at, kind,
    text: kind === "join" ? "se incorpora a la hermandad." : "deja la hermandad.",
  }));
}

export function attachMembership(db: DatabaseSync, members: Member[]) {
  prepare(db);
  const rows = new Map(
    (db.prepare("SELECT * FROM guild_membership").all() as Row[]).map((r) => [
      r.id,
      r,
    ]),
  );
  const welcomes = db
    .prepare(
      "SELECT member_id, cover_id AS id, day, size, position, joined_at AS joinedAt FROM guild_welcomes",
    )
    .all() as (NonNullable<Member["welcomes"]>[number] & {
    member_id: string;
  })[];
  const byId = new Map(members.map((m) => [m.id, m]));
  for (const { member_id, ...welcome } of welcomes) {
    const m = byId.get(member_id);
    if (m) (m.welcomes ??= []).push(welcome);
  }
  for (const m of members) {
    const row = rows.get(m.id);
    if (rows.size) m.inRoster = Boolean(row && !row.missing_since && !row.left_at);
    if (!row) continue;
    if (!row.eligible) {
      if (row.joined_at) m.rosterJoinedAt = row.joined_at;
      continue;
    }
    m.membership = {
      joinedAt: row.joined_at ?? undefined,
      leftAt: row.left_at ?? undefined,
      pendingAbsence: Boolean(row.missing_since && !row.left_at) || undefined,
    };
  }
}
