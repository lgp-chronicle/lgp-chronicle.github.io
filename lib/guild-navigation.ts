export const archiveGroups = [
  {
    label: "Hermandad",
    sections: [
      ["overview", "Miembros"],
      ["gallery", "Galería"],
    ],
  },
  {
    label: "Progreso",
    sections: [
      ["race", "Leveling Race"],
      ["history", "Evolución"],
      ["logs", "Warcraft Logs"],
    ],
  },
  {
    label: "Honor",
    sections: [
      ["awards", "Salón de la fama"],
      ["compare", "Cara a cara"],
    ],
  },
  { label: "El Heraldo", sections: [["news", "El Heraldo"]] },
] as const;

export type GuildSection =
  (typeof archiveGroups)[number]["sections"][number][0];
export const guildSections = archiveGroups.flatMap<
  readonly [GuildSection, string]
>((group) => group.sections);
export const groupForSection = (section?: GuildSection) =>
  archiveGroups.find((group) => group.sections.some(([id]) => id === section));
export const archivePath = (section: GuildSection) => "/archivo/" + section;
export const sectionFromPath = (path: string) =>
  guildSections.find(([id]) => archivePath(id) === path.split("?")[0])?.[0];

export const searchable = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es").trim();

export function duelPath(left: string, right: string) {
  return archivePath("compare") + "?" + new URLSearchParams({ left, right });
}
