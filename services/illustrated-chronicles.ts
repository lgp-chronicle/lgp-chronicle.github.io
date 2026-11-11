import type { DatabaseSync } from "node:sqlite";
import { fullName } from "../features/member-name.ts";
import { finishLevel, finishTitle } from "../features/race-course.ts";
import {
  color,
  numeric,
  type ChronicleRow,
  type IllustratedChronicle,
  type Member,
} from "../features/types.ts";
import { metricTime } from "../features/observations.ts";

type Metric = "level" | "itemLevel" | "honorableKills";
type Measurement = { at: number; value: number };
type Change = { from: string; start: number; end: number; row: ChronicleRow };

function changesByDay(members: Member[], metric: Metric) {
  const days = new Map<string, Change[]>();
  for (const member of members) {
    const samples = new Map<number, number>();
    const snapshots = member.data.observedAt
      ? [...member.history, { at: member.data.observedAt, data: member.data }]
      : member.history;
    for (const snapshot of snapshots) {
      const value = snapshot.data[metric];
      const at = Date.parse(metricTime(snapshot, metric));
      if (
        numeric(value) &&
        value >= (metric === "honorableKills" ? 0 : 1) &&
        Number.isFinite(at)
      )
        samples.set(at, value);
    }
    const observations = new Map<
      string,
      { first: Measurement; last: Measurement }
    >();
    for (const [at, value] of [...samples].sort(([a], [b]) => a - b)) {
      const day = new Date(at).toISOString().slice(0, 10);
      const same = observations.get(day);
      const sample = { at, value };
      if (same) same.last = sample;
      else observations.set(day, { first: sample, last: sample });
    }
    let previous: Measurement | undefined;
    for (const [day, { first, last }] of observations) {
      const before = previous ?? first;
      const row = {
        id: member.id,
        name: fullName(member),
        given: member.name,
        tint: color(member),
        before: before.value,
        after: last.value,
      };
      if (!days.has(day)) days.set(day, []);
      days
        .get(day)!
        .push({
          from: new Date(before.at).toISOString().slice(0, 10),
          start: before.at,
          end: last.at,
          row,
        });
      previous = last;
    }
  }
  return days;
}

const gain = ({ row }: Change) => row.after - row.before;
function strongest(changes: Change[]) {
  return [...changes].sort(
    (a, b) => gain(b) - gain(a) || a.row.id.localeCompare(b.row.id),
  )[0];
}

// Follow the highest finisher with a reversal and their closest overtaken rival.
function reversal(changes: Change[]) {
  const eligible = changes.filter((c) => gain(c) >= 0);
  const current = [...eligible].sort(
    (a, b) => b.row.after - a.row.after || a.row.id.localeCompare(b.row.id),
  );
  for (const winner of current) {
    const rival = current.find(
      (c) =>
        c.from === winner.from &&
        Math.max(c.start, winner.start) < Math.min(c.end, winner.end) &&
        c.row.before > winner.row.before &&
        c.row.after < winner.row.after,
    );
    if (rival) return { rival, winner };
  }
}

export function chronicleCandidates(members: Member[]) {
  const stories: IllustratedChronicle[] = [];
  for (const metric of ["honorableKills", "itemLevel", "level"] as const) {
    for (const [day, changes] of changesByDay(members, metric)) {
      if (metric === "level") {
        for (const { from, row } of changes) {
          if (row.before < finishLevel && row.after === finishLevel)
            stories.push({
              id: "finish/" + row.id,
              kind: "finish",
              day,
              from,
              rows: [row],
              title: row.given + " cruza la meta",
              caption:
                "Del nivel " +
                row.before +
                " al 60. " +
                row.name +
                " se gana el título de «" +
                finishTitle.title +
                "».",
            });
        }
      }
      if (metric !== "itemLevel") {
        const pair = reversal(changes);
        if (pair) {
          const { row: a } = pair.rival,
            { row: b, from } = pair.winner;
          const pvp = metric === "honorableKills";
          const kind = pvp ? "pvp" : "chase";
          const rival = a.given === b.given ? a.name : a.given;
          const winner = a.given === b.given ? b.name : b.given;
          const deficit = a.before - b.before;
          const lead = b.after - a.after;
          stories.push({
            id: [day, kind, b.id, a.id].join("/"),
            day,
            from,
            kind,
            rows: [a, b],
            title: winner + (pvp ? " le da la vuelta" : " adelanta a " + rival),
            caption: pvp
              ? `De ${deficit === 1 ? "una baja" : deficit + " bajas"} por detrás de ${rival} a ${lead} por delante.`
              : `${rival} iba por delante en la carrera al 60. Ahora ${winner} le saca ${lead === 1 ? "un nivel" : lead + " niveles"}.`,
          });
        }
        if (metric === "honorableKills" || pair) continue;
      }
      const top = strongest(changes);
      if (
        !top ||
        gain(top) < 2 ||
        (metric === "level" && top.row.after >= finishLevel)
      )
        continue;
      const gear = metric === "itemLevel",
        kind = gear ? "gear" : "levels";
      const { row, from } = top;
      stories.push({
        id: day + "/" + kind,
        day,
        from,
        kind,
        rows: [row],
        title:
          row.given + (gear ? " renueva su equipo" : " pisa el acelerador"),
        caption: gear
          ? "Su nivel medio de equipo pasa de " +
            row.before +
            " a " +
            row.after +
            "."
          : row.name + " suma " + gain(top) + " niveles en su camino al 60.",
      });
    }
  }
  return stories;
}

export function archiveChronicles(db: DatabaseSync, members: Member[]) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS illustrated_chronicles (id TEXT PRIMARY KEY, data TEXT NOT NULL)",
  );
  const insert = db.prepare(
    "INSERT INTO illustrated_chronicles (id, data) VALUES (?, ?) ON CONFLICT(id) DO NOTHING",
  );
  const priority = { finish: 4, pvp: 3, chase: 2, gear: 1, levels: 0 };
  const candidates = chronicleCandidates(members).sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      priority[a.kind] - priority[b.kind] ||
      a.id.localeCompare(b.id),
  );
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const story of candidates) insert.run(story.id, JSON.stringify(story));
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return db
    .prepare("SELECT data FROM illustrated_chronicles ORDER BY rowid DESC")
    .all()
    .map((r) => JSON.parse(String(r.data)) as IllustratedChronicle)
    .sort((a, b) => b.day.localeCompare(a.day));
}
