"use client";
import { apiUrl, siteHref } from "@/lib/public-settings";
import {
  archivePath,
  type GuildSection,
} from "@/lib/guild-navigation";
import { GuildIcon } from "@/components/guild-icon";
import { useEffect, useRef, useState } from "react";
import { useGuildTools } from "./webmcp";
import { MemberLink } from "./member-portrait";
import { CurrentAwards } from "./current-awards";
import { GuildRecords } from "./guild-records";
import { GuildStrengths } from "./guild-strengths";
import { MemberActivity } from "./member-activity";
import { LevelingRace } from "./leveling-race";
import { SourceNotice } from "./source-notice";
import { ArmoryRumors } from "./armory-rumors";
import { CoverGallery, RecentImages } from "./cover-gallery";
import { ChronicleArchive } from "./illustrated-chronicles";
import { MembershipArchive, MembershipNews } from "./membership-news";
import { isCurrentMember } from "./membership";
import { RecentTrophies, TrophyRoom } from "./trophy-room";
import { RefreshCw } from "lucide-react";
import { Empty } from "@/components/guild-ui";
import { HomeMemberSearch, Roster } from "./roster";
import { HistoryChart, Distribution } from "./charts";
import { Compare } from "./compare";
import { LatestHeadlines, Newspaper } from "./newspaper";
import { display, awards, ago } from "./analytics";
import { numeric, type GuildData, type Member } from "./types";
import "../app/home-dashboard.css";
import { hasRecentUpdate } from "./spotlight-freshness";
import { useActivityClock } from "../hooks/use-activity-clock";
import { CreationsPreview, MemberCreations, FerrogardDiary } from "./member-creations";
import { VideoGallery } from "./video-gallery";
import { GuildCollections } from "./guild-collections-panel";
import { KeenPage, FerrogardPage, WallpaperPage } from "./creation-pages";

