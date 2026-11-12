import { useMemo } from "react";
import { GuildIcon } from "../components/guild-icon";
import { assetUrl } from "../lib/public-settings";
import { color, type Member } from "./types";
import { memberHref } from "./member-portrait";
import { tavernActivity } from "./tavern-activity";
import "../app/tavern-board.css";

const date = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const weekday = new Intl.DateTimeFormat("es", {
  weekday: "short",
  timeZone: "UTC",
});
const elapsed = new Intl.RelativeTimeFormat("es", { numeric: "always" });
function lastSeen(at: number, now: number) {
  const minutes = Math.floor((now - at) / 60000);
  if (minutes < 1) return "Ahora mismo";
  if (minutes < 60) return elapsed.format(-minutes, "minute");
  if (minutes < 1440) return elapsed.format(-Math.floor(minutes / 60), "hour");
  return elapsed.format(-Math.floor(minutes / 1440), "day");
}

type Row = ReturnType<typeof tavernActivity>["active"][number];
function TavernList({
  rows,
  days,
  now,
  week,
}: {
  rows: Row[];
  days: number[];
  now: number;
  week: boolean;
}) {
  function line(row: Row) {
    return (
      <li key={row.member.id}>
        <a href={memberHref(row.member)} style={{ color: color(row.member) }}>
          {row.name}
        </a>
        {week ? (
          <>
            <b>
              {row.activeDays.size} {row.activeDays.size === 1 ? "día" : "días"}
            </b>
            <div className="tavern-week" aria-label="Días con actualización">
              {days.map((d) => (
                <span
                  key={d}
                  data-active={row.activeDays.has(d) || undefined}
                  title={
                    date.format(d) +
                    (row.activeDays.has(d) ? " · Con señal" : " · Sin señal")
                  }
                >
                  <span aria-hidden="true">
                    {weekday.format(d).slice(0, 2)}
                  </span>
                  <span className="sr-only">
                    {date.format(d)} ·{" "}
                    {row.activeDays.has(d) ? "Con señal" : "Sin señal"}
                  </span>
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            <b>{lastSeen(row.last, now)}</b>
            <time dateTime={new Date(row.last).toISOString()}>
              {date.format(row.last)}
            </time>
          </>
        )}
      </li>
    );
  }
  if (!rows.length)
    return (
      <p className="tavern-empty">
        {week
          ? "Todavía no hay señales registradas esta semana."
          : "Aún no hay fechas confirmadas."}
      </p>
    );
  const tied =
    week && rows.length > 3
      ? rows
          .slice(3)
          .filter((r) => r.activeDays.size === rows[2].activeDays.size).length
      : 0;
  return (
    <>
      <ul className="tavern-list">{rows.slice(0, 3).map(line)}</ul>
      {rows.length > 3 && (
        <details className="tavern-more">
          <summary>
            Ver la lista completa ({rows.length})
            {tied > 0 && (
              <small>
                {" "}
                · {tied} más con {rows[2].activeDays.size}{" "}
                {rows[2].activeDays.size === 1 ? "día" : "días"}
              </small>
            )}
          </summary>
          <ul className="tavern-list">{rows.slice(3).map(line)}</ul>
        </details>
      )}
    </>
  );
}

export function TavernBoard({
  members,
  asOf,
}: {
  members: Member[];
  asOf: string;
}) {
  const { days, active, oldest, unknown } = useMemo(
    () => tavernActivity(members, asOf),
    [members, asOf],
  );
  const now = Date.parse(asOf);
  return (
    <section
      className="tavern-board"
      id="tablon-taberna"
      aria-labelledby="tavern-heading"
    >
      <header className="tavern-heading">
        <GuildIcon name="campfire" size={45} />
        <div>
          <h2 id="tavern-heading">Actividad de los miembros</h2>
          <p>
            Días con cambios y últimas actualizaciones de la armería hasta el{" "}
            <time dateTime={asOf}>{date.format(now)}</time>.
          </p>
        </div>
      </header>
      <div className="tavern-panels">
        <article className="tavern-panel tavern-active">
          <header
            style={{
              backgroundImage: `linear-gradient(90deg,#302116 27%,#302116dc 60%,#30211668),url("${assetUrl("/guild/galeria/cocinas.webp")}")`,
            }}
          >
            <GuildIcon name="boot" size={36} />
            <div>
              <h3>Los de «una misión más»</h3>
              <p>
                Más días con cambios en los últimos siete días (UTC). Cada día
                cuenta una vez.
              </p>
            </div>
          </header>
          <TavernList days={days} rows={active} now={now} week />
        </article>
        <article className="tavern-panel tavern-missing">
          <header
            style={{
              backgroundImage: `linear-gradient(90deg,#222731 27%,#222731dc 60%,#22273168),url("${assetUrl("/guild/galeria/atalaya.webp")}")`,
            }}
          >
            <GuildIcon name="spyglass" size={36} />
            <div>
              <h3>¿Alguien los ha visto?</h3>
              <p>
                Personajes con más tiempo desde su última actualización
                registrada.
              </p>
            </div>
          </header>
          <TavernList days={days} rows={oldest} now={now} week={false} />
        </article>
      </div>
      {unknown.length > 0 && (
        <details className="tavern-unknown">
          <summary>
            Sin fecha de actualización conocida ({unknown.length})
          </summary>
          <ul>
            {unknown.map((row) => (
              <li key={row.member.id}>
                <a
                  style={{ color: color(row.member) }}
                  href={memberHref(row.member)}
                >
                  {row.name}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
