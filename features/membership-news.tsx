import { color, type Activity, type Member } from "./types";
import { fullName, MemberLink, memberHref } from "./member-portrait";
import { welcomeParties } from "./membership";
import { WelcomeArt } from "./welcome-art";
import { siteHref } from "../lib/public-settings";
import { archivePath, withGalleryScene } from "../lib/guild-navigation";
import { LogIn, LogOut } from "lucide-react";

const dateLabel = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
function nameLink(m: Member) {
  return (
    <a href={memberHref(m)} style={{ color: color(m) }}>
      {fullName(m)}
    </a>
  );
}

export function MembershipNews({
  members,
  asOf,
}: {
  members: Member[];
  asOf: string;
}) {
  const since = new Date(Date.parse(asOf) - 29 * 86400000)
    .toISOString()
    .slice(0, 10);
  const parties = welcomeParties(members)
    .filter((p) => p.day >= since)
    .map((party) => ({
      party,
      current: party.members.filter(
        (m) =>
          m.membership?.joinedAt &&
          !m.membership.leftAt &&
          !m.membership.pendingAbsence &&
          m.welcomes?.some(
            (w) => w.id === party.id && w.joinedAt === m.membership!.joinedAt,
          ),
      ),
    }))
    .filter(({ current }) => current.length);
  const departed = members
    .filter((m) => m.membership?.leftAt && m.membership.leftAt >= since)
    .sort((a, b) => b.membership!.leftAt!.localeCompare(a.membership!.leftAt!));
  const arrivalCard = ({ party, current }: (typeof parties)[number]) => (
    <article className="arrival-card" key={party.id}>
      <a
        className="arrival-art"
        href={siteHref(withGalleryScene(archivePath("gallery"), party.id))}
        aria-label={"Ver portada de " + party.members.map(fullName).join(", ")}
      >
        <WelcomeArt party={party} />
      </a>
      <div className="arrival-caption">
        <time dateTime={party.day}>
          {dateLabel.format(new Date(party.day))}
        </time>
        <ul>
          {current.map((m) => (
            <li key={m.id}>
              {nameLink(m)}{" "}
              <small>
                {m.data.className} · Nv. {m.data.level}
              </small>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
  return (
    <div className="membership-news">
      <section aria-labelledby="guild-arrivals">
        <header>
          <h2 id="guild-arrivals">Nuevos integrantes</h2>
          <small>Últimos 30 días</small>
        </header>
        {parties.length ? (
          <>
            <div className="arrival-grid">
              {parties.slice(0, 2).map(arrivalCard)}
            </div>
            {parties.length > 2 && (
              <details>
                <summary>Más bienvenidas ({parties.length - 2})</summary>
                <div className="arrival-grid">
                  {parties.slice(2).map(arrivalCard)}
                </div>
              </details>
            )}
          </>
        ) : (
          <p>Sin incorporaciones registradas en este periodo.</p>
        )}
        <a
          className="membership-gallery"
          href={siteHref(archivePath("movimientos"))}
        >
          Ver altas y bajas en El Heraldo →
        </a>
      </section>
      <section aria-labelledby="guild-departures" className="departure-list">
        <header>
          <h2 id="guild-departures">Últimas salidas</h2>
          <small>Últimos 30 días</small>
        </header>
        {departed.length ? (
          <ul>
            {departed.slice(0, 3).map((m) => (
              <li key={m.id}>
                {nameLink(m)}{" "}
                <time dateTime={m.membership!.leftAt}>
                  {dateLabel.format(new Date(m.membership!.leftAt!))}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p>Sin salidas confirmadas en este periodo.</p>
        )}
        {departed.length > 3 && (
          <a
            className="membership-gallery"
            href={siteHref(archivePath("movimientos"))}
          >
            Ver todas las salidas →
          </a>
        )}
      </section>
    </div>
  );
}

export function MembershipArchive({
  members,
  events,
}: {
  members: Member[];
  events: Activity[];
}) {
  const dates = new Map<string, Activity[]>();
  for (const event of events) {
    const month = event.at.slice(0, 7);
    if (!dates.has(month)) dates.set(month, []);
    dates.get(month)!.push(event);
  }
  return (
    <section className="panel membership-archive">
      <h2 className="section-title">Altas y bajas</h2>
      {dates.size ? (
        [...dates].map(([month, rows]) => (
          <section key={month}>
            <h3>
              {new Date(month + "-01T12:00:00Z").toLocaleDateString("es-ES", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </h3>
            <ul>
              {rows.map((e) => {
                const m = members.find((member) => member.id === e.characterId);
                const joined = e.kind === "join";
                return (
                  <li key={e.id} data-kind={e.kind}>
                    <span className="movement-kind">
                      {joined ? <LogIn size={17} /> : <LogOut size={17} />}{" "}
                      {joined ? "Alta" : "Baja"}
                    </span>
                    {m ? (
                      <MemberLink member={m} />
                    ) : (
                      <span>{e.characterId}</span>
                    )}
                    <time dateTime={e.at}>
                      {dateLabel.format(new Date(e.at))}
                    </time>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      ) : (
        <p>Aún no hay altas ni bajas confirmadas en el registro.</p>
      )}
    </section>
  );
}
