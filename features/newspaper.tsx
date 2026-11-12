"use client";
import { apiUrl, siteHref } from "@/lib/public-settings";
import { archivePath } from "@/lib/guild-navigation";
import { useState, useEffect, type CSSProperties } from "react";
import { Pick, Empty } from "@/components/guild-ui";
import type { Activity, Member, IllustratedChronicle } from "./types";
import { ChronicleFeature } from "./illustrated-chronicles";
import { fullName, MemberLink } from "./member-portrait";
import { GuildIcon, type GuildIconName } from "@/components/guild-icon";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useEntryState } from "@/hooks/use-entry-state";
import { editionPlay, rivalId } from "./guild-stories";
import { EditionPlay } from "./edition-play";

const categories: Record<string, string> = {
  all: "Todo",
  trophy: "Trofeos",
  overtake: "Posiciones",
  level: "Niveles",
  itemLevel: "Equipo",
  honorableKills: "Honor",
  logs: "Raids",
  membership: "Altas y bajas",
  other: "Otras noticias",
};
const categoryIcons: Record<string, GuildIconName> = {
  all: "dispatch",
  trophy: "trophy",
  overtake: "boot",
  level: "steps",
  itemLevel: "shield",
  honorableKills: "medal",
  logs: "journal",
  membership: "tabard",
  other: "campfire",
};
const categoryOf = (e: Activity) =>
  e.kind === "join" || e.kind === "leave" ? "membership" :
  e.kind === "gain" && e.metric && categories[e.metric]
    ? e.metric
    : categories[e.kind]
      ? e.kind
      : "other";

