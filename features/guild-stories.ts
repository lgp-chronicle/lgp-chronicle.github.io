import type { Activity, Equipment, Member } from "./types.ts";
import type { GuildIconName } from "../components/guild-icon.tsx";

export const rivalId = (e: Activity) =>
  e.otherCharacterId ?? e.id.split(":")[1];

type Racer = { member: Member; before?: number; after?: number };
type Play = { key: string; at: string; lead: Racer; rivals: Racer[] };

// Older editions have no saved starting levels. Only use actual observations
// when the last one matches the finish of this sync.
function previousLevel(member: Member, at: string, finish: number | undefined) {
  const end = Date.parse(at);
  const last = member.history
    .filter((s) => typeof s.data.level === "number" && Date.parse(s.at) <= end)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  if (
    !last[1] ||
    last[0].data.level !== finish ||
    end - Date.parse(last[0].at) > 10 * 60000
  )
    return;
  return last[1].data.level;
}

export function editionPlay(events: Activity[], members: Member[]) {
  const roster = new Map(members.map((m) => [m.id, m]));
  const plays = new Map<string, Play>();
  for (const e of events) {
    if (e.kind !== "overtake") continue;
    const member = roster.get(e.characterId),
      rival = roster.get(rivalId(e));
    if (!member || !rival || member.id === rival.id) continue;
    const key = e.at + "/" + member.id;
    // Earlier editions only recorded the finishing levels in the headline.
    const legacy = /nivel (\d+) frente a (\d+)/i.exec(e.text);
    const after =
      e.levels?.after ?? (legacy ? [Number(legacy[1]), Number(legacy[2])] : []);
    const play = plays.get(key) ?? {
      key,
      at: e.at,
      lead: {
        member,
        before: e.levels?.before[0] ?? previousLevel(member, e.at, after[0]),
        after: after[0],
      },
      rivals: [] as Racer[],
    };
    if (!play.rivals.some((r) => r.member.id === rival.id)) {
      play.rivals.push({
        member: rival,
        before: e.levels?.before[1] ?? previousLevel(rival, e.at, after[1]),
        after: after[1],
      });
    }
    plays.set(key, play);
  }
  return [...plays.values()].sort(
    (a, b) =>
      b.rivals.length - a.rivals.length ||
      b.at.localeCompare(a.at) ||
      a.lead.member.id.localeCompare(b.lead.member.id),
  )[0];
}

type Piece = { item: Equipment; owners: Member[] };
type Theme = {
  kind: string;
  title: string;
  mark: GuildIconName;
  quiz?: boolean;
  match: (item: Equipment) => boolean;
};
export type ArmoryStory = Piece &
  Pick<Theme, "kind" | "title" | "mark"> & {
    choices: Member[];
  };

const slot = (id: string, label: string) => (item: Equipment) =>
  item.slotType?.replace(/_?[12]$/, "") === id ||
  item.slot?.replace(/\s*[12]$/, "") === label;

