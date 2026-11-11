import { GuildIcon } from "@/components/guild-icon";
import { Search } from "lucide-react";
import { useEntryState } from "@/hooks/use-entry-state";
import { searchable } from "@/lib/guild-navigation";
import { Empty } from "@/components/guild-ui";
import { ago, display, leveling } from "./analytics";
import { rankChanges } from "./observations";
import { MemberLink, fullName, memberHref } from "./member-portrait";
import { numeric, type Member } from "./types";
import { RaceTrack } from "./race-track";
import { finishLevel } from "./race-course";

const hasRaceLevel = (m: Member) =>
  numeric(m.data.level) && Number.isInteger(m.data.level) && m.data.level >= 1;

export function LevelingRace({ members }: { members: Member[] }) {
  const [search, setSearch] = useEntryState<string>("raceSearch", "");
  const changes = rankChanges(members);
  const sorted = members
    .filter(hasRaceLevel)
    .map((member) => ({
      member,
      level: member.data.level!,
      pace: leveling(member),
    }))
    .sort(
      (a, b) =>
        b.level - a.level ||
        (b.pace.day ?? -1) - (a.pace.day ?? -1) ||
        fullName(a.member).localeCompare(fullName(b.member), "es"),
    );
  let currentRank = 0;
  const entries = sorted.map((row, i) => {
    const prev = sorted[i - 1];
    if (
      !prev ||
      Math.min(prev.level, finishLevel) !== Math.min(row.level, finishLevel)
    )
      currentRank = i + 1;
    return { ...row, rank: currentRank };
  });
  const podium = [
    ...new Set(entries.filter((x) => x.rank <= 3).map((x) => x.rank)),
  ];
  const matches = (m: Member) =>
    searchable(fullName(m)).includes(searchable(search));
  const filtered = entries.filter(({ member }) => matches(member));
  const pending = members.filter((m) => !hasRaceLevel(m) && matches(m));
  return (
    <section className="panel race-panel">
      <div className="dossier-heading">
        <h2>Leveling Race</h2>
        <p>{entries.length} participantes</p>
      </div>
      {pending.length > 0 && (
        <p className="race-pending">
          Nivel pendiente ·{" "}
          {pending.map((m) => (
            <a key={m.id} href={memberHref(m)}>
              {fullName(m)}
            </a>
          ))}
        </p>
      )}
      {!entries.length ? (
        <Empty
          title="La parrilla está preparada"
          text="La carrera empieza cuando se registra el primer nivel."
        />
      ) : (
        <>
          <div className="toolbar race-searchbar">
            <label className="roster-search">
              <Search size={16} aria-hidden="true" />
              <input
                aria-label="Buscar en la carrera"
                placeholder="Buscar personaje…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <RaceTrack runners={filtered} />
          <div className="race-podium" aria-label="Podio de la carrera">
            {podium.map((rank) => {
              const group = entries.filter((x) => x.rank === rank);
              return (
                <section key={rank} className="podium-place" data-rank={rank}>
                  <h3>
                    <GuildIcon
                      name={rank === 1 ? "crown" : "medal"}
                      size={25}
                    />
                    {rank === 1 ? "En cabeza" : rank + ".º puesto"}
                  </h3>
                  <div className="banner-lineup podium-winners">
                    {group.map(({ member }) => (
                      <MemberLink
                        key={member.id}
                        member={member}
                        banner
                        shared={group.length > 1}
                      />
                    ))}
                  </div>
                  <p>
                    Nivel <b>{group[0].level}</b>
                    {group.length > 1 && " · Puesto compartido"}
                  </p>
                </section>
              );
            })}
          </div>
          <div className="toolbar">
            <div>
              <h3>Clasificación</h3>
              <p className="subheading">
                Quienes alcanzan el mismo nivel comparten puesto.
              </p>
            </div>
          </div>
          <div className="member-grid race-grid">
            {filtered.map(({ member, rank, pace, level }) => {
              const delta = changes.get(member.id);
              const age = Date.now() - Date.parse(member.addedAt ?? "");
              return (
                <article className="race-entry" key={member.id}>
                  <div className="race-identity">
                    <span
                      className="race-position"
                      aria-label={"Puesto " + rank}
                    >
                      {rank}.º
                    </span>
                    <MemberLink member={member} />
                    <span className="race-level">Niv. {level}</span>
                  </div>
                  <dl className="race-metrics">
                    {[
                      ["24 h", pace.day],
                      ["7 días", pace.week],
                      ["Media / día", pace.average],
                    ].map(([k, v]) => (
                      <div key={String(k)}>
                        <dt>{k}</dt>
                        <dd>{display(v)}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="race-last">
                    {delta === undefined &&
                      (age >= 0 && age < 86400000 ? (
                        <b>Nuevo · </b>
                      ) : (
                        <span>Sin referencia de ayer · </span>
                      ))}
                    {delta !== undefined && delta !== 0 && (
                      <b
                        className={delta > 0 ? "rank-up" : "rank-down"}
                        title="Cambio por nivel entre personajes con registros comparables"
                      >
                        {delta > 0 ? "↑ " : "↓ "}
                        {Math.abs(delta)} ·{" "}
                      </b>
                    )}
                    {pace.lastLevel
                      ? "Última subida · " + ago(pace.lastLevel)
                      : "Sin subida registrada"}
                  </p>
                </article>
              );
            })}
          </div>
          {!filtered.length && (
            <p className="muted">Ningún personaje coincide con la búsqueda.</p>
          )}
        </>
      )}
    </section>
  );
}
