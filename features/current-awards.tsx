import type { CSSProperties } from "react";
import { useEntryState } from "../hooks/use-entry-state";
import { Search } from "lucide-react";
import { GuildIcon, type GuildIconName } from "../components/guild-icon";
import { assetUrl } from "../lib/public-settings";
import { searchable } from "../lib/guild-navigation";
import { CharacterArt, hasEntrancePortrait } from "./character-art";
import { FittedName, fullName, memberHref } from "./member-portrait";
import { display, type Award } from "./analytics";
import { color, type Member } from "./types";
import { finishTitle } from "./race-course";
import { spotlightWindowDays } from "./spotlight-freshness";
import { ninjaLoot } from "./ninja-loot";
import { wowheadUrl } from "./armory-data";
import "../app/current-awards.css";

const categories = [
  { id: "progress", label: "Progreso", icon: "steps" },
  { id: "combat", label: "Combate", icon: "swords" },
  { id: "attributes", label: "Atributos", icon: "stamina" },
  { id: "equipment", label: "Equipo", icon: "shield" },
  { id: "world", label: "Oficios y mundo", icon: "compass" },
  { id: "collections", label: "Colecciones", icon: "crate" },
] as const;
type Category = (typeof categories)[number]["id"];
const definitions: Record<string, { category: Category; icon: GuildIconName; unit: string }> = {
  stamina:{category:"attributes",icon:"stamina",unit:"aguante"}, intellect:{category:"attributes",icon:"intellect",unit:"intelecto"},
  strength:{category:"attributes",icon:"strength",unit:"fuerza"}, agility:{category:"attributes",icon:"agility",unit:"agilidad"},
  spirit:{category:"attributes",icon:"spirit",unit:"espíritu"}, armor:{category:"attributes",icon:"armor",unit:"armadura"},
  level:{category:"progress",icon:"finish",unit:"nivel"}, speed:{category:"progress",icon:"boot",unit:"niveles · 24 h"},
  week:{category:"progress",icon:"steps",unit:"niveles · 7 días"}, journey:{category:"progress",icon:"compass",unit:"niveles desde el registro"},
  newcomer:{category:"progress",icon:"tabard",unit:"Última ficha registrada"}, main:{category:"progress",icon:"crown",unit:"premios liderados"},
  pvp:{category:"combat",icon:"medal",unit:"muertes honorables"}, pvpday:{category:"combat",icon:"swords",unit:"muertes honorables · 24 h"},
  pvpweek:{category:"combat",icon:"swords",unit:"muertes honorables · 7 días"}, honor:{category:"combat",icon:"medal",unit:"honor"},
  "bg-wins":{category:"combat",icon:"swords",unit:"victorias"}, pve:{category:"combat",icon:"helmet",unit:"jefes distintos"},
  parse:{category:"combat",icon:"ruby",unit:"% de parse"}, dps:{category:"combat",icon:"attack",unit:"DPS"}, hps:{category:"combat",icon:"health",unit:"HPS"},
  "boss-destroyer":{category:"combat",icon:"helmet",unit:"victorias contra jefes · 7 días"}, repair:{category:"combat",icon:"blacksmithing",unit:"wipes · 7 días"},
  combat:{category:"combat",icon:"swords",unit:"minutos de combate · 7 días"},
  gear:{category:"equipment",icon:"shield",unit:"nivel de objeto"}, goblin:{category:"equipment",icon:"coin",unit:"puntos de equipo · 7 días"},
  epic:{category:"equipment",icon:"ruby",unit:"piezas épicas"}, legend:{category:"equipment",icon:"trophy",unit:"piezas legendarias"},
  "ninja-loot":{category:"equipment",icon:"coin",unit:"puntos fuera de su especialización"},
  profession:{category:"world",icon:"blacksmithing",unit:"puntos de profesiones"}, craft:{category:"world",icon:"engineering",unit:"profesiones al tope de su tramo"},
  book:{category:"world",icon:"journal",unit:"puntos de logros"}, rep:{category:"world",icon:"tabard",unit:"reputaciones en Exaltado"},
  mounts:{category:"collections",icon:"boot",unit:"monturas distintas"}, pets:{category:"collections",icon:"clue",unit:"mascotas distintas"},
  [finishTitle.id]:{category:"progress",icon:"tabard",unit:"nivel · título permanente"},
};
function presentation(award: Award) {
  return definitions[award.id] ?? (award.id.startsWith("bg-map-")
    ? {category:"combat" as const,icon:"finish" as const,unit:"victorias"}
    : {category:"world" as const,icon:"trophy" as const,unit:"puntos"});
}

