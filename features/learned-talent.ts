import catalog from "../config/armory-catalog.json" with { type: "json" };
import type { Talent } from "./types.ts";

type TalentMetadata = Pick<Talent, "tree" | "spellId" | "maxRank"> & { icon: number };
const byClass: Record<number, Record<string, TalentMetadata>> = catalog.talents;

export function learnedTalent(value: Talent | string, classId?: number): Talent {
  let talent: Talent;
  if (typeof value === "string") {
    const matched = value.match(/^(.+?)\s*·\s*(\d+)\s+puntos?$/i);
    talent = matched ? { name: matched[1].trim(), rank: Number(matched[2]) } : { name: value };
  } else talent = value;
  const known = byClass[classId ?? 0]?.[talent.name];
  const max = talent.maxRank ?? known?.maxRank;
  return {
    ...talent,
    spellId: talent.spellId ?? known?.spellId,
    tree: talent.tree ?? known?.tree,
    icon: talent.icon ?? (known?.icon ? "https://render.worldofwarcraft.com/forever-eu/icons/56/" + known.icon + ".jpg" : undefined),
    maxRank: max !== undefined && max >= (talent.rank ?? 0) ? max : undefined,
  };
}
