import { GuildIcon, type GuildIconName } from "../components/guild-icon";
import { archivePath } from "../lib/guild-navigation";
import { siteHref } from "../lib/public-settings";
import { color, numeric, type Member } from "./types";
import { display, leveling } from "./analytics";
import { fullName, memberHref } from "./member-portrait";
import { isCurrentMember } from "./membership";
import { hasRecentUpdate, spotlightWindowDays } from "./spotlight-freshness";
import "../app/guild-records.css";

export function GuildRecords({members,now,home=false}:{members:Member[];now:number;home?:boolean}) {
  const active=members.filter(m=>isCurrentMember(m)&&hasRecentUpdate(m,now));
  const metrics:{label:string;unit:string;icon:GuildIconName;get:(m:Member)=>unknown}[]=[
    {label:"Por delante en nivel",unit:"nivel",icon:"crown",get:m=>m.data.level},
    {label:"El equipo más brillante",unit:"nivel de objeto",icon:"ruby",get:m=>m.data.itemLevel},
    {label:"Pisando el acelerador",unit:"niveles · 24 h",icon:"boot",get:m=>leveling(m,now).day},
    {label:"El terror del otro bando",unit:"muertes honorables",icon:"swords",get:m=>m.data.honorableKills},
  ];
  return <section className="guild-record-strip" aria-labelledby={home?"home-records-title":"hall-records-title"}>
    <header><div><h2 id={home?"home-records-title":"hall-records-title"}>Récords de la hermandad</h2><p>Entre personajes activos en los últimos {spotlightWindowDays} días.</p></div>{home&&<a href={siteHref(archivePath("awards"))}>Ver premios →</a>}</header>
    <div>{metrics.map(metric=>{
      const entries=active.flatMap(m=>{const value=metric.get(m);return numeric(value)?[{member:m,value}]:[];});
      const value=entries.length?Math.max(...entries.map(e=>e.value)):undefined;
      const winners=value&&value>0?entries.filter(e=>e.value===value).map(e=>e.member):[];
      return <article key={metric.label}><h3><GuildIcon name={metric.icon} size={25}/>{metric.label}</h3>
        <p><b>{winners.length?display(value):"—"}</b><span>{metric.unit}</span></p>
        <div className="record-winners">{winners.slice(0,2).map(m=><a href={memberHref(m)} key={m.id} style={{color:color(m)}}>{fullName(m)}</a>)}
          {winners.length>2&&<details><summary>+{winners.length-2} empatados</summary><div>{winners.slice(2).map(m=><a href={memberHref(m)} key={m.id} style={{color:color(m)}}>{fullName(m)}</a>)}</div></details>}
          {!winners.length&&<span>Sin marca reciente</span>}
        </div>
      </article>;
    })}</div>
  </section>;
}
