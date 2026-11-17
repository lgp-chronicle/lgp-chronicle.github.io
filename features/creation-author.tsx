import { siteHref } from "../lib/public-settings";
import { fullName, memberHref, Portrait } from "./member-portrait";
import { color, type Member } from "./types";
import "../app/creation-author.css";

export function CreationAuthor({ members, id, name, linked = true }: {
  members: Member[]; id: string; name: string; linked?: boolean;
}) {
  const member = members.find(m => m.id === id);
  const label = member ? fullName(member) : name;
  const style = member ? { color: color(member) } : undefined;
  return <div className="creation-author">
    {member && <Portrait member={member} />}
    <span className="creation-author-copy">Una creación de
      {linked
        ? <a className="creation-author-name" href={member ? memberHref(member) : siteHref("/character/" + id)} style={style}>{label}</a>
        : <span className="creation-author-name" style={style}>{label}</span>}
    </span>
  </div>;
}
