import type { CSSProperties } from "react";
import {
  ArrowUpRight,
  BicepsFlexed,
  Brain,
  Feather,
  Flame,
  Heart,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { assetUrl } from "@/lib/public-settings";
import { ClassFrame } from "./class-frame";
import { CharacterArt } from "./character-art";
import { FittedName, fullName, memberHref } from "./member-portrait";
import { display, type Award } from "./analytics";
import { color, type Member } from "./types";

type Scene = "corona" | "ambar" | "bota" | "espadas";
const attributes: Record<string, LucideIcon> = {
  stamina: Heart,
  intellect: Brain,
  strength: BicepsFlexed,
  agility: Feather,
  spirit: Flame,
  armor: Shield,
};
const scenes: Record<string, Scene> = {
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
        <CharacterArt member={member} />
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
  icon?: LucideIcon;
};
export function HonorCard({
  title,
  scene,
  value,
  unit,
  note,
  winners,
  icon: Icon,
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
          {Icon ? (
            <Icon size={30} strokeWidth={1.5} aria-hidden="true" />
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
          <summary>Otros {winners.length - 4} ganadores del empate</summary>
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
  return (
    <HonorCard
      title={award.title}
      value={award.value}
      note={award.rule}
      winners={winners}
      scene={scenes[award.id] ?? "corona"}
      icon={attributes[award.id]}
    />
  );
}
