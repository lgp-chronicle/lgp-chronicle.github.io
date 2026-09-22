"use client";
import { apiUrl } from "@/lib/public-settings";
import { useState } from "react";
import { useGuildTools } from "./webmcp";
import { rankChanges } from "./observations";
import { SourceNotice } from "./source-notice";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Crown, Swords, Zap, Gem, Trophy, RefreshCw } from "lucide-react";
import { Empty } from "@/components/guild-ui";
import { Roster } from "./roster";
import { HistoryChart, Distribution } from "./charts";
import { Compare } from "./compare";
import { Newspaper } from "./newspaper";
import { leveling, display, awards, ago } from "./analytics";
import { numeric, type GuildData, type Member, color } from "./types";
function leader(members: Member[], score: (m: Member) => unknown) {
  const valid = members.filter((m) => numeric(score(m)));
  if (!valid.length) return null;
  const max = Math.max(...valid.map((m) => score(m) as number));
  const names = valid.filter((m) => score(m) === max).map((m) => m.name);
  return {
    name: names.length > 1 ? `${names.length} empatados` : names[0],
    names: names.join(" / "),
    value: max,
    partial: valid.length < members.length,
  };
}
export function Dashboard({ initial }: { initial: GuildData }) {
  const [data, setData] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useGuildTools(data);
  const m = data.members;
  const trophies = awards(m);
  const changes = rankChanges(m);
  const cards = [
    {
      label: "Por delante en nivel",
      Icon: Crown,
      top: leader(m, (x) => x.data.level),
      unit: "nivel",
    },
    {
      label: "El equipo más brillante",
      Icon: Gem,
      top: leader(m, (x) => x.data.itemLevel),
      unit: "item level",
    },
    {
      label: "Pisando el acelerador",
      Icon: Zap,
      top: leader(m, (x) => leveling(x).day),
      unit: "niveles / 24 h",
    },
    {
      label: "El terror del otro bando",
      Icon: Swords,
      top: leader(m, (x) => x.data.honorableKills),
      unit: "muertes honorables",
    },
  ];
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(apiUrl("/api/guild"), { cache: "no-store" });
      if (!r.ok) throw Error();
      setData(await r.json());
    } catch {
      setError(
        "No hemos podido consultar el archivo. Se conserva la vista anterior.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="page-width">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CAPÍTULO ACTIVO · CLASSIC ANNIVERSARY</p>
          <h2 className="section-title">
            WoW TBC <span style={{ color: "#78a6d4" }}> / </span> La compañía
          </h2>
          <p className="subheading">
            Un vistazo para saber cómo van los tuyos.
          </p>
        </div>
        <button className="button outline" onClick={refresh} disabled={busy}>
          <RefreshCw size={15} />
          {busy ? "Consultando…" : "Consultar archivo"}
        </button>
      </div>
      {(!data.available || m.every((x) => !x.data.observedAt)) && (
        <div className="notice">
          {data.available
            ? "La compañía está registrada. Esperando la primera sincronización con Blizzard y Warcraft Logs; los guiones indican datos aún no disponibles."
            : data.message}
        </div>
      )}
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <div className="stat-grid">
        {cards.map(({ label, Icon, top, unit }) => (
          <article className="stat" key={label}>
            <small>
              <Icon size={16} />
              {label}
            </small>
            <strong title={top?.names}>{top?.name ?? "Por descubrir"}</strong>
            <p>
              {top
                ? `${display(top.value)} ${unit}${top.partial ? " · cobertura parcial" : ""}`
                : "Esperando datos reales"}
            </p>
          </article>
        ))}
      </div>
      <SourceNotice members={m} />
      <Tabs defaultValue="overview">
        <TabsList className="nav-tabs">
          {[
            ["overview", "La compañía"],
            ["race", "Leveling Race"],
            ["history", "Progresión"],
            ["awards", "Salón de la fama"],
            ["news", "El Heraldo"],
            ["compare", "Cara a cara"],
            ["logs", "Warcraft Logs"],
          ].map(([id, label]) => (
            <TabsTrigger value={id} key={id}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <Roster members={m} />
          <div style={{ marginTop: 24 }} className="grid-two">
            <Newspaper events={data.events.slice(0, 12)} />
            <section className="panel">
              <p className="eyebrow">UN POCO DE GLORIA</p>
              <h3>Los nombres del momento</h3>
              {trophies.length ? (
                trophies.slice(0, 4).map((a) => (
                  <article
                    className="award"
                    key={a.id}
                    style={{ marginTop: 15 }}
                  >
                    <h3>{a.title}</h3>
                    <p>{a.names.join(" / ")}</p>
                    <small>
                      {a.rule} · {display(a.value)}
                    </small>
                  </article>
                ))
              ) : (
                <Empty
                  title="Las coronas no se regalan"
                  text="Los premios aparecerán cuando haya suficientes datos comparables. Aquí nadie gana por defecto."
                />
              )}
            </section>
          </div>
        </TabsContent>
        <TabsContent value="race">
          <section className="panel">
            <h3>Leveling Race</h3>
            <p className="subheading">
              Nivel primero; velocidad reciente como desempate. Velocidad de
              calendario, no horas de juego.
            </p>
            {m.some((x) => numeric(x.data.level)) ? (
              <>
                <div className="race-row muted">
                  <span>#</span>
                  <span>Personaje</span>
                  <span>24 h</span>
                  <span>7 días</span>
                  <span>Media / día</span>
                </div>
                {[...m]
                  .filter((x) => numeric(x.data.level))
                  .sort(
                    (a, b) =>
                      b.data.level! - a.data.level! ||
                      (leveling(b).day ?? -1) - (leveling(a).day ?? -1),
                  )
                  .map((x, i, sorted) => {
                    const l = leveling(x);
                    return (
                      <div className="race-row" key={x.id}>
                        <strong>
                          {sorted.findIndex(
                            (other) =>
                              other.data.level === x.data.level &&
                              (leveling(other).day ?? -1) === (l.day ?? -1),
                          ) + 1}
                        </strong>
                        <div>
                          <span style={{ color: color(x) }}>
                            {x.name}{" "}
                            {changes.has(x.id) && changes.get(x.id) !== 0
                              ? changes.get(x.id)! > 0
                                ? "↑ " + changes.get(x.id)
                                : "↓ " + Math.abs(changes.get(x.id)!)
                              : null}
                          </span>
                          <p className="subheading">
                            Nivel {x.data.level} · Último nivel:{" "}
                            {l.lastLevel
                              ? ago(l.lastLevel)
                              : "Sin cambio detectado"}
                          </p>
                        </div>
                        <span>{display(l.day)}</span>
                        <span>{display(l.week)}</span>
                        <span>{display(l.average)}</span>
                      </div>
                    );
                  })}
              </>
            ) : (
              <Empty
                title="La parrilla está preparada"
                text="Necesitamos niveles e histórico para ordenar esta carrera. No hay posiciones asignadas todavía."
              />
            )}
            <p className="subheading">
              Un guion significa que el periodo no tiene cobertura suficiente.
            </p>
          </section>
          <div style={{ marginTop: 22 }}>
            <HistoryChart members={m} />
          </div>
        </TabsContent>
        <TabsContent value="history">
          <HistoryChart members={m} />
          <div style={{ marginTop: 22 }}>
            <Distribution members={m} />
          </div>
        </TabsContent>
        <TabsContent value="awards">
          <p className="eyebrow">
            HONOR ETERNO. HASTA LA PRÓXIMA SINCRONIZACIÓN.
          </p>
          <h2 className="section-title">El salón de la fama</h2>
          {trophies.length ? (
            <div className="award-grid">
              {trophies.map((a) => (
                <article className="award" key={a.id}>
                  <Trophy size={24} color="#d6be8d" />
                  <h3>{a.title}</h3>
                  <p>{a.names.join(" / ")}</p>
                  <strong>{display(a.value)}</strong>
                  <p>
                    <small>
                      {a.rule}. {a.names.length > 1 ? "Premio compartido." : ""}
                    </small>
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <section className="panel">
              <Empty
                title="Aquí se viene a ganarse el título"
                text="No hay premios calculables todavía. Cuando los datos lo permitan, la gloria cambiará de manos automáticamente."
              />
            </section>
          )}
        </TabsContent>
        <TabsContent value="news">
          <Newspaper events={data.events} />
        </TabsContent>
        <TabsContent value="compare">
          <Compare members={m} />
        </TabsContent>
        <TabsContent value="logs">
          <section className="panel">
            <h3>Warcraft Logs · La mesa de raid</h3>
            <p className="subheading">
              Informes públicos de Anniversary. Cada ficha conserva su fuente y
              fecha.
            </p>
            {m.some((x) => x.logs) ? (
              m
                .filter((x) => x.logs)
                .map((x) => (
                  <article
                    className="award"
                    key={x.id}
                    style={{ marginTop: 16 }}
                  >
                    <h3 style={{ color: color(x) }}>{x.name}</h3>
                    <p>
                      Best Parse: {display(x.logs?.bestParse)} · DPS:{" "}
                      {display(x.logs?.bestDps)} · HPS:{" "}
                      {display(x.logs?.bestHps)} · Bosses:{" "}
                      {display(x.logs?.bosses)}
                    </p>
                    <small>{ago(x.logs?.observedAt)}</small>
                    {x.logs?.reports.map((r) => (
                      <p key={r.code}>
                        <a
                          href={`https://fresh.warcraftlogs.com/reports/${r.code}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {r.title} ↗
                        </a>
                      </p>
                    ))}
                  </article>
                ))
            ) : (
              <Empty
                title="Sin informes en la mesa, de momento"
                text="Warcraft Logs aparecerá tras conectar la cuenta de aplicación y encontrar informes públicos. Los parses necesitan zonas de raid configuradas."
              />
            )}
          </section>
        </TabsContent>
      </Tabs>
      <p className="subheading" style={{ marginTop: 28, fontSize: 12 }}>
        Los datos pertenecen a la última observación válida de cada fuente. No
        representan necesariamente el estado actual dentro del juego.
      </p>
    </main>
  );
}
