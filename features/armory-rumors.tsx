import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Fish, Gem, HelpCircle } from "lucide-react";
import { useEntryState } from "@/hooks/use-entry-state";
import { armoryStories } from "./guild-stories";
import { itemDisplay, wowheadUrl } from "./armory-data";
import { MemberLink, fullName } from "./member-portrait";
import type { Member } from "./types";

export function ArmoryRumors({ members }: { members: Member[] }) {
  const day = Math.floor(Date.now() / 86400000);
  const data = useMemo(() => armoryStories(members, day), [members, day]);
  const [offset, setOffset] = useEntryState<number>("rumorOffset", 0);
  const [revealed, setRevealed] = useEntryState<string>("rumorReveal", "");
  const [answer, setAnswer] = useEntryState<string>("armoryAnswer", "");
  const cards = [
    ...(data.pole
      ? [
          {
            kind: "fish",
            title: "¿Quién se ha dejado la caña puesta?",
            item: data.pole,
            owners: data.anglers,
            Mark: Fish,
          },
        ]
      : []),
    ...(data.shared
      ? [
          {
            kind: "shared",
            title: "El uniforme extraoficial",
            item: data.shared.item,
            owners: data.shared.owners,
            Mark: Gem,
          },
        ]
      : []),
    ...(data.clue && data.choices.length
      ? [
          {
            kind: "quiz",
            title: "¿De quién es esta pieza?",
            item: data.clue.item,
            owners: data.clue.owners,
            Mark: HelpCircle,
          },
        ]
      : []),
  ];
  if (!cards.length) return null;
  const index = (day + offset) % cards.length,
    card = cards[index],
    quiz = card.kind === "quiz";
  const key = card.kind + "/" + card.item.id,
    owner = card.owners[0];
  const chosen = data.choices.find((m) => key + "/" + m.id === answer);
  const icon = itemDisplay(card.item).icon;
  return (
    <section className="rumor-panel" data-story="armory-rumors">
      <header>
        <h2>Cotilleos de la armería</h2>
        {cards.length > 1 && (
          <div className="rumor-controls">
            <button
              aria-label="Cotilleo anterior"
              onClick={() =>
                setOffset((offset + cards.length - 1) % cards.length)
              }
            >
              <ChevronLeft />
            </button>
            <span>
              {index + 1} / {cards.length}
            </span>
            <button
              aria-label="Siguiente cotilleo"
              onClick={() => setOffset((offset + 1) % cards.length)}
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </header>
      <div className="rumor-body">
        <button
          className="rumor-icon"
          aria-label={quiz ? "Ver objeto en Wowhead" : "Ver quién lo lleva"}
          onClick={() => {
            if (!quiz) setRevealed(key);
            else
              window.open(
                wowheadUrl("item", card.item.id, card.item.name!),
                "_blank",
                "noopener,noreferrer",
              );
          }}
        >
          <card.Mark aria-hidden="true" />
          {icon && (
            <img
              key={icon}
              src={icon}
              alt=""
              onError={(e) => {
                e.currentTarget.hidden = true;
              }}
            />
          )}
        </button>
        <div>
          <h3>{card.title}</h3>
          <p>
            <a
              href={wowheadUrl("item", card.item.id, card.item.name!)}
              target="_blank"
              rel="noreferrer"
            >
              {card.item.name} ↗
            </a>
            {!quiz && (
              <>
                {" "}
                · {card.owners.length} de {data.coverage} con equipo registrado
              </>
            )}
          </p>
          {quiz ? (
            <div className="rumor-answers">
              {data.choices.map((m) => (
                <button
                  className="button outline"
                  key={m.id}
                  disabled={!!chosen}
                  onClick={() => setAnswer(key + "/" + m.id)}
                >
                  {fullName(m)}
                </button>
              ))}
            </div>
          ) : (
            <button
              className="rumor-reveal"
              aria-expanded={revealed === key}
              onClick={() => setRevealed(revealed === key ? "" : key)}
            >
              {revealed === key
                ? "Ocultar nombres"
                : "Descubrir quién lo lleva"}
            </button>
          )}
          {quiz && chosen && (
            <p role="status">
              {chosen.id === owner.id ? "¡Lo has clavado!" : "La lleva"}{" "}
              <MemberLink member={owner} />
            </p>
          )}
        </div>
      </div>
      {!quiz && revealed === key && (
        <div className="rumor-owners">
          {card.owners.map((m) => (
            <MemberLink key={m.id} member={m} />
          ))}
        </div>
      )}
    </section>
  );
}
