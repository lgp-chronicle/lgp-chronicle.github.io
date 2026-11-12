import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { GuildIcon, type GuildIconName } from "@/components/guild-icon";
import { assetUrl } from "@/lib/public-settings";
import { ClassFrame } from "./class-frame";
import { CharacterArt, hasEntrancePortrait } from "./character-art";
import { FittedName, fullName, memberHref } from "./member-portrait";
import { display, type Award } from "./analytics";
import { finishTitle } from "./race-course";
import { color, type Member } from "./types";
import { ninjaLoot } from "./ninja-loot";
import { wowheadUrl } from "./armory-data";

type Scene = "corona" | "ambar" | "bota" | "espadas";
const awardIcons: Record<string, GuildIconName> = {
  "ninja-loot": "coin",
  [finishTitle.id]: "tabard",
  stamina: "stamina",
  intellect: "intellect",
  strength: "strength",
  agility: "agility",
  spirit: "spirit",
  armor: "armor",
  goblin: "coin",
  craft: "engineering",
  repair: "blacksmithing",
  journey: "compass",
  profession: "leatherworking",
  dps: "attack",
  hps: "health",
  combat: "swords",
  epic: "spell-crit",
  legend: "trophy",
  "boss-destroyer": "helmet",
};
const scenes: Record<string, Scene> = {
  "ninja-loot": "ambar",
  stamina: "espadas",
  strength: "espadas",
  pvp: "espadas",
  pvpday: "espadas",
  pvpweek: "espadas",
  honor: "espadas",
  dps: "espadas",
  combat: "espadas",
  "boss-destroyer": "espadas",
  intellect: "ambar",
  armor: "ambar",
  gear: "ambar",
  goblin: "ambar",
  epic: "ambar",
  legend: "ambar",
  profession: "ambar",
  craft: "ambar",
  repair: "ambar",
  agility: "bota",
  spirit: "bota",
  speed: "bota",
  week: "bota",
  journey: "bota",
  hps: "bota",
};

function Winner({ member, shared }: { member: Member; shared: boolean }) {
  const name = fullName(member);
  return (
    <a
      className="laureate"
      href={memberHref(member)}
      title={name}
      aria-label={"Ver ficha de " + name}
      style={{ "--class-tint": color(member) } as CSSProperties}
    >
      <span className="laureate-figure">
        {hasEntrancePortrait(member) ? (
          <CharacterArt member={member} honor />
        ) : (
          <img className="honor-tabard" src={assetUrl("/guild/sello-la-ganga.png")} alt="" />
        )}
      </span>
      <span className="laureate-plaque">
        <span className="laureate-name">
          <FittedName name={name} given={member.name} />
        </span>
        {member.data.className && (
          <small className="laureate-class">{member.data.className}</small>
        )}
        <ArrowUpRight className="laureate-arrow" size={16} aria-hidden="true" />
      </span>
      {!shared && <ClassFrame member={member} />}
    </a>
  );
}

type HonorCardProps = {
  title: string;
  scene: Scene;
  value?: number;
  unit?: string;
  note?: string;
  winners: Member[];
  icon?: GuildIconName;
};
export function HonorCard({
  title,
  scene,
  value,
  unit,
  note,
  winners,
  icon,
}: HonorCardProps) {
  const shared = winners.length > 1;
  return (
    <article
      className="honor-card"
      data-scene={scene}
      data-shared={shared || undefined}
    >
      <div className="honor-painting" aria-hidden="true" />
      <header className="honor-inscription">
        <div className="honor-title">
          {icon ? (
            <GuildIcon name={icon} size={36} />
          ) : (
            <img
              src={assetUrl("/guild/" + scene + ".webp")}
              width={37}
              height={37}
              alt=""
            />
          )}
          <h3>{title}</h3>
        </div>
        {value !== undefined && (
          <p className="honor-score">
            <b>{display(value)}</b>
            {unit && <span>{unit}</span>}
          </p>
        )}
        {note && <p className="honor-note">{note}</p>}
      </header>
      {winners.length ? (
        <div
          className="honor-cast"
          style={{ "--seats": Math.min(4, winners.length) } as CSSProperties}
        >
          {winners.slice(0, 4).map((member) => (
            <Winner key={member.id} member={member} shared={shared} />
          ))}
        </div>
      ) : (
        <p className="honor-empty">Sin registros suficientes.</p>
      )}
      {winners.length > 4 && (
        <details className="honor-rest">
          <summary>Ver los demás personajes ({winners.length - 4})</summary>
          <div className="honor-extra">
            {winners.slice(4).map((member) => (
              <Winner key={member.id} member={member} shared />
            ))}
          </div>
        </details>
      )}
    </article>
  );
}

export function HallAward({
  award,
  members,
}: {
  award: Award;
  members: Member[];
}) {
  const winners = members.filter((member) =>
    award.memberIds.includes(member.id),
  );
  const card = (
    <HonorCard
      title={award.title}
      value={award.value}
      unit={
        award.id === finishTitle.id
          ? "nivel"
          : award.id === "ninja-loot"
            ? "puntos fuera de spec"
            : undefined
      }
      note={award.rule}
      winners={winners}
      scene={scenes[award.id] ?? "corona"}
      icon={awardIcons[award.id]}
    />
  );
  if (award.id !== "ninja-loot") return card;
  return (
    <div className="ninja-award">
      {card}
      <details className="ninja-evidence">
        <summary>Inspeccionar el botín</summary>
        {winners.map((m) => (
          <div key={m.id}>
            <strong style={{ color: color(m) }}>
              {fullName(m)} · {m.data.spec}
            </strong>
            <ul>
              {ninjaLoot(m)?.items.map(({ item, bonuses }, i) => (
                <li key={i}>
                  <a
                    href={wowheadUrl("item", item.id, item.name)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.name}
                  </a>{" "}
                  · {bonuses.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p>
          Un punto por cada +1 de un bonus fijo fuera de su rama. El aguante, la
          armadura y los efectos temporales quedan fuera del recuento.
        </p>
      </details>
    </div>
  );
}
