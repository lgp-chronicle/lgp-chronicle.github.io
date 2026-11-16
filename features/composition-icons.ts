import icons from "../config/composition-icons.json" with { type: "json" };
import { classNames } from "./types.ts";
import type { DistributionKind, DistributionRow } from "./composition.ts";

const normalized = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
const local = (file: string) => "/guild/composicion/" + file;
const classes: Record<string, { file: string }> = icons.classes;
const specs: Record<string, { file: string }> = icons.specs;
const races: Record<string, { file: string }> = icons.races;
export const classIcon = (id?: number) => classes[String(id)] ? local(classes[String(id)].file) : "/guild/iconos/helmet.webp";
export const classIconByName = (name: string) => classIcon(Number(Object.entries(classNames).find(([, label]) => label === name)?.[0]));

const raceKeys: Record<string, string> = {
  humano: "human", human: "human", enano: "dwarf", dwarf: "dwarf",
  gnomo: "gnome", gnome: "gnome", "elfo de la noche": "nightelf", "night elf": "nightelf",
  "no-muerto": "undead", "no muerto": "undead", undead: "undead",
  orco: "orc", orc: "orc", trol: "troll", troll: "troll", tauren: "tauren",
  "cielonato de la orden eminente": "skyborne", cielonato: "skyborne", skyborne: "skyborne",
};
export function raceIcon(name: string) {
  const image = races[raceKeys[normalized(name)]];
  return image ? local(image.file) : "/guild/iconos/tabard.webp";
}
export function specIcons(classId: number | undefined, specialization: string) {
  const aliases: Record<string, string> = {
    restauracion: "recuperacion", restoration: "recuperacion",
    feral: "combate feral", "feral combat": "combate feral",
    elemental: "combate elemental",
  };
  return [...new Set(specialization.split("/").map(part => {
    const key = normalized(part);
    const image = specs[classId + ":" + (aliases[key] ?? key)];
    return image ? local(image.file) : classIcon(classId);
  }))];
}
export function distributionIcons(row: DistributionRow, kind: DistributionKind) {
  if (kind === "className") return [classIcon(row.classId)];
  if (kind === "spec") return specIcons(row.classId, row.label);
  if (kind === "race") return [raceIcon(row.label)];
  const role: Record<string, string> = { TANK: "shield", HEAL: "health", DPS: "swords" };
  return ["/guild/iconos/" + (role[row.label] ?? "clue") + ".webp"];
}
