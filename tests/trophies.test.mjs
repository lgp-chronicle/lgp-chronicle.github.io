import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { armoryNews } from "../services/armory-news.ts";
import { awards } from "../features/analytics.ts";
import { trophyCatalog } from "../features/trophy-catalog.ts";
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
const battlefield = (id, won, name = "Mapa " + id) => ({world_map: {id, name}, match_statistics: {won, played: won, lost: 0}});
const collection = ids => ids.map(id => ({id, name:"Especie " + id}));
test("current collection and battleground awards distinguish maps, keep ties and exclude stale or absent members", () => {
  const at = "2026-11-13T12:00:00Z", stale = "2026-11-01T12:00:00Z";
  const member = (id, wins, mounts, pets) => ({
    id, name:id, history:[], data:{level:30, sourceModified:at, resourceTimes:{pvp_summary:at,mounts:at,pets:at},
      collections:{mounts:collection(mounts),pets:collection(pets)},pvp:{pvp_map_statistics:wins}},
  });
  const a = member("a",[battlefield(489,6),battlefield(529,1)],[1,2],[]);
  const b = member("b",[battlefield(529,1),battlefield(30,0)],[1,2],[3]);
  const absent = member("gone",[battlefield(489,80)],[1,2,3],[2,3]);
  const old = {...absent,id:"old",data:{...absent.data,sourceModified:stale}};
  const staleRead = {...absent,id:"cached",data:{...absent.data,resourceTimes:{pvp_summary:stale,mounts:stale,pets:stale}}};
  const current = awards([a,b,old,staleRead,{...absent,inRoster:false},{...absent,id:"bank",data:{...absent.data,level:1}}],Date.parse(at));
  const rank = id => current.find(row => row.id === id);
  assert.deepEqual(rank("mounts").memberIds,["a","b"]);
  assert.deepEqual(rank("pets").memberIds,["b"]);
  assert.equal(rank("bg-wins").value,7);
  assert.deepEqual(rank("bg-map-489").memberIds,["a"]);
  assert.deepEqual(rank("bg-map-529").memberIds,["a","b"]);
  assert.equal(rank("bg-map-30"),undefined);
});
test("v2 trophy register replays map-specific winners and removes retired collections from editions", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("CREATE TABLE character_snapshots(id INTEGER PRIMARY KEY,character_id TEXT,at TEXT,data TEXT); CREATE TABLE trophy_register(id INTEGER PRIMARY KEY,cursor INTEGER,data TEXT)");
    const first = "2026-11-11T09:00:00Z", second = "2026-11-12T09:00:00Z";
    const put = db.prepare("INSERT INTO character_snapshots(character_id,at,data) VALUES(?,?,?)");
    for (const id of ["a","b"]) put.run(id, first, JSON.stringify({surveyAt:first,resourceTimes:{pvp_summary:first},pvp:{pvp_map_statistics:[battlefield(489,6),battlefield(529,4)]}}));
    put.run("b",second,JSON.stringify({surveyAt:second,resourceTimes:{pvp_summary:second},pvp:{pvp_map_statistics:[battlefield(489,10)]}}));
    const saved = {at:first,batch:first,winners:[{id:"a",name:"A",tint:"#fff"}]};
    db.prepare("INSERT INTO trophy_register VALUES(1,3,?)").run(JSON.stringify({version:2,factions:{},unlocks:{"mounts-1":saved,"pets-1":saved,"bg-wins-10":saved}}));
    const members = ["a","b"].map(id => ({id,name:id,data:{}}));
    const room = recordTrophies(db,members);
    assert.deepEqual(room.unlocks["bg-wins-10"],saved);
    assert.deepEqual(room.unlocks["bg-map-489-1"].winners.map(w=>w.id),["a","b"]);
    assert.equal(room.unlocks["bg-map-489-10"].at,second);
    assert.equal(room.unlocks["bg-map-529-10"],undefined);
    const retired = id => /^(mounts|pets)-1$/.test(id);
    assert.ok(!Object.keys(room.unlocks).some(retired));
    assert.ok(!trophyCatalog(room.factions,room.battlefields).some(t=>retired(t.id)));
    assert.ok(!trophyNews(room).some(event=>retired(event.id.slice(7))));
    assert.deepEqual(recordTrophies(db,members),room);
  } finally { db.close(); }
});
test("the Herald reports a first census, then only newly observed species, victories and tied records", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("CREATE TABLE character_snapshots(id INTEGER PRIMARY KEY,character_id TEXT,at TEXT,data TEXT)");
    const members = ["a","b"].map(id => ({id,name:id,data:{}}));
    const write = db.prepare("INSERT INTO character_snapshots(character_id,at,data) VALUES(?,?,?)");
    const put = (id, day, wins, pets, stamp = day) => {
      const at = "2026-11-"+day+"T10:00:00Z", time = "2026-11-"+stamp+"T10:00:00Z";
      write.run(id,at,JSON.stringify({level:20,surveyAt:at,resourceTimes:{pets:time,pvp_summary:time},
        collections:{pets:collection(pets)},pvp:{pvp_map_statistics:[battlefield(489,wins)]}}));
    };
    put("a",10,2,[1]); put("b",10,0,[2]); put("a",11,4,[1,3]); put("b",11,4,[2,3]);
    put("a",12,30,[1,2,3,4],11); put("b",12,3,[]); put("b",13,4,[2,3]);
    const news = armoryNews(db,members);
    assert.equal(news.length,5);
    assert.equal(news.filter(e=>e.id==="census/pets" && e.text.includes("2 mascotas distintas entre 2 personajes")).length,1);
    assert.equal(news.filter(e=>e.kind==="collections" && e.text.includes("Especie 3")).length,2);
    const wins = news.filter(e=>e.kind==="battlefields");
    assert.deepEqual(wins.map(e=>e.text.split(".")[0]),["a suma 2 victorias en Mapa 489","b suma 4 victorias en Mapa 489"]);
    assert.ok(wins.every(e=>e.text.includes("Comparte la nueva mejor marca")));
    assert.deepEqual(armoryNews(db,members),news);
  } finally { db.close(); }
});
test("new battlefield trophies replay early winners and collection trophies use owned species", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("CREATE TABLE character_snapshots(id INTEGER PRIMARY KEY,character_id TEXT,at TEXT,data TEXT)");
    db.exec("CREATE TABLE trophy_register(id INTEGER PRIMARY KEY,cursor INTEGER,data TEXT)");
    const at = "2026-11-12T09:00:00.000Z", later = "2026-11-13T10:00:00.000Z";
    const members = ["a","b"].map(id => ({ id, name:id, region:"eu", data:{} }));
    const pvp = { pvp_map_statistics: [{ world_map:{id:529,name:"Cuenca de Arathi"}, match_statistics:{played:18,won:10,lost:8} }] };
    const add = db.prepare("INSERT INTO character_snapshots(character_id,at,data) VALUES (?,?,?)");
    add.run("a", at, JSON.stringify({surveyAt:at, pvp, resourceTimes:{pvp_summary:at}}));
    db.prepare("INSERT INTO trophy_register VALUES (1,1,?)").run(JSON.stringify({factions:{},unlocks:{}}));
    add.run("b", later, JSON.stringify({surveyAt:later, pvp, collections:{pets:Array.from({length:5},(_,id)=>({id,name:"Mascota "+id})),mounts:[]},resourceTimes:{pvp_summary:later,pets:later,mounts:later}}));
    const room = recordTrophies(db,members);
    assert.deepEqual(room.unlocks["bg-wins-10"].winners.map(m=>m.id),["a"]);
    assert.equal(room.unlocks["pets-5"].at,later);
    assert.equal(room.unlocks["pets-1"],undefined);
    assert.deepEqual(room.unlocks["bg-map-529-10"].winners.map(m=>m.id),["a"]);
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
    for (const id of ["level-20", "mining-75", "cooking-75", "mounts-1", "pets-1"])
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
