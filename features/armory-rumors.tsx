import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GuildIcon } from "@/components/guild-icon";
import { useEntryState } from "@/hooks/use-entry-state";
import { armoryStories, type ArmoryStory } from "./guild-stories";
import { itemDisplay } from "./armory-data";
import { EquipmentTooltip, itemQuality } from "./equipment-tooltip";
import { MemberLink, fullName } from "./member-portrait";
import type { Member } from "./types";

const dayMs = 86400000;
const editionLabel = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const today = () => Math.floor(Date.now() / dayMs);

export function ArmoryRumors({ members }: { members: Member[] }) {
  const [day, setDay] = useState(today);
  useEffect(() => {
    let timer: number;
    function syncDay() {
      window.clearTimeout(timer);
      const now = Date.now(),
        current = Math.floor(now / dayMs);
      setDay(current);
      timer = window.setTimeout(syncDay, (current + 1) * dayMs - now);
    }
    syncDay();
    document.addEventListener("visibilitychange", syncDay);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", syncDay);
    };
  }, []);
  return <RumorEdition key={day} members={members} day={day} />;
}
function RumorEdition({ members, day }: { members: Member[]; day: number }) {
  const { cards, coverage } = useMemo(
    () => armoryStories(members, day),
    [members, day],
  );
  const [offset, setOffset] = useEntryState<number>("rumorOffset/" + day, 0);
  if (!cards.length) return null;
  const index = (day + offset) % cards.length,
    card = cards[index];
  const storyKey = [
    day,
    card.kind,
    card.item.id,
    card.item.name,
    ...card.owners.map((m) => m.id),
  ].join("/");
  const date = new Date(day * dayMs);
  function advance(step: number) {
    setOffset((offset + step + cards.length) % cards.length);
  }
  return (
    <section className="rumor-panel" data-story="armory-rumors">
      <header>
        <div>
          <h2>Cotilleos de la armería</h2>
          <p className="rumor-edition">
            <time dateTime={date.toISOString().slice(0, 10)}>
              {editionLabel.format(date)}
            </time>{" "}
            · Nueva edición a las 00:00 UTC
          </p>
        </div>
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
      <RumorDetails
        key={storyKey}
        storyKey={storyKey}
        card={card}
        coverage={coverage}
      />
    </section>
  );
}
function RumorDetails({
  storyKey,
  card,
  coverage,
}: {
  storyKey: string;
  card: ArmoryStory;
  coverage: number;
}) {
  const [pinned, setPinned] = useState("");
  const [revealed, setRevealed] = useEntryState<boolean>(
    "rumorReveal/" + storyKey,
    false,
  );
  const [answer, setAnswer] = useEntryState<string>(
    "armoryAnswer/" + storyKey,
    "",
  );
  const owner = card.owners[0],
    quiz = card.choices.length > 0;
  const chosen = card.choices.find((m) => m.id === answer);
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
    <>
      <div className="rumor-body">
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
            onClick={() => setRevealed(true)}
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
                · {card.owners.length} de {coverage} con equipo registrado
              </>
            )}
          </p>
          {quiz ? (
            <div className="rumor-answers">
              {card.choices.map((m) => (
                <button
                  className="button outline"
                  key={m.id}
                  disabled={!!chosen}
                  onClick={() => setAnswer(m.id)}
                >
                  {fullName(m)}
                </button>
              ))}
            </div>
          ) : (
            <button
              className="rumor-reveal"
              aria-expanded={revealed}
              onClick={() => setRevealed(!revealed)}
            >
              {revealed ? "Ocultar nombres" : "Descubrir quién lo lleva"}
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
      {!quiz && revealed && (
        <div className="rumor-owners">
          {card.owners.map((m) => (
            <MemberLink key={m.id} member={m} />
          ))}
        </div>
      )}
    </>
  );
}
