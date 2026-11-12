"use client";
import { apiUrl, assetUrl, siteHref } from "@/lib/public-settings";
import {
  archivePath,
  groupForSection,
  type GuildSection,
} from "@/lib/guild-navigation";
import { GuildIcon } from "@/components/guild-icon";
import { guildSectionIcons } from "@/components/section-icons";
import { useEffect, useRef, useState } from "react";
import { useGuildTools } from "./webmcp";
import { fullName, memberHref, MemberLink } from "./member-portrait";
import { HallAward } from "./honor-card";
import { GuildStrengths } from "./guild-strengths";
import { TavernBoard } from "./tavern-board";
import { LevelingRace } from "./leveling-race";
import { SourceNotice } from "./source-notice";
import { ArmoryRumors } from "./armory-rumors";
import { CoverGallery } from "./cover-gallery";
import { ChronicleArchive, ChronicleFeature } from "./illustrated-chronicles";
import { MembershipArchive, MembershipNews } from "./membership-news";
import { TrophyRoom } from "./trophy-room";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Empty } from "@/components/guild-ui";
import { HomeMemberSearch, Roster } from "./roster";
import { HistoryChart, Distribution } from "./charts";
import { Compare } from "./compare";
import { LatestHeadlines, Newspaper } from "./newspaper";
import { leveling, display, awards, ago } from "./analytics";
import { color, numeric, type GuildData, type Member } from "./types";

function FerrogardDiary() {
  return (
    <section className="ferrogard-diary" aria-labelledby="diary-title">
      <a
        href="https://discord.com/channels/1551288910569808112/1569452969064140830"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div>
          <h2 id="diary-title">El diario de Ferrogard</h2>
          <span>Leer en Discord <ExternalLink size={15} aria-hidden="true" /></span>
        </div>
        <img src={assetUrl("/guild/galeria/diario.webp")} width={768} height={256} loading="lazy" alt="" />
      </a>
    </section>
  );
}

