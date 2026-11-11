import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GuildIcon } from "@/components/guild-icon";
import { useEntryState } from "@/hooks/use-entry-state";
import { armoryStories } from "./guild-stories";
import { itemDisplay } from "./armory-data";
import { EquipmentTooltip, itemQuality } from "./equipment-tooltip";
import { MemberLink, fullName } from "./member-portrait";
import type { Member } from "./types";

export function ArmoryRumors({ members }: { members: Member[] }) {
  const day = Math.floor(Date.now() / 86400000);
  const data = useMemo(() => armoryStories(members, day), [members, day]);
  const [offset, setOffset] = useEntryState<number>("rumorOffset", 0);
  const [revealed, setRevealed] = useEntryState<string>("rumorReveal", "");
  const [answer, setAnswer] = useEntryState<string>("armoryAnswer", "");
  const [pinned, setPinned] = useState("");
  const cards = [
    ...(data.pole
      ? [
          {
            kind: "fish",
            title: "¿Quién se ha dejado la caña puesta?",
            item: data.pole,
            owners: data.anglers,
            mark: "fish" as const,
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
            mark: "amber" as const,
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
            mark: "clue" as const,
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
  const picture = (
    <>
      <GuildIcon name={card.mark} size={30} />
      {icon && (
        <img
          className="rumor-item-art"
          key={icon}
          src={icon}
          alt=""
          onError={(e) => {
            e.currentTarget.hidden = true;
          }}
        />
      )}
    </>
  );
  function advance(step: number) {
    setPinned("");
    setOffset((offset + step + cards.length) % cards.length);
  }
  function itemHint(trigger: string) {
    return {
      item: card.item,
      side: "top" as const,
      pinned: pinned === trigger,
      hasPinnedItem: !!pinned,
      onPinChange: (open: boolean) => setPinned(open ? trigger : ""),
    };
  }
  return (
    <section className="rumor-panel" data-story="armory-rumors">
      <header>
        <h2>Cotilleos de la armería</h2>
        {cards.length > 1 && (
          <div className="rumor-controls">
            <button aria-label="Cotilleo anterior" onClick={() => advance(-1)}>
              <ChevronLeft />
            </button>
            <span>
              {index + 1} / {cards.length}
            </span>
            <button aria-label="Siguiente cotilleo" onClick={() => advance(1)}>
              <ChevronRight />
            </button>
          </div>
        )}
      </header>
      <div className="rumor-body" key={key}>
        {quiz ? (
          <EquipmentTooltip {...itemHint("icon")}>
            <button
              type="button"
              className="rumor-icon"
              tabIndex={-1}
              aria-label={"Detalles de " + card.item.name}
            >
              {picture}
            </button>
          </EquipmentTooltip>
        ) : (
          <button
            type="button"
            className="rumor-icon"
            aria-label="Ver quién lo lleva"
            onClick={() => setRevealed(key)}
          >
            {picture}
          </button>
        )}
        <div>
          <h3>{card.title}</h3>
          <p>
            <EquipmentTooltip {...itemHint("name")}>
              <button
                type="button"
                className="rumor-item-name"
                style={{ color: itemQuality(card.item)[1] }}
              >
                {card.item.name}
              </button>
            </EquipmentTooltip>
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
