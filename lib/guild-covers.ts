import type { Member } from "../features/types.ts";
import { fullName } from "../features/member-name.ts";
import {
  paintedWelcome,
  welcomeParties,
  type WelcomeParty,
} from "../features/membership.ts";

export const guildCovers = {
  mensajeria: {
    title: "El correo de medianoche",
    cast: ["Calvix Uñanegra", "Betadine Sagrado"],
    action: "atan y sellan el último paquete a la luz de una vela.",
    date: "2026-11-12",
  },
  embarcadero: {
    title: "La primera barca",
    cast: ["Armentak Akrom", "Starshow Ofvalley"],
    action: "sueltan amarras bajo la reja del embarcadero.",
    date: "2026-11-12",
  },
  veta: {
    title: "La veta de ámbar",
    cast: ["Clairex Fuenteterna", "Lua Nita"],
    action: "examinan una veta de ámbar bajo la fortaleza.",
    date: "2026-11-12",
  },
  pique: {
    title: "La última chapa",
    cast: ["Jukkz Shelby", "Juninho Delbosque"],
    action:
      "cuentan sus chapas para ver quién ha derrotado a más rivales de la Horda.",
  },
  humedales: {
    title: "La excavación de los Humedales",
    cast: [
      "Naisen Grandwell",
      "Franz Martel",
      "Rast Puñotormenta",
      "Vincie Quickhands",
    ],
    action: "se adentran en la excavación de los Humedales.",
    date: "2026-11-10",
  },
  mapa: {
    title: "La mesa de mapas",
    cast: ["Naisen Grandwell", "Rast Puñotormenta"],
    action: "trazan la próxima expedición.",
  },
  fragua: {
    title: "La fragua de la fortaleza",
    cast: ["Franz Martel", "Ferrogard Escudoferreo"],
    action: "examinan un escudo en la fragua.",
  },
  jardin: {
    title: "El jardín del claustro",
    cast: ["Lua Nita", "Betadine Sagrado"],
    action: "identifican una flor en el claustro.",
  },
  atalaya: {
    title: "La guardia de la atalaya",
    cast: ["Lyrae Grandwell", "Vincie Quickhands"],
    action: "otean el valle desde la atalaya.",
  },
  patio: {
    title: "El patio de armas",
    cast: ["Varón Dandy", "Rompecraneos Roman"],
    action: "ponen a prueba el muñeco del patio.",
  },
  observatorio: {
    title: "El observatorio",
    cast: ["Aditus Antrum", "Veshar Frostmind"],
    action: "alinean el astrolabio del observatorio.",
  },
  relojeria: {
    title: "El reloj de la torre",
    cast: ["Jukkz Shelby", "Armentak Akrom"],
    action: "devuelven la marcha al reloj de la torre.",
  },
  enfermeria: {
    title: "La enfermería",
    cast: ["Starshow Ofvalley", "Clairex Fuenteterna"],
    action: "preparan un remedio en la enfermería.",
  },
  cripta: {
    title: "El sello de la cripta",
    cast: ["Chusticiero Maldito", "Hellbrios Realtrece"],
    action: "descubren un sello en la cripta.",
  },
  cocinas: {
    title: "Las cocinas de la fortaleza",
    cast: ["Akimis Derechos", "Dertak Reign"],
    action: "prueban el guiso de las cocinas.",
  },
  santuario: {
    title: "El roble del santuario",
    cast: ["Juninho Delbosque", "Olynn Grandwell", "Viçent Wildfang"],
    action: "cuidan el roble del santuario.",
  },
} as const;

export type Cover = keyof typeof guildCovers;
export const coverMemberId = (name: string) =>
  "forever-eu-" + name.toLocaleLowerCase("es").replaceAll(" ", "-");
export const coverIds = Object.keys(guildCovers) as Cover[];
export type CoverScene = {
  title: string;
  cast: readonly string[];
  action: string;
  date?: string;
  party?: WelcomeParty;
};
export function coverCatalogue(members: Member[]): Record<string, CoverScene> {
  const scenes: Record<string, CoverScene> = { ...guildCovers };
  for (const party of welcomeParties(members)) {
    scenes[party.id] = {
      title:
        party.id === paintedWelcome
          ? "Una insignia para Er Manu"
          : "Bienvenida de " + party.members.map(fullName).join(" · "),
      cast: party.members.map(fullName),
      action:
        party.id === paintedWelcome
          ? "cuelga su insignia en la puerta de la fortaleza."
          : party.members.length === 1
            ? "se incorpora a La Ganga."
            : "se incorporan a La Ganga.",
      date: party.day,
      party,
    };
  }
  return scenes;
}
export function coversForMember(memberId: string) {
  return coverIds.filter((id) =>
    guildCovers[id].cast.some((name) => coverMemberId(name) === memberId),
  );
}
const storageKey = "la-ganga:portadas:v1";

export function drawCover(
  storage?: Pick<Storage, "getItem" | "setItem">,
  ids: readonly string[] = coverIds,
): string {
  let seen: string[] = [];
  try {
    const saved: unknown = JSON.parse(storage?.getItem(storageKey) ?? "[]");
    if (Array.isArray(saved)) {
      seen = [...new Set(saved.filter((id): id is string => ids.includes(id)))];
    }
  } catch {
    // A blocked or stale browser store can still show a random cover.
  }
  const last = seen.at(-1);
  if (seen.length === ids.length) seen = [];
  const remaining = ids.filter((id) => !seen.includes(id) && id !== last);
  const next =
    remaining[Math.floor(Math.random() * remaining.length)] ?? ids[0] ?? "mapa";
  try {
    storage?.setItem(storageKey, JSON.stringify([...seen, next]));
  } catch {
    // The selected cover is valid even when it cannot be remembered.
  }
  return next;
}

export function browserCover(ids: string[] = coverIds): string {
  try {
    const requested = new URLSearchParams(window.location.search).get(
      "portada",
    );
    const featured = ids.find((id) => id === requested);
    if (featured) return featured;
    return drawCover(window.sessionStorage, ids);
  } catch {
    return drawCover(undefined, ids);
  }
}
