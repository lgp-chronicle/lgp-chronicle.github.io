import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
  equipmentTrophies,
  recordTrophies,
  trophyNews,
} from "../services/permanent-trophies.ts";

const slots = [
  "HEAD",
  "NECK",
  "SHOULDER",
  "BACK",
  "CHEST",
  "WRIST",
  "HANDS",
  "WAIST",
  "LEGS",
  "FEET",
  "FINGER_1",
  "FINGER_2",
  "TRINKET_1",
  "TRINKET_2",
  "MAIN_HAND",
  "RANGED",
];
test("new battlefield trophies replay early winners and collection trophies use owned species", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("CREATE TABLE character_snapshots(id INTEGER PRIMARY KEY,character_id TEXT,at TEXT,data TEXT)");
    db.exec("CREATE TABLE trophy_register(id INTEGER PRIMARY KEY,cursor INTEGER,data TEXT)");
    const at = "2026-11-12T09:00:00.000Z", later = "2026-11-13T10:00:00.000Z";
    const members = ["a","b"].map(id => ({ id, name:id, region:"eu", data:{} }));
    const pvp = { pvp_map_statistics: [{ world_map:{name:"Cuenca"}, match_statistics:{played:18,won:10,lost:8} }] };
    const add = db.prepare("INSERT INTO character_snapshots(character_id,at,data) VALUES (?,?,?)");
    add.run("a", at, JSON.stringify({surveyAt:at, pvp, resourceTimes:{pvp_summary:at}}));
    db.prepare("INSERT INTO trophy_register VALUES (1,1,?)").run(JSON.stringify({factions:{},unlocks:{}}));
    add.run("b", later, JSON.stringify({surveyAt:later, pvp, collections:{pets:[{id:44,name:"Siamés"}],mounts:[]},resourceTimes:{pvp_summary:later,pets:later,mounts:later}}));
    const room = recordTrophies(db,members);
    assert.deepEqual(room.unlocks["bg-wins-10"].winners.map(m=>m.id),["a"]);
    assert.equal(room.unlocks["pets-1"].at,later);
    assert.equal(room.unlocks["mounts-1"],undefined);
    assert.deepEqual(recordTrophies(db,members),room);
    assert.ok(trophyNews(room).some(e=>e.id==="trophy/bg-wins-10"));
  } finally {db.close();}
});
test("full sets require every combat slot at the threshold in the same set, with correct two-handed and cosmetic exceptions", () => {
  const items = slots.map((slotType) => ({
    slotType,
    slot: slotType,
    quality: "EPIC",
  }));
  const main = items.find((i) => i.slotType === "MAIN_HAND");
  main.properties = { inventoryType: "Dos manos" };
  const gear = (x) =>
    equipmentTrophies(x).filter((id) => id.startsWith("gear-"));
  assert.deepEqual(gear(items), ["gear-2", "gear-3", "gear-4"]);
  assert.deepEqual(
    gear([...items, { slot: "Tabardo", quality: "COMMON" }]),
    gear(items),
  );
  assert.deepEqual(gear(items.slice(1)), []);
  assert.deepEqual(
    gear(
      items.map((i) => (i.slotType === "HEAD" ? { ...i, quality: "RARE" } : i)),
    ),
    ["gear-2", "gear-3"],
  );
  assert.deepEqual(
    gear(
      items.map((i) =>
        i.slotType === "HEAD" ? { ...i, quality: "UNCOMMON" } : i,
      ),
    ),
    ["gear-2"],
  );
  main.properties = { inventoryType: "Una mano" };
  assert.deepEqual(gear(items), []);
  assert.deepEqual(
    gear([...items, { slotType: "OFF_HAND", quality: "COMMON" }]),
    [],
  );
  assert.deepEqual(
    gear([...items, { slotType: "OFF_HAND", quality: "RARE" }]),
    ["gear-2", "gear-3"],
  );
  assert.equal(
    equipmentTrophies([{ slot: "Tabardo", id: 5976 }]).includes("tabard"),
    true,
  );
  assert.equal(
    equipmentTrophies([
      { slot: "Tabardo", id: 123 },
      { slot: "Pecho", id: 5976 },
    ]).includes("tabard"),
    false,
  );
});

