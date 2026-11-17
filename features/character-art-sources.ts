import { assetUrl } from "../lib/public-settings.ts";
import { isCurrentMember } from "./membership.ts";
import { models } from "./portrait-availability.ts";
import type { Member, Profile } from "./types.ts";

export type CharacterArtMode = "current" | "entrance" | "honor";

// Blizzard replaces the image at the same URL when a character changes gear.
// Keep a stable cache key until the profile changes, including across sections.
export function armoryImageUrl(source: string | undefined, profile: Profile) {
  if (!source) return undefined;
  const version = [
    profile.sourceModified,
    profile.resourceTimes?.media,
    profile.observedAt,
  ].map(value => Date.parse(value ?? "")).find(Number.isFinite);
  if (version === undefined) return source;
  try {
    const url = new URL(source);
    url.searchParams.set("v", String(version));
    return url.href;
  } catch {
    return source;
  }
}

export function characterArtSources(
  member: Member,
  mode: CharacterArtMode = "current",
) {
  const archived = models[member.id];
  const render = member.data.characterRender || archived?.url;
  const sameSnapshot = archived &&
    archived.url === render &&
    Date.parse(member.data.sourceModified ?? "") === archived.modified;
  // An old optimized copy must never take precedence over a newer armory image.
  const local = sameSnapshot
    ? assetUrl("/guild/personajes/" +
        encodeURIComponent(member.id.slice("forever-eu-".length)) +
        ".webp?v=" + archived.modified)
    : undefined;
  const cutout = mode === "entrance" && local
    ? local.replace("/personajes/", "/formacion/")
    : undefined;
  const live = armoryImageUrl(render, member.data);
  const avatar = armoryImageUrl(member.data.avatar, member.data);
  const sources = isCurrentMember(member)
    ? [cutout, local, live, avatar].filter((src): src is string => Boolean(src))
    : [];
  return { sources, avatar, cutout };
}
