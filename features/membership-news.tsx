import { color, type Member } from "./types";
import { fullName, memberHref } from "./member-portrait";
import { welcomeParties } from "./membership";
import { WelcomeArt } from "./welcome-art";
import { siteHref } from "../lib/public-settings";
import { archivePath } from "../lib/guild-navigation";

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
  return (
    <div className="membership-news">
      <section aria-labelledby="guild-arrivals">
        <header>
          <h2 id="guild-arrivals">Nuevos integrantes</h2>
          <small>Últimos 30 días</small>
        </header>
        {parties.length ? (
          <div className="arrival-grid">
            {parties.map(({ party, current }) => (
              <article className="arrival-card" key={party.id}>
                <a
                  className="arrival-art"
                  href={
                    "?portada=" + encodeURIComponent(party.id) + siteHref("/")
                  }
                  aria-label={
                    "Ver portada de " + party.members.map(fullName).join(", ")
                  }
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
            ))}
          </div>
        ) : (
          <p>Sin incorporaciones registradas en este periodo.</p>
        )}
        {parties.length > 0 && (
          <a
            className="membership-gallery"
            href={siteHref(archivePath("gallery"))}
          >
            Ver galería de portadas
          </a>
        )}
      </section>
      <section aria-labelledby="guild-departures" className="departure-list">
        <header>
          <h2 id="guild-departures">Últimas salidas</h2>
          <small>Últimos 30 días</small>
        </header>
        {departed.length ? (
          <ul>
            {departed.map((m) => (
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
      </section>
    </div>
  );
}
