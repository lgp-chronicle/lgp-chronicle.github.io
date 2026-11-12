export const archiveGroups = [
  {
    label: "Hermandad",
    sections: [
      ["overview", "Miembros"],
      ["awards", "Salón de la fama"],
      ["compare", "Cara a cara"],
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
    label: "El Heraldo",
    sections: [
      ["news", "El Heraldo"],
      ["movimientos", "Altas y bajas"],
      ["cronicas", "Historial de crónicas"],
    ],
  },
] as const;

export type GuildSection =
  (typeof archiveGroups)[number]["sections"][number][0];
export const guildSections = archiveGroups.flatMap<
  readonly [GuildSection, string]
>((group) => group.sections);
export const groupForSection = (section?: GuildSection) =>
  archiveGroups.find((group) => group.sections.some(([id]) => id === section));
export const archivePath = (section: GuildSection) => "/archivo/" + section;
export function withGalleryScene(path: string, scene: string | null) {
  const [base, query] = path.split("?");
  const params = new URLSearchParams(query);
  if (scene) params.set("escena", scene);
  else if (params.has("escena")) params.delete("escena");
  else return path;
  return params.size ? base + "?" + params : base;
}
export const sectionFromPath = (path: string) =>
  guildSections.find(([id]) => archivePath(id) === path.split("?")[0])?.[0];

export const searchable = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es").trim();

export function duelPath(left: string, right: string) {
  return archivePath("compare") + "?" + new URLSearchParams({ left, right });
}
