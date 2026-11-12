import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { recordRoster, attachMembership } from "../services/membership.ts";
import {
  groupArrivals,
  hasArmory,
  welcomeParties,
} from "../features/membership.ts";
import { coverCatalogue, drawCover } from "../lib/guild-covers.ts";
import { awards } from "../features/analytics.ts";
import { ninjaLoot } from "../features/ninja-loot.ts";

const day = "2026-11-12T01:00:00.000Z";
const member = (id, data = {}) => ({
  id,
  name: id,
  region: "eu",
  addedAt: day,
  data: { level: 10, armoryVerified: true, ...data },
  history: [],
  membership: { joinedAt: day },
});

test("group sizes, whole parties, real profile and the exact level boundary", () => {
  assert.equal(hasArmory(member("a", { level: 9 })), false);
  assert.equal(
    hasArmory(
      member("a", {
        armoryVerified: undefined,
        resourceTimes: { summary: day },
      }),
    ),
    false,
  );
  assert.equal(
    hasArmory(
      member("a", {
        armoryVerified: undefined,
        resourceTimes: { equipment: day },
      }),
    ),
    true,
  );
  assert.equal(
    hasArmory(member("a", { armoryVerified: false, avatar: "old" })),
    false,
  );
  for (const [n, sizes] of [
    [],
    [1],
    [2],
    [3],
    [2, 2],
    [2, 3],
    [2, 2, 2],
    [2, 2, 3],
  ].entries()) {
    const parties = groupArrivals(
      Array.from({ length: n }, (_, i) => member(String(i))),
    );
    assert.deepEqual(
      parties.map((p) => p.members.length),
      sizes,
    );
  }
});

test("two distinct complete censuses confirm a departure, returning members and published parties survive retries", () => {
  const db = new DatabaseSync(":memory:");
  try {
    let guild = [
      member("old"),
      member("forever-eu-er-manu"),
      member("no-profile", { armoryVerified: false }),
    ];
    guild[0].addedAt = "2026-11-10T08:56:44.000Z";
    const scan = (ids, at) => recordRoster(db, guild, new Set(ids), at);
    const view = () => {
      const copy = guild.map(({ membership, welcomes, ...m }) => ({ ...m }));
      attachMembership(db, copy);
      return copy;
    };
    const all = guild.map((m) => m.id);
    scan(all, day);
    let data = view();
    assert.equal(data[0].membership.joinedAt, undefined);
    assert.equal(data[2].membership, undefined);
    const id = welcomeParties(data)[0].id;
    assert.equal(id, "bienvenida-er-manu");
    assert.ok(Object.keys(coverCatalogue(data)).includes(id));
    assert.equal(drawCover(undefined, [id]), id);
    const missingDay = "2026-11-13";
    scan(["old"], missingDay);
    scan(["old"], missingDay);
    scan([], "2026-11-14");
    assert.equal(view()[1].membership.leftAt, undefined);
    scan(all, "2026-11-15");
    assert.equal(view()[1].membership.pendingAbsence, undefined);
    scan(["old"], "2026-11-16");
    scan(["old"], "2026-11-17");
    assert.equal(view()[1].membership.leftAt, "2026-11-16");
    assert.equal(view()[2].membership, undefined);
    scan(all, "2026-11-18");
    data = view();
    assert.equal(data[1].membership.joinedAt, "2026-11-18");
    assert.equal(data[1].welcomes.length, 2);
    assert.ok(welcomeParties(data).some((p) => p.id === id));
    guild[2].data.armoryVerified = true;
    scan(all, "2026-11-19");
    assert.equal(view()[2].welcomes.length, 1);
  } finally {
    db.close();
  }
});

test("ninja loot totals item bonuses once, shares ties, counts zero-score rivals and excludes only Naisen Grandwell", () => {
  const gear = (id, spec, classId, details, effects = []) =>
    member(id, {
      spec,
      classId,
      equipment: [{ name: "Botín", slot: "Cabeza", details, effects }],
    });
  const mage = gear(
    "forever-eu-naisen-nightray",
    "Escarcha",
    8,
    ["+4 fuerza", "+8 aguante", "-3 agilidad"],
    ["+4 fuerza", "Usar: +40 fuerza.", "+6 agilidad"],
  );
  const rogue = gear("pícaro", "Combate", 4, ["+10 intelecto"]);
  const immune = gear("forever-eu-naisen-grandwell", "Demonología", 9, [
    "+100 fuerza",
  ]);
  const hybrid = gear("paladín", "Sagrado / Protección", 2, [
    "+90 poder de ataque",
    "+1 intelecto",
  ]);
  const winner = (ms) => awards(ms).find((a) => a.id === "ninja-loot");
  assert.equal(ninjaLoot(mage).points, 10);
  assert.equal(ninjaLoot(hybrid).points, 0);
  assert.equal(ninjaLoot(immune), undefined);
  assert.equal(ninjaLoot(gear("x", undefined, 8, ["+100 fuerza"])), undefined);
  assert.deepEqual(winner([mage, rogue, immune, hybrid]).memberIds, [
    mage.id,
    rogue.id,
  ]);
  assert.deepEqual(winner([mage, hybrid]).memberIds, [mage.id]);
  assert.equal(winner([mage, immune]), undefined);
});
