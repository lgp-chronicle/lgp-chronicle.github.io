export type CharacterConfig = {
  name: string;
  realm: string;
  region: "eu" | "us";
  campaign: "forever";
  armory?: string;
  logsId?: number;
  logsZones?: number[];
};

export const guildConfig = {
  name: "La Ganga",
  realm: "lone-wolf",
  region: "eu" as const,
  faction: "alliance" as const,
  namespace: "profile-classic1x-eu",
} as const;

/** Build a character config from a guild roster member. */
export function rosterEntry(
  name: string,
  realm: string = guildConfig.realm,
): CharacterConfig {
  return {
    name,
    realm,
    region: guildConfig.region,
    campaign: "forever",
    armory: `https://worldofwarcraft.blizzard.com/es-es/classic/eu/armory/character/${encodeURIComponent(realm)}/${encodeURIComponent(name.toLowerCase())}`,
  };
}

export const characterId = (c: CharacterConfig) =>
  `${c.campaign}-${c.region}-${c.realm}-${c.name.toLowerCase()}`;

export const campaigns = {
  forever: {
    name: "WoW Forever",
    active: true,
  },
};
