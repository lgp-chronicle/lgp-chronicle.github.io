import type { DatabaseSync } from "node:sqlite";
import {
  color,
  type Activity,
  type Equipment,
  type Member,
  type Profile,
  type TrophyRoom,
} from "../features/types.ts";
import { fullName } from "../features/member-name.ts";
import { battlegrounds } from "../features/battlegrounds.ts";
import { knownProfession, professions } from "../features/professions.ts";
import {
  honorSteps,
  victorySteps,
  collectionSteps,
  levelSteps,
  tradeSteps,
  trophyCatalog,
} from "../features/trophy-catalog.ts";
import itemProperties from "../config/item-tooltips.json" with { type: "json" };

const armorSlots = [
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
const qualities = [
  "POOR",
  "COMMON",
  "UNCOMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
  "ARTIFACT",
];
const legacySlots: Record<string, string> = {
  cabeza: "HEAD",
  cuello: "NECK",
  hombro: "SHOULDER",
  hombros: "SHOULDER",
  espalda: "BACK",
  pecho: "CHEST",
  muñeca: "WRIST",
  manos: "HANDS",
  cintura: "WAIST",
  piernas: "LEGS",
  pies: "FEET",
  "anillo 1": "FINGER_1",
  "anillo 2": "FINGER_2",
  "abalorio 1": "TRINKET_1",
  "abalorio 2": "TRINKET_2",
  "mano principal": "MAIN_HAND",
  "mano secundaria": "OFF_HAND",
  "a distancia": "RANGED",
  reliquia: "RANGED",
  tabardo: "TABARD",
};
const properties: Record<string, { inventoryType?: string }> = itemProperties;
const retiredTrophies = ["level-20", "mounts-1", "pets-1", ...professions.map(([, , id]) => id + "-75")];
function itemSlot(item: Equipment) {
  const slot =
    item.slotType ?? legacySlots[item.slot?.toLowerCase()] ?? item.slot;
  return ["RANGEDRIGHT", "RELIC", "RANGED_RIGHT"].includes(slot)
    ? "RANGED"
    : slot;
}
export function equipmentTrophies(items: Equipment[]) {
  const slots = new Map(items.map((i) => [itemSlot(i), i]));
  const rank = (s: string) => qualities.indexOf(slots.get(s)?.quality ?? "");
  const main = slots.get("MAIN_HAND");
  const grip =
    main?.properties?.inventoryType ??
    properties[main?.id + "-" + main?.itemLevel]?.inventoryType ??
    "";
  const twoHand =
    main?.properties?.inventoryTypeId === "TWOHWEAPON" ||
    /^(dos manos|two.hand(?:ed)?)$/iu.test(grip.trim());
  const required =
    twoHand && !slots.has("OFF_HAND")
      ? armorSlots
      : [...armorSlots, "OFF_HAND"];
  const min = Math.min(...required.map(rank));
  const ids = [2, 3, 4].filter((n) => min >= n).map((n) => "gear-" + n);
  if (slots.get("TABARD")?.id === 5976) ids.push("tabard");
  if (rank("FINGER_1") >= 4 && rank("FINGER_2") >= 4) ids.push("rings");
  if (required.some((s) => rank(s) === 5)) ids.push("legendary");
  return ids;
}

type StoredProfile = Profile & { surveyAt?: string };
type Evidence = { id: string; resource: string };
function evidence(
  p: StoredProfile,
  factions: Record<string, string>,
  battlefields: Record<string, string>,
): Evidence[] {
  const found: Evidence[] = [];
  const add = (id: string, resource: string) => found.push({ id, resource });
  for (const n of levelSteps)
    if ((p.level ?? 0) >= n) add("level-" + n, "summary");
  for (const n of honorSteps)
    if ((p.honorableKills ?? 0) >= n) add("honor-" + n, "pvp_summary");
  const maps = battlegrounds(p);
  for (const map of maps) {
    battlefields[map.id] = map.name;
    for (const n of victorySteps)
      if (map.won >= n) add(`bg-map-${map.id}-${n}`, "pvp_summary");
  }
  const wins = maps.reduce((sum, map) => sum + map.won, 0);
  for (const n of victorySteps) if (wins >= n) add("bg-wins-" + n, "pvp_summary");
  for (const kind of ["mounts", "pets"] as const) {
    const total = p.collections?.[kind]?.length ?? 0;
    for (const n of collectionSteps) if (total >= n) add(kind + "-" + n, kind);
  }
  for (const id of equipmentTrophies(p.equipment ?? [])) add(id, "equipment");
  const masters = new Set<string>();
  for (const t of p.professions ?? []) {
    const trade = knownProfession(t.name);
    if (!trade || t.skill == null || t.max == null) continue;
    const mastered = t.max >= 300 && t.skill >= t.max;
    if (mastered) masters.add(trade[2]);
    for (const n of tradeSteps)
      if (n === 300 ? mastered : t.skill >= n && t.max >= n)
        add(trade[2] + "-" + n, "professions");
  }
  if (masters.size >= 5) add("five-trades", "professions");
  for (const rep of p.reputations ?? []) {
    if (!rep.name || rep.name === "Reputación") continue;
    const id =
      "rep-" + rep.name.normalize("NFC").toLocaleLowerCase("es").trim();
    factions[id] = rep.name;
    if (/^(exaltad[oa]|exalted|7)$/iu.test(rep.standing?.trim()))
      add(id, "reputations");
  }
  return found;
}

// Read each full armory snapshot once. The cursor and winners advance atomically.
export function recordTrophies(
  db: DatabaseSync,
  members: Member[],
): TrophyRoom {
  db.exec(
    "CREATE TABLE IF NOT EXISTS trophy_register (id INTEGER PRIMARY KEY, cursor INTEGER NOT NULL, data TEXT NOT NULL)",
  );
  db.exec("BEGIN IMMEDIATE");
  try {
    const state = db
      .prepare("SELECT cursor,data FROM trophy_register WHERE id=1")
      .get();
    type LegacyRun = { start: string; last: string; members: string[] };
    const saved: TrophyRoom & { legacyRun?: LegacyRun; version?: number } = state
      ? JSON.parse(String(state.data))
      : { factions: {}, unlocks: {} };
    const battlefields = saved.battlefields ?? {};
    const room: TrophyRoom = {
      battlefields,
      factions: saved.factions,
      unlocks: saved.unlocks,
    };
    const retired = retiredTrophies.filter((id) => Object.hasOwn(room.unlocks, id));
    for (const id of retired) delete room.unlocks[id];
    // Old snapshots already contain battlefield results. Replay them once for the new awards.
    const backfill = !!state && (saved.version ?? 0) < 3;
    const previousCursor = Number(state?.cursor ?? 0);
    let legacyRun = backfill ? undefined : saved.legacyRun;
    let cursor = backfill ? 0 : previousCursor;
    const roster = new Map(members.map((m) => [m.id, m]));
    const rows = db
      .prepare(
        "SELECT id,character_id,at,data FROM character_snapshots WHERE id>? ORDER BY id",
      )
      .iterate(cursor);
    for (const row of rows) {
      cursor = Number(row.id);
      const member = roster.get(String(row.character_id));
      if (!member) continue;
      const p: StoredProfile = JSON.parse(String(row.data));
      const captured = String(row.at);
      if (!p.surveyAt) {
        const gap = Date.parse(captured) - Date.parse(legacyRun?.last ?? "");
        if (
          !legacyRun ||
          !(gap >= 0 && gap < 180000) ||
          legacyRun.members.includes(member.id)
        )
          legacyRun = { start: captured, last: captured, members: [] };
        legacyRun.last = captured;
        legacyRun.members.push(member.id);
      }
      for (const { id, resource } of evidence(p, room.factions, battlefields)) {
        if (backfill && cursor <= previousCursor && !id.startsWith("bg-map-") &&
          !((saved.version ?? 0) < 2 && /^(bg-wins|mounts|pets)-/.test(id))) continue;
        const at =
          p.resourceTimes?.[resource] ?? p.observedAt ?? String(row.at);
        if (!Number.isFinite(Date.parse(at))) continue;
        if (
          p.surveyAt &&
          (Date.parse(at) < Date.parse(p.surveyAt) ||
            (resource !== "summary" && !p.resourceTimes?.[resource]))
        )
          continue;
        // Earlier exports omit run IDs; merge only consecutive reads of distinct characters.
        const run = p.surveyAt ?? legacyRun!.start;
        if (Date.parse(at) < Date.parse(run) && p.resourceTimes?.[resource])
          continue;
        const batch = run;
        let unlock = room.unlocks[id];
        if (!unlock || Date.parse(batch) < Date.parse(unlock.batch)) {
          unlock = room.unlocks[id] = { batch, at, winners: [] };
        }
        if (
          unlock.batch !== batch ||
          unlock.winners.some((w) => w.id === member.id)
        )
          continue;
        if (at < unlock.at) unlock.at = at;
        unlock.winners.push({
          id: member.id,
          name: fullName(member),
          tint: color(member),
        });
        unlock.winners.sort((a, b) => a.name.localeCompare(b.name, "es"));
      }
    }
    if (!state || backfill || cursor !== state.cursor || retired.length > 0)
      db.prepare(
        "INSERT INTO trophy_register VALUES (1,?,?) ON CONFLICT(id) DO UPDATE SET cursor=excluded.cursor,data=excluded.data",
      ).run(cursor, JSON.stringify({ ...room, legacyRun, version: 3 }));
    db.exec("COMMIT");
    return room;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function trophyNews(room: TrophyRoom): Activity[] {
  const news: Activity[] = [];
  for (const trophy of trophyCatalog(room.factions, room.battlefields)) {
    const win = room.unlocks[trophy.id];
    if (!win?.winners.length) continue;
    news.push({
      id: "trophy/" + trophy.id,
      at: win.at,
      kind: "trophy",
      characterId: win.winners[0].id,
      text: trophy.title,
      trophyWinners: win.winners,
    });
  }
  return news;
}
