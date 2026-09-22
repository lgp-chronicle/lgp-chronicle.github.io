import assert from "node:assert/strict";
import test from "node:test";
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
