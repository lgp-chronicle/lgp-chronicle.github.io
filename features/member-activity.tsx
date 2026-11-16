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
  {id:"all",label:"Toda la hermandad",note:"Sin bancos de nivel 1",icon:"tabard"},
  {id:"active",label:"Una misión más",note:"Cambios en los últimos 5 días",icon:"boot"},
  {id:"resting",label:"En la posada",note:"5 días o más sin novedades",icon:"campfire"},
  {id:"unknown",label:"Sin rastro todavía",note:"Sin fecha de actividad fiable",icon:"spyglass"},
];
export function MemberActivity({members,now}:{members:Member[];now:number}) {
  const [filter,setFilter]=useEntryState<(typeof filters)[number]["id"]>("activityFilter","all"),[query,setQuery]=useEntryState<string>("activityQuery","");
  const {days,rows}=tavernActivity(members,new Date(now).toISOString());
  const matching=rows.filter(r=>(filter==="all"||r.state===filter)&&searchable(r.name).includes(searchable(query)))
    .sort((a,b)=>filter==="resting"?a.last-b.last||a.name.localeCompare(b.name,"es"):b.activeDays.size-a.activeDays.size||((Number.isFinite(b.last)?b.last:0)-(Number.isFinite(a.last)?a.last:0))||a.name.localeCompare(b.name,"es"));
  return <section className="member-activity" aria-labelledby="member-activity-title">
    <header className="member-activity-heading"><GuildIcon name="campfire" size={42}/><div><p className="eyebrow">El pulso de La Ganga</p><h2 id="member-activity-title">Actividad de los miembros</h2><p>Cambios en la armería, no tiempo de juego ni estado de conexión.</p></div></header>
    <div className="activity-filters" role="group" aria-label="Filtrar actividad">{filters.map(f=><button key={f.id} type="button" aria-pressed={filter===f.id} onClick={()=>setFilter(f.id)}>
      <GuildIcon name={f.icon} size={30}/><span><b>{f.label}</b><small>{f.note}</small></span><strong>{f.id==="all"?rows.length:rows.filter(r=>r.state===f.id).length}</strong>
    </button>)}</div>
    <div className="activity-directory-heading"><div><h3>Los últimos 7 días</h3><p><i/>Día con cambios · UTC</p></div><label><Search size={15}/><span className="sr-only">Buscar en actividad</span><input type="search" placeholder="Buscar personaje…" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
    <ul className="activity-directory">{matching.map(row=><li key={row.member.id} data-state={row.state}>
      <a className="activity-figure" href={memberHref(row.member)} aria-label={"Ver ficha de "+row.name}>
        {hasEntrancePortrait(row.member)?<CharacterArt member={row.member} honor/>:<img src={assetUrl("/guild/sello-la-ganga.png")} alt=""/>}
      </a>
      <a className="activity-name" href={memberHref(row.member)} style={{color:color(row.member)}}>{fullName(row.member)}</a>
      <b className="activity-day-count">{row.activeDays.size}<small>/ 7 días</small></b>
      <div className="activity-week" aria-label={row.activeDays.size+" días con cambios"}>{days.map(day=><span key={day} data-active={row.activeDays.has(day)||undefined} title={date.format(day)+(row.activeDays.has(day)?" · Con cambios":" · Sin cambios registrados")}><span aria-hidden="true">{weekday.format(day).slice(0,2)}</span><span className="sr-only">{date.format(day)}: {row.activeDays.has(day)?"con cambios":"sin cambios registrados"}</span></span>)}</div>
      <p className="activity-last">{Number.isFinite(row.last)?<>Último cambio: <time dateTime={new Date(row.last).toISOString()}>{ago(new Date(row.last).toISOString(),now).toLocaleLowerCase("es")}</time></>:"Sin fecha de actividad confirmada"}{row.state==="resting"&&<span>De descanso</span>}</p>
    </li>)}</ul>
    {!matching.length&&<p className="activity-empty">{query?"No hay personajes con ese nombre.":filter==="resting"?"Nadie lleva cinco días sin novedades confirmadas.":"Todavía no hay personajes en este grupo."}</p>}
  </section>;
}
