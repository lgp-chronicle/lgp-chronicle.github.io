import { measurements } from "./observations.ts";
import type { Member } from "./types.ts";

export const spotlightWindowDays = 7;

// A dated Blizzard update is exact. A change between observations can only
// be placed inside that interval, which matters at the edge of a week.
export function armorySignals(member: Member, now: number) {
  const signals = new Map<number, number>();
  function record(at: number, earliest = at) {
    if (Number.isFinite(at) && at <= now)
      signals.set(at, Math.max(earliest, signals.get(at) ?? -Infinity));
  }
  const verified = member.data.armoryVerified !== false;
  const source = Date.parse(member.data.sourceModified ?? "");
  if (verified) record(source);
  for (const { at, data } of member.history) {
    const published = Date.parse(data.sourceModified ?? "");
    const observed = Date.parse(at);
    if (published <= observed && observed <= now && data.armoryVerified !== false)
      record(published);
  }

  // A roster-only character can still gain levels. Repeated identical
  // observations, including the first import, don't date a change.
  const metrics = verified
    ? (["level", "itemLevel", "honorableKills"] as const)
    : (["level"] as const);
  for (const key of metrics) {
    const rows = measurements(member, key);
    for (let i = 1; i < rows.length; i++) {
      const previous = rows[i - 1],
        current = rows[i];
      const before = Date.parse(previous.at),
        at = Date.parse(current.at);
      if (
        current.data[key] === previous.data[key] ||
        !(before < at && at <= now)
      )
        continue;
      const modified = Date.parse(current.data.sourceModified ?? "");
      // Don't award a second day when the next poll first sees last night's update.
      if (
        verified &&
        ((modified > before && modified <= at) ||
          (!Number.isFinite(modified) && source > before && source <= at))
      )
        continue;
      record(at, before);
    }
  }
  return signals;
}

export function hasRecentUpdate(member: Member, now: number) {
  const cutoff = now - spotlightWindowDays * 86400000;
  const modified = Date.parse(member.data.sourceModified ?? "");
  if (
    member.data.armoryVerified !== false &&
    cutoff <= modified &&
    modified <= now
  )
    return true;
  return [...armorySignals(member, now).values()].some(
    (time) => time >= cutoff,
  );
}
