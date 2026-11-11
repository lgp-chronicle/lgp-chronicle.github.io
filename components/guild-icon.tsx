import { assetUrl } from "@/lib/public-settings";

export type GuildIconName =
  | "painting"
  | "keep"
  | "tabard"
  | "boot"
  | "steps"
  | "crown"
  | "dispatch"
  | "swords"
  | "journal"
  | "shield"
  | "staff"
  | "ruby"
  | "compass"
  | "finish"
  | "medal"
  | "fish"
  | "amber"
  | "health"
  | "strength"
  | "agility"
  | "intellect"
  | "stamina"
  | "spirit"
  | "attack"
  | "spellpower"
  | "melee-crit"
  | "spell-crit"
  | "ranged-crit"
  | "armor"
  | "defense"
  | "dodge"
  | "parry"
  | "block"
  | "mining"
  | "engineering"
  | "cooking"
  | "fishing"
  | "first-aid"
  | "herbalism"
  | "leatherworking"
  | "skinning"
  | "alchemy"
  | "blacksmithing"
  | "tailoring"
  | "enchanting"
  | "clue"
  | "trophy"
  | "helmet"
  | "lantern"
  | "shoulders"
  | "cloak"
  | "shirt"
  | "bracer"
  | "belt"
  | "legs"
  | "ring"
  | "necklace"
  | "trinket"
  | "sword"
  | "bow"
  | "quiver"
  | "crate"
  | "spyglass"
  | "coin"
  | "campfire";

export function GuildIcon({
  name,
  size = 24,
  className = "",
}: {
  name: GuildIconName;
  size?: number;
  className?: string;
}) {
  return (
    <img
      className={("guild-icon " + className).trim()}
      src={assetUrl("/guild/iconos/" + name + ".webp")}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
