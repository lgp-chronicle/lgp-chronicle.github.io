import type { Profile } from "./types.ts";

type Battlefield = { id: string; name: string; played: number; won: number; lost: number };
const knownIds: Record<string, string> = {
  "Garganta Grito de Guerra": "489", "Warsong Gulch": "489",
  "Cuenca de Arathi": "529", "Arathi Basin": "529",
};
const count = (n: unknown): n is number => Number.isSafeInteger(n) && Number(n) >= 0;
export function battlegrounds(profile: Profile): Battlefield[] {
  const maps = profile.pvp?.pvp_map_statistics;
  if (!Array.isArray(maps)) return [];
  return maps.flatMap(entry => {
    const name = entry?.world_map?.name;
    const stats = entry?.match_statistics;
    if (typeof name !== "string" || !count(stats?.played) || !count(stats.won) || !count(stats.lost)) return [];
    const mapId = entry.world_map.id;
    const id = count(mapId) && mapId > 0 ? String(mapId) : knownIds[name] ?? name.normalize("NFC");
    return [{ id, name, played: stats.played, won: stats.won, lost: stats.lost }];
  }).sort((a,b) => b.played - a.played || a.name.localeCompare(b.name, "es"));
}
