"use client";
import { apiUrl } from "@/lib/public-settings";
import { useState, useEffect } from "react";
import { Pick, Empty } from "@/components/guild-ui";
import type { Activity, Member } from "./types";
import { MemberLink } from "./member-portrait";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useEntryState } from "@/hooks/use-entry-state";
import { editionPlay, rivalId } from "./guild-stories";
import { EditionPlay } from "./edition-play";

const categories: Record<string, string> = {
  all: "Todo",
  overtake: "Posiciones",
  level: "Niveles",
  itemLevel: "Equipo",
  honorableKills: "Honor",
  logs: "Raids",
  other: "Otras noticias",
};
const categoryOf = (e: Activity) =>
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
      {moved ? (
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
export function Newspaper({
  events,
  members,
  featured = false,
}: {
  events: Activity[];
  members: Member[];
  featured?: boolean;
}) {
  const [category, setCategory] = useEntryState<string>("newsCategory", "all");
  const [limit, setLimit] = useEntryState<number>("newsLimit", 8);
  const [archivedDays, setArchivedDays] = useState<string[]>([]);
  const [archivedEvents, setArchivedEvents] = useState<Activity[] | null>(null);
  const [archiveError, setArchiveError] = useState(false);
  const days = Array.from(
    new Set([
      new Date().toISOString().slice(0, 10),
      ...archivedDays,
      ...events.map((e) => e.at.slice(0, 10)),
    ]),
  )
    .sort()
    .reverse();
  const [day, setDay] = useEntryState<string>("newsDay", days[0]);
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
                  {label}{" "}
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