const rumorThemes: Theme[] = [
  {
    kind: "ring",
    quiz: true,
    title: "¿De quién es este anillo?",
    mark: "ring",
    match: slot("FINGER", "Anillo"),
  },
  {
    kind: "fish",
    title: "¿Quién se ha dejado la caña puesta?",
    mark: "fish",
    match: (i) =>
      /caña de (?:pesca|pescar)|fishing pole/i.test(
        i.name + " " + (i.properties?.subclass ?? ""),
      ),
  },
  {
    kind: "blue",
    title: "La pieza azul del día",
    mark: "amber",
    match: (i) => i.quality === "RARE",
  },
  {
    kind: "cloak",
    quiz: true,
    title: "¿Quién se esconde bajo esta capa?",
    mark: "cloak",
    match: slot("BACK", "Espalda"),
  },
  {
    kind: "boots",
    title: "¿Quién se ha puesto estas botas?",
    mark: "boot",
    match: slot("FEET", "Pies"),
  },
  {
    kind: "trinket",
    title: "El amuleto de la suerte",
    mark: "trinket",
    match: slot("TRINKET", "Abalorio"),
  },
  {
    kind: "grey",
    title: "¿Quién le guarda cariño a una pieza gris?",
    mark: "crate",
    match: (i) => i.quality === "POOR",
  },
  {
    kind: "neck",
    title: "La joya del día",
    mark: "necklace",
    match: slot("NECK", "Cuello"),
  },
  {
    kind: "hand",
    quiz: true,
    title: "¿Quién lleva esto en la mano principal?",
    mark: "sword",
    match: slot("MAIN_HAND", "Mano principal"),
  },
  {
    kind: "shirt",
    title: "Debajo de la armadura",
    mark: "shirt",
    match: slot("BODY", "Camisola"),
  },
  {
    kind: "epic",
    title: "Un destello morado",
    mark: "spell-crit",
    match: (i) => i.quality === "EPIC",
  },
];

export function armoryStories(members: Member[], day: number) {
  const wearers = members
    .filter((m) => m.data.equipment?.some((i) => i.id && i.name))
    .sort((a, b) => a.id.localeCompare(b.id));
  const catalog = new Map<string, Piece>();
  const ownersByName = new Map<string, Set<string>>();
  const itemName = (item: Equipment) =>
    item.name!.trim().normalize("NFC").toLocaleLowerCase("es");
  for (const member of wearers) {
    const seen = new Set<string>();
    for (const item of member.data.equipment ?? []) {
      if (!item.id || !item.name?.trim()) continue;
      const name = itemName(item),
        key = item.id + "/" + name;
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = catalog.get(key) ?? { item, owners: [] };
      entry.owners.push(member);
      catalog.set(key, entry);
      const owners = ownersByName.get(name) ?? new Set<string>();
      owners.add(member.id);
      ownersByName.set(name, owners);
    }
  }

  const items = [...catalog.values()].sort(
    (a, b) =>
      a.item.id! - b.item.id! ||
      itemName(a.item).localeCompare(itemName(b.item), "es"),
  );
  const used = new Set<string>();
  const cards: ArmoryStory[] = [];
  function deal(
    kind: string,
    title: string,
    mark: GuildIconName,
    pool: Piece[],
    quiz = false,
  ) {
    if (!pool.length) return;
    for (let i = 0; i < pool.length; i++) {
      const entry = pool[(day + i) % pool.length];
      const name = itemName(entry.item);
      if (used.has(name)) continue;
      const choices: Member[] = [];
      if (quiz) {
        if (wearers.length < 3 || ownersByName.get(name)?.size !== 1) continue;
        const owner = entry.owners[0],
          others = wearers.filter((m) => m.id !== owner.id);
        const start = (day + entry.item.id!) % others.length;
        choices.push(others[start], others[(start + 1) % others.length]);
        choices.splice((day + entry.item.id!) % 3, 0, owner);
      }
      cards.push({ ...entry, kind, title, mark, choices });
      used.add(name);
      return true;
    }
  }

  const unique = items.filter(
    (p) => ownersByName.get(itemName(p.item))?.size === 1,
  );
  deal("quiz", "¿De quién es esta pieza?", "clue", unique, true);
  deal(
    "shared",
    "El uniforme extraoficial",
    "tabard",
    items.filter((p) => p.owners.length > 1),
  );
  for (let i = 0; i < rumorThemes.length && cards.length < 5; i++) {
    const theme = rumorThemes[(day + i) % rumorThemes.length];
    const pool = items.filter((p) => theme.match(p.item));
    if (theme.quiz && deal(theme.kind, theme.title, theme.mark, pool, true)) continue;
    deal(theme.kind, theme.title, theme.mark, pool);
  }
  if (!cards.length) deal("item", "Una pieza de la armería", "clue", items);
  return { coverage: wearers.length, cards };
}
