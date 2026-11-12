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
  const members = data.members.filter(
    (m): m is Member & { strength: MemberStrength } => Boolean(m.strength),
  );
  const sheet = new Map(members.map((m) => [m.id, m]));
  const edition = data.spotlight;
  const featured = edition?.members.flatMap((id) => sheet.get(id) ?? []) ?? [];
  if (!members.length)
    return (
      <p className="muted">A la espera del próximo censo de la hermandad.</p>
    );
  return (
    <>
      {edition && (
        <p className="strength-edition">
          <time dateTime={edition.day}>
            {new Intl.DateTimeFormat("es", {
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            }).format(new Date(edition.day))}
          </time>
          <span>
            Hoy tienen el turno quienes llevan más tiempo sin aparecer.
          </span>
        </p>
      )}
      <div className="honor-gallery honors" aria-label="Protagonistas del día">
        {featured.map((m) => (
          <HonorCard key={m.id} {...m.strength} winners={[m]} />
        ))}
      </div>
      <details className="strength-directory">
        <summary>
          Ver los puntos fuertes de toda la hermandad{" "}
          <span>{members.length} personajes</span>
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
