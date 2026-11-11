export const guildCovers = {
  mapa: {
    cast: ["Naisen Grandwell", "Rast Puñotormenta"],
    action: "trazan la próxima expedición.",
  },
  fragua: {
    cast: ["Franz Martel", "Ferrogard Escudoferreo"],
    action: "examinan un escudo en la fragua.",
  },
  jardin: {
    cast: ["Lua Nita", "Betadine Sagrado"],
    action: "identifican una flor en el claustro.",
  },
  atalaya: {
    cast: ["Lyrae Grandwell", "Vincie Quickhands"],
    action: "otean el valle desde la atalaya.",
  },
  patio: {
    cast: ["Varón Dandy", "Rompecraneos Roman"],
    action: "ponen a prueba el muñeco del patio.",
  },
  observatorio: {
    cast: ["Aditus Antrum", "Veshar Frostmind"],
    action: "alinean el astrolabio del observatorio.",
  },
  relojeria: {
    cast: ["Jukkz Shelby", "Armentak Akrom"],
    action: "devuelven la marcha al reloj de la torre.",
  },
  enfermeria: {
    cast: ["Starshow Ofvalley", "Clairex Fuenteterna"],
    action: "preparan un remedio en la enfermería.",
  },
  cripta: {
    cast: ["Chusticiero Maldito", "Hellbrios Realtrece"],
    action: "descubren un sello en la cripta.",
  },
  cocinas: {
    cast: ["Akimis Derechos", "Dertak Reign"],
    action: "prueban el guiso de las cocinas.",
  },
  santuario: {
    cast: ["Juninho Delbosque", "Olynn Grandwell", "Viçent Wildfang"],
    action: "cuidan el roble del santuario.",
  },
} as const;

type Cover = keyof typeof guildCovers;
export const coverMemberId = (name: string) =>
  "forever-eu-" + name.toLocaleLowerCase("es").replaceAll(" ", "-");
const ids = Object.keys(guildCovers) as Cover[];
const storageKey = "la-ganga:portadas:v1";

export function drawCover(
  storage?: Pick<Storage, "getItem" | "setItem">,
): Cover {
  let seen: Cover[] = [];
  try {
    const saved: unknown = JSON.parse(storage?.getItem(storageKey) ?? "[]");
    if (Array.isArray(saved)) {
      seen = [...new Set(saved.filter((id): id is Cover => ids.includes(id)))];
    }
  } catch {
    // A blocked or stale browser store can still show a random cover.
  }
  const last = seen.at(-1);
  if (seen.length === ids.length) seen = [];
  const remaining = ids.filter((id) => !seen.includes(id) && id !== last);
  const next = remaining[Math.floor(Math.random() * remaining.length)];
  try {
    storage?.setItem(storageKey, JSON.stringify([...seen, next]));
  } catch {
    // The selected cover is valid even when it cannot be remembered.
  }
  return next;
}

export function browserCover(): Cover {
  try {
    return drawCover(window.sessionStorage);
  } catch {
    return drawCover();
  }
}
