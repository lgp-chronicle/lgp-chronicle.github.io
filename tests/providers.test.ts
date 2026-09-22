import assert from "node:assert/strict";
import test from "node:test";
import { blizzard } from "../providers/blizzard";
import {
  normalizeRankings,
  participantFights,
} from "../providers/warcraft-logs";
import { overtakeEvents, measurements } from "../features/observations";
const config = {
  name: "Hékate",
  realm: "spineshatter",
  region: "eu" as const,
  campaign: "tbc" as const,
};
const env = {
  BLIZZARD_CLIENT_ID: "TEST-ONLY",
  BLIZZARD_CLIENT_SECRET: "TEST-ONLY",
};
const response = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
test("Blizzard Classic namespace, accented name, advertised resources only and partial retention", async () => {
  const urls: string[] = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.endsWith("/token"))
      return response({ access_token: "TEST-ONLY", expires_in: 3600 });
    if (url.includes("/equipment?")) return response({}, 404);
    return response({
      name: "Hékate",
      realm: { slug: "spineshatter" },
      level: 64,
      character_class: { id: 8, name: "Mago" },
      equipment: {
        href: "https://eu.api.blizzard.com/profile/wow/character/spineshatter/h%C3%A9kate/equipment",
      },
    });
  };
  try {
    const old = {
      itemLevel: 100,
      equipment: [{ slot: "HEAD", name: "TEST-ONLY" }],
    };
    const result = await blizzard(config, env, old);
    assert.equal(result.data.level, 64);
    assert.equal(result.data.itemLevel, 100);
    assert.deepEqual(result.data.equipment, old.equipment);
    assert.deepEqual(result.errors, ["equipment:http-404"]);
    assert.ok(
      urls.some(
        (u) =>
          u.includes("h%C3%A9kate") &&
          u.includes("namespace=profile-classicann-eu"),
      ),
    );
    assert.ok(urls.every((u) => !u.includes("/professions")));
  } finally {
    globalThis.fetch = real;
  }
});
test("Blizzard rejects a same-name character on the wrong realm", async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async () =>
    response({ name: "Hékate", realm: { slug: "other" }, level: 70 });
  try {
    await assert.rejects(() => blizzard(config, env, {}), /identity-mismatch/);
  } finally {
    globalThis.fetch = real;
  }
});
test("Classic talents select only the active group and preserve tied primary trees", async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async (input) =>
    String(input).includes("/specializations?")
      ? response({
          specialization_groups: [
            {
              is_active: false,
              specializations: [
                { specialization_name: "TEST-INACTIVE", spent_points: 61 },
              ],
            },
            {
              is_active: true,
              specializations: [
                {
                  specialization_name: "TEST-A",
                  spent_points: 20,
                  talents: [
                    {
                      talent_rank: 3,
                      spell_tooltip: { spell: { name: "TEST-TALENT" } },
                    },
                  ],
                },
                { specialization_name: "TEST-B", spent_points: 20 },
              ],
            },
          ],
        })
      : response({
          name: config.name,
          realm: { slug: config.realm },
          specializations: {
            href: "https://eu.api.blizzard.com/specializations",
          },
        });
  try {
    const result = await blizzard(config, env, {});
    assert.equal(result.data.spec, "TEST-A / TEST-B");
    assert.equal(result.data.specDerived, true);
    assert.deepEqual(result.data.talents, ["TEST-TALENT · 3 puntos"]);
    assert.equal(result.data.talentTrees?.length, 2);
  } finally {
    globalThis.fetch = real;
  }
});
test("Missing rankings stay unknown rather than zero", () =>
  assert.deepEqual(normalizeRankings([{ id: 1, dps: null, hps: null }]), {}));
test("Known rankings deduplicate bosses across damage and healing", () => {
  const rows = {
    rankings: [
      {
        rankPercent: 80,
        bestAmount: 1000,
        totalKills: 2,
        encounter: { id: 42 },
      },
    ],
  };
  const x = normalizeRankings([{ id: 1, dps: rows, hps: rows }]);
  assert.equal(x.bosses, 1);
  assert.equal(x.bestParse, 80);
});
test("Report membership requires correct server and confirmed participation", () => {
  const report = {
    startTime: 1000,
    masterData: {
      actors: [
        { id: 1, name: "Hékate", type: "Player", server: "Spineshatter" },
        { id: 2, name: "Hékate", type: "Player", server: "Other" },
      ],
    },
    fights: [
      {
        id: 1,
        encounterID: 42,
        name: "TEST-ONLY",
        kill: true,
        startTime: 0,
        endTime: 100,
        friendlyPlayers: [1],
        friendlySpecs: ["Arcane"],
      },
      { id: 2, encounterID: 43, kill: true, friendlyPlayers: [2] },
      { id: 3, encounterID: 0, kill: true, friendlyPlayers: [1] },
    ],
  };
  const x = participantFights(report, config);
  assert.equal(x.length, 1);
  assert.equal(x[0].endTime, 1100);
  assert.equal(x[0].spec, "Arcane");
});
test("Overtaking is based on two known levels, not roster order", () => {
  const at = new Date().toISOString();
  const m = (id: string, level?: number) => ({
    id,
    name: id,
    realm: "spineshatter",
    region: "eu",
    data: { level, observedAt: at },
    history: [],
    status: "ok",
  });
  assert.equal(
    overtakeEvents([m("a", 10), m("b", 11)], [m("a", 12), m("b", 11)], at)
      .length,
    1,
  );
  assert.equal(
    overtakeEvents([m("a"), m("b", 11)], [m("a", 12), m("b", 11)], at).length,
    0,
  );
});
test("Unchanged stale PvP measurements are not fresh observations", () => {
  const data = {
    honorableKills: 100,
    resourceTimes: { pvp_summary: "2026-09-20T00:00:00Z" },
  };
  const m = {
    id: "a",
    name: "a",
    realm: "r",
    region: "eu",
    data,
    history: [
      { at: "2026-09-21T00:00:00Z", data },
      { at: "2026-09-22T00:00:00Z", data },
    ],
    status: "partial",
  };
  assert.equal(measurements(m, "honorableKills").length, 1);
  assert.equal(measurements(m, "honorableKills")[0].at, "2026-09-20T00:00:00Z");
});
