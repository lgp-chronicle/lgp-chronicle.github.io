import type { Member, Profile, Snapshot, Activity } from "./types.ts";
import { numeric } from "./types.ts";
export function metricTime(s: Snapshot, key: keyof Profile) {
  const resource =
    key === "honorableKills" || key === "honor" ? "pvp_summary" : "summary";
  return s.data.resourceTimes?.[resource] ?? s.data.observedAt ?? s.at;
}
export function measurements(m: Member, key: keyof Profile) {
  const seen = new Set<string>();
  return m.history
    .filter((s) => {
      const at = metricTime(s, key);
      if (!numeric(s.data[key]) || seen.has(at)) return false;
      seen.add(at);
      return true;
    })
    .map((s) => ({ ...s, at: metricTime(s, key) }))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
export function overtakeEvents(before: Member[], after: Member[], at: string) {
  const events: Activity[] = [];
  for (const a of after) {
    const oldA = before.find((x) => x.id === a.id);
    if (
      !numeric(a.data.level) ||
      !numeric(oldA?.data.level) ||
      !a.data.observedAt ||
      Date.parse(at) - Date.parse(a.data.observedAt) > 6 * 3600000
    )
      continue;
    for (const b of after) {
      if (a.id === b.id) continue;
      const oldB = before.find((x) => x.id === b.id);
      if (
        !numeric(b.data.level) ||
        !numeric(oldB?.data.level) ||
        !b.data.observedAt ||
        Date.parse(at) - Date.parse(b.data.observedAt) > 6 * 3600000
      )
        continue;
      if (
        oldA!.data.level! <= oldB!.data.level! &&
        a.data.level > b.data.level &&
        a.data.level > oldA!.data.level!
      ) {
        events.push({
          id: `${a.id}:${b.id}:${at}:overtake`,
          characterId: a.id,
          at,
          kind: "overtake",
          text: `${a.name} adelanta a ${b.name}: nivel ${a.data.level} frente a ${b.data.level}. La clasificación tiene movimiento.`,
        });
      }
    }
  }
  return events;
}
export function rankChanges(members: Member[], now = Date.now()) {
  const values = members.map((m) => ({
    m,
    current: m.data.level,
    old: measurements(m, "level")
      .filter(
        (s) =>
          Date.parse(s.at) <= now - 86400000 &&
          Date.parse(s.at) >= now - 86400000 - 6 * 3600000,
      )
      .at(-1)?.data.level,
  }));
  if (values.some((v) => !numeric(v.current) || !numeric(v.old)))
    return new Map<string, number>();
  const current = [...values].sort((a, b) => b.current! - a.current!);
  const old = [...values].sort((a, b) => b.old! - a.old!);
  return new Map(
    values.map((v) => [
      v.m.id,
      old.findIndex((x) => x.old === v.old) -
        current.findIndex((x) => x.current === v.current),
    ]),
  );
}
