import { Crown, Medal, Search } from "lucide-react";
import { useState } from "react";
import { Empty } from "@/components/guild-ui";
import { ago, display, leveling } from "./analytics";
import { rankChanges } from "./observations";
import { MemberLink, fullName } from "./member-portrait";
import { numeric, type Member } from "./types";

export function LevelingRace({ members }: { members: Member[] }) {
  const [search, setSearch] = useState("");
  const changes = rankChanges(members);
  const sorted = members
    .filter((m) => numeric(m.data.level))
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
    if (!prev || prev.level !== row.level || prev.pace.day !== row.pace.day)
      currentRank = i + 1;
    return { ...row, rank: currentRank };
  });
  const podium = [
    ...new Set(entries.filter((x) => x.rank <= 3).map((x) => x.rank)),
  ];
  const filtered = entries.filter((x) =>
    fullName(x.member)
      .toLocaleLowerCase("es")
      .includes(search.trim().toLocaleLowerCase("es")),
  );
  return (
    <section className="panel race-panel">
      <div className="dossier-heading">
        <h2>Leveling Race</h2>
        <p>{entries.length} participantes</p>
      </div>
      {!entries.length ? (
        <Empty
          title="La parrilla está preparada"
          text="La carrera empieza cuando se registra el primer nivel."
        />
      ) : (
        <>
          <div className="race-podium" aria-label="Podio de la carrera">
            {podium.map((rank) => {
              const group = entries.filter((x) => x.rank === rank);
              const Mark = rank === 1 ? Crown : Medal;
              return (
                <section key={rank} className="podium-place" data-rank={rank}>
                  <h3>
                    <Mark aria-hidden="true" size={21} />
                    {rank === 1 ? "En cabeza" : rank + ".º puesto"}
                  </h3>
                  <div className="banner-lineup podium-winners">
                    {group.map(({ member }) => (
                      <MemberLink key={member.id} member={member} banner />
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
                Por nivel, con los niveles ganados en 24 horas como desempate.
              </p>
            </div>
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
          <div className="member-grid race-grid">
            {filtered.map(({ member, rank, pace, level }) => {
              const delta = changes.get(member.id) ?? 0;
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
                    {delta !== 0 && (
                      <b>
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
