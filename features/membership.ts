import type { Member } from "./types.ts";

// First individually tracked arrival, Er Manu's original membership (UTC).
export const membershipStart = "2026-11-12T02:30:18.111Z";
export const originalCensusEnd = "2026-11-10T08:57:01.451Z";
export const newMemberPeriod = 7 * 86400000;
export function newUntil(m: Member) {
  const joined = m.membership?.joinedAt;
  if (!joined || joined < membershipStart || m.inRoster === false ||
      m.membership?.leftAt || m.membership?.pendingAbsence || !hasArmory(m)) return 0;
  return Date.parse(joined) + newMemberPeriod;
}

export function hasArmory(member: Member) {
  const p = member.data;
  const verified =
    p.armoryVerified ??
    Boolean(
      p.characterRender ||
        p.avatar ||
        Object.keys(p.resourceTimes ?? {}).some((key) => key !== "summary"),
    );
  return (p.level ?? 0) >= 10 && verified;
}

export type WelcomeParty = { id: string; day: string; members: Member[] };
export const paintedWelcome = "bienvenida-er-manu";

export function groupArrivals(members: Member[]): WelcomeParty[] {
  const days = new Map<string, Member[]>();
  for (const m of members) {
    if (
      !hasArmory(m) ||
      !m.membership?.joinedAt ||
      m.membership.leftAt ||
      m.membership.pendingAbsence
    )
      continue;
    const day = m.membership.joinedAt.slice(0, 10);
    if (!days.has(day)) days.set(day, []);
    days.get(day)!.push(m);
  }
  const parties: WelcomeParty[] = [];
  for (const [day, group] of [...days].sort(([a], [b]) => b.localeCompare(a))) {
    group.sort(
      (a, b) =>
        a.membership!.joinedAt!.localeCompare(b.membership!.joinedAt!) ||
        a.id.localeCompare(b.id),
    );
    for (let start = 0; start < group.length; ) {
      const party = group.slice(
        start,
        start + (group.length - start === 3 ? 3 : 2),
      );
      const painted =
        party.length === 1 &&
        party[0].id === "forever-eu-er-manu" &&
        day === "2026-11-12";
      const id = painted
        ? paintedWelcome
        : "bienvenida-" + day + "-" + party.map((m) => m.id).join("~");
      parties.push({ id, day, members: party });
      start += party.length;
    }
  }
  return parties;
}

export function welcomeParties(members: Member[]): WelcomeParty[] {
  const groups = new Map<
    string,
    { day: string; size: number; cast: { member: Member; position: number }[] }
  >();
  for (const m of members) {
    if (!hasArmory(m)) continue;
    for (const w of m.welcomes ?? []) {
      if (!groups.has(w.id))
        groups.set(w.id, { day: w.day, size: w.size, cast: [] });
      groups.get(w.id)!.cast.push({ member: m, position: w.position });
    }
  }
  return [...groups]
    .filter(([, group]) => group.cast.length === group.size)
    .map(([id, group]) => ({
      id,
      day: group.day,
      members: group.cast
        .sort((a, b) => a.position - b.position)
        .map((row) => row.member),
    }))
    .sort((a, b) => b.day.localeCompare(a.day) || a.id.localeCompare(b.id));
}
