import { measurements } from "./observations.ts";
import { raidActivity } from "./raid-activity.ts";
import {
  numeric,
  type Member,
  type Snapshot,
  type Profile,
  type Activity,
} from "./types.ts";
export const DAY = 86400000;
export function windowGain(
  m: Member,
  key: keyof Profile,
  days: number,
  now = Date.now(),
): number | null {
  const cutoff = now - days * DAY;
  const rows = measurements(m, key);
  const base = rows.filter((s) => Date.parse(s.at) <= cutoff).at(-1);
  const last = rows.at(-1);
  if (
    !base ||
    !last ||
    now - Date.parse(last.at) > 6 * 3600000 ||
    Date.parse(last.at) < cutoff ||
    cutoff - Date.parse(base.at) > 6 * 3600000
  )
    return null;
  const a = base.data[key],
    b = last.data[key];
  return numeric(a) && numeric(b) && b >= a ? b - a : null;
}
export function leveling(m: Member, now = Date.now()) {
  const rows = measurements(m, "level");
  const first = rows[0],
    last = rows.at(-1);
  const total = first && last ? last.data.level! - first.data.level! : null;
  const days =
    first && last ? (Date.parse(last.at) - Date.parse(first.at)) / DAY : 0;
  let best: { gain: number; hours: number; at: string } | null = null,
    lastLevel: string | null = null;
  for (let i = 1; i < rows.length; i++) {
    const gain = rows[i].data.level! - rows[i - 1].data.level!;
    const hours =
      (Date.parse(rows[i].at) - Date.parse(rows[i - 1].at)) / 3600000;
    if (gain > 0 && hours > 0) {
      lastLevel = rows[i].at;
      if (!best || gain / hours > best.gain / best.hours)
        best = { gain, hours, at: rows[i].at };
    }
  }
  return {
    day: windowGain(m, "level", 1, now),
    week: windowGain(m, "level", 7, now),
    total,
    average: days > 0 && total !== null ? total / days : null,
    best,
    lastLevel,
  };
}
export function changedEvents(
  id: string,
  name: string,
  old: Profile,
  next: Profile,
  at: string,
): Activity[] {
  const rows: Activity[] = [];
  for (const [key, unit] of [
    ["level", "niveles"],
    ["itemLevel", "puntos de equipo"],
    ["honorableKills", "muertes honorables"],
  ] as const) {
    const a = old[key],
      b = next[key];
    if (numeric(a) && numeric(b) && b > a)
      rows.push({
        id: `${id}:${at}:${key}`,
        characterId: id,
        at,
        kind: "gain",
        metric: key,
        delta: b - a,
        text:
          key === "level"
            ? `${name} alcanza el nivel ${b}. ${b - a} ${unit} más para la historia.`
            : `${name} gana ${b - a} ${unit} desde el último registro.`,
      });
  }
  return rows;
}
export type Award = {
  id: string;
  title: string;
  names: string[];
  value: number;
  rule: string;
};
export function awards(members: Member[], now = Date.now()): Award[] {
  const a: Award[] = [];
  const add = (
    id: string,
    title: string,
    rule: string,
    score: (m: Member) => number | null | undefined,
    min = 0,
  ) => {
    const values = members
      .map((m) => ({ m, n: score(m) }))
      .filter((x): x is { m: Member; n: number } => numeric(x.n) && x.n > min);
    if (values.length < 2) return;
    const max = Math.max(...values.map((x) => x.n));
    a.push({
      id,
      title,
      rule,
      value: max,
      names: values.filter((x) => x.n === max).map((x) => x.m.name),
    });
  };
  add(
    "pvp",
    "El más PvPero",
    "Más muertes honorables registradas",
    (m) => m.data.honorableKills,
  );
  add(
    "gear",
    "El Fashion Victim",
    "Mayor item level equipado",
    (m) => m.data.itemLevel,
  );
  add("level", "El abrecaminos", "Mayor nivel registrado", (m) => m.data.level);
  add("speed", "Speedrunner", "Más niveles observados en 24 horas", (m) =>
    windowGain(m, "level", 1, now),
  );
  add("week", "El Tryhard", "Más niveles observados en 7 días", (m) =>
    windowGain(m, "level", 7, now),
  );
  add("goblin", "Gear Goblin", "Mayor aumento de item level en 7 días", (m) =>
    windowGain(m, "itemLevel", 7, now),
  );
  add(
    "pvpday",
    "Gladiador del Lidl",
    "Más muertes honorables ganadas en 24 horas",
    (m) => windowGain(m, "honorableKills", 1, now),
  );
  add(
    "pvpweek",
    "El problema del otro bando",
    "Más muertes honorables ganadas en 7 días",
    (m) => windowGain(m, "honorableKills", 7, now),
  );
  add(
    "profession",
    "El Empresario",
    "Mayor suma de habilidad en profesiones",
    (m) =>
      m.data.professions?.some((p) => numeric(p.skill))
        ? m.data.professions.reduce((sum, p) => sum + (p.skill ?? 0), 0)
        : null,
  );
  add(
    "book",
    "El Ratón de Biblioteca",
    "Más puntos de logros proporcionados por la fuente",
    (m) => m.data.achievementPoints,
  );
  add(
    "epic",
    "Púrpura es mi color",
    "Más piezas épicas equipadas",
    (m) => m.data.equipment?.filter((x) => x.quality === "EPIC").length,
  );
  add(
    "legend",
    "Con permiso del loot council",
    "Más piezas legendarias equipadas",
    (m) => m.data.equipment?.filter((x) => x.quality === "LEGENDARY").length,
  );
  add(
    "pve",
    "PvE Enjoyer",
    "Más bosses únicos en los rankings configurados",
    (m) => m.logs?.bosses,
  );
  add(
    "parse",
    "Best Parse",
    "Mayor mejor parse entre zonas configuradas",
    (m) => m.logs?.bestParse,
  );
  add(
    "dps",
    "Top DPS",
    "Mayor DPS registrado en rankings configurados; encuentros distintos",
    (m) => m.logs?.bestDps,
  );
  add(
    "hps",
    "Top Healer",
    "Mayor HPS registrado en rankings configurados; encuentros distintos",
    (m) => m.logs?.bestHps,
  );
  add(
    "rep",
    "El diplomático",
    "Más reputaciones en Exaltado",
    (m) => m.data.reputations?.filter((r) => /exalt/i.test(r.standing)).length,
  );
  add(
    "craft",
    "Maestro artesano",
    "Más profesiones con habilidad al máximo",
    (m) =>
      m.data.professions?.filter(
        (p) =>
          numeric(p.skill) && numeric(p.max) && p.max > 0 && p.skill === p.max,
      ).length,
  );
  add(
    "journey",
    "De la zona inicial al infinito",
    "Más niveles desde el primer registro",
    (m) => leveling(m, now).total,
  );
  add(
    "honor",
    "Por el honor",
    "Mayor honor disponible registrado",
    (m) => m.data.honor,
  );
  add(
    "boss-destroyer",
    "Boss Destroyer",
    "Más kills con participación confirmada en informes recientes (7 días)",
    (m) => raidActivity(m.logs, now)?.kills,
  );
  add(
    "repair",
    "Patrocinador del herrero",
    "Más wipes confirmados en informes recientes (7 días)",
    (m) => raidActivity(m.logs, now)?.wipes,
  );
  add(
    "combat",
    "Un pull más y lo dejamos",
    "Más minutos de combate confirmados en informes recientes (7 días)",
    (m) => raidActivity(m.logs, now)?.minutes,
  );
  const dated = members.filter((m) => m.addedAt);
  if (dated.length > 1) {
    const latest = dated.reduce((a, b) => (a.addedAt! > b.addedAt! ? a : b));
    const ties = dated.filter(
      (m) => m.addedAt!.slice(0, 10) === latest.addedAt!.slice(0, 10),
    );
    if (ties.length === 1)
      a.push({
        id: "newcomer",
        title: "El recién llegado",
        names: [latest.name],
        value: 1,
        rule: "Último personaje incorporado al archivo",
      });
  }
  const counts = Object.fromEntries(
    members.map((m) => [
      m.name,
      a.filter((x) => x.names.includes(m.name)).length,
    ]),
  );
  add(
    "main",
    "Main Character",
    "Lidera más categorías de este salón",
    (m) => counts[m.name],
    1,
  );
  return a;
}
export const display = (v: unknown) =>
  v === undefined || v === null
    ? "—"
    : typeof v === "number"
      ? v.toLocaleString("es-ES", { maximumFractionDigits: 1 })
      : String(v);
export function ago(at?: string, now = Date.now()) {
  if (!at) return "Sin sincronizar";
  const n = Math.max(0, Math.floor((now - Date.parse(at)) / 60000));
  return n < 1
    ? "Hace un momento"
    : n < 60
      ? `Hace ${n} min`
      : n < 1440
        ? `Hace ${Math.floor(n / 60)} h`
        : `Hace ${Math.floor(n / 1440)} días`;
}
