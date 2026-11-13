import { battlegrounds } from "./battlegrounds.ts";
import { hasRecentUpdate, spotlightWindowDays } from "./spotlight-freshness.ts";
import type { Member } from "./types.ts";

export function armoryRecords(members: Member[], now: number) {
  type RecordRow = {
    id: string; title: string; unit: string; tab: "collections" | "attributes";
    best: number; winners: Member[]; coverage: number;
  };
  const records = new Map<string, RecordRow>();
  const cutoff = now - spotlightWindowDays * 86400000;
  const active = members.filter(m => m.inRoster !== false && !m.membership?.leftAt &&
    m.data.armoryVerified !== false && (m.data.level ?? 0) >= 10 && hasRecentUpdate(m, now));
  function observe(id: string, title: string, unit: string, member: Member, value: number, tab: RecordRow["tab"]) {
    const row = records.get(id) ?? { id, title, unit, tab, best: 0, winners: [], coverage: 0 };
    row.coverage++;
    if (value > row.best) {
      row.best = value;
      row.winners = [];
    }
    if (value > 0 && value === row.best) row.winners.push(member);
    records.set(id, row);
  }
  let pvpCoverage = 0;
  for (const member of active) {
    const p = member.data;
    const fresh = (resource: string) => {
      const at = Date.parse(p.resourceTimes?.[resource] ?? "");
      return at >= cutoff && at <= now;
    };
    for (const kind of ["mounts", "pets"] as const) {
      const items = p.collections?.[kind];
      if (!items || !fresh(kind)) continue;
      observe(kind, kind === "mounts" ? "El establo se queda pequeño" : "Se ha vuelto a casa con otra",
        kind === "mounts" ? "monturas distintas" : "mascotas distintas", member, items.length, "collections");
    }
    if (!p.pvp || !fresh("pvp_summary")) continue;
    pvpCoverage++;
    const maps = battlegrounds(p);
    observe("bg-wins", "Otra cola y lo dejo", "victorias en campos de batalla", member,
      maps.reduce((total, map) => total + map.won, 0), "attributes");
    for (const map of maps)
      observe("bg-map-" + map.id, "Especialista en " + map.name, "victorias en " + map.name,
        member, map.won, "attributes");
  }
  const rows = [...records.values()].filter(row => row.best > 0);
  for (const row of rows) if (row.id.startsWith("bg-map-")) row.coverage = pvpCoverage;
  return rows.sort((a, b) => Number(a.id.startsWith("bg-map-")) - Number(b.id.startsWith("bg-map-")) ||
    a.title.localeCompare(b.title, "es"));
}
