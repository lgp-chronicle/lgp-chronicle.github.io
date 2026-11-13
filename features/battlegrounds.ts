import type { Profile } from "./types.ts";

type Battlefield = { name: string; played: number; won: number; lost: number };
const count = (n: unknown): n is number => Number.isSafeInteger(n) && Number(n) >= 0;
export function battlegrounds(profile: Profile): Battlefield[] {
  const maps = profile.pvp?.pvp_map_statistics;
  if (!Array.isArray(maps)) return [];
  return maps.flatMap(entry => {
    const name = entry?.world_map?.name;
    const stats = entry?.match_statistics;
    if (typeof name !== "string" || !count(stats?.played) || !count(stats.won) || !count(stats.lost)) return [];
    return [{ name, played: stats.played, won: stats.won, lost: stats.lost }];
  }).sort((a,b) => b.played - a.played || a.name.localeCompare(b.name, "es"));
}
export function battlegroundWins(profile: Profile) {
  return battlegrounds(profile).reduce((sum, map) => sum + map.won, 0);
}
