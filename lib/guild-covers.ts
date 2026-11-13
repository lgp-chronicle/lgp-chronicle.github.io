import type { Member } from "../features/types.ts";
import { fullName } from "../features/member-name.ts";
import {
  paintedWelcome,
  welcomeParties,
  type WelcomeParty,
} from "../features/membership.ts";

const november13Release = "2026-11-13T10:30:42Z";

export const guildCovers = {
  acequia: {
    title: "El agua vuelve al patio",
    cast: ["Viçent Wildfang", "Clairex Fuenteterna"],
    action: "abren la compuerta y recogen la primera agua que baja por la acequia.",
    date: "2026-11-13",
    publishedAt: november13Release,
  },
  grifon: {
    title: "Una correa de más",
    cast: ["Juninho Delbosque", "Dertak Reign"],
    action: "intentan ensillar a un grifo que se empeña en comerse la correa.",
    date: "2026-11-13",
    publishedAt: november13Release,
  },
  ajedrez: {
    title: "Jaque de escarcha",
    cast: ["Starshow Ofvalley", "Veshar Frostmind"],
    action: "se disputan el tablero con un caballo de ámbar y una torre de hielo.",
    date: "2026-11-13",
    publishedAt: november13Release,
  },
  paella: {
    publishedAt: "2026-11-12T15:25:55+01:00",
    title: "La paella de múrloc",
    cast: ["Varón Dandy"],
    guests: [
      "Aditus Antrum", "Akimis Derechos", "Alexion Grandwell", "Armentak Akrom",
      "Betadine Sagrado", "Calvix Uñanegra", "Chusticiero Maldito", "Clairex Fuenteterna",
      "Dertak Reign", "Er Manu", "Ferrogard Escudoferreo", "Franz Martel",
      "Hellbrios Realtrece", "Jukkz Shelby", "Juninho Delbosque", "Lua Nita",
      "Lyrae Grandwell", "Naisen Grandwell", "Olynn Grandwell", "Rast Puñotormenta",
      "Rompecraneos Roman", "Starshow Ofvalley", "Veshar Frostmind", "Viçent Wildfang",
      "Vincie Quickhands",
    ],
    action: "prueba el arroz de su paella de múrloc mientras la hermandad brinda en el patio.",
    date: "2026-11-12",
  },
  campana: {
    publishedAt: "2026-11-12T14:37:38+01:00",
    title: "La primera campanada",
    cast: ["Varón Dandy", "Hellbrios Realtrece"],
    action: "ajustan el badajo de la campana antes de que despierte la fortaleza.",
    date: "2026-11-12",
  },
  mandragora: {
    publishedAt: "2026-11-12T14:37:38+01:00",
    title: "Una raíz con malas pulgas",
    cast: ["Akimis Derechos", "Calvix Uñanegra", "Er Manu"],
    action: "descubren por qué la maceta del invernadero no paraba de moverse.",
    date: "2026-11-12",
  },
  diario: {
    publishedAt: "2026-11-12T12:23:10+01:00",
    title: "El diario de Ferrogard",
    cast: ["Ferrogard Escudoferreo"],
    action: "escribe en su diario a la luz de una vela, en la calma de su cuarto.",
    date: "2026-11-12",
  },
  cisterna: {
    publishedAt: "2026-11-12T12:06:37+01:00",
    title: "El pez de la cisterna",
    cast: ["Franz Martel", "Olynn Grandwell"],
    action: "intentan sacar un siluro que apenas cabe en la red.",
    date: "2026-11-12",
  },
  cofre: {
    publishedAt: "2026-11-12T12:06:37+01:00",
    title: "El botín del intendente",
    cast: ["Vincie Quickhands", "Ferrogard Escudoferreo"],
    action: "abren el cofre del almacén y se reparten el botín por pares.",
    date: "2026-11-12",
  },
  invocacion: {
    publishedAt: "2026-11-12T12:06:37+01:00",
    title: "La lección de Naisen",
    cast: ["Naisen Grandwell", "Aditus Antrum"],
    action: "repasan las runas del círculo mientras la súcubo de Naisen las pone a prueba.",
    date: "2026-11-12",
  },
  halcon: {
    publishedAt: "2026-11-12T10:52:10+01:00",
    title: "Un mensaje en la pata",
    cast: ["Alexion Grandwell", "Lyrae Grandwell"],
    action: "recogen el mensaje que acaba de traer el halcón a la torre.",
    date: "2026-11-12",
  },
  rastro: {
    publishedAt: "2026-11-12T10:52:10+01:00",
    title: "Tres garras en la nieve",
    cast: ["Alexion Grandwell", "Rompecraneos Roman"],
    action: "siguen unas huellas de tres garras al pie de la fortaleza.",
    date: "2026-11-12",
  },
  farol: {
    publishedAt: "2026-11-12T10:52:10+01:00",
    title: "El farol de Chusticiero",
    cast: ["Chusticiero Maldito", "Veshar Frostmind"],
    action: "se juegan la última moneda de cobre en la bodega.",
    date: "2026-11-12",
  },
  prensa: {
    publishedAt: "2026-11-12T10:52:10+01:00",
    title: "La primera sidra",
    cast: ["Dertak Reign", "Viçent Wildfang"],
    action: "llenan la primera jarra de sidra en el lagar de la fortaleza.",
    date: "2026-11-12",
  },
  mensajeria: {
    publishedAt: "2026-11-12T10:35:29+01:00",
    title: "El correo de medianoche",
    cast: ["Calvix Uñanegra", "Betadine Sagrado"],
    action: "atan y sellan el último paquete a la luz de una vela.",
    date: "2026-11-12",
  },
  embarcadero: {
    publishedAt: "2026-11-12T10:35:29+01:00",
    title: "La primera barca",
    cast: ["Armentak Akrom", "Starshow Ofvalley"],
    action: "sueltan amarras bajo la reja del embarcadero.",
    date: "2026-11-12",
  },
  veta: {
    publishedAt: "2026-11-12T10:35:29+01:00",
    title: "La veta de ámbar",
    cast: ["Clairex Fuenteterna", "Lua Nita"],
    action: "examinan una veta de ámbar bajo la fortaleza.",
    date: "2026-11-12",
  },
  pique: {
    publishedAt: "2026-11-11T15:28:46+01:00",
    title: "La última chapa",
    cast: ["Jukkz Shelby", "Juninho Delbosque"],
    action:
      "cuentan sus chapas para ver quién ha derrotado a más rivales de la Horda.",
  },
  humedales: {
    publishedAt: "2026-11-11T15:28:46+01:00",
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
    publishedAt: "2026-11-11T15:28:46+01:00",
    title: "La mesa de mapas",
    cast: ["Naisen Grandwell", "Rast Puñotormenta"],
    action: "trazan la próxima expedición.",
  },
  fragua: {
    publishedAt: "2026-11-11T15:28:46+01:00",
    title: "La fragua de la fortaleza",
    cast: ["Franz Martel", "Ferrogard Escudoferreo"],
    action: "examinan un escudo en la fragua.",
  },
  jardin: {
    publishedAt: "2026-11-11T15:28:46+01:00",
    title: "El jardín del claustro",
    cast: ["Lua Nita", "Betadine Sagrado"],
    action: "identifican una flor en el claustro.",
  },
  atalaya: {
    publishedAt: "2026-11-11T15:28:46+01:00",
    title: "La guardia de la atalaya",
    cast: ["Lyrae Grandwell", "Vincie Quickhands"],
    action: "otean el valle desde la atalaya.",
  },
  patio: {
    publishedAt: "2026-11-11T15:28:46+01:00",
    title: "El patio de armas",
    cast: ["Varón Dandy", "Rompecraneos Roman"],
    action: "ponen a prueba el muñeco del patio.",
  },
  observatorio: {
    publishedAt: "2026-11-11T15:28:46+01:00",
    title: "El observatorio",
    cast: ["Aditus Antrum", "Veshar Frostmind"],
    action: "alinean el astrolabio del observatorio.",
  },
  relojeria: {
    publishedAt: "2026-11-11T15:28:46+01:00",
    title: "El reloj de la torre",
    cast: ["Jukkz Shelby", "Armentak Akrom"],
    action: "devuelven la marcha al reloj de la torre.",
  },
  enfermeria: {
    publishedAt: "2026-11-11T15:28:46+01:00",
    title: "La enfermería",
    cast: ["Starshow Ofvalley", "Clairex Fuenteterna"],
    action: "preparan un remedio en la enfermería.",
  },
  cripta: {
    publishedAt: "2026-11-11T15:28:46+01:00",
    title: "El sello de la cripta",
    cast: ["Chusticiero Maldito", "Hellbrios Realtrece"],
    action: "descubren un sello en la cripta.",
  },
  cocinas: {
    publishedAt: "2026-11-11T15:28:46+01:00",
    title: "Las cocinas de la fortaleza",
    cast: ["Akimis Derechos", "Dertak Reign"],
    action: "prueban el guiso de las cocinas.",
  },
  santuario: {
    publishedAt: "2026-11-11T15:28:46+01:00",
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
  guests?: readonly string[];
  action: string;
  date?: string;
  publishedAt?: string;
  party?: WelcomeParty;
};
export function sceneParticipants(scene: CoverScene): readonly string[] {
  return scene.guests ? [...scene.cast, ...scene.guests] : scene.cast;
}
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
      publishedAt: party.id === paintedWelcome ? "2026-11-12T09:21:12+01:00" : party.members.map(m => m.membership!.joinedAt!).sort().at(-1),
      party,
    };
  }
  return scenes;
}
export function coversForMember(memberId: string) {
  return coverIds.filter((id) =>
    sceneParticipants(guildCovers[id]).some((name) => coverMemberId(name) === memberId),
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
