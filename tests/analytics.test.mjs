import assert from "node:assert/strict";
import test from "node:test";
import { courseProgress, raceLanes } from "../features/race-course.ts";
import { composition } from "../features/composition.ts";

test("level-one bankers are excluded from every composition view until they level up", () => {
  const member = { data: { level: 2, classId: 1, race: "Enano", spec: "Armas" } };
  const banker = { data: { level: 1, classId: 8, race: "Gnomo", spec: "Fuego" } };
  for (const kind of ["className", "race", "spec", "role"]) {
    assert.deepEqual(composition([member, banker], kind), composition([member], kind));
    assert.deepEqual(composition([banker], kind), composition([], kind));
    const promoted = { data: { ...banker.data, level: 2 } };
    assert.equal(composition([promoted], kind).rows.reduce((sum, row) => sum + row.count, 0), 1);
  }
});

test("race segments account for every member of a race and retain legacy class colors", () => {
  const members = [
    { data: { race: "Enano", classId: 2 } },
    { data: { race: "Enano", className: "Paladín" } },
    { data: { race: "Enano", className: "Guerrero" } },
    { data: { race: "Enano" } },
    { data: { race: "Gnomo", classId: 8 } },
    { data: { race: "Enano", classId: 2 }, inRoster: false },
  ];
  const { rows, max, legend } = composition(members, "race");
  assert.equal(max, 4);
  assert.deepEqual(rows.map(row => [row.label, row.count]), [["Enano", 4], ["Gnomo", 1]]);
  assert.equal(rows[0].classes.get("Paladín").count, 2);
  assert.equal(rows[0].classes.get("Clase desconocida").count, 1);
  assert.equal(new Map(legend).get("Paladín"), "#f58cba");
  for (const row of rows) assert.equal([...row.classes.values()].reduce((sum, entry) => sum + entry.count, 0), row.count);
});

test("roles count each member once, including unresolved feral builds and tied trees", () => {
  const profiles = [
    { classId: 9 }, { className: "Guerrero", spec: "Armas / Furia" },
    { classId: 1, spec: "Protección" }, { classId: 5, spec: "Sagrado / Disciplina" },
    { classId: 7, spec: "Recuperación" }, { classId: 2 },
    { classId: 11, spec: "Combate feral" }, { classId: 2, spec: "Protección / Reprensión" },
    { classId: 1, spec: "Armas / Desconocida" },
  ];
  const counts = profiles => composition(profiles.map(data => ({ data })), "role").rows.map(row => [row.label, row.count]);
  assert.deepEqual(counts(profiles), [["DPS", 2], ["TANK", 1], ["HEAL", 2], ["Sin determinar", 4]]);
  assert.deepEqual(counts([{ classId: 3 }]), [["DPS", 1], ["TANK", 0], ["HEAL", 0]]);
  assert.deepEqual(counts([]), []);
});

test("role segments use active point totals, learned ranks and distinctive Forever feral talents", () => {
  const feral = talents => ({ classId: 11, spec: "Combate feral", talents });
  const profiles = [
    feral([{ name: "Disciplina depredadora", spellId: 1328613, rank: 1, tree: "Combate feral" }]),
    feral(["Mordisco primigenio · 1 punto"]),
    feral(["Carga feral", "Furia salvaje"]),
    feral(["Disciplina depredadora", "Mordisco primigenio"]),
    feral([{ name: "Mordisco primigenio", rank: 0 }]),
    { classId: 2, spec: "Reprensión", talentTrees: [{ name: "Protección", points: 18 }, { name: "Reprensión", points: 3 }] },
    { classId: 7, talents: ["Enfoque de las mareas · 2 puntos", "Convección · 1 punto"] },
    { classId: 1, spec: "Furia", talentTrees: [{name: "Armas", points: 0}, {name: "Furia", points: 0}] },
  ];
  const { rows, legend } = composition(profiles.map(data => ({ data })), "role");
  const specs = (role, cls) => Object.fromEntries(rows.find(row => row.label === role).classes.get(cls).specs);
  assert.deepEqual(specs("DPS", "Druida"), { "Combate feral": 1 });
  assert.deepEqual(specs("TANK", "Druida"), { "Combate feral": 1 });
  assert.deepEqual(specs("TANK", "Paladín"), { "Protección": 1 });
  assert.deepEqual(specs("HEAL", "Chamán"), { "Recuperación": 1 });
  assert.deepEqual(specs("Sin determinar", "Druida"), { "Combate feral": 3 });
  assert.deepEqual(specs("Sin determinar", "Guerrero"), { "Sin especialización registrada": 1 });
  assert.equal(new Map(legend).get("Druida"), "#ff984c");
  for (const row of rows) {
    assert.equal([...row.classes.values()].reduce((sum, entry) => sum + entry.count, 0), row.count);
    for (const entry of row.classes.values()) assert.equal([...entry.specs.values()].reduce((a,b) => a+b, 0), entry.count);
  }
});

