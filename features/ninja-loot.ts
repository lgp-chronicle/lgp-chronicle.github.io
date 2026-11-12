import type { Equipment, Member } from "./types.ts";

// Guild scoring rules for unconditional item bonuses. Mixed builds only count
// a stat when it is off-spec for every leading talent tree.
const caster = [
  "fuerza",
  "agilidad",
  "poder de ataque",
  "poder de ataque a distancia",
  "daño físico",
];
const spells = [
  "daño con hechizos",
  "poder con hechizos",
  "perforación de hechizo",
];
const healing = "sanación con hechizos";
const noMana = ["intelecto", "regeneración de maná", healing, ...spells];
const rules: Record<number, Record<string, string[]>> = {
  1: { Armas: noMana, Furia: noMana, Protección: noMana },
  2: { Sagrado: caster, Protección: [healing], Reprensión: [healing] },
  3: {
    "Dominio de bestias": [healing, ...spells],
    Puntería: [healing, ...spells],
    Supervivencia: [healing, ...spells],
  },
  4: { Asesinato: noMana, Combate: noMana, Sutileza: noMana },
  5: { Disciplina: caster, Sagrado: caster, Sombra: [...caster, healing] },
  7: {
    "Combate elemental": [...caster, healing],
    Elemental: [...caster, healing],
    Recuperación: caster,
    Restauración: caster,
    Mejora: [healing],
  },
  8: {
    Arcano: [...caster, healing],
    Fuego: [...caster, healing],
    Escarcha: [...caster, healing],
  },
  9: {
    Aflicción: [...caster, healing],
    Demonología: [...caster, healing],
    Destrucción: [...caster, healing],
  },
  11: {
    "Combate feral": [healing, ...spells],
    Feral: [healing, ...spells],
    Equilibrio: [...caster, healing],
    Restauración: caster,
  },
};

export type NinjaItem = { item: Equipment; points: number; bonuses: string[] };
export function ninjaLoot(m: Member) {
  if (
    m.id === "forever-eu-naisen-grandwell" ||
    m.membership?.leftAt ||
    !m.data.spec ||
    !m.data.equipment?.length
  )
    return;
  const bySpec = rules[m.data.classId ?? 0];
  const builds = m.data.spec
    .split(/\s*\/\s*/)
    .map((spec) => bySpec?.[spec.trim()]);
  if (!builds.every(Boolean)) return;
  const items: NinjaItem[] = [];
  let observed = false;
  for (const item of m.data.equipment) {
    const bonuses: string[] = [];
    let points = 0;
    for (const line of new Set(
      [...(item.details ?? []), ...(item.effects ?? [])].map((line) =>
        line.trim().toLocaleLowerCase("es"),
      ),
    )) {
      if (/\d/.test(line)) observed = true;
      const match = /^\+(\d+)\s+(.+)$/.exec(line);
      if (!match) continue;
      const stat = match[2].replace(
        /^regeneración de maná cada 5 s$/,
        "regeneración de maná",
      );
      if (!builds.every((stats) => stats.includes(stat))) continue;
      points += Number(match[1]);
      bonuses.push(line);
    }
    if (points) items.push({ item, points, bonuses });
  }
  if (observed)
    return {
      points: items.reduce((n, item) => n + item.points, 0),
      items: items.sort((a, b) => b.points - a.points),
    };
}
