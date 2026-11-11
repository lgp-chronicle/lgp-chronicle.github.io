import assert from "node:assert/strict";
import test from "node:test";
import { rankChanges } from "../features/observations.ts";
import { editionPlay, armoryStories } from "../features/guild-stories.ts";
import {
  awards,
  windowGain,
  changedEvents,
  leveling,
  DAY,
} from "../features/analytics.ts";
const now = Date.parse("2026-09-22T12:00:00Z");
const member = (name, history = []) => ({
  id: name,
  name,
  realm: "spineshatter",
  region: "eu",
  status: "ok",
  data: history.at(-1)?.data ?? {},
  history,
});
const point = (days, level) => ({
  at: new Date(now - days * DAY).toISOString(),
  data: { level },
});
test("a new recruit does not erase established positions", () => {
  const a = member("a", [point(1, 10), point(0, 12)]),
    b = member("b", [point(1, 11), point(0, 11)]);
  assert.deepEqual(
    [...rankChanges([a, b, member("c", [point(0, 1)])], now)],
    [
      ["a", 1],
      ["b", -1],
    ],
  );
});
test("replays keep a single race observation and distinct participants", () => {
  const at = point(0, 0).at,
    roster = ["a", "b", "c"].map((n) => member(n));
  const pass = (r, time) => ({
    kind: "overtake",
    id: "a:" + r + ":" + time + ":overtake",
    characterId: "a",
    at: time,
    text: "a adelanta: nivel 30 frente a 29.",
  });
  const play = editionPlay(
    [pass("b", at), pass("c", at), pass("b", at), pass("c", point(1, 1).at)],
    roster,
  );
  assert.equal(play.rivals.length, 2);
  assert.equal(play.lead.after, 30);
  assert.equal(play.lead.before, undefined);
  assert.equal(editionPlay([pass("unknown", at)], roster), undefined);
});
test("rumors count players once and quiz choices have a single verified owner", () => {
  const gear = (name, ids) => ({
    ...member(name),
    data: {
      equipment: ids.map((id) => ({
        id,
        name: id === 1 ? "Caña de pescar" : "Pieza " + id,
      })),
    },
  });
  const r = armoryStories(
    [gear("a", [1, 1, 2]), gear("b", [1, 3]), gear("c", [4]), member("blank")],
    0,
  );
  assert.equal(r.coverage, 3);
  assert.equal(r.anglers.length, 2);
  assert.equal(r.shared.owners.length, 2);
  assert.equal(r.clue.item.id, 2);
  assert.equal(new Set(r.choices.map((m) => m.id)).size, 3);
  assert.equal(
    r.choices.filter((m) =>
      m.data.equipment.some((i) => i.id === r.clue.item.id),
    ).length,
    1,
  );
});
test("unknown data never receives an award", () =>
  assert.deepEqual(awards([member("a"), member("b")], now), []));
test("24h requires a sufficiently close baseline", () => {
  assert.equal(
    windowGain(member("a", [point(2, 10), point(0, 12)]), "level", 1, now),
    null,
  );
  assert.equal(
    windowGain(member("a", [point(1, 10), point(0, 12)]), "level", 1, now),
    2,
  );
});
test("level corrections do not become gains", () => {
  assert.equal(
    windowGain(member("a", [point(1, 12), point(0, 10)]), "level", 1, now),
    null,
  );
  assert.deepEqual(
    changedEvents(
      "a",
      "a",
      { level: 12 },
      { level: 10 },
      new Date(now).toISOString(),
    ),
    [],
  );
});
test("first data never creates a fictitious change event", () =>
  assert.deepEqual(
    changedEvents(
      "a",
      "a",
      {},
      { level: 64, honorableKills: 400 },
      new Date(now).toISOString(),
    ),
    [],
  ));
test("ties share awards", () => {
  const a = awards(
    [member("a", [point(0, 20)]), member("b", [point(0, 20)])],
    now,
  ).find((x) => x.id === "level");
  assert.deepEqual(a.names, ["a", "b"]);
});
test("one character alone cannot win comparisons", () =>
  assert.deepEqual(awards([member("a", [point(0, 20)])], now), []));
test("best interval and last level are observation timestamps", () => {
  const r = leveling(
    member("a", [point(2, 10), point(1, 12), point(0, 13)]),
    now,
  );
  assert.equal(r.total, 3);
  assert.equal(r.average, 1.5);
  assert.equal(r.best.gain, 2);
  assert.equal(r.lastLevel, new Date(now).toISOString());
});
test("events preserve exact deltas", () => {
  const e = changedEvents(
    "a",
    "A",
    { level: 61, itemLevel: 100, honorableKills: 20 },
    { level: 64, itemLevel: 114, honorableKills: 28 },
    new Date(now).toISOString(),
  );
  assert.deepEqual(
    e.map((x) => x.delta),
    [3, 14, 8],
  );
});
