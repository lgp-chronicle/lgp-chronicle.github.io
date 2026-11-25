import type { Member } from "../features/types.ts";
import { fullName } from "../features/member-name.ts";
import {
  isCurrentMember,
  welcomeParties,
  type WelcomeParty,
} from "../features/membership.ts";
import { welcomePaintings } from "./welcome-paintings.ts";

const november13Release = "2026-11-13T10:30:42Z";
const november16Release = "2026-11-16T08:50:00Z";
const november16ComicRelease = "2026-11-16T09:10:41Z";
const november17Release = "2026-11-17T08:45:17Z";
const november18Release = "2026-11-18T08:47:18Z";

export const guildCovers = {
  "guardia-de-cama": {
    title: "Guardia de cama",
    cast: ["Vincie Quickhands"],
    action: "guarda cama en la enfermería con un paño en la frente y las dos espadas al alcance.",
    date: "2026-11-25",
    publishedAt: "2026-11-25T14:08:06.030Z",
  },
  "luciernagas-en-la-azotea": {
    title: "Luces sobre la muralla",
    cast: ["Naisen Grandwell","Olynn Grandwell"],
    action: "abren un tarro en la azotea y dejan que las luciérnagas vuelvan al jardín.",
    date: "2026-11-25",
    publishedAt: "2026-11-25T10:34:38.496Z",
  },
  "puerta-de-al-lado": {
    title: "Por la puerta de al lado",
    cast: ["Franz Martel","Vincie Quickhands"],
    action: "prueban dos formas de entrar en la fortaleza: empujar el portón o abrir la puerta de al lado.",
    date: "2026-11-25",
    publishedAt: "2026-11-25T10:34:38.496Z",
  },
  "campana-de-la-marea": {
    title: "La campana de la marea",
    cast: ["Juninho Delbosque","Ferrogard Escudoferreo"],
    action: "encuentran la campana de un naufragio entre las rocas y se apresuran a sacarla antes de que suba la marea.",
    date: "2026-11-25",
    publishedAt: "2026-11-25T10:34:38.496Z",
  },
  "libro-a-flote": {
    title: "Un libro a flote",
    cast: ["Miyu Sacerpowah","Zush Ira"],
    action: "rescatan un libro del agua antes de que la fuente del claustro se quede con la última página.",
    date: "2026-11-25",
    publishedAt: "2026-11-25T10:19:40Z",
  },
  "puente-entre-brumas": {
    title: "El puente entre brumas",
    cast: ["Ryuma Senju","Volkhim Garrasombría"],
    action: "siguen el cauce hasta un puente olvidado y se detienen a comprobar si aguanta un paso más.",
    date: "2026-11-25",
    publishedAt: "2026-11-25T10:19:40Z",
  },
  "tetera-sin-permiso": {
    title: "La tetera va por libre",
    cast: ["Laister Grandwell","Maister Grandwell"],
    action: "intentan servirse un té en la cocina de la fortaleza. La tetera toma otro rumbo.",
    date: "2026-11-25",
    publishedAt: "2026-11-25T10:19:40Z",
  },
  "limpieza-arcana": {
    title: "Limpieza arcana",
    cast: ["Alexion Grandwell", "Veshar Frostmind"],
    castJoiner: " recoge el regalo de su lobo con los pergaminos de ",
    action: "y descubre que la furia arcana también se desata en el patio.",
    date: "2026-11-19",
    publishedAt: "2026-11-19T10:20:00Z",
  },
  "murlocs-nightray": {
    title: "¡No traigas más!",
    cast: ["Naisen Nightray", "Nerey Nightray"],
    castJoiner: " se lanza contra los múrlocs de Elwynn mientras ",
    action: "cura a la desesperada. Él juraría que solo había visto dos.",
    date: "2026-11-19",
    publishedAt: "2026-11-19T08:15:00Z",
  },
  "juninho-madrugador": {
    title: "Antes que el gallo",
    cast: ["Juninho Delbosque"],
    action: "sale a levear cuando la fortaleza aún duerme. El café va haciendo su parte; el gallo sigue de baja.",
    date: "2026-11-19",
    publishedAt: "2026-11-19T08:15:00Z",
  },
  "sueno-onyxia": {
    title: "El héroe de la siesta",
    cast: ["Veshar Frostmind"],
    action: "sueña con derrotar a Onyxia él solo. Azeroth está a salvo… hasta que alguien lo despierte.",
    date: "2026-11-18",
    publishedAt: "2026-11-18T10:51:07Z",
  },
  colmillos: {
    title: "Colmillo a colmillo",
    cast: ["Varón Dandy"],
    action: "reúne colmillos Sangrapellejo en Tuercespina para la prueba de ",
    quest: {
      name: "Cicloniano",
      href: "https://www.wowhead.com/forever/es/quest=1712/cicloniano",
    },
    actionSuffix: ". Cada colmillo acerca al guerrero a su recompensa.",
    date: "2026-11-18",
    publishedAt: november18Release,
  },
  emboscada: {
    title: "Una emboscada mal elegida",
    cast: ["Naisen Grandwell", "Alexion Grandwell"],
    action: "plantan cara a un cazador trol y un pícaro cielonato, con una súcubo y un lobo cubriéndoles las espaldas.",
    date: "2026-11-18",
    publishedAt: november18Release,
  },
  dardos: {
    title: "La diana estaba demasiado alta",
    cast: ["Chemaxtor Balarota", "Lyrae Grandwell"],
    action: "discuten el reglamento de los dardos. Chemaxtor exige un barril de ventaja; Lyrae pide medir primero.",
    date: "2026-11-18",
    publishedAt: november18Release,
  },
  desolace: {
    title: "Bajo la luna de Desolace",
    cast: ["Olynn Grandwell", "Rast Puñotormenta"],
    castPrefix: "Multifer ",
    castJoiner: " llega para rematar a un orco guerrero que luchaba ferozmente contra ",
    action: "en Desolace.",
    date: "2026-11-17",
    publishedAt: "2026-11-17T09:29:00Z",
  },
  carpinteros: {
    title: "Manitas de Forjaz",
    cast: ["Loqe Delabahía", "Rast Puñotormenta"],
    action: "descubren que las reformas del patio pedían un carpintero, no un hacha de guerra.",
    date: "2026-11-17",
    publishedAt: november17Release,
  },
  pan: {
    title: "Pan para un regimiento",
    cast: ["Aditus Antrum", "Franz Martel"],
    action: "piden una merienda y acaban con pan suficiente para alimentar a toda la fortaleza.",
    date: "2026-11-17",
    publishedAt: november17Release,
  },
  contrato: {
    title: "La letra pequeña",
    cast: ["Calvix Uñanegra", "Ferrogard Escudoferreo"],
    action: "negocian con un diablillo que exige galletas antes de devolverles la tinta.",
    date: "2026-11-17",
    publishedAt: november17Release,
  },
  gallina: {
    title: "Invocación de corral",
    cast: ["Calvix Uñanegra", "Hellbrios Realtrece"],
    action: "descubren que el círculo de invocación también acepta encargos del gallinero.",
    date: "2026-11-16",
    publishedAt: november16ComicRelease,
  },
  espuma: {
    title: "La espuma contraataca",
    cast: ["Wondelond Manastorm", "Armentak Akrom"],
    action: "comprueban que enfriar una jarra con magia puede costar una barba de espuma.",
    date: "2026-11-16",
    publishedAt: november16ComicRelease,
  },
  cabra: {
    title: "El sombrero no se negocia",
    cast: ["Olynn Grandwell", "Akimis Derechos"],
    action: "negocian con una cabra que ha confundido el sombrero de Olynn con la merienda.",
    date: "2026-11-16",
    publishedAt: november16ComicRelease,
  },
  reyerta: {
    title: "Naisen acude a la Reyerta de Roman",
    cast: ["Naisen Grandwell", "Rompecraneos Roman"],
    castJoiner: " acude en auxilio de ",
    action: "frente a Big Will, en ",
    quest: {
      name: "La Reyerta",
      href: "https://www.wowhead.com/forever/es/quest=1719/la-reyerta",
    },
    actionSuffix: ", la prueba que forja a un guerrero.",
    date: "2026-11-16",
    publishedAt: november16Release,
  },
  claustro: {
    title: "El huésped del claustro",
    cast: ["Alexion Grandwell", "Lua Nita"],
    action: "comparten la merienda con un pequeño dragón feérico que ha tomado el claustro por hogar.",
    date: "2026-11-16",
    publishedAt: november16Release,
  },
  despensa: {
    title: "El golpe del queso",
    cast: ["Nyxeth Shadowheart", "Vincie Quickhands"],
    action: "siguen el rastro del queso perdido hasta el ladrón más pequeño de la fortaleza.",
    date: "2026-11-16",
    publishedAt: november16Release,
  },
  impostor: {
    title: "El otro Alexion",
    cast: ["Alexion Grandwell"],
    action: "le quita la careta al espía no-muerto que se hacía pasar por él.",
    date: "2026-11-13",
    publishedAt: "2026-11-13T11:48:00Z",
  },
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
  castPrefix?: string;
  castJoiner?: string;
  quest?: { name: string; href: string };
  actionSuffix?: string;
  date?: string;
  publishedAt?: string;
  party?: WelcomeParty;
};
export function sceneParticipants(scene: CoverScene): readonly string[] {
  return scene.guests ? [...scene.cast, ...scene.guests] : scene.cast;
}
export function coverCatalogue(members: Member[]): Record<string, CoverScene> {
  const unavailable = new Set(members.filter(m => !isCurrentMember(m)).map(m => m.id));
  const scenes: Record<string, CoverScene> = Object.fromEntries(
    Object.entries(guildCovers).filter(([, scene]) =>
      sceneParticipants(scene).every(name => !unavailable.has(coverMemberId(name))),
    ),
  );
  for (const party of welcomeParties(members).filter(p => p.members.every(isCurrentMember))) {
    const painting = welcomePaintings[party.id];
    scenes[party.id] = {
      title:
        painting?.title ?? "Bienvenida de " + party.members.map(fullName).join(" · "),
      cast: party.members.map(fullName),
      action:
        painting?.action ?? (party.members.length === 1
            ? "se incorpora a La Ganga."
            : "se incorporan a La Ganga."),
      date: party.day,
      publishedAt: painting?.publishedAt ?? party.members.flatMap(m => m.welcomes?.filter(w => w.id === party.id).map(w => w.joinedAt) ?? []).sort().at(-1),
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
