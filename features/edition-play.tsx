import { useEffect, useState } from "react";
import { GuildIcon } from "@/components/guild-icon";
import { Play as PlayIcon, RotateCcw } from "lucide-react";
import { duelPath } from "@/lib/guild-navigation";
import { siteHref } from "@/lib/public-settings";
import { useEntryState } from "@/hooks/use-entry-state";
import { editionPlay } from "./guild-stories";
import { fullName, MemberLink } from "./member-portrait";
import { CharacterArt } from "./character-art";
import type { CSSProperties } from "react";

export function EditionPlay({
  play,
}: {
  play: NonNullable<ReturnType<typeof editionPlay>>;
}) {
  const [opened, setOpened] = useEntryState<string>("editionReplay", "");
  const open = opened === play.key;
  const [after, setAfter] = useState(open);
  useEffect(() => {
    if (!open || after) return;
    const t = window.setTimeout(
      () => setAfter(true),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1300,
    );
    return () => window.clearTimeout(t);
  }, [open, after]);
  const lead = play.lead.member;
  const rows = [...play.rivals, play.lead];
  const order = [...rows].sort((a, b) => {
    if (after && (a === play.lead || b === play.lead))
      return a === play.lead ? -1 : 1;
    const difference =
      (b[after ? "after" : "before"] ?? 0) -
      (a[after ? "after" : "before"] ?? 0);
    if (difference) return difference;
    if (a === play.lead || b === play.lead) return a === play.lead ? 1 : -1;
    return fullName(a.member).localeCompare(fullName(b.member), "es");
  });
  return (
    <section className="edition-play" data-story={play.key}>
      <div className="play-bill">
        <div className="play-copy">
          <p className="eyebrow">La jugada del día</p>
          <h3>
            {fullName(lead)} adelanta a{" "}
            {play.rivals.length === 1
              ? "un compañero"
              : play.rivals.length + " compañeros"}
          </h3>
          <p>
            {play.lead.after !== undefined && <>Nivel {play.lead.after} · </>}{" "}
            {new Date(play.at).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "UTC",
            })}{" "}
            UTC
          </p>
          <button
            className="button bronze"
            type="button"
            aria-expanded={open}
            onClick={() => {
              if (open && !after) {
                setAfter(true);
                return;
              }
              setAfter(false);
              setOpened(play.key);
            }}
          >
            {open && after ? <RotateCcw /> : <PlayIcon />}
            {!open
              ? "Ver la remontada"
              : after
                ? "Volver a verla"
                : "Ver resultado"}
          </button>
        </div>
        <div className="play-portrait">
          <CharacterArt member={lead} />
        </div>
      </div>
      {open && (
        <div className="replay-content">
          <p className="replay-phase" aria-live="polite">
            {after
              ? "Después del adelantamiento"
              : "Antes · por delante o empatados"}
          </p>
          <ul
            className="replay-field"
            style={{ "--runners": rows.length } as CSSProperties}
          >
            {order.map((r) => (
              <li
                key={r.member.id}
                className={r === play.lead ? "replay-lead" : undefined}
                style={{ "--place": order.indexOf(r) } as CSSProperties}
              >
                <MemberLink member={r.member} />
                <span>
                  {r[after ? "after" : "before"] !== undefined
                    ? "Niv. " + r[after ? "after" : "before"]
                    : ""}
                </span>
                {after && r !== play.lead && (
                  <a
                    className="replay-duel"
                    href={siteHref(duelPath(lead.id, r.member.id))}
                    aria-label={"Cara a cara con " + fullName(r.member)}
                  >
                    <GuildIcon name="swords" size={18} />
                    <span>Cara a cara</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
