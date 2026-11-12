import { armorySignals, spotlightWindowDays } from "./spotlight-freshness.ts";
import { fullName } from "./member-name.ts";
import type { Member } from "./types.ts";

const dayMs = 86400000;
export function tavernActivity(members: Member[], asOf: string) {
  const now = Date.parse(asOf);
  const today = Math.floor(now / dayMs);
  const days = Array.from(
    { length: spotlightWindowDays },
    (_, i) => (today - spotlightWindowDays + 1 + i) * dayMs,
  );
  const roster = members.filter(
    (m) =>
      m.inRoster !== false &&
      !m.membership?.leftAt &&
      !m.membership?.pendingAbsence,
  );
  const rows = roster.map((member) => {
    const marks = armorySignals(member, now);
    const activeDays = new Set<number>();
    let last = -Infinity;
    for (const [at, earliest] of marks) {
      last = Math.max(last, at);
      if (earliest >= days[0]) activeDays.add(Math.floor(at / dayMs) * dayMs);
    }
    return { member, name: fullName(member), last, activeDays };
  });
  const active = rows
    .filter((r) => r.activeDays.size)
    .sort(
      (a, b) =>
        b.activeDays.size - a.activeDays.size ||
        a.name.localeCompare(b.name, "es"),
    );
  const oldest = rows
    .filter((r) => Number.isFinite(r.last))
    .sort((a, b) => a.last - b.last || a.name.localeCompare(b.name, "es"));
  const unknown = rows
    .filter((r) => !Number.isFinite(r.last))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  return { days, active, oldest, unknown };
}