function leader(members: Member[], score: (m: Member) => unknown) {
  const valid = members.flatMap((member) => {
    const value = score(member);
    return numeric(value) ? [{ member, value }] : [];
  });
  if (!valid.length) return null;
  const max = Math.max(...valid.map((row) => row.value));
  const winners = valid
    .filter((row) => row.value === max)
    .map((row) => row.member);
  return {
    winners,
    value: max,
    registered: valid.length,
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
  const tavernLink = <a className="tavern-shortcut" href={siteHref(archivePath("overview")+"?ver=taberna")}
    onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && location.hash === event.currentTarget.hash)
      document.getElementById("tablon-taberna")?.scrollIntoView({block:"start"}); }}>
    <GuildIcon name="campfire" size={20}/>Tablón de la taberna →</a>;
  useEffect(() => {
    const y = window.history.state?.returnY;
    const trophy = archive.current?.querySelector<HTMLElement>(".trophy-case [data-selected]");
    if (typeof y === "number") window.scrollTo(0, y);
    else if (trophy) {
      trophy.scrollIntoView({block: "center"});
      trophy.focus({preventScroll: true});
    }
    else if (window.history.state?.menuFromTop) window.scrollTo(0, 0);
    else if (section === "overview" && new URLSearchParams(location.hash.split("?")[1]).get("ver") === "taberna")
      document.getElementById("tablon-taberna")?.scrollIntoView({block:"start"});
    else if (section) archive.current?.scrollIntoView({ block: "start" });
  }, [section]);
  const m = data.members;
  const query = new URLSearchParams(location.hash.split("?")[1]);
  const group = groupForSection(section);
  const trophies = awards(m);
  const withoutLogs = m.filter((member) => !member.logs);
  const cards = [
    {
      label: "Por delante en nivel",
      top: leader(m, (x) => x.data.level),
      unit: "nivel",
    },
    {
      label: "El equipo más brillante",
      top: leader(m, (x) => x.data.itemLevel),
      unit: "item level",
    },
    {
      label: "Pisando el acelerador",
      top: leader(m, (x) => leveling(x).day),
      unit: "niveles / 24 h",
    },
    {
      label: "El terror del otro bando",
      top: leader(m, (x) => x.data.honorableKills),
      unit: "muertes honorables",
    },
  ] as const;
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
      {!section && (
        <>
          <div className="section-heading honors-heading">
            <div>
              <h2 className="section-title">Cuadro de honor</h2>
            </div>
            <HomeMemberSearch members={m} />
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
          <div className="home-honors"><GuildStrengths data={data} />{tavernLink}</div>
          <div className="home-journal">
            <div>
              <LatestHeadlines events={data.events} members={m} />
              <ChronicleFeature story={data.chronicles?.[0]} />
            </div>
            <div>
              <ArmoryRumors members={m} />
              <FerrogardDiary />
            </div>
          </div>
          <MembershipNews members={m} asOf={data.generatedAt} />
        </>
      )}
      {section !== "gallery" && section !== "cronicas" && <SourceNotice members={m} />}
      {section && <section
        className="archive"
        ref={archive}
        id="guild-archive"
        aria-label="Archivo de la hermandad"
      >
        {group && group.sections.length > 1 && (
          <nav
            aria-label={"Apartados de " + group.label}
            className="archive-links"
          >
            {group.sections.map(([id, label]) => (
              <a
                key={id}
                href={siteHref(archivePath(id))}
                aria-current={section === id ? "page" : undefined}
              >
                <GuildIcon name={guildSectionIcons[id]} size={19} /> {label}
              </a>
            ))}
          </nav>
        )}
        {section === "gallery" && <CoverGallery members={m} />}
        {section === "movimientos" && <MembershipArchive members={m} events={data.membershipEvents ?? data.events.filter(e => e.kind === "join" || e.kind === "leave")} />}
        {section === "cronicas" && <ChronicleArchive stories={data.chronicles ?? []} />}
        {section === "overview" && (
          <>
            {tavernLink}
            <Roster members={m} initialSearch={query.get("buscar") ?? ""} />
            <TavernBoard members={m} asOf={data.generatedAt} />
            <div style={{ marginTop: 24 }} className="grid-two">
              <Newspaper members={m} events={data.events.slice(0, 12)} />
              <section className="panel">
                <h3>Récords de la hermandad</h3>
                <dl className="guild-records">
                  {cards.map(({label,top,unit})=><div key={label}><dt>{label}</dt>
                    <dd>{top && top.value > 0 ? <>
                      <strong>{display(top.value)} {unit}</strong>
                      <span>{top.winners.map(p=><a key={p.id} href={memberHref(p)} style={{color:color(p)}}>{fullName(p)}</a>)}</span>
                      {top.registered < m.length && <small>{top.registered} de {m.length} con datos</small>}
                    </> : "Sin marca registrada"}</dd>
                  </div>)}
                </dl>
                <a href={siteHref(archivePath("awards"))}>Ver el Salón de la fama →</a>
              </section>
            </div>
          </>
        )}
        {section === "race" && <LevelingRace members={m} />}
        {section === "history" && (
          <>
            <HistoryChart members={m} />
            <div style={{ marginTop: 22 }}>
              <Distribution members={m} />
            </div>
          </>
        )}
        {section === "awards" && (
          <>
            <p className="eyebrow">
              HONOR ETERNO. HASTA LA PRÓXIMA SINCRONIZACIÓN.
            </p>
            <h2 className="section-title">El salón de la fama</h2>
            <TrophyRoom room={data.trophyRoom} members={m} selectedId={query.get("trofeo")} />
            <h3 className="section-title">Premios actuales</h3>
            {trophies.length ? (
              <div className="honor-gallery hall-gallery">
                {trophies.map((a) => (
                  <HallAward key={a.id} award={a} members={m} />
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
          </>
        )}
        {section === "news" && (
          <>
            <Newspaper members={m} events={data.events} featured />
            <FerrogardDiary />
          </>
        )}
        {section === "compare" && (
          <>
            <Compare
              members={m}
              initialPair={
                new URLSearchParams(window.location.hash.split("?")[1])
              }
            />
          </>
        )}
        {section === "logs" && (
          <>
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
          </>
        )}
      </section>}
      {section !== "gallery" && section !== "cronicas" && (
        <p className="subheading" style={{ marginTop: 28, fontSize: 12 }}>
          Los datos pertenecen a la última observación válida de cada fuente. No
          representan necesariamente el estado actual dentro del juego.
        </p>
      )}
    </main>
  );
}
