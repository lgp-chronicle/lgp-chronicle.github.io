import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
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
  { id: "wallpaper", type: "Wallpaper Engine · " + guildWallpaper.editions.length + " fondos", icon: "keep", authorId: guildWallpaper.authorId, author: guildWallpaper.author, title: guildWallpaper.title, description: "Naisen y Vincie, ya en tu escritorio. Más personajes a petición.", image: guildWallpaper.image, mobile: guildWallpaper.image },
];

function CreationsGrid({ members, compact = false, activeIndex = 0 }: { members: Member[]; compact?: boolean; activeIndex?: number }) {
  const now = useActivityClock();
  const hasNewStory = isNewVideo(videosForMember(undefined, now)[0], now);
  return <div className={"creations-grid" + (compact ? " creations-grid--compact" : "")}>
    {creations.map((creation, index) => <a key={creation.id} className={"creation-card creation-card--" + creation.id} href={siteHref(archivePath(creation.id))} inert={compact && index !== activeIndex}>
      <div className="creation-card-scene">
        <picture><source media="(max-width: 700px)" srcSet={creation.mobile} /><img src={creation.image} width={800} height={450} alt="" loading="lazy" draggable={false} /></picture>
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
  const section = useRef<HTMLElement>(null);
  const [viewport, carousel] = useEmblaCarousel({ loop: true, align: "start", duration: 28 });
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) setPlaying(false);
    };
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    preference.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.4), { threshold: 0.4 });
    if (section.current) observer.observe(section.current);
    return () => {
      preference.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!carousel) return;
    const update = () => setActive(carousel.selectedScrollSnap());
    const pause = () => setPlaying(false);
    carousel.on("select", update).on("reInit", update).on("pointerDown", pause);
    update();
    return () => { carousel.off("select", update).off("reInit", update).off("pointerDown", pause); };
  }, [carousel]);

  useEffect(() => {
    if (!carousel || !playing || hovered || !inView || !pageVisible) return;
    const timer = window.setTimeout(() => carousel.scrollNext(reducedMotion), 6000);
    return () => window.clearTimeout(timer);
  }, [carousel, active, playing, hovered, inView, pageVisible, reducedMotion]);

  const move = (direction: -1 | 1) => {
    setPlaying(false);
    if (direction === 1) carousel?.scrollNext(reducedMotion);
    else carousel?.scrollPrev(reducedMotion);
  };
  return <section className="creations-preview" ref={section} aria-labelledby="creations-preview-title" aria-roledescription="carrusel"
    onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }}
    onPointerLeave={event => { if (event.pointerType === "mouse") setHovered(false); }}
    onFocusCapture={event => { if (!(event.target instanceof HTMLElement && event.target.closest("[data-autoplay-control]"))) setPlaying(false); }}>
    <header className="creations-heading">
      <div><p className="eyebrow">Hecho por los nuestros</p><h2 id="creations-preview-title">Creaciones de la hermandad</h2></div>
      <div className="creations-controls">
        <a href={siteHref(archivePath("creations"))}>Ver todas <ArrowRight size={14} aria-hidden="true" /></a>
        <button className="button outline" data-autoplay-control type="button" aria-label={playing ? "Pausar carrusel" : "Reproducir carrusel"} title={playing ? "Pausar" : "Reproducir"} onClick={() => setPlaying(current => !current)}>{playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}</button>
        <button className="button outline" type="button" aria-label="Creación anterior" aria-controls="creations-rail" onClick={() => move(-1)}><ArrowLeft size={18} aria-hidden="true" /></button>
        <button className="button outline" type="button" aria-label="Siguiente creación" aria-controls="creations-rail" onClick={() => move(1)}><ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </header>
    <div id="creations-rail" className="creations-rail" ref={viewport} role="group" aria-label="Banners de las creaciones de la hermandad" tabIndex={0} onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(event.key === "ArrowLeft" ? -1 : 1);
      }
    }}>
      <CreationsGrid members={members} compact activeIndex={active} />
    </div>
    <div className="creations-pagination" aria-label="Elegir creación">
      {creations.map((creation, index) => <button key={creation.id} type="button" aria-label={"Mostrar " + creation.title} aria-current={active === index ? "true" : undefined} aria-controls="creations-rail" onClick={() => { setPlaying(false); carousel?.scrollTo(index, reducedMotion); }}><span /></button>)}
      <span className="creations-position">{active + 1} / {creations.length}</span>
    </div>
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
