import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import { ArrowRight } from "lucide-react";
import { assetUrl } from "@/lib/public-settings";
import { hasEntrancePortrait, useCharacterArt } from "./character-art";
import { measureEntranceFrame } from "./entrance-frame";
import { positions, raceStature } from "./entrance-formation";
import { fullName } from "./member-portrait";
import type { Member } from "./types";

const seenKey = "la-ganga:entrada";
const motionQuery = "(prefers-reduced-motion: reduce)";
export type EntranceMode = "auto" | "replay";

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
    "entrance",
  );
  const name = fullName(member);
  const [unreadable, setUnreadable] = useState<string>();
  const measure = Boolean(image && !cutout && !avatar && unreadable !== image);
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
        key={measure ? "measure:" + image : image}
        crossOrigin={measure ? "anonymous" : undefined}
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
          if (measure) {
            const frame = measureEntranceFrame(img);
            if (frame) {
              img.style.setProperty("--model-x", -frame.center + "%");
              img.style.setProperty("--model-feet", -frame.feet + "%");
              img.style.setProperty(
                "--model-height",
                10000 / frame.height + "%",
              );
            }
          }
        }}
        onError={() => {
          if (measure && image) setUnreadable(image);
          else onError();
        }}
        decoding="async"
        draggable={false}
      />
    </div>
  );
}

function Formation({
  members,
  onMissing,
}: {
  members: Member[];
  onMissing: MissingPortrait;
}) {
  const wide = positions(members, false);
  const narrow = positions(members, true);
  const wings: ReactElement[][] = [[], []];
  members.forEach((member, i) => {
    const right = i % 2 === 1;
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
    wings[i % 2].push(
      <li key={member.id} style={vars}>
        <Guest member={member} onMissing={onMissing} />
      </li>,
    );
  });
  return (
    <>
      {wings.map((seats, i) => (
        <ul key={i} className="arrival-wing" data-side={i ? "right" : "left"}>
          {seats}
        </ul>
      ))}
    </>
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
    .filter((m) => hasEntrancePortrait(m) && !missing.has(m.id))
    .sort(
      (a, b) =>
        raceStature(b) - raceStature(a) ||
        fullName(a).localeCompare(fullName(b), "es"),
    );
  const crest = assetUrl("/guild/escudo-la-ganga.webp?v=estandarte");

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
        <Formation members={ordered} onMissing={onMissing} />
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
