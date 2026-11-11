import { useState, type CSSProperties } from "react";
import { assetUrl } from "@/lib/public-settings";
import archive from "../config/character-art.json";
import type { Member } from "./types";

type Frame = { x: number; top: number; height: number };
type ArchivedModel = { url: string; modified: number; frame: Frame };
const models: Record<string, ArchivedModel> = archive;

export function characterRender(member: Member) {
  return member.data.characterRender || models[member.id]?.url;
}

export function CharacterArt({ member }: { member: Member }) {
  const archived = models[member.id];
  const live = characterRender(member);
  // Blizzard can update a character in place at the same URL after a gear change.
  const sameSnapshot =
    archived &&
    archived.url === live &&
    Date.parse(member.data.sourceModified ?? "") === archived.modified;
  const local = sameSnapshot
    ? assetUrl(
        "/guild/personajes/" +
          encodeURIComponent(member.id.slice("forever-eu-".length)) +
          ".webp",
      )
    : undefined;
  const [failed, setFailed] = useState<string[]>([]);
  const image = [local, live, member.data.avatar].find(
    (src) => src && !failed.includes(src),
  );
  const avatar = image && image === member.data.avatar;
  const frame = archived?.frame ?? { x: 50, top: 24, height: 57 };
  return (
    <span
      aria-hidden="true"
      className="banner-art"
      style={
        {
          "--model-x": -frame.x + "%",
          "--model-top": -frame.top + "%",
          "--model-height": 10000 / frame.height + "%",
        } as CSSProperties
      }
    >
      {image ? (
        <img
          key={image}
          src={image}
          loading="lazy"
          decoding="async"
          alt=""
          className={avatar ? "banner-avatar" : "banner-model"}
          onError={() => setFailed((previous) => [...previous, image])}
        />
      ) : (
        <span className="banner-initial">{member.name.slice(0, 1)}</span>
      )}
    </span>
  );
}
