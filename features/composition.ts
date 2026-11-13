import { classColors, classNames, type Member } from "./types.ts";

export type DistributionKind = "className" | "race" | "spec" | "role";
const roleColors = { DPS: "#df9166", TANK: "#79aada", HEAL: "#8abc80", "Sin determinar": "#a39a8b" };
type Role = keyof typeof roleColors;
const damageClasses = new Set([3, 4, 8, 9]);
const hybridTrees: Record<number, Record<string, Role>> = {
  1: { armas: "DPS", arms: "DPS", furia: "DPS", fury: "DPS", proteccion: "TANK", protection: "TANK" },
  2: { sagrado: "HEAL", holy: "HEAL", proteccion: "TANK", protection: "TANK", reprension: "DPS", retribution: "DPS" },
  5: { disciplina: "HEAL", discipline: "HEAL", sagrado: "HEAL", holy: "HEAL", sombra: "DPS", shadow: "DPS" },
  7: { elemental: "DPS", "combate elemental": "DPS", mejora: "DPS", enhancement: "DPS", recuperacion: "HEAL", restauracion: "HEAL", restoration: "HEAL" },
  // In Classic the feral tree is shared by bears and cats.
  11: { equilibrio: "DPS", balance: "DPS", guardian: "TANK", recuperacion: "HEAL", restauracion: "HEAL", restoration: "HEAL" },
};

const normalized = (name: string) => name.trim().normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const classIds = new Map(Object.entries(classNames).map(([id, name]) => [normalized(name), Number(id)]));

function estimatedRole(classId: number, spec?: string): Role {
  if (damageClasses.has(classId)) return "DPS";
  const roles = spec?.split("/").map(tree => hybridTrees[classId]?.[normalized(tree)]);
  const first = roles?.[0];
  return first && roles?.every(role => role === first) ? first : "Sin determinar";
}

export type DistributionCount = { label: string; count: number; tint?: string };
export type DistributionRow = DistributionCount & { classes: Map<string, DistributionCount> };

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
    for (const role of ["DPS", "TANK", "HEAL"] as const) group(role, roleColors[role]);
  }
  for (const { data, inRoster, membership } of members) {
    if (inRoster === false || membership?.leftAt) continue;
    const id = data.classId ?? classIds.get(normalized(data.className ?? "")) ?? 0;
    const name = classNames[id] ?? (data.className?.trim() || "Clase desconocida");
    const tint = classColors[id] ?? "#a39a8b";
    if (kind === "race") {
      const row = group(data.race?.trim() || "Raza desconocida");
      row.count++;
      const entry = row.classes.get(name) ?? { label: name, tint, count: 0 };
      entry.count++;
      row.classes.set(name, entry);
      legend.set(name, tint);
    } else if (kind === "role") {
      const role = estimatedRole(id, data.spec);
      group(role, roleColors[role]).count++;
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
