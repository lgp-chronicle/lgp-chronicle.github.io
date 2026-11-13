import catalog from "../config/armory-catalog.json";
import tooltipCatalog from "../config/item-tooltips.json";
import talentTooltips from "../config/talent-tooltips.json";
import type { Equipment, ItemProperties, Talent } from "./types";
import { learnedTalent } from "./learned-talent";

type KnownEffects = { spells?: string[]; stats?: string[]; sets?: string[] };
const icons: Record<string, string | number> = catalog.items;
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
  memberId?: string,
  level?: number,
): Talent {
  const talent = learnedTalent(value, classId);
  const tooltips: Record<string, Partial<Talent>> = talentTooltips;
  const signature = ":" + talent.name + ":" + talent.rank;
  const saved =
    tooltips[memberId + ":" + level + signature] ??
    tooltips[classId + signature];
  return {
    ...talent,
    description: talent.description ?? saved?.description,
    cast: talent.cast ?? saved?.cast,
    cost: talent.cost ?? saved?.cost,
    cooldown: talent.cooldown ?? saved?.cooldown,
    range: talent.range ?? saved?.range,
  };
}
