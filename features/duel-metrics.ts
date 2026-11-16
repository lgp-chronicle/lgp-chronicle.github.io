import type { GuildIconName } from "../components/guild-icon";
import { leveling } from "./analytics.ts";
import { battlegrounds } from "./battlegrounds.ts";
import { collectionCount, sharedCollections } from "./guild-collections.ts";
import { knownProfession } from "./professions.ts";
import { numeric, type Member, type Profile } from "./types.ts";

type Metric = { label: string; left: unknown; right: unknown; unit?: string; crown: boolean };
type Group = { id: string; title: string; icon: GuildIconName; rows: Metric[]; note?: string };

function battlefieldStats(profile: Profile) {
  const raw = profile.pvp?.pvp_map_statistics;
  if (!Array.isArray(raw)) return undefined;
  const maps = battlegrounds(profile);
  if (maps.length !== raw.length) return undefined;
  const played = maps.reduce((sum, m) => sum + m.played, 0);
  const won = maps.reduce((sum, m) => sum + m.won, 0);
  return { maps, played, won, rate: played ? won / played * 100 : undefined };
}
function trades(profile: Profile) {
  if (!profile.professions) return undefined;
  const skills = new Map<string, number>();
  for (const trade of profile.professions) {
    if (!numeric(trade.skill) || trade.skill < 0) continue;
    const name = knownProfession(trade.name)?.[1] ?? trade.name;
    skills.set(name, Math.max(trade.skill, skills.get(name) ?? 0));
  }
  return skills;
}

