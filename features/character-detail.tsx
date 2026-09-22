"use client";
import { siteHref } from "@/lib/public-settings";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Empty } from "@/components/guild-ui";
import { HistoryChart } from "./charts";
import { Compare } from "./compare";
import { RaidActivity } from "./raid-panel";
import { SourceNotice } from "./source-notice";
import { color, type Member } from "./types";
import { display, ago, leveling, awards } from "./analytics";
const quality: Record<string, string> = {
  POOR: "#9d9d9d",
  COMMON: "#eee",
  UNCOMMON: "#77ca51",
  RARE: "#649df6",
  EPIC: "#bc8eff",
  LEGENDARY: "#ffb151",
};
export function CharacterDetail({
  member: m,
  members,
}: {
  member: Member;
  members: Member[];
}) {
  const p = m.data,
    l = leveling(m);
  return (
    <main className="page-width">
      <a className="back-link" href={siteHref("/tbc")}>
        ← Volver a la compañía
      </a>
      <div
        className="character-banner"
        style={{ borderBottom: `1px solid ${color(m)}55` }}
      >
        <div
          className="avatar"
          style={{ boxShadow: `0 0 40px ${color(m)}22`, color: color(m) }}
        >
          {p.avatar ? (
            <img src={p.avatar} alt="" width={88} height={88} />
          ) : (
            m.name[0]
          )}
        </div>
        <div>
          <p className="eyebrow">
            {m.region.toUpperCase()} · {m.realm} · TBC ANNIVERSARY
          </p>
          <h1 style={{ color: color(m) }}>{m.name}</h1>
          <p className="muted">
            {[p.race, p.className, p.spec, p.faction]
              .filter(Boolean)
              .join(" · ") || "Su historia todavía no ha llegado al archivo."}
          </p>
        </div>
      </div>
      <div className="toolbar">
        <span className="badge">
          Consultado {ago(p.observedAt)}
          {m.status === "partial" ? " · Datos parciales" : ""}
        </span>
        <a
          className="button outline"
          href={m.armory}
          target="_blank"
          rel="noreferrer"
        >
          Ver Armory oficial ↗
        </a>
      </div>
      <SourceNotice members={[m]} />
      {m.errors?.length ? (
        <div className="notice">
          Algunos datos no se han podido actualizar. Se conserva la última
          información válida; cada apartado indica su fecha.
        </div>
      ) : null}
      <div className="stat-grid">
        {[
          ["Nivel", p.level],
          ["Item level", p.itemLevel],
          ["Muertes honorables", p.honorableKills],
          ["Bosses en logs", m.logs?.bosses],
        ].map(([label, v]) => (
          <div className="stat" key={String(label)}>
            <small>{label}</small>
            <strong>{display(v)}</strong>
          </div>
        ))}
      </div>
      <Tabs defaultValue="armory">
        <TabsList className="nav-tabs">
          {[
            ["armory", "Armory"],
            ["history", "Su historia"],
            ["logs", "Warcraft Logs"],
            ["compare", "Comparar"],
          ].map(([id, label]) => (
            <TabsTrigger key={id} value={id}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="armory">
          <div className="grid-two">
            <section className="panel">
              <h3>Arsenal</h3>
              <p className="subheading">{ago(p.resourceTimes?.equipment)}</p>
              {p.equipment?.length ? (
                <div className="equipment" style={{ marginTop: 18 }}>
                  {p.equipment.map((e, i) => (
                    <article key={e.slot + i}>
                      <small>
                        {e.slot} · iLvl {display(e.itemLevel)}
                      </small>
                      <strong
                        style={{ color: quality[e.quality ?? ""] ?? "#e8dcc5" }}
                      >
                        {e.name}
                      </strong>
                      <small>{e.quality ?? "Calidad no disponible"}</small>
                      {e.details?.length ? (
                        <details>
                          <summary>Estadísticas y encantamientos</summary>
                          {e.details.map((d, n) => (
                            <small
                              key={n}
                              style={{ display: "block", marginTop: 6 }}
                            >
                              {d}
                            </small>
                          ))}
                        </details>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <Empty
                  title="El armero aún no tiene el inventario"
                  text="Las piezas y sus calidades aparecerán si el perfil oficial ofrece equipamiento."
                />
              )}
            </section>
            <section className="panel">
              <h3>Oficios y talentos</h3>
              <p className="subheading">
                Profesiones · {ago(p.resourceTimes?.professions)}
              </p>
              {p.professions?.length ? (
                p.professions.map((r, i) => (
                  <article
                    key={r.name + i}
                    className="award"
                    style={{ marginTop: 12 }}
                  >
                    <h3>{r.name}</h3>
                    <p>
                      {display(r.skill)} / {display(r.max)}
                    </p>
                  </article>
                ))
              ) : (
                <Empty
                  title="Oficios por descubrir"
                  text="La fuente todavía no ha proporcionado profesiones."
                />
              )}
              <h3>Talentos</h3>
              {p.talentTrees?.length ? (
                <p className="subheading">
                  {p.talentTrees
                    .map((t) => `${t.name} ${t.points}`)
                    .join(" · ")}
                  .{" "}
                  {p.specDerived
                    ? "Spec: rama con más puntos del grupo activo."
                    : ""}
                </p>
              ) : null}
              {p.talents?.length ? (
                <ul>
                  {p.talents.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Sin talentos publicados por la fuente.</p>
              )}
            </section>
          </div>
          <div className="grid-two" style={{ marginTop: 22 }}>
            <section className="panel">
              <h3>PvP y reputaciones</h3>
              <p className="subheading">
                PvP · {ago(p.resourceTimes?.pvp_summary)}
              </p>
              <p>
                Honor: {display(p.honor)} · Muertes honorables:{" "}
                {display(p.honorableKills)}
              </p>
              {p.pvpRank !== undefined ? (
                <p>Rango PvP comunicado: {p.pvpRank}</p>
              ) : null}
              {p.reputations?.length ? (
                <ul>
                  {p.reputations.map((r) => (
                    <li key={r.name}>
                      {r.name} · {r.standing} {display(r.value)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Sin reputaciones disponibles.</p>
              )}
            </section>
            <section className="panel">
              <h3>PvE, logros y reconocimientos</h3>
              <p>Raids completadas: {p.raids?.join(", ") || "—"}</p>
              <p>Bosses en Armory: {display(p.raidBosses)}</p>
              <p>Puntos de logros: {display(p.achievementPoints)}</p>
              {p.achievements?.length ? (
                <ul>
                  {p.achievements.slice(0, 30).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Logros no disponibles en esta ficha.</p>
              )}
              {awards(members)
                .filter((a) => a.names.includes(m.name))
                .map((a) => (
                  <article className="award" key={a.id}>
                    <h3>{a.title}</h3>
                    <small>{a.rule}</small>
                  </article>
                ))}
            </section>
          </div>
        </TabsContent>
        <TabsContent value="history">
          <HistoryChart members={[m]} />
          <section className="panel" style={{ marginTop: 22 }}>
            <h3>Su ritmo, sin adivinar</h3>
            <div className="stat-grid">
              {[
                ["Niveles / 24 h", l.day],
                ["Niveles / 7 días", l.week],
                ["Desde el primer registro", l.total],
                ["Media / día observado", l.average],
              ].map(([k, v]) => (
                <div className="stat" key={String(k)}>
                  <small>{k}</small>
                  <strong>{display(v)}</strong>
                </div>
              ))}
            </div>
            <p>
              Mejor intervalo observado:{" "}
              {l.best
                ? `${l.best.gain} niveles en ${display(l.best.hours)} horas entre registros`
                : "—"}
            </p>
            <p>
              Último nivel detectado: {l.lastLevel ? ago(l.lastLevel) : "—"}
            </p>
            <p className="subheading">
              El instante exacto de subida no se conoce. La velocidad mide
              tiempo transcurrido entre registros, no tiempo conectado.
            </p>
          </section>
        </TabsContent>
        <TabsContent value="logs">
          <section className="panel">
            <h3>Warcraft Logs</h3>
            {m.logs ? (
              <>
                <p className="subheading">{ago(m.logs.observedAt)}</p>
                <div className="stat-grid">
                  {[
                    ["Best Parse", m.logs.bestParse],
                    ["Mejor DPS", m.logs.bestDps],
                    ["Mejor HPS", m.logs.bestHps],
                    ["Bosses únicos", m.logs.bosses],
                  ].map(([label, value]) => (
                    <div className="stat" key={String(label)}>
                      <small>{label}</small>
                      <strong>{display(value)}</strong>
                    </div>
                  ))}
                </div>
                <p className="subheading">
                  Mejores registros en zonas configuradas. DPS/HPS entre
                  encuentros distintos no son comparaciones equivalentes.
                </p>
                {m.logs.reports.map((r) => (
                  <article
                    className="award"
                    style={{ marginTop: 15 }}
                    key={r.code}
                  >
                    <a
                      href={`https://fresh.warcraftlogs.com/reports/${r.code}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <h3>{r.title} ↗</h3>
                    </a>
                    <small>
                      {new Date(r.startTime).toLocaleString("es-ES")}
                    </small>
                  </article>
                ))}
                {!m.logs.zones.length && (
                  <div className="notice">
                    La identidad está vinculada. Falta seleccionar las zonas de
                    raid para consultar parses y rendimiento.
                  </div>
                )}
              </>
            ) : (
              <Empty
                title="El escriba de combate aún no ha llegado"
                text="No hay datos de Warcraft Logs sincronizados para este personaje."
              />
            )}
          </section>
          <RaidActivity logs={m.logs} />
        </TabsContent>
        <TabsContent value="compare">
          <Compare members={[m, ...members.filter((x) => x.id !== m.id)]} />
        </TabsContent>
      </Tabs>
      {p.statistics && Object.keys(p.statistics).length ? (
        <section className="panel" style={{ marginTop: 24 }}>
          <h3>El personaje en números</h3>
          <p className="subheading">
            Estadísticas del perfil, no rendimiento de raid · Consultado{" "}
            {ago(p.resourceTimes?.statistics)}
          </p>
          <div className="stat-grid">
            {Object.entries(p.statistics).map(([label, value]) => (
              <div className="stat" key={label}>
                <small>{label}</small>
                <strong>{display(value)}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <p className="subheading" style={{ marginTop: 28 }}>
        Fuente del perfil: Blizzard · Género: {p.gender ?? "No disponible"} ·
        Última modificación comunicada: {p.sourceModified ?? "No disponible"}
      </p>
    </main>
  );
}
