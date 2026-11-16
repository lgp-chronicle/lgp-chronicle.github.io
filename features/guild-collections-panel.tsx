import { useState } from "react";
import { GuildIcon } from "../components/guild-icon";
import { useActivityClock } from "../hooks/use-activity-clock";
import { color, type CollectionKind, type Member } from "./types";
import { guildCollection } from "./guild-collections";
import { fullName, memberHref } from "./member-portrait";
import { spotlightWindowDays } from "./spotlight-freshness";
import "../app/guild-collections.css";

export function GuildCollections({ members }: { members: Member[] }) {
  const now = useActivityClock();
  const [kind, setKind] = useState<CollectionKind>("mounts");
  const [query, setQuery] = useState("");
  const collections = { mounts: guildCollection(members,"mounts",now), pets: guildCollection(members,"pets",now) };
  const active = collections[kind];
  const labels = { mounts: "Monturas", pets: "Mascotas" };
  const icons = { mounts: "boot", pets: "clue" } as const;
  const matching = active.items.filter(({item}) => item.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")));
  const rankingRows = (rows: typeof active.ranking) => rows.map(row => <li key={row.member.id}>
    <span className="collection-rank">{row.rank===1&&row.count>0?<GuildIcon name="crown" size={23}/>:row.rank+".º"}</span>
    <a href={memberHref(row.member)+"?tab=collections"} style={{color:color(row.member)}}>{fullName(row.member)}</a>
    <strong>{row.count}</strong>
    <progress max={Math.max(1,active.ranking[0].count)} value={row.count} style={{color:color(row.member),accentColor:color(row.member)}} aria-label={fullName(row.member)+": "+row.count+" "+labels[kind].toLowerCase()} />
  </li>);
  return <section className="guild-collections" aria-labelledby="guild-collections-title">
    <header className="collections-heading">
      <p className="eyebrow">El tesoro compartido de La Ganga</p>
      <h2 id="guild-collections-title" className="section-title">Colecciones de la hermandad</h2>
      <p>Cada especie cuenta una sola vez, aunque la tengan varios personajes.</p>
    </header>
    <div className="collection-totals">
      {(["mounts","pets"] as const).map(k => <article key={k}>
        <GuildIcon name={icons[k]} size={42} />
        <div><h3>{labels[k]} distintas</h3><strong>{collections[k].coverage ? collections[k].distinct : "—"}</strong>
          <p>{collections[k].total} entre todos · {collections[k].coverage} de {collections[k].rosterSize} personajes con datos</p></div>
      </article>)}
    </div>
    <p className="collections-note">El total usa las últimas colecciones conocidas de los miembros actuales. Los juguetes todavía no están disponibles en la armería de Forever.</p>
    <div className="collections-kind" role="group" aria-label="Tipo de colección">
      {(["mounts","pets"] as const).map(k => <button key={k} className={kind===k?"button bronze":"button outline"} aria-pressed={kind===k}
        onClick={()=>{setKind(k);setQuery("");}}><GuildIcon name={icons[k]} size={22} />{labels[k]}</button>)}
    </div>
    <div className="collections-body">
      <section className="panel collection-ranking" aria-labelledby="collectors-title">
        <header><GuildIcon name="crown" size={26}/><h3 id="collectors-title">Los coleccionistas</h3></header>
        <p>Con cambios y colección consultada en los últimos {spotlightWindowDays} días. Los empates comparten puesto.</p>
        {active.ranking.length ? <>
          <ol>{rankingRows(active.ranking.slice(0,8))}</ol>
          {active.ranking.length>8&&<details className="collection-ranking-more" key={kind}>
            <summary>Ver los {active.ranking.length} coleccionistas</summary>
            <ol start={9}>{rankingRows(active.ranking.slice(8))}</ol>
          </details>}
        </> : <p className="muted">No hay colecciones recientes para este ranking.</p>}
      </section>
      <section className="panel collection-catalogue" aria-labelledby="shared-collection-title">
        <header><div><h3 id="shared-collection-title">De mano en mano</h3><p>Primero, las más compartidas. {active.singleOwner===1?"Una solo aparece en una ficha.":active.singleOwner+" solo aparecen en una ficha."}</p></div>
          <label><span className="sr-only">Buscar en la colección</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={"Buscar "+labels[kind].toLowerCase()+"…"}/></label>
        </header>
        {matching.length ? <ul>{matching.map(({item,owners}) => <li key={item.id}>
          <div className="collectible-art"><GuildIcon name={icons[kind]} size={34}/>{item.image&&<img src={item.image} alt="" loading="lazy" width={112} height={84} onError={e=>{e.currentTarget.hidden=true;}}/>}</div>
          <div><strong>{item.name}</strong><small>{owners.length===1?"Solo en una ficha":owners.length+" personajes"}</small>
            <details><summary>Quién la tiene</summary><div className="collectible-owners">{owners.map(m=><a key={m.id} href={memberHref(m)+"?tab=collections"} style={{color:color(m)}}>{fullName(m)}</a>)}</div></details>
          </div>
        </li>)}</ul>:<p className="muted">{query?"No hay coincidencias.":"Todavía no hay colecciones registradas."}</p>}
      </section>
    </div>
  </section>;
}
