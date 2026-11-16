import catalogue from "../config/videos.json" with { type: "json" };
import { searchable } from "./guild-navigation.ts";

export type GuildVideo = {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  publishedAt: string;
  memberIds: string[];
  authorId: string;
};
export const videoAuthor = "forever-eu-vincie-quickhands";
export const videoPublicationUrl = "https://github.com/lgp-chronicle/lgp-chronicle.github.io/actions/workflows/publish-video.yml";

export function youtubeIdFromUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split("/").filter(Boolean);
    const id = host === "youtu.be" && parts.length === 1 ? parts[0]
      : ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)
        ? url.pathname === "/watch" ? url.searchParams.get("v")
          : ["shorts", "embed", "live"].includes(parts[0]) && parts.length === 2 ? parts[1] : null
        : ["youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host) && parts[0] === "embed" && parts.length === 2 ? parts[1] : null;
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

export function validateVideo(value: unknown): asserts value is GuildVideo {
  const v = value as GuildVideo | null;
  if (!v || typeof v !== "object" || typeof v.id !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(v.id) ||
      typeof v.youtubeId !== "string" || !/^[A-Za-z0-9_-]{11}$/.test(v.youtubeId) ||
      typeof v.title !== "string" || !v.title.trim() || v.title.length > 160 ||
      typeof v.description !== "string" || v.description.length > 1500 ||
      !/^\d{4}-\d{2}-\d{2}T/.test(v.publishedAt ?? "") || !Number.isFinite(Date.parse(v.publishedAt)) ||
      !Array.isArray(v.memberIds) || !v.memberIds.length ||
      v.memberIds.some(id => typeof id !== "string" || !id.startsWith("forever-eu-")) ||
      new Set(v.memberIds).size !== v.memberIds.length || v.authorId !== videoAuthor)
    throw new Error("La ficha del vídeo está incompleta o no es válida.");
}

export const guildVideos: GuildVideo[] = catalogue.map((value: unknown) => {
  validateVideo(value);
  return value;
});
if (new Set(guildVideos.map(v => v.id)).size !== guildVideos.length ||
    new Set(guildVideos.map(v => v.youtubeId)).size !== guildVideos.length)
  throw new Error("Hay vídeos duplicados en la videoteca.");

export const videosForMember = (memberId?: string, now = Date.now(), videos = guildVideos) =>
  videos.filter(v => Date.parse(v.publishedAt) <= now && (!memberId || v.memberIds.includes(memberId)))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id));

export function isNewVideo(video: Pick<GuildVideo, "publishedAt"> | undefined, now = Date.now()) {
  const age = now - Date.parse(video?.publishedAt ?? "");
  return age >= 0 && age < 48 * 60 * 60 * 1000;
}

export function resolveVideoMembers(names: string, members: { id: string; name: string; surname?: string }[]) {
  const requested = names.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  if (!requested.length) throw new Error("Indica al menos un protagonista.");
  return [...new Set(requested.map(name => {
    const matches = members.filter(m => m.id === name || searchable([m.name, m.surname].filter(Boolean).join(" ")) === searchable(name));
    if (matches.length !== 1) throw new Error("No se reconoce el nombre completo: " + name);
    return matches[0].id;
  }))];
}

export function prepareVideo(
  inputs: { url: string; title: string; characters: string; description?: string },
  members: { id: string; name: string }[],
  existing: GuildVideo[],
  now = new Date().toISOString(),
) {
  const youtubeId = youtubeIdFromUrl(inputs.url);
  if (!youtubeId) throw new Error("Pega un enlace HTTPS válido a un vídeo de YouTube.");
  const previous = existing.find(v => v.youtubeId === youtubeId);
  const video: GuildVideo = {
    id: previous?.id ?? "v-" + youtubeId,
    youtubeId,
    title: inputs.title.trim(),
    description: (inputs.description ?? "").trim(),
    publishedAt: previous?.publishedAt ?? now,
    memberIds: resolveVideoMembers(inputs.characters, members),
    authorId: videoAuthor,
  };
  validateVideo(video);
  return video;
}

export const videoPoster = (video: GuildVideo) => `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
export const videoEmbed = (video: GuildVideo) =>
  `https://www.youtube-nocookie.com/embed/${video.youtubeId}?playsinline=1&rel=0`;

export function withGalleryVideo(path: string, id: string | null) {
  const [base, query] = path.split("?");
  const params = new URLSearchParams(query);
  params.delete("escena");
  if (base.startsWith("/character/")) params.set("vista", "videos");
  else params.delete("vista");
  if (id) params.set("video", id); else params.delete("video");
  return base + "?" + params;
}
