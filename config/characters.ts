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
    armory: `https://worldofwarcraft.blizzard.com/es-es/forever/eu/armory/character/${encodeURIComponent(slug)}`,
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
