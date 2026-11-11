import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ArrowRight } from "lucide-react";
import { assetUrl } from "@/lib/public-settings";
import { hasCharacterArt, useCharacterArt } from "./character-art";
import { fullName } from "./member-portrait";
import type { Member } from "./types";

const seenKey = "la-ganga:entrada";
const motionQuery = "(prefers-reduced-motion: reduce)";
export type EntranceMode = "auto" | "replay";

// Grounded heights relative to a human at the same distance from the camera.
const stature: Record<string, number> = {
  gnomo: 0.6,
  gnome: 0.6,
  enano: 0.78,
  dwarf: 0.78,
  "elfo de la noche": 1.1,
  "night elf": 1.1,
  tauren: 1.22,
  trol: 1.12,
  troll: 1.12,
  draenei: 1.12,
};

export function initialEntrance(): EntranceMode | null {
  if (new URLSearchParams(window.location.search).get("presentacion") === "1")
    return "replay";
  if (window.matchMedia(motionQuery).matches) return null;
  try {
    return sessionStorage.getItem(seenKey) ? null : "auto";
  } catch {
    return "auto";
  }
}

function raceStature(member: Member) {
  return stature[member.data.race?.toLowerCase() ?? ""] ?? 1;
}

// Reserve the front ranks for shorter races even when a back rank has room.
function positions(members: Member[], compact: boolean) {
  const total = members.length;
  const columns = Math.max(
    1,
    Math.ceil(Math.sqrt(total * (compact ? 0.52 : 2))),
  );
  const short = members.filter((member) => raceStature(member) < 1).length;
  const ranks = [total - short, short].flatMap((size) => {
    const rows = Math.ceil(size / columns);
    return Array.from(
      { length: rows },
      (_, i) => Math.floor(size / rows) + Number(i < size % rows),
    );
  });
  const slots = [];
  for (const [row, count] of ranks.entries()) {
    const depth = ranks.length > 1 ? row / (ranks.length - 1) : 0.7;
    for (let col = 0; col < count; col++) {
      const stagger = count > 2 ? (row % 2 ? 0.22 : -0.15) : 0;
      const x = 5 + ((col + 0.5 + stagger) * 90) / count;
      slots.push({
        x: Math.min(94, x),
        feet: (compact ? 40 : 64) + depth * (compact ? 46 : 24),
        height: (compact ? 13 : 18) + depth * (compact ? 9 : 10),
        maxHeight: Math.min(
          compact ? 36 : 23,
          ((compact ? 46 : 41) / count) * (1.63 + depth * 0.38),
        ),
        width: Math.min(95, 98 / count),
        depth,
        row,
      });
    }
  }
  return slots;
}

type MissingPortrait = (id: string) => void;

function Guest({
  member,
  onMissing,
}: {
  member: Member;
  onMissing: MissingPortrait;
}) {
  const { image, cutout, avatar, onError, style } = useCharacterArt(
    member,
    true,
  );
  const name = fullName(member);
  useEffect(() => {
    if (!image) onMissing(member.id);
  }, [image, member.id, onMissing]);
  if (!image) return null;
  return (
    <div
      className="arrival-guest"
      style={style}
      title={name}
      role="img"
      aria-label={name}
    >
      <img
        className={
          avatar
            ? "arrival-avatar"
            : cutout
              ? "arrival-cutout"
              : "arrival-render"
        }
        alt=""
        src={image}
        onLoad={(event) => {
          const img = event.currentTarget;
          img.style.setProperty("--native-height", img.naturalHeight + "px");
        }}
        onError={onError}
        decoding="async"
        draggable={false}
      />
    </div>
  );
}

function Wing({
  members,
  right,
  onMissing,
}: {
  members: Member[];
  right: boolean;
  onMissing: MissingPortrait;
}) {
  const wide = positions(members, false);
  const narrow = positions(members, true);
  return (
    <ul className="arrival-wing" data-side={right ? "right" : "left"}>
      {members.map((member, i) => {
        const d = wide[i],
          m = narrow[i];
        const vars = {
          "--x": (right ? 100 - d.x : d.x) + "%",
          "--mx": (right ? 100 - m.x : m.x) + "%",
          "--feet": d.feet + "%",
          "--mfeet": m.feet + "%",
          "--height": d.height + "dvh",
          "--mheight": m.height + "dvh",
          "--cap": d.maxHeight + "vw",
          "--mcap": m.maxHeight + "vw",
          "--width": d.width + "%",
          "--mwidth": m.width + "%",
          "--rank": d.row + 1,
          "--mrank": m.row + 1,
          "--stature": raceStature(member),
          "--delay": 0.16 + d.depth * 0.65 + "s",
        } as CSSProperties;
        return (
          <li key={member.id} style={vars}>
            <Guest member={member} onMissing={onMissing} />
          </li>
        );
      })}
    </ul>
  );
}