export function duelGroups(a: Member, b: Member, now = Date.now()) {
  const groups: Group[] = [];
  function group(id: string, title: string, icon: GuildIconName, note?: string) {
    const rows: Metric[] = [];
    groups.push({ id, title, icon, rows, note });
    return (label: string, get: (m: Member) => unknown, unit?: string, crown = true) => {
      const left = get(a), right = get(b);
      if (left !== undefined && left !== null || right !== undefined && right !== null)
        rows.push({ label, left, right, unit, crown });
    };
  }
  const general = group("general", "Personaje y equipo", "shield");
  general("Nivel", m => m.data.level);
  general("Nivel de objeto", m => m.data.itemLevel);
  const quality = (m: Member, minimum: number) => m.data.equipment?.filter(item => {
    const rank = ["POOR","COMMON","UNCOMMON","RARE","EPIC","LEGENDARY"].indexOf(item.quality ?? "");
    return !["SHIRT","TABARD"].includes(item.slotType ?? "") && !/^(camisa|camisola|tabardo)$/i.test(item.slot) && rank >= minimum;
  }).length;
  general("Piezas azules o mejores", m => quality(m,3));
  general("Piezas épicas o mejores", m => quality(m,4));

  const shared = (["mounts","pets"] as const).flatMap(kind => {
    const total = sharedCollections(a.data,b.data,kind);
    return total === undefined ? [] : [total + (kind==="mounts"?" monturas":" mascotas")];
  });
  const collections = group("collections", "Colecciones", "crate", shared.length ? "En común: " + shared.join(" · ") + "." : undefined);
  collections("Monturas distintas", m => collectionCount(m.data,"mounts"));
  collections("Mascotas distintas", m => collectionCount(m.data,"pets"));
  collections("Coleccionables en total", m => {
    const mounts = collectionCount(m.data,"mounts"), pets = collectionCount(m.data,"pets");
    return mounts === undefined || pets === undefined ? undefined : mounts + pets;
  });

  const pvp = group("pvp", "Honor y campos de batalla", "swords");
  pvp("Muertes honorables", m => m.data.honorableKills);
  pvp("Honor", m => m.data.honor);
  pvp("Rango PvP", m => m.data.pvpRank);
  const bg = new Map([[a.id,battlefieldStats(a.data)],[b.id,battlefieldStats(b.data)]]);
  pvp("Campos de batalla jugados", m => bg.get(m.id)?.played, undefined, false);
  pvp("Victorias en campos de batalla", m => bg.get(m.id)?.won);
  pvp("Porcentaje de victorias", m => bg.get(m.id)?.rate, "%");
  const maps = new Map([...bg.values()].flatMap(stats => stats?.maps.map(map => [map.id,map.name] as const) ?? []));
  for (const [id,name] of maps) {
    pvp(name + " · Victorias", m => {
      const stats = bg.get(m.id);
      return stats ? stats.maps.find(map => map.id===id)?.won ?? 0 : undefined;
    });
  }

  const statKeys = [...new Set([...Object.keys(a.data.statistics ?? {}),...Object.keys(b.data.statistics ?? {})])];
  const defence = new Set(["Armadura","Defensa","Esquivar (%)","Parar (%)","Bloquear (%)"]);
  const base = new Set(["Salud","Fuerza","Agilidad","Intelecto","Aguante","Espíritu"]);
  for (const [id,title,icon,pick] of [
    ["attributes","Atributos","stamina",(key: string) => base.has(key)],
    ["attack","Ataque y hechizos","spellpower",(key: string) => !base.has(key) && !defence.has(key)],
    ["defence","Defensa","armor",(key: string) => defence.has(key)],
  ] as const) {
    const add = group(id,title,icon);
    for (const key of statKeys.filter(pick)) add(key.replace(/ \(%\)$/, ""), m => m.data.statistics?.[key], key.endsWith(" (%)")?"%":undefined);
  }

  const skills = new Map([[a.id,trades(a.data)],[b.id,trades(b.data)]]);
  const profession = group("professions","Profesiones","blacksmithing");
  profession("Puntos de habilidad en total",m => { const t=skills.get(m.id);return t?[...t.values()].reduce((sum,n)=>sum+n,0):undefined; });
  profession("Profesiones a 300 puntos",m => { const t=skills.get(m.id);return t?[...t.values()].filter(n=>n>=300).length:undefined; });
  const names = [...new Set([...skills.values()].flatMap(t=>t?[...t.keys()]:[]))].sort((x,y)=>x.localeCompare(y,"es"));
  for (const name of names) profession(name,m=>{const t=skills.get(m.id);return t?t.get(name)??0:undefined;});

  const achievements = group("achievements","Logros y reputaciones","trophy");
  achievements("Puntos de logros",m=>m.data.achievementPoints);
  achievements("Logros registrados",m=>m.data.achievements?new Set(m.data.achievements).size:undefined);
  achievements("Logros de exploración",m=>m.data.achievements?new Set(m.data.achievements.filter(s=>/^(explore |explora)/i.test(s))).size:undefined);
  achievements("Reputaciones en Exaltado",m=>m.data.reputations?.filter(r=>/exalt/i.test(r.standing)).length);
  achievements("Reputaciones en Reverenciado o más",m=>m.data.reputations?.filter(r=>/rever|exalt/i.test(r.standing)).length);

  const progress = group("progress","Ritmo de subida","steps");
  const pace = new Map([[a.id,leveling(a,now)],[b.id,leveling(b,now)]]);
  progress("Niveles en 24 horas",m=>pace.get(m.id)?.day);
  progress("Niveles en 7 días",m=>pace.get(m.id)?.week);
  progress("Niveles desde el primer registro",m=>pace.get(m.id)?.total);
  progress("Niveles por día observado",m=>pace.get(m.id)?.average);

  const logs = group("logs","Warcraft Logs","journal","DPS, HPS y parses son mejores registros y pueden corresponder a encuentros distintos.");
  logs("Jefes en logs",m=>m.logs?.bosses);
  logs("Mejor parse",m=>m.logs?.bestParse,"%");
  logs("Mejor DPS",m=>m.logs?.bestDps);
  logs("Mejor HPS",m=>m.logs?.bestHps);
  return groups.filter(g=>g.rows.length);
}
