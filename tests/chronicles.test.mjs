import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  archiveChronicles,
  chronicleCandidates,
} from "../services/illustrated-chronicles.ts";

const first = "2026-11-10T09:00:00Z",
  second = "2026-11-11T13:00:00Z";
function character(name, observations) {
  return {
    id: name.toLowerCase(),
    name,
    region: "eu",
    realm: "forever",
    status: "ok",
    data: {},
    history: observations.map(([at, data]) => ({ at, data })),
  };
}
function kills(name, before, after) {
  return character(name, [
    [first, { honorableKills: before }],
    [second, { honorableKills: after }],
  ]);
}

test("a recorded PvP reversal uses two comparable observations and keeps the closest rival", () => {
  const guild = [
    kills("Juninho", 9, 212),
    kills("Jukkz", 88, 154),
    kills("Ferrogard", 89, 90),
  ];
  const stories = chronicleCandidates(guild);
  assert.deepEqual(chronicleCandidates(guild.toReversed()), stories);
  assert.equal(stories.length, 1);
  assert.deepEqual(
    stories[0].rows.map((r) => [r.given, r.before, r.after]),
    [
      ["Jukkz", 88, 154],
      ["Juninho", 9, 212],
    ],
  );
  assert.match(stories[0].caption, /79.*Jukkz.*58/);
});

test("ties, a falling counter, stale PvP data and disjoint sampling windows cannot create a reversal", () => {
  const rival = kills("A", 10, 12);
  for (const contender of [kills("B", 10, 15), kills("B", 3, 12)]) {
    assert.deepEqual(chronicleCandidates([rival, contender]), []);
  }
  assert.deepEqual(
    chronicleCandidates([kills("A", 20, 3), kills("B", 4, 19)]),
    [],
  );
  const stale = kills("B", 3, 20);
  stale.history[1].data.resourceTimes = { pvp_summary: first };
  assert.deepEqual(chronicleCandidates([rival, stale]), []);
  const sameDay = (hour) => "2026-11-10T" + hour + ":00:00Z";
  assert.deepEqual(
    chronicleCandidates([
      character("X", [
        [sameDay("08"), { level: 12 }],
        [sameDay("09"), { level: 13 }],
      ]),
      character("Y", [
        [sameDay("14"), { level: 13 }],
        [sameDay("15"), { level: 13 }],
      ]),
    ]),
    [],
  );
  const rank = character("Y", [
    [sameDay("14"), { honorableKills: 14 }],
    [sameDay("15"), { honorableKills: 14 }],
  ]);
  assert.deepEqual(
    chronicleCandidates([
      rank,
      character("X", [
        [sameDay("08"), { honorableKills: 10 }],
        [sameDay("09"), { honorableKills: 18 }],
      ]),
    ]),
    [],
  );
});

test("the archive freezes published panels and retains them across later imports, retries and absences", () => {
  const db = new DatabaseSync(":memory:");
  try {
    const guild = [kills("Juninho", 9, 212), kills("Jukkz", 88, 154)];
    const published = archiveChronicles(db, guild);
    guild[0].history.push({
      at: "2026-11-11T19:00:00Z",
      data: { honorableKills: 250 },
    });
    assert.deepEqual(archiveChronicles(db, guild), published);
    const advance = character("Franz", [
      [second, { itemLevel: 20 }],
      ["2026-11-13T07:00:00Z", { itemLevel: 25 }],
    ]);
    const archive = archiveChronicles(db, [advance]);
    assert.deepEqual(
      archive.map((s) => s.day),
      ["2026-11-13", "2026-11-11"],
    );
    assert.deepEqual(archive[1], published[0]);
    assert.deepEqual(archiveChronicles(db, []), archive);
  } finally {
    db.close();
  }
});

test("simultaneous journeys to 60 are preserved and an already-capped new member is not awarded a crossing", () => {
  const guild = ["Rast", "Vincie"].map((name) =>
    character(name, [
      [first, { level: 59 }],
      [second, { level: 60 }],
    ]),
  );
  guild.push(character("Naisen", [[second, { level: 60 }]]));
  const stories = chronicleCandidates(guild);
  assert.deepEqual(
    stories.map((s) => s.kind),
    ["finish", "finish"],
  );
  assert.ok(
    stories.every(
      (s) =>
        s.caption.includes("Colmillo de Oro") && !s.caption.includes("primero"),
    ),
  );
});
