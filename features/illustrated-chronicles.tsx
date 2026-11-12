import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { guildCovers, coverMemberId } from "@/lib/guild-covers";
import { archivePath } from "@/lib/guild-navigation";
import { assetUrl, siteHref } from "@/lib/public-settings";
import portraitArchive from "../config/character-art.json";
import type { IllustratedChronicle } from "./types";
import "../app/illustrated-chronicles.css";

const archiveHref = siteHref(archivePath("cronicas"));
const sectionTitle = "¿Qué está pasando en La Ganga?";
const dates = new Intl.DateTimeFormat("es", {
  dateStyle: "long",
  timeZone: "UTC",
});
const shortDate = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const metricLabels = {
  finish: "Nivel de personaje",
  levels: "Nivel de personaje",
  chase: "Nivel de personaje",
  pvp: "Muertes honorables registradas",
  gear: "Nivel medio de equipo",
};
const captions = {
  finish: "La llegada al 60",
  levels: "Camino al 60",
  chase: "Carrera al 60",
  pvp: "Duelo de honor",
  gear: "Desde la armería",
};
const models: Record<string, { entranceIssue?: string; url: string }> =
  portraitArchive;
const stamp = (day: string) => new Date(day + "T00:00:00Z");

function ChronicleScene({
  story,
  first,
}: {
  story: IllustratedChronicle;
  first: boolean;
}) {
  const painted =
    story.kind === "pvp" &&
    guildCovers.pique.cast.every((name) =>
      story.rows.some((row) => row.id === coverMemberId(name)),
    );
  const portraits = painted
    ? []
    : story.rows.filter(({ id }) => models[id] && !models[id].entranceIssue);
  return (
    <div className="chronicle-scene" data-kind={story.kind}>
      <div className="chronicle-painting" aria-hidden="true">
        {painted ? (
          <picture>
            <source
              media="(max-width: 640px)"
              srcSet={
                new URL("../app/art/pique-movil.webp", import.meta.url).href
              }
            />
            <img
              className="chronicle-original"
              src={new URL("../app/art/pique.webp", import.meta.url).href}
              alt=""
              loading={first ? "eager" : "lazy"}
            />
          </picture>
        ) : (
          <div className="chronicle-figures">
            {portraits.map(({ id }) => (
              <img
                key={id}
                alt=""
                loading={first ? "eager" : "lazy"}
                src={assetUrl(
                  "/guild/formacion/" +
                    encodeURIComponent(id.slice("forever-eu-".length)) +
                    ".webp",
                )}
              />
            ))}
          </div>
        )}
      </div>
      <div className="chronicle-copy">
        <p>{captions[story.kind]}</p>
        <h3>{story.title}</h3>
        <div>{story.caption}</div>
      </div>
    </div>
  );
}

function ChronicleCard({
  story,
  first = false,
}: {
  story: IllustratedChronicle;
  first?: boolean;
}) {
  const max = Math.max(
    1,
    ...story.rows.flatMap((row) => [row.before, row.after]),
  );
  return (
    <article className="chronicle-card" aria-label={story.title}>
      <header className="chronicle-mast">
        <time dateTime={story.day}>{dates.format(stamp(story.day))}</time>
      </header>
      <ChronicleScene story={story} first={first} />
      <div className="chronicle-ledger">
        <div className="chronicle-metric">
          <strong>{metricLabels[story.kind]}</strong>
        </div>
        <div className="chronicle-comparison">
          {(["before", "after"] as const).map((key) => {
            const day = key === "before" ? story.from : story.day;
            const fmt =
              story.from.slice(0, 4) === story.day.slice(0, 4)
                ? shortDate
                : dates;
            return (
              <div key={key} className="chronicle-column">
                <time dateTime={day}>
                  {story.from === story.day
                    ? key === "before"
                      ? "Primer registro"
                      : "Último registro"
                    : fmt.format(stamp(day))}
                </time>
                {story.rows.map((row) => (
                  <div
                    className="chronicle-row"
                    key={row.id}
                    style={{ "--ink": row.tint } as CSSProperties}
                  >
                    <span>{row.name}</span>
                    <i aria-hidden="true">
                      <i style={{ width: (100 * row[key]) / max + "%" }} />
                    </i>
                    <b>{row[key].toLocaleString("es")}</b>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export function ChronicleFeature({ story }: { story?: IllustratedChronicle }) {
  if (!story) return null;
  return (
    <section
      className="chronicle-feature"
      aria-labelledby="chronicle-brief-title"
    >
      <a className="chronicle-brief" href={archiveHref}>
        <img
          src={assetUrl("/guild/sello-la-ganga.png")}
          width="36"
          height="36"
          alt=""
        />
        <div>
          <h2 id="chronicle-brief-title">{sectionTitle}</h2>
          <p>
            <time dateTime={story.day}>
              {shortDate.format(stamp(story.day))}
            </time>{" "}
            · {story.title}
          </p>
        </div>
        <span>
          Ver historial <ArrowRight size={15} aria-hidden="true" />
        </span>
      </a>
    </section>
  );
}

export function ChronicleArchive({
  stories,
}: {
  stories: IllustratedChronicle[];
}) {
  return (
    <section className="chronicle-archive">
      <header>
        <h2 className="section-title">Historial de crónicas</h2>
        <span>
          {stories.length} {stories.length === 1 ? "crónica" : "crónicas"}
        </span>
      </header>
      {stories.length ? (
        <div className="chronicle-shelf">
          {stories.map((story, i) => (
            <ChronicleCard key={story.id} story={story} first={i === 0} />
          ))}
        </div>
      ) : (
        <p>
          Las primeras crónicas aparecerán cuando la armería registre una
          remontada, una mejora de equipo o una subida de nivel.
        </p>
      )}
    </section>
  );
}
