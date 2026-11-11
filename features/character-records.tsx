import { ChevronDown } from "lucide-react";
import { GuildIcon, type GuildIconName } from "@/components/guild-icon";
import { assetUrl } from "@/lib/public-settings";
import { ago, display } from "./analytics";
import { numeric, type Profile } from "./types";
import { knownProfession } from "./professions";

const attributes: Record<string, [string, GuildIconName]> = {
  Salud: ["Características", "health"],
  Fuerza: ["Características", "strength"],
  Agilidad: ["Características", "agility"],
  Intelecto: ["Características", "intellect"],
  Aguante: ["Características", "stamina"],
  Espíritu: ["Características", "spirit"],
  "Poder de ataque": ["Ataque", "attack"],
  "Poder con hechizos": ["Ataque", "spellpower"],
  "Crítico cuerpo a cuerpo (%)": ["Ataque", "melee-crit"],
  "Crítico con hechizos (%)": ["Ataque", "spell-crit"],
  "Crítico a distancia (%)": ["Ataque", "ranged-crit"],
  Armadura: ["Defensa", "armor"],
  Defensa: ["Defensa", "defense"],
  "Esquivar (%)": ["Defensa", "dodge"],
  "Parar (%)": ["Defensa", "parry"],
  "Bloquear (%)": ["Defensa", "block"],
};

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
                      const icon = attributes[name]?.[1] ?? "medal";
                      const percent = name.endsWith(" (%)");
                      return (
                        <div key={name}>
                          <dt>
                            <GuildIcon name={icon} size={23} />
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
            const known = knownProfession(trade.name);
            const name = known?.[1] ?? trade.name;
            return (
              <li key={trade.name + i}>
                <span className="trade-icon">
                  <GuildIcon name={known?.[2] ?? "blacksmithing"} size={34} />
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
  icon,
}: {
  label: string;
  value?: number;
  icon: GuildIconName;
}) {
  return (
    <div>
      <dt>
        <GuildIcon name={icon} size={18} />
        {label}
      </dt>
      <dd>{display(value)}</dd>
    </div>
  );
}

const achievementGroups = [
  ["Exploración", "spyglass"],
  ["Oficios", "blacksmithing"],
  ["Combate", "swords"],
  ["Otros logros", "dispatch"],
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
            icon="swords"
          />
          <RecordMetric label="Honor" value={p.honor} icon="medal" />
          <RecordMetric label="Rango PvP" value={p.pvpRank} icon="finish" />
        </dl>
        <div className="record-body">
          <h3>
            <GuildIcon name="finish" size={20} />
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
            icon="keep"
          />
          <RecordMetric
            label="Jefes en armería"
            value={p.raidBosses}
            icon="helmet"
          />
          <RecordMetric
            label="Puntos de logro"
            value={p.achievementPoints}
            icon="trophy"
          />
        </dl>
        <div className="record-body">
          {!!p.raids?.length && (
            <>
              <h3>
                <GuildIcon name="keep" size={20} />
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
            <GuildIcon name="journal" size={20} />
            Logros registrados{" "}
            {p.achievements?.length ? (
              <small>{p.achievements.length}</small>
            ) : null}
          </h3>
          {achievements.length ? (
            achievementGroups.map(([group, icon]) => {
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
                      <GuildIcon name={icon} size={20} />
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
