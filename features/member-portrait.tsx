import { useState, type CSSProperties } from "react";
import { siteHref } from "@/lib/public-settings";
import { color, type Member } from "./types";
import { CharacterArt } from "./character-art";

import surnames from "../config/character-surnames.json";

export function fullName(m: Member) {
  const official = m.data.surname ?? (surnames as Record<string, string>)[m.id];
  if (official) return m.name + " " + official;
  const prefix = "forever-" + m.region + "-" + m.name.toLowerCase() + "-";
  if (!m.id.startsWith(prefix)) return m.name;
  const surname = m.id
    .slice(prefix.length)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return m.name + " " + surname;
}

export function Portrait({ member }: { member: Member }) {
  const [failed, setFailed] = useState<string>();
  const src = member.data.avatar;
  return (
    <span
      className="portrait"
      aria-hidden="true"
      style={{ "--class-tint": color(member) } as CSSProperties}
    >
      {src && src !== failed ? (
        <img
          src={src}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          onError={() => setFailed(src)}
        />
      ) : (
        <span>{member.name.slice(0, 1)}</span>
      )}
    </span>
  );
}

export function MemberLink({
  member,
  banner = false,
  subtitle,
}: {
  member: Member;
  banner?: boolean;
  subtitle?: string;
}) {
  const label = fullName(member);
  return (
    <a
      className={banner ? "member-link member-banner" : "member-link"}
      href={siteHref("/character/" + encodeURIComponent(member.id))}
      title={label}
      aria-label={"Ver ficha de " + label}
      style={{ "--class-tint": color(member) } as CSSProperties}
    >
      {banner ? (
        <CharacterArt key={member.id} member={member} />
      ) : (
        <Portrait member={member} />
      )}
      <span className="member-label">
        {label}
        {subtitle && <small className="banner-subtitle">{subtitle}</small>}
      </span>
    </a>
  );
}
