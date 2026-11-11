import catalog from "../config/armory-catalog.json";
import tooltipCatalog from "../config/item-tooltips.json";
import type { Equipment, ItemProperties, Talent } from "./types";

type KnownTalent = {
  tree: string;
  icon: number;
  spellId?: number;
  maxRank?: number;
};
type KnownEffects = { spells?: string[]; stats?: string[]; sets?: string[] };
const talents: Record<string, Record<string, KnownTalent>> = catalog.talents;
const icons: Record<string, string | number> = catalog.items;
export const characterRenders: Record<string, string> = catalog.renders;
const effects: Record<string, KnownEffects> = catalog.itemEffects;
const propertiesByItemLevel: Record<string, ItemProperties> = tooltipCatalog;

export type Entity = "item" | "spell";
export function wowheadUrl(kind: Entity, id: number | undefined, name: string) {
  const root = "https://www.wowhead.com/forever/es/";
  return id
    ? root + kind + "=" + id
    : root + "search?q=" + encodeURIComponent(name);
}

export function namedIcon(name: unknown) {
  if (typeof name === "string" && /^[a-z0-9_-]+$/i.test(name))
    return "https://wow.zamimg.com/images/wow/icons/large/" + name + ".jpg";
}

function catalogIcon(icon?: number | string) {
  return typeof icon === "number"
    ? "https://render.worldofwarcraft.com/forever-eu/icons/56/" + icon + ".jpg"
    : namedIcon(icon);
}

export function itemDisplay(item: Equipment) {
  const known = item.id ? effects[item.id] : undefined;
  const details = item.details ?? [];
  const visibleEffects = item.effects ?? [
    ...(known?.spells ?? []),
    ...details.filter((line) => known?.stats?.includes(line)),
  ];
  return {
    properties:
      item.properties ??
      propertiesByItemLevel[item.id + "-" + item.itemLevel] ??
      {},
    icon: item.icon ?? catalogIcon(item.id ? icons[item.id] : undefined),
    effects: visibleEffects,
    details: details.filter((line) => !visibleEffects.includes(line)),
    sets: item.setBonuses ?? known?.sets ?? [],
  };
}

export function talentDisplay(
  value: Talent | string,
  classId?: number,
): Talent {
  let talent: Talent;
  if (typeof value === "string") {
    const matched = value.match(/^(.+?)\s*·\s*(\d+)\s+puntos?$/i);
    talent = matched
      ? { name: matched[1].trim(), rank: Number(matched[2]) }
      : { name: value };
  } else talent = value;
  const known = classId ? talents[classId]?.[talent.name] : undefined;
  const max = talent.maxRank ?? known?.maxRank;
  return {
    ...talent,
    spellId: talent.spellId ?? known?.spellId,
    tree: talent.tree ?? known?.tree,
    icon: talent.icon ?? catalogIcon(known?.icon),
    maxRank: max !== undefined && max >= (talent.rank ?? 0) ? max : undefined,
  };
}
