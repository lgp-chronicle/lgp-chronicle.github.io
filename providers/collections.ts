import { armoryUrl, type CharacterConfig } from "../config/characters";
import type { Collectible, CollectionKind, Profile } from "../features/types";
import { request, ProviderError } from "./http";

// The public Forever collection tabs include the unowned catalogue as well as owned entries.
export function readCollection(html: string, kind: CollectionKind, slug: string, region: string): Collectible[] {
  const payload = /\bcharacterProfileInitialState\s*=\s*(\{[^\n\r]*?\})\s*;\s*<\/script>/i.exec(html)?.[1];
  if (!payload) throw new ProviderError("collection-unavailable");
  const state = JSON.parse(payload);
  const collection = state[kind];
  if (state.character?.slug?.normalize("NFC") !== slug.normalize("NFC") || state.character?.region !== region)
    throw new ProviderError("collection-identity");
  if (!Array.isArray(collection?.[kind]) || !Number.isInteger(collection[kind + "Collected"]))
    throw new ProviderError("collection-unavailable");
  const items = new Map<number, Collectible>();
  for (const entry of collection[kind]) {
    if (entry.collected !== true) continue;
    if (!Number.isSafeInteger(entry.id) || !entry.name?.trim()) throw new ProviderError("invalid-collection");
    const image = entry.render?.url ?? entry.icon?.url;
    items.set(entry.id, { id: entry.id, name: entry.name,
      image: typeof image === "string" && image.startsWith("https://render.worldofwarcraft.com/") ? image : undefined,
      family: entry.family?.name });
  }
  if (items.size !== collection[kind + "Collected"]) throw new ProviderError("incomplete-collection");
  return [...items.values()].sort((a,b) => a.id - b.id);
}

export async function syncCollections(c: CharacterConfig, profile: Profile, errors: string[]) {
  const now = Date.now();
  const times = profile.resourceTimes ??= {};
  const slug = c.slug || c.name.toLowerCase();
  for (const kind of ["mounts", "pets"] as const) {
    const previous = Date.parse(times[kind] ?? "");
    if (profile.collections?.[kind] && now - previous < 6 * 3600_000) continue;
    try {
      const response = await request(armoryUrl(c.region, slug) + "collections/" + kind);
      const items = readCollection(await response.text(), kind, slug, c.region);
      profile.collections = { ...profile.collections, [kind]: items };
      times[kind] = new Date(now).toISOString();
    } catch (error) {
      const code = error instanceof ProviderError ? error.code : "invalid-response";
      errors.push("blizzard:" + kind + ":" + code);
      if (code === "rate-limited") return false;
    }
  }
  return true;
}
