import { useEntryState } from "../hooks/use-entry-state";
import { Search } from "lucide-react";
import { GuildIcon, type GuildIconName } from "../components/guild-icon";
import { assetUrl } from "../lib/public-settings";
import { searchable } from "../lib/guild-navigation";
import { CharacterArt, hasEntrancePortrait } from "./character-art";
import { fullName, memberHref } from "./member-portrait";
import { tavernActivity } from "./tavern-activity";
import { ago } from "./analytics";
import { color, type Member } from "./types";
import "../app/member-activity.css";

const weekday=new Intl.DateTimeFormat("es",{weekday:"short",timeZone:"UTC"});
const date=new Intl.DateTimeFormat("es",{day:"numeric",month:"short",timeZone:"UTC"});
const filters:{id:"all"|"active"|"resting"|"unknown";label:string;note:string;icon:GuildIconName}[]=[
  {id:"active",label:"Con novedades",note:"La ficha cambió en los últimos 5 días",icon:"boot"},
  {id:"resting",label:"Sin novedades recientes",note:"5 días o más sin cambios registrados",icon:"campfire"},
  {id:"unknown",label:"Aún sin historial",note:"Todavía no podemos fechar sus cambios",icon:"spyglass"},
];
export function MemberActivity({members,now}:{members:Member[];now:number}) {
  const [filter,setFilter]=useEntryState<(typeof filters)[number]["id"]>("activityFilter","all"),[query,setQuery]=useEntryState<string>("activityQuery","");
  const {days,rows}=tavernActivity(members,new Date(now).toISOString());
  const matching=rows.filter(r=>(filter==="all"||r.state===filter)&&searchable(r.name).includes(searchable(query)))
    .sort((a,b)=>filter==="resting"?a.last-b.last||a.name.localeCompare(b.name,"es"):b.activeDays.size-a.activeDays.size||((Number.isFinite(b.last)?b.last:0)-(Number.isFinite(a.last)?a.last:0))||a.name.localeCompare(b.name,"es"));
  return <section className="member-activity" aria-labelledby="member-activity-title">
    <header className="member-activity-heading"><GuildIcon name="campfire" size={42}/><div><p className="eyebrow">El pulso de La Ganga</p><h2 id="member-activity-title">La armería, día a día</h2><p>Cada marca dorada es un día con una actualización o un cambio detectado en la ficha.</p></div></header>
    <div className="activity-filters" role="group" aria-label="Filtrar actividad">{filters.map(f=><button key={f.id} type="button" aria-pressed={filter===f.id} onClick={()=>setFilter(filter===f.id?"all":f.id)}>
      <GuildIcon name={f.icon} size={30}/><span><b>{f.label}</b><small>{f.note}</small></span><strong>{f.id==="all"?rows.length:rows.filter(r=>r.state===f.id).length}</strong>
    </button>)}</div>
    <div className="activity-directory-heading"><div><h3>Los últimos 7 días</h3><div className="activity-legend"><span><i aria-hidden="true"/>Con novedades</span><span><i className="activity-legend-empty" aria-hidden="true"/>Sin novedades registradas</span></div></div>{filter!=="all"&&<button type="button" className="activity-clear" onClick={()=>setFilter("all")}>Quitar filtro</button>}<label><Search size={15}/><span className="sr-only">Buscar en actividad</span><input type="search" placeholder="Buscar personaje…" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
    <ul className="activity-directory">{matching.map(row=><li key={row.member.id} data-state={row.state}>
      <a className="activity-figure" href={memberHref(row.member)} aria-label={"Ver ficha de "+row.name}>
        {hasEntrancePortrait(row.member)?<CharacterArt member={row.member} honor/>:<img src={assetUrl("/guild/sello-la-ganga.png")} alt=""/>}
      </a>
      <a className="activity-name" href={memberHref(row.member)} style={{color:color(row.member)}}>{fullName(row.member)}</a>
      <b className="activity-day-count">{row.state==="unknown"&&!row.activeDays.size?<>—<small>Sin historial</small></>:<>{row.activeDays.size} {row.activeDays.size===1?"día":"días"}<small>con novedades</small></>}</b>
      <div className="activity-week" aria-label={row.state==="unknown"&&!row.activeDays.size?"Sin historial de novedades":row.activeDays.size+(row.activeDays.size===1?" día":" días")+" con novedades en los últimos 7 días"}>{days.map(day=><span key={day} data-active={row.activeDays.has(day)||undefined} title={date.format(day)+(row.activeDays.has(day)?" · Actualización o cambio en la ficha":" · Sin novedades registradas")}><span aria-hidden="true">{weekday.format(day).replace(".","")} <b>{new Date(day).getUTCDate()}</b></span><span className="sr-only">{date.format(day)}: {row.activeDays.has(day)?"actualización o cambio en la ficha":"sin novedades registradas"}</span></span>)}</div>
      <p className="activity-last">{Number.isFinite(row.last)?<>Última novedad: <time dateTime={new Date(row.last).toISOString()}>{ago(new Date(row.last).toISOString(),now).toLocaleLowerCase("es")}</time></>:"Pendiente de historial"}</p>
    </li>)}</ul>
    {!matching.length&&<p className="activity-empty">{query?"No hay personajes con ese nombre.":filter==="resting"?"Nadie lleva cinco días sin novedades confirmadas.":"Todavía no hay personajes en este grupo."}</p>}
    <p className="activity-explanation">Una marca por día, aunque haya varios cambios. Fechas en UTC · No cuentan los personajes de nivel 1.</p>
    <details className="activity-help"><summary>¿Qué nos dice este registro?</summary><p>Recoge las actualizaciones que publica la armería y los cambios que detectamos entre consultas. Una casilla vacía significa que no registramos novedades ese día; el personaje puede haber jugado igualmente. El contador muestra días con novedades, no horas de juego ni conexiones.</p></details>
  </section>;
}
