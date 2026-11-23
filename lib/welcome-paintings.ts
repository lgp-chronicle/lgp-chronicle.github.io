type WelcomePainting = {
  art: string;
  title: string;
  action: string;
  publishedAt: string;
  // An illustrated welcome for a member whose arrival predates our records.
  memberIds?: readonly string[];
};

export const welcomePaintings: Partial<Record<string, WelcomePainting>> = {
  "bienvenida-2026-11-20-forever-eu-ryuma-senju": {
    art: "bienvenida-ryuma",
    title: "Un hogar para Ryuma",
    action: "cruza las puertas de La Ganga con su equipaje y un nuevo camino por delante.",
    publishedAt: "2026-11-23T14:03:47Z",
  },
  "bienvenida-volkhim": {
    art: "bienvenida-volkhim",
    title: "Volkhim llega a la fortaleza",
    action: "entra en el patio con su bolsa de viaje. La Ganga ya le guarda un lugar junto al fuego.",
    publishedAt: "2026-11-23T14:03:47Z",
    memberIds: ["forever-eu-volkhim-garrasombría"],
  },
  "bienvenida-2026-11-23-forever-eu-zush-ira": {
    art: "bienvenida-zush",
    title: "Los primeros pasos de Zush",
    action: "llega con lo puesto y su equipaje, lista para comenzar sus aventuras con La Ganga.",
    publishedAt: "2026-11-23T14:03:47Z",
  },
  "bienvenida-nightray": {
    art: "bienvenida-nightray",
    title: "Dos Nightray bajo el mismo estandarte",
    action: "cruzan las puertas de La Ganga con su equipaje. Él trae ganas de aventura; ella, por si acaso, las curas.",
    publishedAt: "2026-11-19T08:15:00Z",
    memberIds: ["forever-eu-naisen-nightray", "forever-eu-nerey-nightray"],
  },
  "bienvenida-2026-11-17-forever-eu-chemaxtor-balarota": {
    art: "bienvenida-chemaxtor",
    title: "Aquí cabe otro cazador",
    action: "cruza las puertas de La Ganga con todo su equipaje y ganas de quedarse. Ya hay sitio junto al fuego.",
    publishedAt: "2026-11-18T10:25:07Z",
  },
  "bienvenida-er-manu": {
    art: "bienvenida-er-manu",
    title: "Una insignia para Er Manu",
    action: "cuelga su insignia en la puerta de la fortaleza.",
    publishedAt: "2026-11-12T09:21:12+01:00",
  },
  "bienvenida-2026-11-14-forever-eu-nyxeth-shadowheart": {
    art: "bienvenida-nyxeth",
    title: "Las llaves de Nyxeth",
    action: "llega con su equipaje y estrena la llave de sus nuevos aposentos.",
    publishedAt: "2026-11-16T07:48:00Z",
  },
  "bienvenida-2026-11-15-forever-eu-wondelond-manastorm": {
    art: "bienvenida-wondelond",
    title: "La mudanza arcana de Wondelond",
    action: "se instala en la fortaleza haciendo levitar su baúl de viaje.",
    publishedAt: "2026-11-16T07:48:00Z",
  },
};
