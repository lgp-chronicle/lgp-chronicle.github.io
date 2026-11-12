import { knownProfession } from "../features/professions.ts";
import { measurements } from "../features/observations.ts";
import { hasRecentUpdate } from "../features/spotlight-freshness.ts";
import {
  numeric,
  type Member,
  type MemberStrength,
} from "../features/types.ts";

type Reading = MemberStrength & {
  value: number;
  pool: string;
  metric: string;
  priority: number;
};
const attributes = [
  ["Agilidad", "Reflejos felinos", "agility"],
  ["Aguante", "De piedra", "stamina"],
  ["Intelecto", "Mente brillante", "intellect"],
  ["Fuerza", "Pulso de hierro", "strength"],
  ["Espíritu", "Espíritu indomable", "spirit"],
] as const;

function readings(m: Member): Reading[] {
  const p = m.data,
    rows: Reading[] = [];
  if (p.armoryVerified === false || (p.level ?? 0) < 10) return rows;
  for (const trade of p.professions ?? []) {
    if (!numeric(trade.skill) || trade.skill < 0) continue;
    const known = knownProfession(trade.name);
    const name = known?.[1] ?? trade.name;
    rows.push({
      pool: "trade/" + name,
      metric: name.toLocaleLowerCase("es"),
      title: name,
      scene: "ambar",
      icon: known?.[2] ?? "blacksmithing",
      value: trade.skill,
      unit: "de habilidad",
      note:
        numeric(trade.max) && trade.max >= trade.skill
          ? `${trade.skill} de ${trade.max} puntos en su rango de ${name.toLocaleLowerCase("es")}.`
          : `${trade.skill} puntos registrados en ${name.toLocaleLowerCase("es")}.`,
      priority: 4,
    });
  }
  for (const [unit, title, icon] of attributes) {
    const value = p.statistics?.[unit];
    if (numeric(value) && value >= 0)
      rows.push({
        pool: "stat/" + unit,
        metric: unit.toLocaleLowerCase("es"),
        title,
        value,
        unit: "de " + unit.toLocaleLowerCase("es"),
        icon,
        scene: "espadas",
        note: "",
        priority: 1,
      });
  }
  const explored = new Set(
    p.achievements?.filter((a) => /^(explore |explora)/i.test(a)),
  ).size;
  if (Array.isArray(p.achievements))
    rows.push({
      pool: "exploration",
      metric: "exploración",
      title: "Cuaderno de viaje",
      value: explored,
      unit: explored === 1 ? "logro de exploración" : "logros de exploración",
      icon: "compass",
      scene: "bota",
      note: "Exploraciones registradas en su ficha.",
      priority: 3,
    });
  if (numeric(p.honorableKills) && p.honorableKills >= 0)
    rows.push({
      pool: "honor",
      metric: "muertes con honor",
      title: "Guardia de frontera",
      value: p.honorableKills,
      unit: p.honorableKills === 1 ? "muerte con honor" : "muertes con honor",
      icon: "swords",
      scene: "espadas",
      note: "Bajas honorables registradas en la armería.",
      priority: 2,
    });
  return rows;
}

