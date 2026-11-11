import type { CSSProperties } from "react";
import { assetUrl } from "@/lib/public-settings";
import type { Member } from "./types";

const frames: Record<number, [string, string, string]> = {
  1: ["guerrero", "Guerrero", "#a8a49b"],
  2: ["paladin", "Paladín", "#dbb464"],
  3: ["cazador", "Cazador", "#b6a372"],
  4: ["picaro", "Pícaro", "#baa473"],
  5: ["sacerdote", "Sacerdote", "#d2c8aa"],
  7: ["chaman", "Chamán", "#8fabad"],
  8: ["mago", "Mago", "#9bc9e0"],
  9: ["brujo", "Brujo", "#ad8bbb"],
  11: ["druida", "Druida", "#a0a768"],
};

function classArt(member: Member) {
  return (
    frames[member.data.classId ?? 0] ??
    Object.values(frames).find(([, name]) => name === member.data.className)
  );
}

export function ClassRoom({
  member,
  large = false,
}: {
  member: Member;
  large?: boolean;
}) {
  const art = classArt(member);
  if (!art) return null;
  const base = assetUrl("/guild/estancias/" + art[0]);
  return (
    <img
      className="class-room"
      src={base + (large ? ".webp" : "-tarjeta.webp")}
      srcSet={base + "-tarjeta.webp 560w, " + base + ".webp 1280w"}
      sizes={
        large
          ? "(max-width: 1280px) 95vw, 1200px"
          : "(max-width: 600px) 92vw, 420px"
      }
      aria-hidden="true"
      alt=""
      loading={large ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

export function ClassFrame({ member }: { member: Member }) {
  const frame = classArt(member);
  const corner = frame && assetUrl("/guild/marcos/" + frame[0] + ".webp");
  return (
    <span
      aria-hidden="true"
      className="class-frame"
      data-frame={frame?.[0] ?? "guild"}
      style={
        frame ? ({ "--frame-metal": frame[2] } as CSSProperties) : undefined
      }
    >
      {corner && (
        <>
          <img src={corner} alt="" width={58} height={58} loading="lazy" />
          <img src={corner} alt="" width={32} height={32} loading="lazy" />
        </>
      )}
    </span>
  );
}