export function GuildEntrance({
  members,
  mode,
  onDone,
}: {
  members: Member[];
  mode: EntranceMode;
  onDone: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [missing, setMissing] = useState<Set<string>>(() => new Set());
  const onMissing = useCallback((id: string) => {
    setMissing((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);
  const ordered = members
    .filter((m) => hasCharacterArt(m) && !missing.has(m.id))
    .sort(
      (a, b) =>
        raceStature(b) - raceStature(a) ||
        fullName(a).localeCompare(fullName(b), "es"),
    );
  const crest = assetUrl("/guild/escudo-la-ganga.webp");

  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node) return;
    node.showModal();
    const url = new URL(window.location.href);
    if (url.searchParams.get("presentacion") === "1") {
      url.searchParams.delete("presentacion");
      window.history.replaceState(window.history.state, "", url);
    }
    const updateResolution = () =>
      node.style.setProperty("--dpr", String(window.devicePixelRatio || 1));
    updateResolution();
    window.addEventListener("resize", updateResolution);
    try {
      sessionStorage.setItem(seenKey, "1");
    } catch {
      /* Storage can be unavailable. */
    }
    return () => {
      window.removeEventListener("resize", updateResolution);
      node.close();
    };
  }, []);

  useEffect(() => {
    const pictures = Array.from(dialog.current?.querySelectorAll("img") ?? []);
    let active = true;
    const start = () => {
      if (active) setReady(true);
    };
    const limit = window.setTimeout(start, 1100);
    Promise.allSettled(pictures.map((img) => img.decode())).then(start);
    return () => {
      active = false;
      window.clearTimeout(limit);
    };
  }, []);

  useEffect(() => {
    if (!ready || mode !== "auto") return;
    const timer = window.setTimeout(() => setLeaving(true), 6100);
    return () => window.clearTimeout(timer);
  }, [ready, mode]);
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(onDone, 440);
    return () => window.clearTimeout(timer);
  }, [leaving, onDone]);
  useEffect(() => {
    if (mode !== "auto") return;
    const media = window.matchMedia(motionQuery);
    const change = () => {
      if (media.matches) onDone();
    };
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, [mode, onDone]);

  return (
    <dialog
      ref={dialog}
      className="guild-entrance"
      aria-label="La Ganga reunida en el patio de la hermandad"
      data-ready={ready}
      data-leaving={leaving}
      data-auto={mode === "auto"}
      onCancel={(e) => {
        e.preventDefault();
        onDone();
      }}
    >
      <div className="arrival-scene">
        <picture>
          <source
            media="(max-aspect-ratio: 1/1)"
            srcSet={assetUrl("/guild/patio-gradas.webp")}
          />
          <img
            className="arrival-courtyard"
            src={assetUrl("/guild/patio.webp")}
            srcSet={
              assetUrl("/guild/patio-800.webp") +
              " 800w, " +
              assetUrl("/guild/patio.webp") +
              " 1664w"
            }
            sizes="100vw"
            fetchPriority="high"
            alt=""
          />
        </picture>
        <div className="arrival-air" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <i
              key={i}
              style={
                {
                  left: 4 + ((i * 37) % 92) + "%",
                  top: 44 + ((i * 13) % 47) + "%",
                  "--delay": -i * 0.43 + "s",
                  "--drift": (i % 2 ? 18 : -20) + "px",
                } as CSSProperties
              }
            />
          ))}
        </div>
        <Wing
          members={ordered.filter((_, i) => i % 2 === 0)}
          right={false}
          onMissing={onMissing}
        />
        <Wing
          members={ordered.filter((_, i) => i % 2 === 1)}
          right
          onMissing={onMissing}
        />
        <div className="arrival-sigil">
          <div className="arrival-shield">
            <img
              src={crest}
              alt="La Ganga"
              width={800}
              height={797}
              fetchPriority="high"
            />
            <span
              aria-hidden="true"
              style={{ maskImage: "url(" + crest + ")" }}
            />
          </div>
          <p>
            {ordered.length > 0 && (
              <>
                {ordered.length}{" "}
                {ordered.length === 1 ? "personaje" : "personajes"}{" "}
                <span aria-hidden="true">◆</span>{" "}
              </>
            )}
            WoW Forever
          </p>
        </div>
      </div>
      <button
        type="button"
        className="arrival-enter"
        autoFocus
        onClick={onDone}
      >
        Entrar en la web <ArrowRight size={17} aria-hidden="true" />
      </button>
    </dialog>
  );
}
