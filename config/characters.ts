export type CharacterConfig = {
  name: string;
  realm: string;
  region: "eu" | "us";
  campaign: "tbc" | "forever";
  armory?: string;
  logsId?: number;
  logsZones?: number[];
};
export const characters: CharacterConfig[] = [
  "Alekdra",
  "Volkreen",
  "Hékate",
  "Bocasusia",
  "Nimpu",
  "Killpity",
  "Joségitano",
].map((name) => ({
  name,
  realm: "spineshatter",
  region: "eu",
  campaign: "tbc",
  armory: `https://worldofwarcraft.blizzard.com/es-es/classicann/eu/armory/character/spineshatter/${encodeURIComponent(name.toLowerCase())}`,
}));
export const characterId = (c: CharacterConfig) =>
  `${c.campaign}-${c.region}-${c.realm}-${c.name.toLowerCase()}`;
export const campaigns = {
  forever: {
    name: "WoW Forever",
    startsAt: null as string | null,
    active: false,
  },
  tbc: { name: "WoW TBC", active: true },
};
