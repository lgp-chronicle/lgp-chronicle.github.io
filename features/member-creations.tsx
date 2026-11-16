import { ArrowRight, ExternalLink } from "lucide-react";
import { GuildIcon } from "../components/guild-icon";
import { archivePath } from "../lib/guild-navigation";
import { assetUrl, siteHref } from "../lib/public-settings";
import { videosForMember } from "../lib/guild-videos";
import { KeenPanel } from "./keen-panel";
import { CinemaShortcut } from "./video-gallery";
import { color, type Member } from "./types";
import { fullName, memberHref } from "./member-portrait";
import "../app/member-creations.css";

const diaryUrl = "https://discord.com/channels/1551288910569808112/1569452969064140830";
export function MemberCreations({ members }: { members: Member[] }) {
  return <section className="member-creations" aria-labelledby="creations-title">
    <header><p className="eyebrow">Hecho por los nuestros</p><h2 id="creations-title">Creaciones de la hermandad</h2><p>Entre aventura y aventura, también hay tiempo para crear.</p></header>
    <CinemaShortcut />
    <KeenPanel />
    <FerrogardDiary members={members} />
  </section>;
}

export function FerrogardDiary({ members }: { members: Member[] }) {
  const ferrogard = members.find(m => m.id === "forever-eu-ferrogard-escudoferreo");
  return <section className="creator-diary">
      <img src={assetUrl("/guild/galeria/diario.webp")} alt="Ferrogard escribe de noche en su habitación, con su gorro de dormir." loading="lazy"/>
      <div><p className="eyebrow">Las crónicas de un aventurero</p><h2>El diario de Ferrogard</h2>
        <p>Las aventuras de la hermandad, contadas por {ferrogard ? <a href={memberHref(ferrogard)} style={{color:color(ferrogard)}}>{fullName(ferrogard)}</a> : "Ferrogard"}.</p>
        <a className="button outline" href={diaryUrl} target="_blank" rel="noopener noreferrer">Leer en Discord <ExternalLink size={15}/></a>
      </div>
  </section>;
}

export function CreationsPreview() {
  const count = videosForMember().length;
  return <section className="creations-preview" aria-labelledby="creations-preview-title">
    <header><h2 id="creations-preview-title">Creaciones de la hermandad</h2><a href={siteHref(archivePath("creations"))}>Ver todas <ArrowRight size={14}/></a></header>
    <div>
      <a href={siteHref(archivePath("creations"))}><GuildIcon name="engineering" size={30}/><span><small>Olynn Grandwell</small><strong>Keen</strong><em>El addon de la hermandad</em></span><ArrowRight size={16}/></a>
      <a href={diaryUrl} target="_blank" rel="noopener noreferrer"><GuildIcon name="journal" size={30}/><span><small>Ferrogard Escudoferreo</small><strong>El diario de Ferrogard</strong><em>Leer sus crónicas</em></span><ExternalLink size={16}/></a>
      <a href={siteHref(archivePath("videos"))}><GuildIcon name="spyglass" size={30}/><span><small>Vincie Quickhands</small><strong>El catalejo de Vincie</strong><em>{count ? count + (count === 1 ? " vídeo" : " vídeos") : "Relatos en movimiento"}</em></span><ArrowRight size={16}/></a>
    </div>
  </section>;
}
