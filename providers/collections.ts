import { armoryUrl, type CharacterConfig } from "../config/characters";
import type { Collectible, CollectionKind, Profile } from "../features/types";
import { request, ProviderError } from "./http";

// The public Forever collection tabs include the unowned catalogue as well as owned entries.
export function readCollectionPage(html: string, kind: CollectionKind, slug: string, region: string) {
  const payload = /\bcharacterProfileInitialState\s*=\s*(\{[^\n\r]*?\})\s*;\s*<\/script>/i.exec(html)?.[1];
  if (!payload) throw new ProviderError("collection-unavailable");
  const state = JSON.parse(payload);
  const collection = state[kind];
  if (state.character?.slug?.normalize("NFC") !== slug.normalize("NFC") || state.character?.region !== region)
    throw new ProviderError("collection-identity");
  if (!Array.isArray(collection?.[kind]) || !Number.isInteger(collection[kind + "Collected"]))
    throw new ProviderError("collection-unavailable");
  const items = new Map<number, Collectible>();
  const catalogue = new Set<number>();
  for (const entry of collection[kind]) {
    if (!entry || !Number.isSafeInteger(entry.id) || entry.id <= 0 || typeof entry.name !== "string" || !entry.name.trim() || typeof entry.collected !== "boolean")
      throw new ProviderError("invalid-collection");
    catalogue.add(entry.id);
    if (entry.collected !== true) continue;
    const image = entry.render?.url ?? entry.icon?.url;
    items.set(entry.id, { id: entry.id, name: entry.name,
      image: typeof image === "string" && image.startsWith("https://render.worldofwarcraft.com/") ? image : undefined,
      family: entry.family?.name });
  }
  if (items.size !== collection[kind + "Collected"]) throw new ProviderError("incomplete-collection");
  return { items: [...items.values()].sort((a,b) => a.id - b.id), catalogue: [...catalogue].sort((a,b) => a-b) };
}

export function readCollection(html: string, kind: CollectionKind, slug: string, region: string): Collectible[] {
  return readCollectionPage(html,kind,slug,region).items;
}

export async function syncCollections(c: CharacterConfig, profile: Profile, errors: string[]) {
  const now = Date.now();
  const times = profile.resourceTimes ??= {};
  const slug = c.slug || c.name.toLowerCase();
  for (const kind of ["mounts", "pets"] as const) {
    const previous = Date.parse(times[kind] ?? "");
    // Bootstrap catalogues for existing profiles without waiting for their next refresh.
    if (profile.collections?.[kind] && profile.collectionCatalogues?.[kind]?.length && previous <= now && now - previous < 6 * 3600_000) continue;
    try {
      const response = await request(armoryUrl(c.region, slug) + "collections/" + kind);
      const { items, catalogue } = readCollectionPage(await response.text(), kind, slug, c.region);
      if (!catalogue.length) throw new ProviderError("empty-collection-catalogue");
      profile.collections = { ...profile.collections, [kind]: items };
      // Some promotional entries are advertised only on characters who own them.
      // Keep every species discovered, even if a later page no longer lists it.
      profile.collectionCatalogues = { ...profile.collectionCatalogues, [kind]:
        [...new Set([...(profile.collectionCatalogues?.[kind] ?? []), ...catalogue])].sort((a,b)=>a-b) };
      times[kind] = new Date(now).toISOString();
    } catch (error) {
      const code = error instanceof ProviderError ? error.code : "invalid-response";
      errors.push("blizzard:" + kind + ":" + code);
      if (code === "rate-limited") return false;
    }
  }
  return true;
}
