import { isCurrentMember } from "./membership.ts";
import { fullName } from "./member-name.ts";
import { hasRecentUpdate, spotlightWindowDays } from "./spotlight-freshness.ts";
import type { Collectible, CollectionKind, Member, Profile } from "./types.ts";

export function collectedItems(profile: Profile, kind: CollectionKind) {
  const items = profile.armoryVerified === false ? undefined : profile.collections?.[kind];
  if (!Array.isArray(items)) return undefined;
  return [...new Map(items.filter(item => Number.isSafeInteger(item.id) && item.id > 0)
    .map(item => [item.id, item])).values()];
}
export const collectionCount = (profile: Profile, kind: CollectionKind) => collectedItems(profile, kind)?.length;

export function sharedCollections(a: Profile, b: Profile, kind: CollectionKind) {
  const left = collectedItems(a, kind), right = collectedItems(b, kind);
  if (!left || !right) return undefined;
  const ids = new Set(right.map(item => item.id));
  return left.filter(item => ids.has(item.id)).length;
}

export function guildCollection(members: Member[], kind: CollectionKind, now: number) {
  const roster = members.filter(m => isCurrentMember(m) && m.data.level !== 1);
  const catalogue = new Map<number, { item: Collectible; owners: Member[] }>();
  const ranking: { member: Member; count: number; rank: number }[] = [];
  let coverage = 0, total = 0;
  for (const member of roster) {
    const items = collectedItems(member.data, kind);
    if (!items) continue;
    coverage++;
    total += items.length;
    for (const item of items) {
      const entry = catalogue.get(item.id) ?? { item, owners: [] };
      entry.owners.push(member);
      catalogue.set(item.id, entry);
    }
    const at = Date.parse(member.data.resourceTimes?.[kind] ?? "");
    if (hasRecentUpdate(member, now) && at > now - spotlightWindowDays * 86400000 && at <= now)
      ranking.push({ member, count: items.length, rank: 0 });
  }
  ranking.sort((a,b) => b.count - a.count || fullName(a.member).localeCompare(fullName(b.member), "es"));
  ranking.forEach((row,i) => { row.rank = i > 0 && row.count === ranking[i-1].count ? ranking[i-1].rank : i + 1; });
  const items = [...catalogue.values()].sort((a,b) => b.owners.length - a.owners.length || a.item.name.localeCompare(b.item.name,"es"));
  // Discoveries remain known after a member leaves. Ownership still uses only the current roster.
  const known = new Set<number>();
  let consultedAt = 0;
  for (const member of members) {
    const ids = member.data.collectionCatalogues?.[kind];
    const at = Date.parse(member.data.resourceTimes?.[kind] ?? "");
    if (!ids?.length || !Number.isFinite(at) || at > now || member.data.armoryVerified === false) continue;
    for (const id of ids) if (Number.isSafeInteger(id) && id > 0) known.add(id);
    consultedAt = Math.max(consultedAt,at);
  }
  const progress = known.size && coverage ? (() => {
    // Owned promotional species also belong to the known catalogue during migration.
    for (const id of catalogue.keys()) known.add(id);
    return { collected: items.length, total: known.size, remaining: known.size-items.length,
      percent: items.length/known.size*100, consultedAt: new Date(consultedAt).toISOString() };
  })() : undefined;
  return { kind, distinct: items.length, total, coverage, rosterSize: roster.length, items, ranking,
    progress,
    singleOwner: items.filter(row => row.owners.length === 1).length };
}
