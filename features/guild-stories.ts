import type { Activity, Equipment, Member } from "./types.ts";

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

export function armoryStories(members: Member[], day: number) {
  const wearers = members.filter((m) =>
    m.data.equipment?.some((i) => i.id && i.name),
  );
  const pieces = new Map<number, { item: Equipment; owners: Member[] }>();
  const anglers = new Map<string, Member>();
  let pole: Equipment | undefined;
  for (const member of wearers) {
    const seen = new Set<number>();
    for (const item of member.data.equipment ?? []) {
      if (!item.id || !item.name || seen.has(item.id)) continue;
      seen.add(item.id);
      const piece = pieces.get(item.id) ?? { item, owners: [] as Member[] };
      piece.owners.push(member);
      pieces.set(item.id, piece);
      if (
        /caña de (?:pesca|pescar)|fishing pole/i.test(
          item.name + " " + (item.properties?.subclass ?? ""),
        )
      ) {
        anglers.set(member.id, member);
        pole ??= item;
      }
    }
  }
  const items = [...pieces.values()].sort(
    (a, b) => b.owners.length - a.owners.length || a.item.id! - b.item.id!,
  );
  const shared = items.find((p) => p.owners.length > 1);
  const unique = items.filter((p) => p.owners.length === 1);
  const clue = unique[day % (unique.length || 1)];
  const owner = clue?.owners[0];
  const others = wearers
    .filter((m) => m.id !== owner?.id)
    .sort((a, b) => a.id.localeCompare(b.id));
  const choices =
    owner && others.length >= 2
      ? [
          owner,
          others[day % others.length],
          others[(day + 1) % others.length],
        ].sort((a, b) => a.id.localeCompare(b.id))
      : [];
  return {
    coverage: wearers.length,
    pole,
    anglers: [...anglers.values()],
    shared,
    clue,
    choices,
  };
}
