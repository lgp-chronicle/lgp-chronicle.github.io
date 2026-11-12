import { measurements } from "./observations.ts";
import type { Member } from "./types.ts";

export const spotlightWindowDays = 7;

export function hasRecentUpdate(member: Member, now: number) {
  const cutoff = now - spotlightWindowDays * 86400000;
  const recent = (time: number) => cutoff <= time && time <= now;
  const verified = member.data.armoryVerified !== false;
  if (verified && recent(Date.parse(member.data.sourceModified ?? "")))
    return true;

  // A roster-only character can still gain levels. Repeated identical
  // observations, including the first import, don't date a change.
  const metrics = verified
    ? (["level", "itemLevel", "honorableKills"] as const)
    : (["level"] as const);
  return metrics.some((key) => {
    const rows = measurements(member, key).filter((row) =>
      recent(Date.parse(row.at)),
    );
    return rows.some(
      (row, i) => i > 0 && row.data[key] !== rows[i - 1].data[key],
    );
  });
}