function AwardCard({ award, members }: { award: Award; members: Member[] }) {
  const meta = presentation(award);
  const winners = members.filter(m=>award.memberIds.includes(m.id)).sort((a,b)=>fullName(a).localeCompare(fullName(b),"es"));
  const shown = winners.slice(0,3);
  const shared = winners.length>1;
  return <article className="current-award" data-category={meta.category} data-shared={shared||undefined} data-award={award.id}>
    <header><GuildIcon name={meta.icon} size={30}/><h4>{award.title}</h4></header>
    <div className="current-award-stage">
      <div className="current-award-score">
        <b>{award.id==="newcomer"?"¡Buenas!":display(award.value)}</b><span>{meta.unit}</span>
        {shared&&<small>Empate · {winners.length} personajes</small>}
      </div>
      <div className="current-award-cast" style={{"--cast-count":shown.length} as CSSProperties}>
        {shown.map(m=><a key={m.id} href={memberHref(m)} aria-label={"Ver ficha de "+fullName(m)} title={fullName(m)}>
          {hasEntrancePortrait(m)?<CharacterArt member={m} honor/>:<img className="current-award-seal" src={assetUrl("/guild/sello-la-ganga.png")} alt=""/>}
        </a>)}
      </div>
    </div>
    <div className="current-award-names" style={{"--cast-count":shown.length} as CSSProperties}>
      {shown.map(m=><a key={m.id} href={memberHref(m)} style={{color:color(m)}} aria-label={"Ver ficha de "+fullName(m)}><FittedName name={fullName(m)} given={m.name}/>{!shared&&<small>{m.data.className}</small>}</a>)}
    </div>
    {winners.length>3&&<details className="current-award-ties"><summary>Ver los {winners.length} ganadores</summary><div>{winners.map(m=><a key={m.id} href={memberHref(m)} style={{color:color(m)}}>{fullName(m)}</a>)}</div></details>}
    <details className="current-award-rule"><summary>{award.id==="ninja-loot"?"Inspeccionar el botín":"Cómo se gana"}</summary>
      <p>{award.rule}</p>
      {award.id==="ninja-loot"&&winners.map(m=><div key={m.id}><strong style={{color:color(m)}}>{fullName(m)} · {m.data.spec}</strong>
        <ul>{ninjaLoot(m)?.items.map(({item,bonuses},i)=><li key={i}><a href={wowheadUrl("item",item.id,item.name)} target="_blank" rel="noreferrer">{item.name}</a> · {bonuses.join(", ")}</li>)}</ul>
      </div>)}
    </details>
  </article>;
}

export function CurrentAwards({ awards, members }: { awards: Award[]; members: Member[] }) {
  const [category,setCategory]=useEntryState<Category|"all">("awardCategory","all"),[query,setQuery]=useEntryState<string>("awardQuery","");
  const permanent=awards.filter(a=>a.id===finishTitle.id),current=awards.filter(a=>a.id!==finishTitle.id);
  const available=categories.filter(c=>current.some(a=>presentation(a).category===c.id));
  const selected=available.some(c=>c.id===category)?category:"all";
  const names=new Map(members.map(m=>[m.id,fullName(m)]));
  const matches=current.filter(a=>(selected==="all"||presentation(a).category===selected)&&searchable([a.title,a.rule,...a.memberIds.map(id=>names.get(id)??"")].join(" ")).includes(searchable(query)));
  const ordered=matches.toSorted((a,b)=>categories.findIndex(c=>c.id===presentation(a).category)-categories.findIndex(c=>c.id===presentation(b).category));
  return <section className="current-awards" aria-labelledby="current-awards-heading">
    <header className="current-awards-heading"><div><p className="eyebrow">La gloria cambia de manos</p><h3 id="current-awards-heading">Premios actuales</h3><p>Entre personajes con cambios en los últimos {spotlightWindowDays} días.</p></div>
      <span><b>{current.length}</b> premios · <b>{new Set(current.flatMap(a=>a.memberIds)).size}</b> protagonistas</span>
    </header>
    <div className="current-awards-tools"><div className="current-awards-filters" role="group" aria-label="Categorías de premios">
      <button type="button" aria-pressed={selected==="all"} onClick={()=>setCategory("all")}><GuildIcon name="crown" size={22}/>Todos <small>{current.length}</small></button>
      {available.map(c=><button type="button" key={c.id} aria-pressed={selected===c.id} onClick={()=>setCategory(c.id)}><GuildIcon name={c.icon} size={22}/>{c.label}<small>{current.filter(a=>presentation(a).category===c.id).length}</small></button>)}
    </div><label className="current-awards-search"><Search size={15}/><span className="sr-only">Buscar premio o personaje</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Premio o personaje…"/></label></div>
    <div className="current-awards-grid">{ordered.map(a=><AwardCard key={a.id} award={a} members={members}/>)}</div>
    {!matches.length&&<p className="current-awards-empty">{current.length?"No hay premios con esa búsqueda.":"Todavía no hay registros recientes suficientes para repartir premios."}</p>}
    {!!permanent.length&&<section className="current-awards-earned"><h4>Títulos conquistados</h4><p>Estos títulos se conservan aunque el personaje descanse.</p><div className="current-awards-grid">{permanent.map(a=><AwardCard key={a.id} award={a} members={members}/>)}</div></section>}
  </section>;
}
