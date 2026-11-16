import { Play, Image } from "lucide-react";
import { siteHref } from "../lib/public-settings";
import { galleryBasePath } from "../lib/guild-navigation";
import { videosForMember } from "../lib/guild-videos";
import { CoverGallery } from "./cover-gallery";
import { VideoGallery } from "./video-gallery";
import type { Member } from "./types";
import "../app/video-gallery.css";

export function MediaGallery({ members, member }: { members: Member[]; member?: Member }) {
  const params = new URLSearchParams(location.hash.split("?")[1]);
  const videos = params.get("vista") === "videos" || params.has("video");
  const base = galleryBasePath(location.hash.slice(1));
  function href(mode: string) {
    const [path, query] = base.split("?");
    const p = new URLSearchParams(query);
    if (mode === "videos") p.set("vista", mode); else p.delete("vista");
    return siteHref(path + (p.size ? "?" + p : ""));
  }
  const count = videosForMember(member?.id).length;
  return <div className="media-gallery">
    <nav className="media-switch" aria-label="Tipo de galería">
      <a href={href("images")} aria-current={!videos ? "page" : undefined}><Image size={18} />Ilustraciones</a>
      <a href={href("videos")} aria-current={videos ? "page" : undefined}><Play size={18} />Vídeos{count > 0 && <span>{count}</span>}</a>
    </nav>
    {videos ? <VideoGallery members={members} member={member} /> : <CoverGallery members={members} member={member} />}
  </div>;
}
