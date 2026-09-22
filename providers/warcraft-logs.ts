import type { CharacterConfig } from "../config/characters";
import type { Logs } from "../features/types";
import { numeric } from "../features/types";
import { request, token, ProviderError } from "./http";
export function normalizeRankings(zones: Logs["zones"]) {
  const result: Pick<Logs, "bestParse" | "bestDps" | "bestHps" | "bosses"> = {};
  const bosses = new Set<number>();
  let covered = false;
  for (const zone of zones) {
    for (const metric of ["dps", "hps"] as const) {
      const ranks = (zone[metric] as any)?.rankings;
      if (!Array.isArray(ranks)) continue;
      covered = true;
      for (const row of ranks) {
        if (numeric(row.rankPercent))
          result.bestParse = Math.max(result.bestParse ?? 0, row.rankPercent);
        if (numeric(row.bestAmount)) {
          const key = metric === "dps" ? "bestDps" : "bestHps";
          result[key] = Math.max(result[key] ?? 0, row.bestAmount);
        }
        if (row.totalKills > 0 && numeric(row.encounter?.id))
          bosses.add(row.encounter.id);
      }
    }
  }
  if (covered) result.bosses = bosses.size;
  return result;
}
export function participantFights(report: any, c: CharacterConfig) {
  const actors = (report.masterData?.actors ?? []).filter(
    (a: any) =>
      a.type === "Player" &&
      a.name?.toLowerCase() === c.name.toLowerCase() &&
      a.server?.toLowerCase().replace(/[^a-z0-9]/g, "") ===
        c.realm.replace(/[^a-z0-9]/g, ""),
  );
  if (actors.length !== 1) return undefined;
  const actor = actors[0];
  if (!Array.isArray(report.fights)) return undefined;
  return report.fights
    .filter(
      (f: any) =>
        f.encounterID > 0 &&
        f.friendlyPlayers?.includes(actor.id) &&
        typeof f.kill === "boolean" &&
        !f.inProgress,
    )
    .map((f: any) => ({
      id: f.id,
      encounterId: f.encounterID,
      name: f.name,
      kill: f.kill,
      startTime: report.startTime + f.startTime,
      endTime: report.startTime + f.endTime,
      spec: f.friendlySpecs?.[f.friendlyPlayers.indexOf(actor.id)],
    }));
}
export async function warcraftLogs(
  c: CharacterConfig,
  s: Record<string, string | undefined>,
  old?: Logs,
): Promise<Logs> {
  const auth = await token(
    "https://www.warcraftlogs.com/oauth/token",
    s.WARCRAFTLOGS_CLIENT_ID,
    s.WARCRAFTLOGS_CLIENT_SECRET,
  );
  const errors: string[] = [];
  const query = async (q: string, variables: Record<string, unknown>) => {
    const r = await request("https://fresh.warcraftlogs.com/api/v2/client", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: q, variables }),
    });
    const j = (await r.json()) as any;
    if (j.errors?.length) throw new ProviderError("graphql-error");
    return j.data;
  };
  const d = await query(
    `query($id:Int,$name:String,$realm:String,$region:String){rateLimitData{limitPerHour pointsSpentThisHour pointsResetIn} characterData{character(id:$id,name:$name,serverSlug:$realm,serverRegion:$region){id name server{slug region{slug}} recentReports(limit:10){data{code title startTime endTime}}}}}`,
    c.logsId
      ? { id: c.logsId }
      : { name: c.name, realm: c.realm, region: c.region },
  );
  const p = d?.characterData?.character;
  if (!p) throw new ProviderError("not-found");
  if (
    p.name.toLowerCase() !== c.name.toLowerCase() ||
    p.server?.slug !== c.realm ||
    p.server?.region?.slug?.toLowerCase() !== c.region
  )
    throw new ProviderError("identity-mismatch");
  if (
    d.rateLimitData?.pointsSpentThisHour >
    d.rateLimitData?.limitPerHour * 0.9
  )
    throw new ProviderError("rate-limited", d.rateLimitData.pointsResetIn);
  const zoneIds =
    c.logsZones ??
    (s.WARCRAFTLOGS_ZONE_IDS ?? "")
      .split(",")
      .filter(Boolean)
      .map(Number)
      .filter(Number.isInteger);
  const output: Logs = {
    id: p.id,
    name: p.name,
    zones: [],
    reports: p.recentReports?.data ?? [],
    observedAt: new Date().toISOString(),
    errors,
  };
  for (const id of zoneIds) {
    try {
      const z = await query(
        `query($id:Int!,$zone:Int!){characterData{character(id:$id){dps:zoneRankings(zoneID:$zone,metric:dps) hps:zoneRankings(zoneID:$zone,metric:hps)}}}`,
        { id: p.id, zone: id },
      );
      const v = z?.characterData?.character;
      if (!v) throw new ProviderError("invalid-rankings");
      output.zones.push({
        id,
        dps: v.dps,
        hps: v.hps,
        observedAt: output.observedAt,
      });
    } catch (e) {
      errors.push(
        `zone-${id}:${e instanceof ProviderError ? e.code : "invalid-response"}`,
      );
      const prior = old?.zones.find((x) => x.id === id);
      if (prior) output.zones.push(prior);
      if (e instanceof ProviderError && e.code === "rate-limited") throw e;
    }
  }
  Object.assign(output, normalizeRankings(output.zones));
  const limit = Math.max(
    0,
    Math.min(10, Number(s.WARCRAFTLOGS_REPORT_LIMIT) || 3),
  );
  for (const r of output.reports.slice(0, limit)) {
    try {
      const detail = await query(
        `query($code:String!){reportData{report(code:$code){startTime fights{ id encounterID name kill inProgress startTime endTime friendlyPlayers friendlySpecs } masterData{actors{id name server type}}}}}`,
        { code: r.code },
      );
      const report = detail?.reportData?.report;
      if (!report) continue;
      r.fights = participantFights(report, c);
      r.observedAt = output.observedAt;
    } catch (e) {
      errors.push(
        `report:${e instanceof ProviderError ? e.code : "invalid-response"}`,
      );
      const prev = old?.reports.find((x) => x.code === r.code);
      if (prev) {
        r.fights = prev.fights;
        r.observedAt = prev.observedAt;
      }
      if (e instanceof ProviderError && e.code === "rate-limited") throw e;
    }
  }
  return output;
}