function personal(m: Member, rows: Reading[]): MemberStrength {
  const p = m.data;
  const trade = rows
    .filter((r) => r.pool.startsWith("trade/") && r.value > 0)
    .sort(
      (a, b) => b.value - a.value || a.title.localeCompare(b.title, "es"),
    )[0];
  const explores = rows.find((r) => r.icon === "compass" && r.value > 0);
  const levels = measurements(m, "level");
  const first = levels[0]?.data.level,
    current = p.level;
  const repOrder = ["Honrado", "Reverenciado", "Exaltado"];
  const reputation =
    p.armoryVerified === false
      ? undefined
      : p.reputations
          ?.filter((r) => repOrder.includes(r.standing))
          .sort(
            (a, b) =>
              repOrder.indexOf(b.standing) - repOrder.indexOf(a.standing) ||
              (b.value ?? 0) - (a.value ?? 0),
          )[0];
  if (reputation && repOrder.indexOf(reputation.standing) >= 1)
    return {
      title: "Lazos con " + reputation.name,
      note: "Reputación registrada: " + reputation.standing + ".",
      icon: "tabard",
      scene: "corona",
    };
  if (trade && trade.value >= 50) return trade;
  if (explores && explores.value >= 3) return explores;
  if (numeric(first) && numeric(current) && current > first)
    return {
      title: "Pasos por Azeroth",
      value: current - first,
      unit: current - first === 1 ? "nivel ganado" : "niveles ganados",
      note: `Del nivel ${first} al ${current} desde su primer registro.`,
      icon: "steps",
      scene: "bota",
    };
  if (trade || explores) return trade ?? explores!;
  if (reputation)
    return {
      title: reputation.name,
      note: "Reputación registrada: " + reputation.standing + ".",
      icon: "tabard",
      scene: "corona",
    };
  const quality = ["RARE", "EPIC", "LEGENDARY"];
  const prized =
    p.armoryVerified === false
      ? undefined
      : p.equipment
          ?.filter((i) => quality.includes(i.quality ?? ""))
          .sort(
            (a, b) =>
              quality.indexOf(b.quality!) - quality.indexOf(a.quality!) ||
              (b.itemLevel ?? 0) - (a.itemLevel ?? 0),
          )[0];
  if (prized)
    return {
      title: "Joya del equipo",
      note: prized.name + " · " + prized.slot,
      value: prized.itemLevel,
      unit: prized.itemLevel ? "nivel de objeto" : undefined,
      icon: "ruby",
      scene: "ambar",
    };
  const attribute = rows
    .filter((r) => r.scene === "espadas" && r.icon !== "swords" && r.value > 0)
    .sort((a, b) => b.value - a.value)[0];
  if (attribute)
    return {
      ...attribute,
      note: "Su valor más alto entre los atributos principales registrados.",
    };
  if (p.spec && p.armoryVerified !== false)
    return {
      title: p.spec,
      note: "Especialización registrada en la armería.",
      icon: "staff",
      scene: "ambar",
    };
  return {
    title: "En las filas de La Ganga",
    value: current,
    unit: numeric(current) ? "nivel" : undefined,
    note:
      [p.race, p.className].filter(Boolean).join(" · ") ||
      "Personaje registrado en el censo.",
    icon: "tabard",
    scene: "corona",
  };
}

export function describeMembers(members: Member[], now: number) {
  const current = members.filter(
    (m) =>
      m.inRoster !== false &&
      !m.membership?.leftAt &&
      !m.membership?.pendingAbsence,
  );
  for (const m of members) delete m.strength;
  const sheets = current.map((m) => {
    const distinct = new Map<string, Reading>();
    for (const row of readings(m))
      if (row.value > (distinct.get(row.pool)?.value ?? -1))
        distinct.set(row.pool, row);
    return { m, rows: [...distinct.values()] };
  });
  const pools = new Map<string, number[]>();
  for (const { rows } of sheets)
    for (const row of rows) {
      if (!pools.has(row.pool)) pools.set(row.pool, []);
      pools.get(row.pool)!.push(row.value);
    }
  const roster: Member[] = [];
  for (const { m, rows } of sheets) {
    if (!hasRecentUpdate(m, now)) continue;
    roster.push(m);
    const ranked = rows
      .flatMap((row) => {
        const peers = pools.get(row.pool)!;
        if (peers.length < 2 || row.value <= 0) return [];
        const higher = peers.filter((v) => v > row.value).length;
        const tied = peers.filter((v) => v === row.value).length;
        const beaten = (peers.length - higher - tied) / (peers.length - 1);
        const position = `${higher + 1}.º en ${row.metric}${tied > 1 ? " (empate)" : ""}`;
        return [
          {
            row,
            beaten,
            count: peers.length,
            shortNote: position,
            note: `${position} entre ${peers.length} miembros con datos.`,
          },
        ];
      })
      .sort(
        (a, b) =>
          b.beaten - a.beaten ||
          b.row.priority - a.row.priority ||
          b.count - a.count ||
          a.row.pool.localeCompare(b.row.pool),
      );
    const best = ranked[0];
    const { title, value, unit, note, icon, scene } =
      best?.row ?? personal(m, rows);
    m.strength = { title, value, unit, note: best?.note ?? note, shortNote: best?.shortNote, icon, scene };
  }
  return roster;
}
