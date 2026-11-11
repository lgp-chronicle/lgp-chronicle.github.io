import { useState } from "react";
import {
  Anvil,
  Axe,
  BicepsFlexed,
  BookOpen,
  Brain,
  Castle,
  ChevronDown,
  Compass,
  Crosshair,
  Crown,
  Flag,
  Footprints,
  Hammer,
  Heart,
  HeartPulse,
  Medal,
  ScrollText,
  Shield,
  ShieldCheck,
  ShieldHalf,
  Sparkles,
  Swords,
  WandSparkles,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { assetUrl } from "@/lib/public-settings";
import { ago, display } from "./analytics";
import { numeric, type Profile } from "./types";

const attributes: Record<string, [string, LucideIcon]> = {
  Salud: ["Características", HeartPulse],
  Fuerza: ["Características", BicepsFlexed],
  Agilidad: ["Características", Footprints],
  Intelecto: ["Características", Brain],
  Aguante: ["Características", Heart],
  Espíritu: ["Características", Wind],
  "Poder de ataque": ["Ataque", Axe],
  "Poder con hechizos": ["Ataque", WandSparkles],
  "Crítico cuerpo a cuerpo (%)": ["Ataque", Swords],
  "Crítico con hechizos (%)": ["Ataque", Sparkles],
  "Crítico a distancia (%)": ["Ataque", Crosshair],
  Armadura: ["Defensa", ShieldHalf],
  Defensa: ["Defensa", Castle],
  "Esquivar (%)": ["Defensa", Footprints],
  "Parar (%)": ["Defensa", Swords],
  "Bloquear (%)": ["Defensa", ShieldCheck],
};
const professions = [
  ["Mining", "Minería", 136248],
  ["Engineering", "Ingeniería", 136243],
  ["Cooking", "Cocina", 133971],
  ["Fishing", "Pesca", 136245],
  ["First Aid", "Primeros auxilios", 135966],
  ["Herbalism", "Herboristería", 136246],
  ["Leatherworking", "Peletería", 136247],
  ["Skinning", "Desuello", 134366],
  ["Alchemy", "Alquimia", 136240],
  ["Blacksmithing", "Herrería", 136241],
  ["Tailoring", "Sastrería", 136249],
  ["Enchanting", "Encantamiento", 136244],
] as const;

function ProfessionIcon({ id }: { id?: number }) {
  const [failed, setFailed] = useState(false);
  return id && !failed ? (
    <img
      width={40}
      height={40}
      loading="lazy"
      alt=""
      src={assetUrl("/guild/profesiones/" + id + ".jpg")}
      onError={() => setFailed(true)}
    />
  ) : (
    <Hammer size={24} aria-hidden="true" />
  );
}

function Attributes({ profile: p }: { profile: Profile }) {
  const stats = Object.entries(p.statistics ?? {});
  return (
    <section className="panel dossier-panel">
      <div className="dossier-heading">
        <h2>Atributos</h2>
        <p>{ago(p.resourceTimes?.statistics)}</p>
      </div>
      {stats.length ? (
        ["Características", "Ataque", "Defensa", "Otros atributos"].map(
          (group) => {
            const rows = stats.filter(
              ([name]) =>
                (attributes[name]?.[0] ?? "Otros atributos") === group,
            );
            return (
              rows.length > 0 && (
                <section
                  className="attribute-group"
                  key={group}
                  data-group={group}
                >
                  <h3>{group}</h3>
                  <dl>
                    {rows.map(([name, value]) => {
                      const Icon = attributes[name]?.[1] ?? Medal;
                      const percent = name.endsWith(" (%)");
                      return (
                        <div key={name}>
                          <dt>
                            <Icon size={19} aria-hidden="true" />
                            {percent ? name.slice(0, -4) : name}
                          </dt>
                          <dd>
                            {display(value)}
                            {percent && " %"}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </section>
              )
            );
          },
        )
      ) : (
        <p className="muted">Sin atributos registrados.</p>
      )}
    </section>
  );
}

function Professions({ profile: p }: { profile: Profile }) {
  return (
    <section className="panel dossier-panel">
      <div className="dossier-heading">
        <h2>Profesiones</h2>
        <p>{ago(p.resourceTimes?.professions)}</p>
      </div>
      {p.professions?.length ? (
        <ul className="trade-list">
          {p.professions.map((trade, i) => {
            const known = professions.find(
              ([en, es]) =>
                en.toLowerCase() === trade.name.toLowerCase() ||
                es.toLowerCase() === trade.name.toLowerCase(),
            );
            const name = known?.[1] ?? trade.name;
            return (
              <li key={trade.name + i}>
                <span className="trade-icon">
                  <ProfessionIcon id={known?.[2]} />
                </span>
                <div>
                  <div className="trade-label">
                    <strong>{name}</strong>
                    <span>
                      {display(trade.skill)} / {display(trade.max)}
                    </span>
                  </div>
                  {numeric(trade.skill) &&
                    numeric(trade.max) &&
                    trade.max > 0 && (
                      <progress
                        value={trade.skill}
                        max={trade.max}
                        aria-label={name}
                      />
                    )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">Sin profesiones registradas.</p>
      )}
    </section>
  );
}

function SectionBanner({
  title,
  scene,
  stamp,
}: {
  title: string;
  scene: "corona" | "espadas";
  stamp?: string;
}) {
  return (
    <header className="record-banner" data-scene={scene}>
      <span className="honor-painting" aria-hidden="true" />
      <img
        src={assetUrl("/guild/" + scene + ".webp")}
        width={47}
        height={47}
        alt=""
      />
      <div>
        <h2>{title}</h2>
        {stamp && <small>{ago(stamp)}</small>}
      </div>
    </header>
  );
}

function RecordMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: number;
  icon: LucideIcon;
}) {
  return (
    <div>
      <dt>
        <Icon size={16} aria-hidden="true" />
        {label}
      </dt>
      <dd>{display(value)}</dd>
    </div>
  );
}

const achievementGroups = [
  ["Exploración", Compass],
  ["Oficios", Anvil],
  ["Combate", Swords],
  ["Otros logros", ScrollText],
] as const;
function achievementGroup(name: string) {
  if (/^(explor|.*\bspelunker\b)/i.test(name)) return "Exploración";
  if (
    /alchem|blacksmith|enchant|engineer|leatherwork|tailor|herbal|miner|fishing|cooking|first aid|skinning|herrer|alquim|peleter|sastr|ingenier/i.test(
      name,
    )
  )
    return "Oficios";
  if (/arathi basin|warsong|arena|campo de batalla|pvp/i.test(name))
    return "Combate";
  return "Otros logros";
}

function ActivityRecords({ profile: p }: { profile: Profile }) {
  const achievements = p.achievements ?? [];
  return (
    <div className="record-spread">
      <section className="record-panel">
        <SectionBanner
          title="PvP y reputaciones"
          scene="espadas"
          stamp={p.resourceTimes?.pvp_summary}
        />
        <dl className="record-metrics">
          <RecordMetric
            label="Muertes honorables"
            value={p.honorableKills}
            icon={Swords}
          />
          <RecordMetric label="Honor" value={p.honor} icon={Medal} />
          <RecordMetric label="Rango PvP" value={p.pvpRank} icon={Flag} />
        </dl>
        <div className="record-body">
          <h3>
            <Flag size={18} aria-hidden="true" />
            Reputaciones
          </h3>
          {p.reputations?.length ? (
            <ul className="reputation-ledger">
              {p.reputations.map((r, i) => (
                <li key={r.name + i}>
                  <span>{r.name}</span>
                  <span
                    className="rep-standing"
                    data-standing={r.standing?.toLowerCase()}
                  >
                    {r.standing || "—"}
                  </span>
                  <b>{display(r.value)}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Sin reputaciones registradas.</p>
          )}
        </div>
      </section>
      <section className="record-panel">
        <SectionBanner
          title="PvE y logros"
          scene="corona"
          stamp={p.resourceTimes?.achievements}
        />
        <dl className="record-metrics">
          <RecordMetric
            label="Bandas completadas"
            value={p.raids?.length}
            icon={Castle}
          />
          <RecordMetric
            label="Jefes en armería"
            value={p.raidBosses}
            icon={Shield}
          />
          <RecordMetric
            label="Puntos de logro"
            value={p.achievementPoints}
            icon={Crown}
          />
        </dl>
        <div className="record-body">
          {!!p.raids?.length && (
            <>
              <h3>
                <Castle size={18} aria-hidden="true" />
                Bandas completadas
              </h3>
              <ul className="record-raids">
                {p.raids.map((name, i) => (
                  <li key={name + i}>{name}</li>
                ))}
              </ul>
            </>
          )}
          <h3>
            <BookOpen size={18} aria-hidden="true" />
            Logros registrados{" "}
            {p.achievements?.length ? (
              <small>{p.achievements.length}</small>
            ) : null}
          </h3>
          {achievements.length ? (
            achievementGroups.map(([group, Icon]) => {
              const entries = achievements.filter(
                (name) => achievementGroup(name) === group,
              );
              return (
                entries.length > 0 && (
                  <details
                    className="achievement-chapter"
                    key={group}
                    open={group === "Oficios" && entries.length <= 5}
                  >
                    <summary>
                      <Icon size={18} aria-hidden="true" />
                      <span>{group}</span>
                      <b>{entries.length}</b>
                      <ChevronDown size={15} aria-hidden="true" />
                    </summary>
                    <ul>
                      {entries.map((name, i) => (
                        <li key={name + i}>{name}</li>
                      ))}
                    </ul>
                  </details>
                )
              );
            })
          ) : (
            <p className="muted">Sin logros registrados.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export function CharacterRecords({ profile }: { profile: Profile }) {
  return (
    <>
      <div className="grid-two dossier-sections record-stats">
        <Attributes profile={profile} />
        <Professions profile={profile} />
      </div>
      <ActivityRecords profile={profile} />
    </>
  );
}
