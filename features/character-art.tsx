import { useState, type CSSProperties } from "react";
import { assetUrl } from "@/lib/public-settings";
import { models } from "./portrait-availability";
import type { Member } from "./types";
import { isCurrentMember } from "./membership";
import { characterArtSources, type CharacterArtMode } from "./character-art-sources";

export { hasEntrancePortrait } from "./portrait-availability";

export function useCharacterArt(
  member: Member,
  mode: CharacterArtMode = "current",
) {
  const archived = models[member.id];
  const { sources, avatar: avatarSource, cutout } = characterArtSources(member, mode);
  const [failed, setFailed] = useState<string[]>([]);
  const image = sources.find(src => !failed.includes(src));
  const avatar = image && image === avatarSource;
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
  loading = "lazy",
}: {
  member: Member;
  honor?: boolean;
  loading?: "eager" | "lazy";
}) {
  const { image, avatar, style, onError } = useCharacterArt(
    member,
    honor ? "honor" : "current",
  );
  if (!isCurrentMember(member)) return null;
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
          loading={loading}
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
