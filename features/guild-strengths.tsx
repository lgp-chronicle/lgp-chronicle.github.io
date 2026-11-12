import { GuildIcon } from "../components/guild-icon";
import { HonorCard } from "./honor-card";
import {
  color,
  type Member,
  type MemberStrength,
  type GuildData,
} from "./types";
import { fullName, memberHref } from "./member-portrait";
import { display } from "./analytics";
import { hasRecentUpdate, spotlightWindowDays } from "./spotlight-freshness";

function numberLabel(s: MemberStrength) {
  return s.value === undefined
    ? ""
    : [display(s.value), s.unit].filter(Boolean).join(" ");
}

export function StrengthLine({ strength }: { strength: MemberStrength }) {
  return (
    <div className="strength-line">
      <GuildIcon name={strength.icon} size={30} />
      <div>
        <strong>
          {[strength.title, numberLabel(strength)].filter(Boolean).join(" · ")}
        </strong>
        <small>{strength.note}</small>
      </div>
    </div>
  );
}

export function GuildStrengths({ data }: { data: GuildData }) {
  const now = Date.now();
  const members = data.members.filter(
    (m): m is Member & { strength: MemberStrength } =>
      Boolean(m.strength) && hasRecentUpdate(m, now),
  );
  const sheet = new Map(members.map((m) => [m.id, m]));
  const edition = data.spotlight;
  const featured = edition?.members.flatMap((id) => sheet.get(id) ?? []) ?? [];
  if (!members.length)
    return (
      <p className="muted">
        {data.members.length
          ? `Sin actualizaciones de personajes registradas en los últimos ${spotlightWindowDays} días.`
          : "A la espera del próximo censo de la hermandad."}
      </p>
    );
  return (
    <>
      {edition && featured.length > 0 && (
        <p className="strength-edition">
          <time dateTime={edition.day}>
            {new Intl.DateTimeFormat("es", {
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            }).format(new Date(edition.day))}
          </time>
          <span>
            Entre quienes se han actualizado en los últimos{" "}
            {spotlightWindowDays} días, tienen prioridad los que llevan más
            tiempo sin salir.
          </span>
        </p>
      )}
      {featured.length ? (
        <div
          className="honor-gallery honors"
          aria-label="Protagonistas del día"
        >
          {featured.map((m) => (
            <HonorCard key={m.id} {...m.strength} winners={[m]} />
          ))}
        </div>
      ) : (
        <p className="muted">La próxima edición renovará los protagonistas.</p>
      )}
      <details className="strength-directory">
        <summary>
          Ver los puntos fuertes recientes{" "}
          <span>
            {members.length} {members.length === 1 ? "personaje" : "personajes"}
          </span>
        </summary>
        <ul>
          {members
            .sort((a, b) => fullName(a).localeCompare(fullName(b), "es"))
            .map((m) => (
              <li key={m.id}>
                <a href={memberHref(m) + "?tab=attributes"}>
                  <span className="strength-person" style={{ color: color(m) }}>
                    {fullName(m)}
                  </span>
                  <StrengthLine strength={m.strength} />
                </a>
              </li>
            ))}
        </ul>
      </details>
    </>
  );
}
