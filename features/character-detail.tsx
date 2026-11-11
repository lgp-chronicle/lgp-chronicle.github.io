"use client";
import { siteHref } from "@/lib/public-settings";

import { TabsContent } from "@/components/ui/tabs";
import { SectionIndex } from "@/components/section-index";
import { Empty } from "@/components/guild-ui";
import { HistoryChart } from "./charts";
import { Compare } from "./compare";
import { RaidActivity } from "./raid-panel";
import { SourceNotice } from "./source-notice";
import { color, type Member } from "./types";
import { display, ago, leveling, awards } from "./analytics";
import { memberArmoryUrl } from "@/config/characters";
import { archivePath } from "@/lib/guild-navigation";
import { ExternalLink } from "lucide-react";
import { EquipmentPanel, TalentsPanel } from "./armory-panels";
import { fullName } from "./member-portrait";
export function CharacterDetail({
  member: m,
  members,
}: {
  member: Member;
  members: Member[];
}) {
  const p = m.data,
    l = leveling(m);
  const official = memberArmoryUrl(m.id, m.region);
  const titles = awards(members).filter((award) =>
    award.memberIds.includes(m.id),
  );
  return (
    <main className="page-width character-dossier">
      <a className="back-link" href={siteHref(archivePath("overview"))}>
        ← Volver a la hermandad
      </a>
      <header className="character-banner">
        <div className="avatar" style={{ color: color(m) }}>
          {p.avatar ? (
            <img src={p.avatar} alt="" width={80} height={80} />
          ) : (
            m.name[0]
          )}
        </div>
        <div className="character-name">
          <p className="eyebrow">
            WoW Forever · {m.region.toUpperCase()} · {m.realm}
          </p>
          <h1 style={{ color: color(m) }}>{fullName(m)}</h1>
          <p>
            {[p.race, p.className, p.spec, p.faction]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {official && (p.level === undefined || p.level >= 10) ? (
          <a
            className="button outline official-armory"
            href={official}
            target="_blank"
            rel="noreferrer"
          >
            Armería oficial <ExternalLink size={15} aria-hidden="true" />
          </a>
        ) : (
          <small className="armory-unavailable">
            Armería oficial aún sin ficha
          </small>
        )}
      </header>
      <dl className="character-facts">
        {[
          ["Nivel", p.level],
          ["Nivel de objeto", p.itemLevel],
          ["Muertes honorables", p.honorableKills],
          ["Jefes en logs", m.logs?.bosses],
        ].map(([label, v]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{display(v)}</dd>
          </div>
        ))}
      </dl>
      <SectionIndex
        label="Secciones del personaje"
        items={[
          ["armory", "Equipo"],
          ["talents", "Talentos"],
          ["attributes", "Estadísticas"],
          ["history", "Su historia"],
          ["logs", "Warcraft Logs"],
          ["compare", "Comparar"],
        ]}
      >
        <TabsContent value="armory">
          <EquipmentPanel member={m} />
        </TabsContent>
        <TabsContent value="talents">
          <TalentsPanel profile={p} />
        </TabsContent>
        <TabsContent value="attributes">
          {titles.length > 0 && (
            <section className="panel dossier-panel">
              <div className="dossier-heading">
                <h2>Títulos de la hermandad</h2>
                <a href={siteHref(archivePath("awards"))}>Salón de la fama →</a>
              </div>
              <ul className="personal-titles">
                {titles.map((a) => (
                  <li key={a.id}>
                    <strong>{a.title}</strong>
                    <span>
                      {a.rule} · {display(a.value)}
                      {a.memberIds.length > 1 ? " · Compartido" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="grid-two dossier-sections">
            <section className="panel dossier-panel">
              <div className="dossier-heading">
                <h2>Atributos</h2>
                <p>{ago(p.resourceTimes?.statistics)}</p>
              </div>
              {p.statistics && Object.keys(p.statistics).length ? (
                <dl className="attribute-list">
                  {Object.entries(p.statistics).map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{display(value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="muted">Sin atributos registrados.</p>
              )}
            </section>
            <section className="panel dossier-panel">
              <div className="dossier-heading">
                <h2>Profesiones</h2>
                <p>{ago(p.resourceTimes?.professions)}</p>
              </div>
              {p.professions?.length ? (
                <dl className="attribute-list">
                  {p.professions.map((r, i) => (
                    <div key={r.name + i}>
                      <dt>{r.name}</dt>
                      <dd>
                        {display(r.skill)} / {display(r.max)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="muted">Sin profesiones registradas.</p>
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
              <h3>PvE y logros</h3>
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
      </SectionIndex>
      <details className="dossier-source">
        <summary>
          Datos de Blizzard · {ago(p.observedAt)}
          {m.status === "partial" || m.errors?.length
            ? " · Actualización parcial"
            : ""}
        </summary>
        <SourceNotice members={[m]} />
        {m.errors?.length ? (
          <p>
            Se conserva la última información disponible de los apartados que no
            se pudieron actualizar.
          </p>
        ) : null}
        <p>
          Última modificación comunicada: {p.sourceModified ?? "Sin fecha"} ·
          Género: {p.gender ?? "Sin registrar"}
        </p>
        {p.specDerived && (
          <p>
            La especialización corresponde a la rama con más puntos del grupo
            activo.
          </p>
        )}
      </details>
    </main>
  );
}
