"use client";
import { apiUrl, assetUrl, siteHref } from "@/lib/public-settings";
import {
  archivePath,
  guildSections,
  type GuildSection,
} from "@/lib/guild-navigation";
import { useEffect, useRef, useState } from "react";
import { useGuildTools } from "./webmcp";
import { MemberLink } from "./member-portrait";
import { LevelingRace } from "./leveling-race";
import { SourceNotice } from "./source-notice";
import { TabsContent } from "@/components/ui/tabs";
import { SectionIndex } from "@/components/section-index";
import {
  BookOpen,
  Trophy,
  RefreshCw,
  Users,
  Heart,
  Brain,
  BicepsFlexed,
  Feather,
  Flame,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { Empty } from "@/components/guild-ui";
import { Roster } from "./roster";
import { HistoryChart, Distribution } from "./charts";
import { Compare } from "./compare";
import { Newspaper } from "./newspaper";
import { leveling, display, awards, ago, type Award } from "./analytics";
import { numeric, type GuildData, type Member } from "./types";
const titleIcons: Record<string, LucideIcon> = {
  stamina: Heart,
  intellect: Brain,
  strength: BicepsFlexed,
  agility: Feather,
  spirit: Flame,
  armor: Shield,
};
function AwardWinners({ award, members }: { award: Award; members: Member[] }) {
  return (
    <span className="award-winners">
      {award.memberIds.map((id) => {
        const winner = members.find((m) => m.id === id);
        return winner ? <MemberLink key={id} member={winner} /> : null;
      })}
    </span>
  );
}
function leader(members: Member[], score: (m: Member) => unknown) {
  const valid = members.filter((m) => numeric(score(m)));
  if (!valid.length) return null;
  const max = Math.max(...valid.map((m) => score(m) as number));
  const winners = valid.filter((m) => score(m) === max);
  return {
    winners,
    value: max,
    partial: valid.length < members.length,
  };
}
export function Dashboard({
  initial,
  section,
}: {
  initial: GuildData;
  section?: GuildSection;
}) {
  const [data, setData] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useGuildTools(data);
  const archive = useRef<HTMLElement>(null);
  useEffect(() => {
    if (section) archive.current?.scrollIntoView({ block: "start" });
  }, [section]);
  const m = data.members;
  const trophies = awards(m);
  const withoutLogs = m.filter((member) => !member.logs);
  const cards = [
    {
      label: "Por delante en nivel",
      image: "corona",
      top: leader(m, (x) => x.data.level),
      unit: "nivel",
    },
    {
      label: "El equipo más brillante",
      image: "ambar",
      top: leader(m, (x) => x.data.itemLevel),
      unit: "item level",
    },
    {
      label: "Pisando el acelerador",
      image: "bota",
      top: leader(m, (x) => leveling(x).day),
      unit: "niveles / 24 h",
    },
    {
      label: "El terror del otro bando",
      image: "espadas",
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
    <main className="page-width guild-dashboard">
      <header className="guild-cover">
        <div className="cover-copy">
          <p className="eyebrow cover-kicker">
            Hermandad <i aria-hidden="true" /> WoW Forever
          </p>
          <h1>La Ganga</h1>
          <p className="cover-summary">
            Las crónicas de nuestra hermandad en Azeroth.
          </p>
          <div className="cover-actions">
            <a
              className="button bronze"
              href={siteHref(archivePath("overview"))}
            >
              <Users size={16} /> Ver personajes
            </a>
            <a className="button iron" href={siteHref(archivePath("news"))}>
              <BookOpen size={16} /> Leer El Heraldo
            </a>
          </div>
        </div>
        <img
          className="cover-crest"
          src={assetUrl("/guild/escudo-la-ganga.webp")}
          alt="Escudo de La Ganga con dos serpientes de escamas oliva y una cinta dorada"
          width="650"
          height="597"
        />
      </header>
      <div className="section-heading honors-heading">
        <div>
          <h2 className="section-title">Cuadro de honor</h2>
        </div>
        <button
          className="button outline"
          onClick={refresh}
          disabled={busy}
          aria-label={busy ? "Consultando el archivo" : "Consultar archivo"}
          title="Consultar archivo"
        >
          <RefreshCw size={15} />
          <span>{busy ? "Consultando…" : "Consultar archivo"}</span>
        </button>
      </div>
      {(!data.available || m.every((x) => !x.data.observedAt)) && (
        <div className="notice">
          {data.available
            ? "La hermandad está registrada. Esperando la primera sincronización con Blizzard y Warcraft Logs; los guiones indican datos aún no disponibles."
            : data.message}
        </div>
      )}
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <div className="stat-grid honors">
        {cards.map(({ label, image, top, unit }) => (
          <article className="stat" key={label}>
            <div className="honor-caption">
              <img
                className="honor-illustration"
                src={assetUrl("/guild/" + image + ".webp")}
                alt=""
                width="27"
                height="27"
              />
              <h3>{label}</h3>
            </div>
            {top ? (
              <>
                <div
                  className={
                    top.winners.length > 1
                      ? "honor-winners shared"
                      : "honor-winners"
                  }
                >
                  {top.winners.map((member) => (
                    <MemberLink key={member.id} member={member} />
                  ))}
                </div>
                <p className="honor-value">
                  {unit === "nivel"
                    ? "Nivel " + display(top.value)
                    : display(top.value) + " " + unit}
                  {top.partial ? " · cobertura parcial" : ""}
                </p>
              </>
            ) : (
              <p className="honor-value">Sin registros suficientes.</p>
            )}
          </article>
        ))}
      </div>
      <SourceNotice members={m} />
      <section
        className="archive"
        ref={archive}
        id={archivePath(section ?? "overview")}
        aria-label="Archivo de la hermandad"
      >
        <SectionIndex
          items={guildSections}
          label="Secciones del archivo"
          value={section ?? "overview"}
          onChange={(value) => {
            window.location.hash = archivePath(value as GuildSection);
          }}
        >
          <TabsContent value="overview">
            <Roster members={m} />
            <div style={{ marginTop: 24 }} className="grid-two">
              <Newspaper members={m} events={data.events.slice(0, 12)} />
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
                      <p>
                        <AwardWinners award={a} members={m} />
                      </p>
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
            <LevelingRace members={m} />
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
                {trophies.map((a) => {
                  const Icon = titleIcons[a.id] ?? Trophy;
                  return (
                    <article className="award" key={a.id}>
                      <Icon size={24} color="#d6be8d" aria-hidden="true" />
                      <h3>{a.title}</h3>
                      <p>
                        <AwardWinners award={a} members={m} />
                      </p>
                      <strong>{display(a.value)}</strong>
                      <p>
                        <small>
                          {a.rule}.{" "}
                          {a.names.length > 1 ? "Premio compartido." : ""}
                        </small>
                      </p>
                    </article>
                  );
                })}
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
            <Newspaper members={m} events={data.events} />
          </TabsContent>
          <TabsContent value="compare">
            <Compare members={m} />
          </TabsContent>
          <TabsContent value="logs">
            <section className="panel">
              <h3>Warcraft Logs · La mesa de raid</h3>
              <p className="subheading">
                Informes públicos de Classic Era. Cada ficha conserva su fuente
                y fecha.
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
                      <h3>
                        <MemberLink member={x} />
                      </h3>
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
              {withoutLogs.length > 0 && (
                <details className="logs-directory">
                  <summary>
                    Personajes sin informes ({withoutLogs.length})
                  </summary>
                  <div className="member-grid">
                    {withoutLogs.map((member) => (
                      <MemberLink key={member.id} member={member} />
                    ))}
                  </div>
                </details>
              )}
            </section>
          </TabsContent>
        </SectionIndex>
      </section>
      <p className="subheading" style={{ marginTop: 28, fontSize: 12 }}>
        Los datos pertenecen a la última observación válida de cada fuente. No
        representan necesariamente el estado actual dentro del juego.
      </p>
    </main>
  );
}