test("the race uses one level scale, fits every portrait and stacks ties in their true position", () => {
  const levels = [61, 60, 34, 34, 33, 32, 21, 1, 1];
  assert.equal(courseProgress(1), 0);
  assert.equal(courseProgress(60), 1);
  assert.equal(courseProgress(61), 1);
  assert.equal(courseProgress(30), 29 / 59);
  for (const width of [180, 360, 1200]) {
    const places = raceLanes(levels, width, 52);
    assert.equal(places.length, levels.length);
    assert.equal(places[2].progress, places[3].progress);
    assert.notEqual(places[2].lane, places[3].lane);
    for (const [i, a] of places.entries()) {
      for (const b of places.slice(i + 1)) {
        if (a.lane === b.lane)
          assert.ok((a.progress - b.progress) * width >= 52);
      }
    }
  }
});
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
  const shared = r.cards.find((card) => card.kind === "shared");
  assert.deepEqual(
    shared.owners.map((m) => m.id),
    ["a", "b"],
  );
  const quiz = r.cards.find((card) => card.kind === "quiz");
  assert.equal(quiz.item.id, 2);
  assert.equal(new Set(quiz.choices.map((m) => m.id)).size, 3);
  assert.equal(
    quiz.choices.filter((m) =>
      m.data.equipment.some((i) => i.id === quiz.item.id),
    ).length,
    1,
  );
});
test("daily editions rotate quizzes, shared gear and themes without repeating pieces within a day", () => {
  const roster = ["a", "b", "c"].map((name, n) => ({
    ...member(name),
    data: {
      equipment: [
        ...[
          "Espalda",
          "Pies",
          "Anillo 1",
          "Mano principal",
          "Abalorio 2",
          "Cuello",
        ].map((slot, i) => ({
          id: 100 * n + i + 10,
          name: name + " " + slot,
          slot,
          quality: "RARE",
        })),
        ...[1, 2, 3].map((id) => ({ id, name: "Uniforme " + id })),
      ],
    },
  }));
  const types = new Set(),
    quizzes = new Set(),
    uniforms = new Set();
  for (let day = 0; day < 14; day++) {
    const deck = armoryStories(roster, day).cards;
    assert.deepEqual(deck, armoryStories([...roster].reverse(), day).cards);
    assert.equal(deck.length, 5);
    assert.equal(new Set(deck.map((card) => card.item.name)).size, 5);
    for (const card of deck) {
      types.add(card.kind);
      if (card.choices.length) {
        assert.equal(card.choices.length, 3);
        assert.deepEqual(
          card.choices.filter((m) =>
            m.data.equipment.some((i) => i.name === card.item.name),
          ),
          card.owners,
        );
      }
      if (card.kind === "quiz") quizzes.add(card.item.id);
      if (card.kind === "shared") uniforms.add(card.item.id);
    }
  }
  assert.equal(quizzes.size, 14);
  assert.equal(uniforms.size, 3);
  assert.ok(types.size >= 7);
});
test("ambiguous item names never give a one-owner quiz; sparse rosters still get factual stories", () => {
  const equip = (name, id) => ({
    ...member(name),
    data: { equipment: [{ id, name: "Misma capa", slot: "Espalda" }] },
  });
  const players = [equip("a", 1), equip("b", 2), equip("c", 3)];
  assert.ok(armoryStories(players, 2).cards.every((c) => !c.choices.length));
  assert.equal(armoryStories([players[0]], 4).cards.length, 1);
  assert.deepEqual(armoryStories([member("unknown")], 0).cards, []);
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
test("Colmillo de Oro belongs to every finisher, including the first and earlier finishers", () => {
  const holders = (roster) =>
    awards(roster, now).find((award) => award.id === "level-60")?.memberIds ??
    [];
  const first = member("a", [point(1, 59), point(0, 60)]);
  const second = { ...member("b"), data: { level: 61 } };
  const partial = { ...first, data: {} };
  const below = member("c", [point(0, 59)]);
  assert.deepEqual(holders([below, member("unknown")]), []);
  assert.deepEqual(holders([first]), ["a"]);
  assert.deepEqual(holders([partial, second, below]), ["a", "b"]);
});
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