test("permanent trophies backfill, share a survey, persist, and generate one herald story for each milestone", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(
      "CREATE TABLE character_snapshots(id INTEGER PRIMARY KEY,character_id TEXT,at TEXT,data TEXT)",
    );
    const write = db.prepare(
      "INSERT INTO character_snapshots(character_id,at,data) VALUES(?,?,?)",
    );
    const roster = ["a", "b", "c"].map((id) => ({
      id,
      name: id.toUpperCase(),
      region: "eu",
      data: {},
    }));
    const put = (id, at, surveyAt, p) =>
      write.run(
        id,
        at,
        JSON.stringify({
          ...p,
          surveyAt,
          observedAt: at,
          resourceTimes: {
            summary: at,
            pvp_summary: at,
            professions: at,
            reputations: at,
            equipment: at,
            ...p.resourceTimes,
          },
        }),
      );
    const first = "2026-11-10T13:00:00Z",
      second = "2026-11-10T13:20:00Z";
    const trades = [
      "Cooking",
      "Fishing",
      "Engineering",
      "First Aid",
      "Mining",
    ].map((name) => ({ name, skill: 300, max: 300 }));
    put("a", "2026-11-10T13:00:02Z", first, {
      level: 60,
      honorableKills: 1000,
      professions: trades.slice(0, 4),
      reputations: [
        { name: "Forjaz", standing: "Exaltado" },
        { name: "Ventormenta", standing: "Venerado", value: 42000 },
      ],
    });
    put("b", "2026-11-10T13:00:14Z", first, {
      level: 60,
      professions: [{ name: "Cocina", skill: 75, max: 75 }],
    });
    const firstRoom = recordTrophies(db, roster);
    assert.equal(firstRoom.unlocks["level-20"], undefined);
    assert.equal(firstRoom.unlocks["cooking-75"], undefined);
    assert.ok(firstRoom.unlocks["level-40"]);
    assert.ok(firstRoom.unlocks["cooking-150"]);
    assert.ok(firstRoom.unlocks["cooking-225"]);
    assert.equal(firstRoom.unlocks["five-trades"], undefined);
    assert.deepEqual(
      firstRoom.unlocks["level-60"].winners.map((w) => w.id),
      ["a", "b"],
    );
    assert.ok(firstRoom.unlocks["rep-forjaz"]);
    assert.equal(firstRoom.unlocks["rep-ventormenta"], undefined);
    assert.equal(firstRoom.unlocks["cooking-300"].winners.length, 1);
    // A previously published register also needs updating without new snapshots.
    const stored = JSON.parse(db.prepare("SELECT data FROM trophy_register WHERE id=1").get().data);
    for (const id of ["level-20", "mining-75", "cooking-75"])
      stored.unlocks[id] = firstRoom.unlocks["level-60"];
    db.prepare("UPDATE trophy_register SET data=? WHERE id=1").run(JSON.stringify(stored));
    const retry = recordTrophies(db, roster);
    assert.deepEqual(retry, firstRoom);
    assert.deepEqual(JSON.parse(db.prepare("SELECT data FROM trophy_register WHERE id=1").get().data).unlocks, firstRoom.unlocks);
    put("c", "2026-11-10T13:20:01Z", second, {
      level: 60,
      honorableKills: 5000,
      professions: trades,
    });
    put("a", "2026-11-10T13:20:02Z", second, {
      professions: trades.slice(4),
      honorableKills: 100000,
      resourceTimes: { pvp_summary: first },
    });
    const final = recordTrophies(db, roster);
    assert.deepEqual(final.unlocks["level-60"], firstRoom.unlocks["level-60"]);
    assert.deepEqual(
      final.unlocks["honor-1000"].winners.map((w) => w.id),
      ["a"],
    );
    assert.ok(final.unlocks["honor-5000"]);
    assert.equal(final.unlocks["honor-100000"], undefined);
    assert.deepEqual(
      final.unlocks["five-trades"].winners.map((w) => w.id),
      ["c"],
    );
    const news = trophyNews(final);
    assert.equal(news.length, Object.keys(final.unlocks).length);
    assert.equal(new Set(news.map((e) => e.id)).size, news.length);
    assert.deepEqual(
      news
        .find((e) => e.id === "trophy/level-60")
        .trophyWinners.map((w) => w.name),
      ["A", "B"],
    );
  } finally {
    db.close();
  }
});
