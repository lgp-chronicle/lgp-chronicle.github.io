import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { guildSpotlight } from "../services/spotlight.ts";
import { describeMembers } from "../services/member-strengths.ts";
import { hasRecentUpdate } from "../features/spotlight-freshness.ts";

const member = (id, data = {}) => ({
  id,
  name: id,
  region: "eu",
  data: { level: 14, sourceModified: day(1), ...data },
  history: [],
});
const day = (n) => new Date(Date.UTC(2026, 10, n, 12)).toISOString();

test("freshness uses the source modification date or a measured change, never a routine poll", () => {
  const now = Date.parse(day(12));
  const fresh = (m) => hasRecentUpdate(m, now);
  assert.ok(
    fresh(
      member("boundary", { sourceModified: new Date(day(5)).toUTCString() }),
    ),
  );
  const stale = member("old", {
    sourceModified: new Date(Date.parse(day(5)) - 1).toISOString(),
    observedAt: day(12),
    resourceTimes: { summary: day(12), equipment: day(12) },
  });
  stale.checkedAt = stale.addedAt = day(12);
  stale.history = [8, 10, 12].map((n) => ({
    at: day(n),
    data: { level: 14, itemLevel: 11 },
  }));
  assert.equal(fresh(stale), false);
  for (const sourceModified of [undefined, "invalid", day(13)]) {
    assert.equal(fresh(member("unknown", { sourceModified })), false);
  }
  const change = member("level", { sourceModified: undefined });
  change.history = [
    { at: day(4), data: { level: 9 } },
    { at: day(11), data: { level: 10 } },
  ];
  assert.equal(fresh(change), false);
  change.history.push({ at: day(12), data: { level: 11 } });
  assert.ok(fresh(change));
  const pvp = member("pvp", { sourceModified: day(1) });
  pvp.history = [10, 11].map((n, i) => ({
    at: day(n),
    data: { honorableKills: i + 1, resourceTimes: { pvp_summary: day(n) } },
  }));
  assert.ok(fresh(pvp));
  pvp.history[1].data.resourceTimes.pvp_summary = day(10);
  assert.equal(fresh(pvp), false);
  const revoked = member("revoked", {
    armoryVerified: false,
    sourceModified: day(12),
  });
  revoked.history = [10, 11].map((n, i) => ({
    at: day(n),
    data: { itemLevel: 12 + i },
  }));
  assert.equal(fresh(revoked), false);
});

test("expiring mid-edition frees a place, outdated peers drop out and returning members qualify again", () => {
  const db = new DatabaseSync(":memory:");
  try {
    const retiring = member("old", {
      sourceModified: day(5),
      statistics: { Agilidad: 100 },
    });
    const players = ["a", "b"].map((id, i) =>
      member(id, { sourceModified: day(12), statistics: { Agilidad: 9 + i } }),
    );
    const roster = [...players, retiring];
    assert.equal(guildSpotlight(db, roster, day(12)).members.length, 3);
    assert.match(retiring.strength.note, /entre 3 personajes/);
    const later = new Date(Date.parse(day(12)) + 1).toISOString();
    const recruit = member("c", {
      sourceModified: day(12),
      statistics: { Agilidad: 5 },
    });
    roster.push(recruit);
    assert.deepEqual(
      new Set(guildSpotlight(db, roster, later).members),
      new Set(["a", "b", "c"]),
    );
    assert.equal(retiring.strength, undefined);
    assert.match(players[1].strength.note, /Primer puesto entre 3 personajes/);
    assert.deepEqual(guildSpotlight(db, roster, day(20)).members, []);
    retiring.data.sourceModified = day(20);
    assert.deepEqual(guildSpotlight(db, roster, day(20)).members, ["old"]);
  } finally {
    db.close();
  }
});

test("every eligible member gets a turn within nine editions for a guild of 33, including weekly players", () => {
  const db = new DatabaseSync(":memory:");
  try {
    const guild = Array.from({ length: 33 }, (_, i) =>
      member("m" + i, {
        level: i % 5 === 0 ? 1 : 20,
        statistics: { Aguante: i + 1 },
      }),
    );
    const collected = new Set();
    for (let n = 1; n <= 9; n++) {
      if (n === 8) guild.forEach((m) => (m.data.sourceModified = day(n)));
      const today = guildSpotlight(db, guild, day(n));
      assert.equal(new Set(today.members).size, 4);
      const waiting = guild.length - collected.size;
      assert.equal(
        today.members.filter((id) => !collected.has(id)).length,
        Math.min(4, waiting),
      );
      today.members.forEach((id) => collected.add(id));
      assert.deepEqual(guildSpotlight(db, [...guild].reverse(), day(n)), today);
    }
    assert.equal(collected.size, 33);
    assert.ok(guild.every((m) => m.strength));
    const recruit = member("recruit", { level: 1, sourceModified: day(10) });
    const tenth = guildSpotlight(db, [...guild, recruit], day(10));
    assert.ok(tenth.members.includes(recruit.id));
    for (const id of tenth.members.slice(0, 2))
      [...guild, recruit].find((m) => m.id === id).inRoster = false;
    const revised = guildSpotlight(db, [...guild, recruit], day(10));
    assert.equal(revised.members.length, 4);
    assert.ok(
      tenth.members.slice(0, 2).every((id) => !revised.members.includes(id)),
    );
    assert.deepEqual(guildSpotlight(db, [], day(11)).members, []);
    assert.deepEqual(
      guildSpotlight(db, [member("solo", { sourceModified: day(11) })], day(11))
        .members,
      ["solo"],
    );
  } finally {
    db.close();
  }
});

test("peers share a level bracket or the same trade, with real denominators, ties and sparse sheets", () => {
  const field = [1, 2, 10, 10, 2, 1].map((n, i) =>
    member(String(i), { statistics: { Agilidad: n } }),
  );
  const veteran = member("v", { level: 51, statistics: { Agilidad: 99 } });
  const absent = member("x", { statistics: { Agilidad: 98 } });
  absent.inRoster = false;
  const empty = member("sparse", { level: 1, className: "Pícaro" });
  const traders = [29, 19, 32].map((n, i) =>
    member("trade" + i, {
      level: n,
      professions: [{ name: "Cooking", skill: i * 25, max: 75 }],
    }),
  );
  traders[2].data.professions.push({ name: "Cocina", skill: 9 });
  describeMembers(
    [...field, veteran, absent, empty, ...traders],
    Date.parse(day(1)),
  );
  assert.equal(field[2].strength.value, 10);
  assert.match(
    field[2].strength.note,
    /Primer puesto compartido entre 6 personajes de nivel 10–19/,
  );
  assert.equal(traders[2].strength.value, 50);
  assert.match(
    traders[2].strength.note,
    /Primer puesto entre 3 personajes del oficio/,
  );
  assert.doesNotMatch(veteran.strength.note, /puesto/i);
  assert.equal(absent.strength, undefined);
  assert.equal(empty.strength.note, "Pícaro");
  const revoked = member("r", {
    armoryVerified: false,
    statistics: { Aguante: 200 },
    reputations: [{ name: "Forjaz", standing: "Exaltado" }],
  });
  revoked.history = [
    { at: day(0), data: { level: 13 } },
    { at: day(1), data: { level: 14 } },
  ];
  describeMembers([revoked], Date.parse(day(1)));
  assert.equal(revoked.strength.title, "Pasos por Azeroth");
  assert.equal(revoked.strength.value, 1);
});
