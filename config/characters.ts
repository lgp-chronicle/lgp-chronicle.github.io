export type CharacterConfig = {
  name: string;
  slug: string;
  realm: string;
  region: "eu" | "us";
  campaign: "forever";
  armory?: string;
  logsId?: number;
  logsZones?: number[];
};

export const guildConfig = {
  name: "La Ganga",
  realm: "jcj",
  region: "eu" as const,
  faction: "alliance" as const,
  namespace: "profile-forever-eu",
} as const;

export function armoryUrl(region: string, slug: string) {
  return `https://worldofwarcraft.blizzard.com/es-es/forever/${encodeURIComponent(region)}/armory/character/${encodeURIComponent(slug.normalize("NFC"))}/`;
}

export function memberArmoryUrl(id: string, region: string) {
  const prefix = `forever-${region}-`;
  if (id.startsWith(prefix) && id.length > prefix.length)
    return armoryUrl(region, id.slice(prefix.length));
}

/** Build a character config from a guild roster member. */
export function rosterEntry(
  name: string,
  slug: string = name.toLowerCase(),
  realm: string = guildConfig.realm,
): CharacterConfig {
  return {
    name,
    slug,
    realm,
    region: guildConfig.region,
    campaign: "forever",
    armory: armoryUrl(guildConfig.region, slug),
  };
}

export const characterId = (c: CharacterConfig) =>
  `${c.campaign}-${c.region}-${c.slug.toLowerCase()}`;

export const campaigns = {
  forever: {
    name: "WoW Forever",
    active: true,
  },
};
