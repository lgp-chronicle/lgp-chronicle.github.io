import { useState, type CSSProperties } from "react";
import { assetUrl } from "@/lib/public-settings";
import { models } from "./portrait-availability";
import type { Member } from "./types";

export { hasEntrancePortrait } from "./portrait-availability";

export function useCharacterArt(
  member: Member,
  mode: "current" | "entrance" | "honor" = "current",
) {
  const archived = models[member.id];
  const live = member.data.characterRender || archived?.url;
  // Blizzard can update a character in place at the same URL after a gear change.
  const sameSnapshot =
    archived &&
    archived.url === live &&
    Date.parse(member.data.sourceModified ?? "") === archived.modified;
  const local =
    sameSnapshot || (mode === "honor" && archived && !archived.entranceIssue)
      ? assetUrl(
          "/guild/personajes/" +
            encodeURIComponent(member.id.slice("forever-eu-".length)) +
            ".webp",
        )
      : undefined;
  const cutout =
    mode === "entrance" && local
      ? local.replace("/personajes/", "/formacion/")
      : undefined;
  const [failed, setFailed] = useState<string[]>([]);
  const image = [cutout, local, live, member.data.avatar].find(
    (src) => src && !failed.includes(src),
  );
  const avatar = image && image === member.data.avatar;
  const frame = archived?.frame ?? { x: 50, top: 24, height: 57 };
  const style = {
    "--model-x": -frame.x + "%",
    "--model-top": -frame.top + "%",
    "--model-feet": -(frame.top + frame.height) + "%",
    "--model-height": 10000 / frame.height + "%",
  } as CSSProperties;
  const onError = () => {
    if (image) setFailed((previous) => [...previous, image]);
  };
  return {
    image,
    avatar,
    cutout: Boolean(cutout && image === cutout),
    style,
    onError,
  };
}

export function CharacterArt({
  member,
  honor = false,
}: {
  member: Member;
  honor?: boolean;
}) {
  const { image, avatar, style, onError } = useCharacterArt(
    member,
    honor ? "honor" : "current",
  );
  if (!image && honor)
    return (
      <img
        className="honor-tabard"
        src={assetUrl("/guild/sello-la-ganga.png")}
        alt=""
      />
    );
  return (
    <span aria-hidden="true" className="banner-art" style={style}>
      {image ? (
        <img
          key={image}
          src={image}
          loading="lazy"
          decoding="async"
          alt=""
          className={avatar ? "banner-avatar" : "banner-model"}
          onError={onError}
        />
      ) : (
        <span className="banner-initial">{member.name.slice(0, 1)}</span>
      )}
    </span>
  );
}
