import type { GuildIconName } from "../components/guild-icon";
import { professions } from "./professions.ts";

export const honorSteps = [1000, 5000, 10000, 25000, 50000, 100000];
export const levelSteps = [40, 60];
export const tradeSteps = [150, 225, 300];
export const victorySteps = [1, 10, 50, 100, 500];
export const collectionSteps = [1, 5, 10, 25, 50];
export const groups = [
  "Hermandad y equipo",
  "Aventura",
  "Honor",
  "Profesiones",
  "Reputaciones",
  "Colecciones",
] as const;
type Trophy = {
  id: string;
  title: string;
  icon: GuildIconName;
  group: (typeof groups)[number];
};
export function trophyCatalog(factions: Record<string, string>): Trophy[] {
  const equipment = [
    ["tabard", "El primer tabardo de La Ganga", "tabard"],
    ["gear-2", "Todo de verde o superior", "armor"],
    ["gear-3", "Todo de azul o superior", "shield"],
    ["gear-4", "Todo de épico o superior", "helmet"],
    ["rings", "Dos anillos épicos o superiores", "ring"],
    ["legendary", "La primera pieza legendaria", "sword"],
  ] as const;
  return [
    ...equipment.map(
      ([id, title, icon]): Trophy => ({ id, title, icon, group: groups[0] }),
    ),
    ...levelSteps.map(
      (n) =>
        ({
          id: "level-" + n,
          title: "Nivel " + n,
          icon: "finish",
          group: groups[1],
        }) as const,
    ),
    ...honorSteps.map(
      (n) =>
        ({
          id: "honor-" + n,
          title: n.toLocaleString("de-DE") + " muertes honorables",
          icon: "medal",
          group: groups[2],
        }) as const,
    ),
    ...victorySteps.map((n): Trophy => ({
      id: "bg-wins-" + n, title: n === 1 ? "Primera victoria en un campo de batalla" : n + " victorias en campos de batalla",
      icon: "swords", group: "Honor",
    })),
    ...collectionSteps.flatMap((n): Trophy[] => [
      { id: "mounts-" + n, title: n === 1 ? "Estrenar las riendas" : n + " monturas distintas", icon: "boot", group: "Colecciones" },
      { id: "pets-" + n, title: n === 1 ? "Adopción en Azeroth" : n + " mascotas distintas", icon: "clue", group: "Colecciones" },
    ]),
    {
      id: "five-trades",
      title: "Cinco profesiones al máximo a la vez",
      icon: "trophy",
      group: groups[3],
    },
    ...professions.flatMap(([, name, icon]) =>
      tradeSteps.map((n) => ({
        id: icon + "-" + n,
        title: name + (n === 300 ? " al máximo" : " · " + n + " puntos"),
        icon,
        group: groups[3],
      })),
    ),
    ...Object.entries(factions)
      .sort(([, a], [, b]) => a.localeCompare(b, "es"))
      .map(
        ([id, name]) =>
          ({
            id,
            title: "Exaltado con " + name,
            icon: "tabard",
            group: groups[4],
          }) as const,
      ),
  ];
}
