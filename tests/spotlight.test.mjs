import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { guildSpotlight } from "../services/spotlight.ts";
import { describeMembers } from "../services/member-strengths.ts";

const member = (id, data = {}) => ({
  id,
  name: id,
  region: "eu",
  data: { level: 14, ...data },
  history: [],
});
const day = (n) => new Date(Date.UTC(2026, 10, n, 12)).toISOString();

test("every member gets a turn within nine editions for a guild of 33, independently of activity and retries", () => {
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
    const recruit = member("recruit", { level: 1 });
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
    assert.deepEqual(guildSpotlight(db, [member("solo")], day(11)).members, [
      "solo",
    ]);
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
  describeMembers([...field, veteran, absent, empty, ...traders]);
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
  describeMembers([revoked]);
  assert.equal(revoked.strength.title, "En las filas de La Ganga");
});
