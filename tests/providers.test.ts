import assert from "node:assert/strict";
import test from "node:test";
import { blizzard } from "../providers/blizzard";
import { memberArmoryUrl } from "../config/characters";
import { itemDisplay, talentDisplay, wowheadUrl } from "../features/armory-data";
import { awards } from "../features/analytics";
import type { Member } from "../features/types";
import {
  normalizeRankings,
  participantFights,
} from "../providers/warcraft-logs";
import { overtakeEvents, measurements } from "../features/observations";
const config = {
  name: "Hékate",
  slug: "hékate",
  realm: "jcj",
  region: "eu" as const,
  campaign: "forever" as const,
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
          u.includes("namespace=profile-forever-eu"),
      ),
    );
    assert.ok(urls.every((u) => !u.includes("/professions")));
  } finally {
    globalThis.fetch = real;
  }
});
test("Blizzard rejects character with mismatched identity", async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async () =>
    response({ name: "OtherName", level: 70 });
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
                    talent: { id: 7777 },
                    spell_tooltip: { spell: { name: "TEST-TALENT", id: 1234 }, description: "Efecto del rango 3", cast_time: "Pasivo" },
                  },
                ],
              },
              { specialization_name: "TEST-B", spent_points: 20 },
            ],
          },
        ],
        specializations: [{ talents: [{ talent: { id: 9999, name: "SECONDARY" } }] }],
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
    assert.deepEqual(result.data.talents, [{
      name: "TEST-TALENT", spellId: 1234, rank: 3, tree: "TEST-A", icon: undefined,
      description: "Efecto del rango 3", cast: "Pasivo", cost: undefined, range: undefined, cooldown: undefined,
    }]);
    assert.equal(result.data.talentTrees?.length, 2);
  } finally {
    globalThis.fetch = real;
  }
});
test("Forever character URLs preserve region, surname, hyphens and accents", () => {
  assert.equal(memberArmoryUrl("forever-eu-varón-dandy", "eu"),
    "https://worldofwarcraft.blizzard.com/es-es/forever/eu/armory/character/var%C3%B3n-dandy/");
  assert.equal(memberArmoryUrl("forever-us-a-b-c", "us")?.endsWith("/forever/us/armory/character/a-b-c/"), true);
});
test("legacy items and talents recover metadata; current observations take precedence", () => {
  const item = { slot: "Espalda", name: "Manteo esporidio", id: 6629, details: ["+6 aguante"] };
  assert.match(itemDisplay(item).effects.join(" "), /Naturaleza/);
  assert.deepEqual(itemDisplay({ ...item, effects: [] }).effects, []);
  assert.deepEqual(itemDisplay(item).details, item.details);
  const cloak = { ...item, itemLevel: 22 };
  assert.equal(itemDisplay(cloak).properties.requirement, "Necesitas ser de nivel 17");
  assert.deepEqual(itemDisplay({ ...cloak, itemLevel: 99 }).properties, {});
  assert.deepEqual(itemDisplay({ ...cloak, properties: { durability: "16 / 18" } }).properties, { durability: "16 / 18" });
  const talent = talentDisplay("Baluarte · 3 puntos", 2);
  assert.equal(talent.spellId, 20127);
  assert.equal(talent.rank, 3);
  assert.equal(talent.tree, "Protección");
  assert.equal(talentDisplay({ name: "Baluarte", spellId: 6789 }, 2).spellId, 6789);
  const missing = talentDisplay("Baluarte · 3 puntos", 0);
  assert.equal(missing.spellId, undefined);
  assert.match(talentDisplay({name:"Ferocidad",rank:3},11).description ?? "",/3 p\./);
  assert.equal(talentDisplay({name:"Ferocidad",rank:3,description:"Efecto vigente"},11).description,"Efecto vigente");
  assert.equal(talentDisplay({name:"Ferocidad",rank:15},11).description,undefined);
  assert.match(wowheadUrl("spell", missing.spellId, missing.name), /search\?q=Baluarte$/);
});
test("equipment synchronization keeps spells, on-equip stats and conditional set effects", async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async input => String(input).includes("/equipment?")
    ? response({equipped_items: [{
      slot: { name: "Cuello", type: "NECK" }, item: {id: 456}, name: "Test",
      binding: {name:"Se liga al recogerlo"}, is_subclass_hidden:true, item_subclass:{name:"Misceláneo"},
      stats: [{display:{display_string:"+5 aguante"}}, {is_equip_bonus:true, display:{display_string:"+7 Poder con hechizos"}}],
      spells: [{description:"Equipar: Devuelve daño."},{description:"Usar: Recuperas maná."}],
      set: {effects:[{display_string:"(2) Bonif.: +5 aguante"}]},
    }]}) : response({ name: config.name, equipment: {href:"equipment"} });
  try {
    const item = (await blizzard(config, env, {})).data.equipment![0];
    assert.equal(item.slotType,"NECK");
    assert.equal(item.properties?.binding, "Se liga al recogerlo");
    assert.equal(item.properties?.subclass, undefined);
    assert.deepEqual(item.details,["+5 aguante"]);
    assert.deepEqual(item.effects,["+7 Poder con hechizos","Equipar: Devuelve daño.","Usar: Recuperas maná."]);
    assert.deepEqual(item.setBonuses,["(2) Bonif.: +5 aguante"]);
  } finally { globalThis.fetch = real; }
});
test("attribute awards distinguish namesakes, share ties and skip unknown scores", () => {
  const player = (id: string, stamina?: number, intellect?: number) => ({
    id, name: "Naisen", data: { statistics: { Aguante: stamina, Intelecto: intellect } }, history: [],
  } as unknown as Member);
  const results = awards([player("a",80,17),player("b",73,17),player("c")]);
  assert.deepEqual(results.find(a => a.id === "stamina")?.memberIds,["a"]);
  assert.deepEqual(results.find(a => a.id === "intellect")?.memberIds,["a","b"]);
  assert.equal(results.some(a => a.id === "agility"),false);
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
        { id: 1, name: "Hékate", type: "Player", server: "JcJ" },
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
