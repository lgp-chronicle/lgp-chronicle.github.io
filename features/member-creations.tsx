import { ArrowRight } from "lucide-react";
import { GuildIcon, type GuildIconName } from "../components/guild-icon";
import { archivePath, type GuildSection } from "../lib/guild-navigation";
import { assetUrl, siteHref } from "../lib/public-settings";
import { isNewVideo, videosForMember } from "../lib/guild-videos";
import { guildWallpaper } from "../lib/guild-wallpaper";
import { useActivityClock } from "../hooks/use-activity-clock";
import type { Member } from "./types";
import { CreationAuthor } from "./creation-author";
import "../app/member-creations.css";

const creations: { id: GuildSection; type: string; icon: GuildIconName; authorId: string; author: string; title: string; description: string; image: string; mobile: string }[] = [
  { id: "videos", type: "Relatos", icon: "spyglass", authorId: "forever-eu-vincie-quickhands", author: "Vincie Quickhands", title: "Las historias de Vincie", description: "Grandes aventuras. Y alguna que otra exageración.", image: assetUrl("/guild/historias-vincie.webp"), mobile: assetUrl("/guild/historias-vincie-movil.webp") },
  { id: "keen", type: "Addon", icon: "keen", authorId: "forever-eu-olynn-grandwell", author: "Olynn Grandwell", title: "Keen · El taller de Olynn", description: "Un poco de ingenio para tus aventuras en Azeroth.", image: assetUrl("/guild/keen-olynn.webp"), mobile: assetUrl("/guild/keen-olynn-movil.webp") },
  { id: "diario", type: "Diario", icon: "journal", authorId: "forever-eu-ferrogard-escudoferreo", author: "Ferrogard Escudoferreo", title: "El diario de Ferrogard", description: "Las aventuras de La Ganga, a la luz de una vela.", image: new URL("../app/art/diario.webp", import.meta.url).href, mobile: new URL("../app/art/diario-movil.webp", import.meta.url).href },
  { id: "wallpaper", type: "Wallpaper Engine", icon: "keep", authorId: guildWallpaper.authorId, author: guildWallpaper.author, title: guildWallpaper.title, description: "El fondo de la hermandad, con nuevos personajes a petición.", image: guildWallpaper.image, mobile: guildWallpaper.image },
];

function CreationsGrid({ members, compact = false }: { members: Member[]; compact?: boolean }) {
  const now = useActivityClock();
  const hasNewStory = isNewVideo(videosForMember(undefined, now)[0], now);
  return <div className={"creations-grid" + (compact ? " creations-grid--compact" : "")}>
    {creations.map(creation => <a key={creation.id} className={"creation-card creation-card--" + creation.id} href={siteHref(archivePath(creation.id))}>
      <div className="creation-card-scene">
        <picture><source media="(max-width: 700px)" srcSet={creation.mobile} /><img src={creation.image} width={800} height={450} alt="" loading="lazy" /></picture>
        <span className="creation-card-kind"><GuildIcon name={creation.icon} size={20} />{creation.type}</span>
        {creation.id === "videos" && hasNewStory && <strong className="video-new-badge">Nueva historia</strong>}
        <h3>{creation.title}</h3>
      </div>
      <div className="creation-card-body">
        <p>{creation.description}</p>
        <div className="creation-card-footer"><CreationAuthor members={members} id={creation.authorId} name={creation.author} linked={false} /><ArrowRight size={18} aria-hidden="true" /></div>
      </div>
    </a>)}
  </div>;
}

export function MemberCreations({ members }: { members: Member[] }) {
  return <section className="member-creations" aria-labelledby="creations-title">
    <header><p className="eyebrow">Hecho por los nuestros</p><h2 id="creations-title">Creaciones de la hermandad</h2><p>Entre aventura y aventura, también hay tiempo para crear.</p></header>
    <CreationsGrid members={members} />
  </section>;
}

export function CreationsPreview({ members }: { members: Member[] }) {
  return <section className="creations-preview" aria-labelledby="creations-preview-title">
    <header className="creations-heading"><div><p className="eyebrow">Hecho por los nuestros</p><h2 id="creations-preview-title">Creaciones de la hermandad</h2></div><a href={siteHref(archivePath("creations"))}>Ver todas <ArrowRight size={14} aria-hidden="true" /></a></header>
    <CreationsGrid members={members} compact />
  </section>;
}

export function FerrogardDiary({ members }: { members: Member[] }) {
  return <a className="creator-diary creation-shortcut" href={siteHref(archivePath("diario"))}>
    <img src={new URL("../app/art/diario.webp", import.meta.url).href} alt="Ferrogard escribe de noche en su habitación, con su gorro de dormir." loading="lazy" />
    <div><p className="eyebrow">Las crónicas de un aventurero</p><h2>El diario de Ferrogard</h2>
      <p>Las aventuras de la hermandad, a la luz de una vela.</p>
      <CreationAuthor members={members} id="forever-eu-ferrogard-escudoferreo" name="Ferrogard Escudoferreo" linked={false} />
      <span className="button outline">Abrir el diario <ArrowRight size={15} /></span>
    </div>
  </a>;
}
