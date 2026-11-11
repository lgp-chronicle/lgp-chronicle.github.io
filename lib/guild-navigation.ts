export const guildSections = [
  ["overview", "La hermandad"],
  ["race", "Leveling Race"],
  ["history", "Progresión"],
  ["awards", "Salón de la fama"],
  ["news", "El Heraldo"],
  ["compare", "Cara a cara"],
  ["logs", "Warcraft Logs"],
] as const;

export type GuildSection = (typeof guildSections)[number][0];
export const archivePath = (section: GuildSection) => "/archivo/" + section;
export const sectionFromPath = (path: string) =>
  guildSections.find(([id]) => archivePath(id) === path)?.[0];
