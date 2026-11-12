import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { siteHref } from "@/lib/public-settings";
import { color, type Member } from "./types";
import { CharacterArt } from "./character-art";
import { ClassFrame, ClassRoom } from "./class-frame";

import { fullName } from "./member-name";
export { fullName } from "./member-name";

export const memberHref = (member: Member) =>
  siteHref("/character/" + encodeURIComponent(member.id));

export function FittedName({ name, given }: { name: string; given: string }) {
  const label = useRef<HTMLSpanElement>(null);
  const measure = useRef<HTMLSpanElement>(null);
  const [compact, setCompact] = useState(false);
  const surname = name.slice(given.length).trim();

  useLayoutEffect(() => {
    const box = label.current;
    const text = measure.current;
    if (!box || !text || !surname) return;
    const fit = () =>
      setCompact(
        text.getBoundingClientRect().width > box.getBoundingClientRect().width,
      );
    fit();
    // Either the available space or the glyph widths can change after the first paint.
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    observer.observe(text);
    return () => observer.disconnect();
  }, [name, surname]);

  return (
    <span className="fitted-name" ref={label} title={name}>
      {compact && surname ? given + " " + Array.from(surname)[0] + "." : name}
      {surname && (
        <span ref={measure} className="name-measure" aria-hidden="true">
          {name}
        </span>
      )}
    </span>
  );
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
      <span>{member.name.slice(0, 1)}</span>
      {src && src !== failed && (
        <img
          src={src}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          onError={() => setFailed(src)}
        />
      )}
    </span>
  );
}

export function MemberLink({
  member,
  banner = false,
  shared = false,
  subtitle,
  badge,
}: {
  member: Member;
  banner?: boolean;
  shared?: boolean;
  subtitle?: string;
  badge?: React.ReactNode;
}) {
  const label = fullName(member);
  return (
    <a
      className={banner ? "member-link member-banner" : "member-link"}
      href={memberHref(member)}
      title={label}
      aria-label={"Ver ficha de " + label}
      style={{ "--class-tint": color(member) } as CSSProperties}
    >
      {banner && !shared && <ClassRoom member={member} />}
      {banner ? (
        <CharacterArt key={member.id} member={member} />
      ) : (
        <Portrait member={member} />
      )}
      <span className="member-label">
        {shared ? <FittedName name={label} given={member.name} /> : label}
        {badge}
        {subtitle && <small className="banner-subtitle">{subtitle}</small>}
      </span>
      {banner && !shared && <ClassFrame member={member} />}
    </a>
  );
}