function NewsEntry({
  event: e,
  members,
}: {
  event: Activity;
  members: Member[];
}) {
  const primary = members.find((m) => m.id === e.characterId);
  const secondId = e.kind === "overtake" ? rivalId(e) : e.otherCharacterId;
  const second = members.find((m) => m.id === secondId);
  const moved = e.kind === "overtake" && primary && second;
  const tail = e.text
    .split(": ")
    .slice(1)
    .join(": ")
    .replace(/\. La clasificación tiene movimiento\.$/, ".");
  const personal = primary && e.text.startsWith(primary.name + " ");
  return (
    <article className="news-story" data-story={e.id}>
      <div className="story-meta">
        <time dateTime={e.at}>
          {new Date(e.at).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
          })}
        </time>
        <span>{categories[categoryOf(e)]}</span>
      </div>
      {e.kind === "trophy" ? (
        <div className="story-content trophy-news">
          <a href={siteHref(archivePath("awards") + (e.id.startsWith("trophy/") ? "?trofeo=" + encodeURIComponent(e.id.slice(7)) : ""))}>
            <GuildIcon name="trophy" size={23} /> {e.text}
          </a>
          <div>
            {e.trophyWinners?.map((w) =>
              members.some((m) => m.id === w.id) ? (
                <a
                  key={w.id}
                  style={{ "--class-tint": w.tint } as CSSProperties}
                  href={siteHref("/character/" + encodeURIComponent(w.id))}
                >
                  {w.name}
                </a>
              ) : (
                <span
                  key={w.id}
                  style={{ "--class-tint": w.tint } as CSSProperties}
                >
                  {w.name}
                </span>
              ),
            )}
          </div>
        </div>
      ) : moved ? (
        <div className="story-content">
          <div className="news-movement">
            <span className="movement-chip">
              <ArrowUp className="move-up" role="img" aria-label="Adelanta" />
              <MemberLink member={primary} />
            </span>
            <span>adelanta a</span>
            <span className="movement-chip">
              <ArrowDown
                className="move-down"
                role="img"
                aria-label="Pierde posición"
              />
              <MemberLink member={second} />
            </span>
          </div>
          {tail && <p>{tail.charAt(0).toUpperCase() + tail.slice(1)}</p>}
        </div>
      ) : (
        <div className="story-content">
          {primary && <MemberLink member={primary} />}{" "}
          <span>
            {(personal
              ? e.text.slice(primary.name.length + 1)
              : e.text
            ).replace(/\b1 niveles\b/g, "1 nivel")}
          </span>
        </div>
      )}
    </article>
  );
}
export function LatestHeadlines({ events, members, chronicle }: { events: Activity[]; members: Member[]; chronicle?: IllustratedChronicle }) {
  const latest: Activity[] = [];
  const seen = new Set<string>();
  for (const e of events) {
    const key = e.kind === "overtake" ? e.at + "/" + e.characterId : e.id;
    if (seen.has(key)) continue;
    seen.add(key);
    latest.push(e);
    if (latest.length === 3) break;
  }
  return <section className="news-paper latest-headlines" aria-labelledby="latest-title">
    <header>
      <h2 id="latest-title" className="paper-title">Últimos titulares</h2>
      <a href={siteHref(archivePath("news"))}>Leer El Heraldo →</a>
    </header>
    {latest.length ? <ul>{latest.map(e => {
      const member = members.find(m => m.id === e.characterId);
      const name = member && fullName(member);
      const day = e.at.slice(0, 10);
      let title = e.text;
      let href = archivePath("news") + "?edicion=" + day;
      if (e.kind === "overtake" && name) {
        const rivals = events.filter(row => row.kind === "overtake" && row.characterId === e.characterId && row.at === e.at);
        const rival = members.find(m => m.id === rivalId(e));
        title = name + " adelanta a " + (rivals.length > 1 ? rivals.length + " compañeros" : rival ? fullName(rival) : "un compañero");
      } else if (e.kind === "trophy" && e.id.startsWith("trophy/")) {
        href = archivePath("awards") + "?trofeo=" + encodeURIComponent(e.id.slice(7));
      } else if (categoryOf(e) === "membership") {
        title = [name, e.text].filter(Boolean).join(" ");
        href = archivePath("movimientos");
      } else if (member && e.text.startsWith(member.name + " ")) {
        title = name + e.text.slice(member.name.length);
      }
      return <li key={e.id} data-story={e.id}><a href={siteHref(href)}>
        <GuildIcon name={categoryIcons[categoryOf(e)]} size={22}/>
        <span>{title.replace(/ desde el último registro\.|\. \d+ niveles? más para la historia\./, "").replace(/\b1 puntos\b/g, "1 punto")}</span>
        <time dateTime={e.at}>{new Date(e.at).toLocaleDateString("es-ES", {day:"numeric",month:"short",timeZone:"UTC"})}</time>
      </a></li>;
    })}</ul>
      : <p>El Heraldo aún espera su primera noticia.</p>}
    <ChronicleFeature story={chronicle} />
  </section>;
}
export function Newspaper({
  events,
  members,
  featured = false,
}: {
  events: Activity[];
  members: Member[];
  featured?: boolean;
}) {
  const params = new URLSearchParams(location.hash.split("?")[1]);
  const queryDay = featured ? params.get("trofeos") : null;
  const trophyDay = queryDay && /^\d{4}-\d{2}-\d{2}$/.test(queryDay) ? queryDay : undefined;
  const requested = featured ? params.get("edicion") : null;
  const editionDay = trophyDay ?? (requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : undefined);
  const [category, setCategory] = useEntryState<string>("newsCategory", trophyDay ? "trophy" : "all");
  const [limit, setLimit] = useEntryState<number>("newsLimit", 8);
  const [archivedDays, setArchivedDays] = useState<string[]>([]);
  const [archivedEvents, setArchivedEvents] = useState<Activity[] | null>(null);
  const [archiveError, setArchiveError] = useState(false);
  const days = Array.from(
    new Set([
      new Date().toISOString().slice(0, 10),
      ...archivedDays,
      ...(editionDay ? [editionDay] : []),
      ...events.map((e) => e.at.slice(0, 10)),
    ]),
  )
    .sort()
    .reverse();
  const [day, setDay] = useEntryState<string>("newsDay", editionDay ?? days[0]);
  useEffect(() => {
    const abort = new AbortController();
    fetch(apiUrl("/api/editions"), { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setArchivedDays((d as { days: string[] }).days))
      .catch(() => {});
    return () => abort.abort();
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    setArchivedEvents(null);
    setArchiveError(false);
    fetch(apiUrl("/api/editions?day=" + day), { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setArchivedEvents((d as { events: Activity[] }).events))
      .catch(() => {
        if (!abort.signal.aborted) setArchiveError(true);
      });
    return () => abort.abort();
  }, [day]);
  const rows =
    archivedEvents ?? events.filter((e) => e.at.slice(0, 10) === day);
  const play = featured ? editionPlay(rows, members) : undefined;
  useEffect(() => {
    const id = window.history.state?.returnStory;
    if (id && archivedEvents) {
      const story = Array.from(
        document.querySelectorAll<HTMLElement>("[data-story]"),
      ).find((el) => el.dataset.story === id);
      if (
        story &&
        (story.getBoundingClientRect().bottom < 60 ||
          story.getBoundingClientRect().top > innerHeight)
      )
        story.scrollIntoView({ block: "center" });
    }
  }, [archivedEvents]);
  const counts = rows.reduce<Record<string, number>>((counts, row) => {
    const key = categoryOf(row);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
  const visible = rows
    .filter((row) => category === "all" || categoryOf(row) === category)
    .filter(
      (row) =>
        !(
          category === "all" &&
          play &&
          row.kind === "overtake" &&
          row.at === play.at &&
          row.characterId === play.lead.member.id &&
          play.rivals.some((r) => r.member.id === rivalId(row))
        ),
    )
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const sums = (metric: string) =>
    rows
      .filter((e) => e.metric === metric)
      .reduce((n, e) => n + (e.delta ?? 0), 0);
  return (
    <section className="news-paper">
      <div className="paper-meta">
        <span>EDICIÓN DE LA GANGA</span>
        <span>PRENSA INDEPENDIENTE*</span>
      </div>
      <h2 className="paper-title">El Heraldo de Azeroth</h2>
      <div className="toolbar">
        <Pick
          label="Edición del periódico"
          value={day}
          onChange={(value) => {
            setDay(value);
            setCategory("all");
            setLimit(8);
          }}
          options={days.map((d) => ({
            value: d,
            label: new Date(d + "T12:00:00Z").toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
          }))}
        />
        <small>Ediciones diarias · UTC</small>
      </div>
      {archiveError && (
        <p role="status">
          No se ha podido cargar la edición completa. Mostrando los registros
          disponibles.
        </p>
      )}
      {rows.length ? (
        <>
          <p className="news-totals">
            {sums("level")} niveles · {sums("itemLevel")} puntos de equipo ·{" "}
            {sums("honorableKills")} HK ganadas
          </p>
          {play && (category === "all" || category === "overtake") && (
            <EditionPlay key={play.key} play={play} />
          )}
          <div
            className="news-categories"
            role="group"
            aria-label="Categorías de noticias"
          >
            {Object.entries(categories)
              .filter(([key]) => key === "all" || counts[key])
              .map(([key, label]) => (
                <button
                  key={key}
                  aria-pressed={key === category}
                  onClick={() => {
                    setCategory(key);
                    setLimit(8);
                  }}
                >
                  <GuildIcon name={categoryIcons[key]} size={18} /> {label}{" "}
                  <small>{key === "all" ? rows.length : counts[key]}</small>
                </button>
              ))}
          </div>
          {visible.slice(0, limit).map((e) => (
            <NewsEntry key={e.id} event={e} members={members} />
          ))}
          {visible.length > limit && (
            <button className="news-more" onClick={() => setLimit(limit + 8)}>
              Ver más noticias ({visible.length - limit})
            </button>
          )}
        </>
      ) : (
        <Empty
          title="La rotativa espera su primer titular."
          text="Todavía no se han detectado cambios en esta edición. Volveremos cuando haya hechos, no rumores."
        />
      )}
      <p
        style={{
          fontSize: 11,
          marginTop: 22,
          borderTop: "1px solid #96886a",
          paddingTop: 12,
        }}
      >
        * Independiente del loot council. Titulares generados a partir de
        registros reales.
      </p>
    </section>
  );
}
