import type { Logs } from "./types.ts";
export function raidActivity(logs: Logs | undefined, now = Date.now()) {
  if (!logs) return null;
  const reports = logs.reports.filter((r) => r.fights);
  if (!reports.length) return null;
  const unique = new Map<
    string,
    NonNullable<Logs["reports"][number]["fights"]>[number]
  >();
  for (const r of reports)
    for (const f of r.fights ?? [])
      unique.set(`${f.encounterId}:${f.startTime}:${f.endTime}`, f);
  const fights = Array.from(unique.values()).filter(
    (f) => f.endTime >= now - 7 * 86400000,
  );
  if (!fights.length) return null;
  return {
    kills: fights.filter((f) => f.kill).length,
    wipes: fights.filter((f) => !f.kill).length,
    bosses: new Set(fights.filter((f) => f.kill).map((f) => f.encounterId))
      .size,
    minutes: fights.reduce((n, f) => n + (f.endTime - f.startTime) / 60000, 0),
    fights,
  };
}
