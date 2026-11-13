import { classColors, classNames, type Member, type Profile, type Talent } from "./types.ts";
import { learnedTalent } from "./learned-talent.ts";

export type DistributionKind = "className" | "race" | "spec" | "role";
const roles = ["DPS", "TANK", "HEAL"] as const;
type Role = (typeof roles)[number] | "Sin determinar";
const damageClasses = new Set([3, 4, 8, 9]);
const hybridTrees: Record<number, Record<string, Role>> = {
  1: { armas: "DPS", arms: "DPS", furia: "DPS", fury: "DPS", proteccion: "TANK", protection: "TANK" },
  2: { sagrado: "HEAL", holy: "HEAL", proteccion: "TANK", protection: "TANK", reprension: "DPS", retribution: "DPS" },
  5: { disciplina: "HEAL", discipline: "HEAL", sagrado: "HEAL", holy: "HEAL", sombra: "DPS", shadow: "DPS" },
  7: { elemental: "DPS", "combate elemental": "DPS", mejora: "DPS", enhancement: "DPS", recuperacion: "HEAL", restauracion: "HEAL", restoration: "HEAL" },
  11: { equilibrio: "DPS", balance: "DPS", guardian: "TANK", recuperacion: "HEAL", restauracion: "HEAL", restoration: "HEAL" },
};

const normalized = (name: string) => name.trim().normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const classIds = new Map(Object.entries(classNames).map(([id, name]) => [normalized(name), Number(id)]));

function leadingTrees(profile: Profile, talents: Talent[]): string[] {
  // The armory's point totals include talents for which it may omit the individual rank.
  const points = new Map<string, number>();
  if (profile.talentTrees?.length) {
    for (const tree of profile.talentTrees) {
      if (tree.name.trim() && tree.points > 0) points.set(tree.name.trim(), tree.points);
    }
  } else {
    for (const { tree, rank } of talents) {
      if (tree?.trim() && rank && rank > 0) points.set(tree.trim(), (points.get(tree.trim()) ?? 0) + rank);
    }
  }
  if (points.size) {
    const max = Math.max(...points.values());
    return [...points].filter(([, n]) => n === max).map(([name]) => name).sort((a,b) => a.localeCompare(b, "es"));
  }
  if (profile.talentTrees?.length) return [];
  return profile.spec?.split("/").map(s => s.trim()).filter(Boolean) ?? [];
}

const feralMarkers: Record<string, Role> = {
  "disciplina depredadora": "DPS", "predatory discipline": "DPS",
  "shifting power": "DPS",
  "mordisco primigenio": "TANK", "mordedura primigenia": "TANK", "primal bite": "TANK",
};
function feralRole(talents: Talent[]): Role {
  const roles = new Set<Role>();
  for (const talent of talents) {
    const role = talent.spellId === 1328613 ? "DPS" : feralMarkers[normalized(talent.name)];
    if (role) roles.add(role);
  }
  if (roles.size === 1) return [...roles][0];
  if (!roles.size && talents.some(t => ["pellejo grueso", "thick hide"].includes(normalized(t.name)))) return "TANK";
  return "Sin determinar";
}

function activeBuild(classId: number, profile: Profile): { role: Role; spec: string } {
  const talents = (profile.talents ?? []).map(t => learnedTalent(t, classId)).filter(t => (t.rank ?? 1) > 0);
  const trees = leadingTrees(profile, talents);
  const spec = trees.join(" / ") || "Sin especialización registrada";
  if (damageClasses.has(classId)) return { role: "DPS", spec };
  const candidates = new Set(trees.map(tree => {
    const key = normalized(tree);
    if (classId === 11 && ["combate feral", "feral combat", "feral"].includes(key)) return feralRole(talents);
    return hybridTrees[classId]?.[key] ?? "Sin determinar";
  }));
  const role = candidates.size === 1 ? [...candidates][0] : "Sin determinar";
  return { role, spec };
}

export type DistributionCount = { label: string; count: number; tint?: string };
type ClassCount = DistributionCount & { specs: Map<string, number> };
export type DistributionRow = DistributionCount & { classes: Map<string, ClassCount> };

export function composition(members: Member[], kind: DistributionKind) {
  const groups = new Map<string, DistributionRow>();
  const legend = new Map<string, string>();
  function group(label: string, tint?: string) {
    let row = groups.get(label);
    if (!row) {
      row = { label, count: 0, tint, classes: new Map() };
      groups.set(label, row);
    }
    return row;
  }
  if (kind === "role") {
    for (const role of roles) group(role);
  }
  for (const { data, inRoster, membership } of members) {
    if (inRoster === false || membership?.leftAt || data.level === 1) continue;
    const id = data.classId ?? classIds.get(normalized(data.className ?? "")) ?? 0;
    const name = classNames[id] ?? (data.className?.trim() || "Clase desconocida");
    const tint = classColors[id] ?? "#a39a8b";
    if (kind === "race" || kind === "role") {
      const build = kind === "role" ? activeBuild(id, data) : undefined;
      const row = group(build?.role ?? (data.race?.trim() || "Raza desconocida"));
      row.count++;
      const entry = row.classes.get(name) ?? { label: name, tint, count: 0, specs: new Map<string, number>() };
      entry.count++;
      if (build) entry.specs.set(build.spec, (entry.specs.get(build.spec) ?? 0) + 1);
      row.classes.set(name, entry);
      legend.set(name, tint);
    } else if (kind === "className") {
      group(name, tint).count++;
    } else if (data.spec?.trim()) {
      group(data.spec.trim()).count++;
    }
  }
  const rows = [...groups.values()];
  if (kind !== "role") rows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"));
  const max = Math.max(0, ...rows.map(row => row.count));
  return { rows: max ? rows : [], max, legend: [...legend].sort(([a], [b]) => a.localeCompare(b, "es")) };
}