function HomePulse({ members }: { members: Member[] }) {
  const adventurers = members.filter(m => m.data.level !== 1);
  const levels = adventurers.flatMap(m => numeric(m.data.level) ? [m.data.level] : []);
  const average = levels.length ? Math.round(levels.reduce((a, b) => a + b, 0) / levels.length * 10) / 10 : undefined;
  const highest = levels.length ? Math.max(...levels) : undefined;
  return <dl className="home-pulse" aria-label="Resumen de la hermandad">
    <div><GuildIcon name="tabard" size={32} /><dt>Personajes<small>Sin bancos de nivel 1</small></dt><dd>{adventurers.length}</dd></div>
    <div><GuildIcon name="steps" size={32} /><dt>Nivel medio<small>De los personajes del censo</small></dt><dd>{display(average)}</dd></div>
    <div><GuildIcon name="finish" size={32} /><dt>Nivel más alto<small>La meta es el nivel 60</small></dt><dd>{display(highest)}<span> / 60</span></dd></div>
  </dl>;
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
  const now = useActivityClock();
  const archive = useRef<HTMLElement>(null);
  const tavernLink = <a className="tavern-shortcut" href={siteHref(archivePath("activity"))}>
    <GuildIcon name="campfire" size={20}/>Ver la actividad de los miembros →</a>;
  useEffect(() => {
    if (section === "overview" && new URLSearchParams(location.hash.split("?")[1]).get("ver") === "taberna") {
      location.replace(siteHref(archivePath("activity")));
      return;
    }
    const y = window.history.state?.returnY;
    const trophy = archive.current?.querySelector<HTMLElement>(".trophy-case [data-selected]");
    if (typeof y === "number") window.scrollTo(0, y);
    else if (trophy) {
      trophy.scrollIntoView({block: "center"});
      trophy.focus({preventScroll: true});
    }
    else if (window.history.state?.menuFromTop) window.scrollTo(0, 0);
    else if (section) archive.current?.scrollIntoView({ block: "start" });
  }, [section]);
  const m = data.members.filter(isCurrentMember);
  const active = m.filter(member => hasRecentUpdate(member, now));
  const query = new URLSearchParams(location.hash.split("?")[1]);
  const trophies = section === "awards" ? awards(m, now) : [];
  const withoutLogs = m.filter((member) => !member.logs);
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
        <div className="home-dashboard">
          <header className="home-dashboard-heading">
            <div>
              <p className="eyebrow">El tablón de La Ganga</p>
              <h2>La hermandad de un vistazo</h2>
              <span>Última lectura del archivo · {ago(data.generatedAt)}</span>
            </div>
            <div className="home-dashboard-tools">
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
          </header>
          <HomePulse members={m} />
          <div className="home-dashboard-grid home-journal">
            <CreationsPreview members={m} />
            <MembershipNews members={data.members} asOf={data.generatedAt} />
            <section className="home-honors-panel" aria-labelledby="home-honors-title">
              <div className="section-heading honors-heading">
                <h2 id="home-honors-title" className="section-title">Cuadro de honor</h2>
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
              <div className="home-honors"><GuildStrengths data={data} /></div>
            </section>
            <div className="home-updates-grid">
              <RecentImages members={data.members} />
              <RecentTrophies room={data.trophyRoom} members={data.members} />
            </div>
            <LatestHeadlines events={data.events} members={data.members} />
            <ArmoryRumors members={active} activityLink={tavernLink} />
            <GuildRecords members={m} now={now} home />
          </div>
        </div>
      )}
      {!["gallery", "cronicas", "videos", "creations", "keen", "diario", "wallpaper"].includes(section ?? "") && <SourceNotice members={m} />}
      {section && <section
        className="archive"
        ref={archive}
        id="guild-archive"
        aria-label="Archivo de la hermandad"
      >
        {section === "gallery" && <CoverGallery members={data.members} />}
        {section === "videos" && <VideoGallery members={data.members} />}
        {section === "creations" && <MemberCreations members={data.members} />}
        {section === "keen" && <KeenPage members={data.members} />}
        {section === "diario" && <FerrogardPage members={data.members} />}
        {section === "wallpaper" && <WallpaperPage members={data.members} />}
        {section === "movimientos" && <MembershipArchive members={data.members} events={data.membershipEvents ?? data.events.filter(e => e.kind === "join" || e.kind === "leave")} />}
        {section === "cronicas" && <ChronicleArchive stories={data.chronicles ?? []} members={data.members} />}
        {section === "overview" && (
          <>
            <MembershipNews members={data.members} asOf={data.generatedAt} />
            <Roster members={m} initialSearch={query.get("buscar") ?? ""} />
          </>
        )}
        {section === "activity" && <MemberActivity members={m} now={now} />}
        {section === "composicion" && <Distribution members={m} />}
        {section === "collections" && <GuildCollections members={data.members} />}
        {section === "race" && <LevelingRace members={m} />}
        {section === "history" && <HistoryChart members={m} />}
        {section === "awards" && (
          <>
            <p className="eyebrow">
              LAS HAZAÑAS DE LA GANGA
            </p>
            <h2 className="section-title">El salón de la fama</h2>
            <TrophyRoom room={data.trophyRoom} members={data.members} selectedId={query.get("trofeo")} />
            <GuildRecords members={m} now={now} />
            <CurrentAwards awards={trophies} members={m} />
          </>
        )}
        {section === "news" && (
          <>
            <Newspaper members={data.members} events={data.events} featured />
            <FerrogardDiary members={data.members} />
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
      {!["gallery", "cronicas", "videos", "creations", "keen", "diario", "wallpaper"].includes(section ?? "") && (
        <p className="subheading" style={{ marginTop: 28, fontSize: 12 }}>
          Los datos pertenecen a la última observación válida de cada fuente. No
          representan necesariamente el estado actual dentro del juego.
        </p>
      )}
    </main>
  );
}
