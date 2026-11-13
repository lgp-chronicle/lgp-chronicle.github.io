import { GuildIcon } from "../components/guild-icon";
import { ago } from "./analytics";
import type { Profile } from "./types";

export function CharacterCollections({ profile, armory }: { profile: Profile; armory?: string }) {
  return <div className="grid-two dossier-sections">{(["mounts", "pets"] as const).map(kind => {
    const mounts = kind === "mounts";
    const items = profile.collections?.[kind];
    const stamp = profile.resourceTimes?.[kind];
    return <section className="panel dossier-panel collection-panel" key={kind}>
      <header className="dossier-heading"><h2>{mounts ? "Monturas" : "Mascotas"} {items && <small>· {items.length}</small>}</h2>
        {stamp && <time dateTime={stamp}>{ago(stamp)}</time>}</header>
      {items?.length ? <ul>{items.map(item => <li key={item.id}>
        {item.image ? <img src={item.image} alt="" width={88} height={66} loading="lazy" /> : <GuildIcon name={mounts ? "boot" : "clue"} size={36} />}
        <div><strong>{item.name}</strong>{item.family && <small>{item.family}</small>}</div>
      </li>)}</ul> : <p className="muted">{items ? (mounts ? "Todavía no hay monturas conseguidas." : "Todavía no hay mascotas conseguidas.") : "Pendiente de datos de la armería."}</p>}
      {armory && <a className="collection-source" href={armory + "collections/" + kind} target="_blank" rel="noreferrer">Ver en la armería ↗</a>}
    </section>;
  })}</div>;
}
