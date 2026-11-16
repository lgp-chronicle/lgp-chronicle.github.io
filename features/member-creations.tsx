import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Pause, Play } from "lucide-react";
import { archivePath } from "../lib/guild-navigation";
import { assetUrl, siteHref } from "../lib/public-settings";
import { isNewVideo, videosForMember, withGalleryVideo } from "../lib/guild-videos";
import { useActivityClock } from "../hooks/use-activity-clock";
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
  const now = useActivityClock();
  const latestVideo = videosForMember(undefined, now)[0];
  const hasNewStory = isNewVideo(latestVideo, now);
  const creations = [
    { id: "vincie", author: "Vincie Quickhands", title: "Las historias de Vincie", description: "Grandes aventuras. Y alguna que otra exageración.", action: hasNewStory ? "Ver nueva historia" : latestVideo ? "Ver sus relatos" : "Explorar sus relatos", image: assetUrl("/guild/historias-vincie.webp"), mobile: assetUrl("/guild/historias-vincie-movil.webp"), href: siteHref(hasNewStory && latestVideo ? withGalleryVideo(archivePath("videos"), latestVideo.id) : archivePath("videos")), external: false },
    { id: "diario", author: "Ferrogard Escudoferreo", title: "El diario de Ferrogard", description: "Las aventuras de La Ganga, a la luz de una vela.", action: "Leer en Discord", image: new URL("../app/art/diario.webp", import.meta.url).href, mobile: new URL("../app/art/diario-movil.webp", import.meta.url).href, href: diaryUrl, external: true },
    { id: "keen", author: "Olynn Grandwell", title: "Keen · El taller de Olynn", description: "Un poco de ingenio para tus aventuras en Azeroth.", action: "Conocer el addon", image: assetUrl("/guild/keen-olynn.webp"), mobile: assetUrl("/guild/keen-olynn-movil.webp"), href: siteHref(archivePath("creations")), external: false },
  ];
  const region = useRef<HTMLElement>(null);
  const [carouselRef, api] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const rotating = !paused && !hovered && !focused && visible && pageVisible && !reducedMotion;

  useEffect(() => {
    if (!api) return;
    const select = () => setSelected(api.selectedScrollSnap());
    select();
    api.on("select", select).on("reInit", select);
    return () => { api.off("select", select).off("reInit", select); };
  }, [api]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(motion.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .4 });
    if (region.current) observer.observe(region.current);
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!api || !rotating) return;
    const timer = window.setInterval(() => api.scrollNext(), 7000);
    return () => window.clearInterval(timer);
  }, [api, rotating]);

  function navigate(direction: "previous" | "next" | number) {
    setPaused(true);
    if (typeof direction === "number") api?.scrollTo(direction, reducedMotion);
    else if (direction === "previous") api?.scrollPrev(reducedMotion);
    else api?.scrollNext(reducedMotion);
  }

  return <section ref={region} className="creations-preview" aria-labelledby="creations-preview-title" aria-roledescription="carrusel"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onKeyDown={event => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        navigate(event.key === "ArrowLeft" ? "previous" : "next");
      }
    }}>
    <header className="creations-heading">
      <div><p className="eyebrow">Hecho por los nuestros</p><h2 id="creations-preview-title">Creaciones de la hermandad</h2></div>
      <a href={siteHref(archivePath("creations"))}>Ver todas <ArrowRight size={14} aria-hidden="true"/></a>
    </header>
    <div className="creations-viewport" ref={carouselRef} id="creations-banners" onPointerDown={() => setPaused(true)}>
      <div className="creations-track">
        {creations.map((creation, index) => <div className="creation-slide" key={creation.id} role="group" aria-roledescription="diapositiva" aria-label={`${index + 1} de ${creations.length}`}>
          <a className={`creation-banner creation-banner--${creation.id}`} href={creation.href} target={creation.external ? "_blank" : undefined} rel={creation.external ? "noopener noreferrer" : undefined}
            onFocus={() => api?.scrollTo(index, reducedMotion)}>
            <picture>
              <source media="(max-width: 600px)" srcSet={creation.mobile}/>
              <img src={creation.image} alt="" loading="lazy" width={2172} height={724} draggable={false}/>
            </picture>
            <div className="creation-banner-copy">
              <div className="creation-banner-meta"><small>{creation.author}</small>{creation.id === "vincie" && hasNewStory && <strong className="video-new-badge">Nueva historia</strong>}</div>
              <h3>{creation.title}</h3><p>{creation.description}</p>
              <span className="creation-banner-action">{creation.action}{creation.external ? <ExternalLink size={15} aria-hidden="true"/> : <ArrowRight size={16} aria-hidden="true"/>}</span>
            </div>
          </a>
        </div>)}
      </div>
    </div>
    <div className="creations-controls">
      <div className="creations-dots" aria-label="Elegir creación">{creations.map((creation, index) => <button key={creation.id} type="button" aria-label={`Mostrar ${creation.title}`} aria-current={index === selected ? "true" : undefined} aria-controls="creations-banners" onClick={() => navigate(index)}><span/></button>)}</div>
      <div className="creations-arrows">
        <span className="creations-position" aria-live={rotating ? "off" : "polite"} aria-atomic="true">{selected + 1} / {creations.length}</span>
        {!reducedMotion && <button type="button" aria-label={paused ? "Reanudar banners automáticos" : "Pausar banners automáticos"} title={paused ? "Reanudar" : "Pausar"} onClick={() => setPaused(value => !value)}>{paused ? <Play size={14} aria-hidden="true"/> : <Pause size={14} aria-hidden="true"/>}</button>}
        <button type="button" aria-label="Creación anterior" aria-controls="creations-banners" onClick={() => navigate("previous")}><ChevronLeft size={18} aria-hidden="true"/></button>
        <button type="button" aria-label="Siguiente creación" aria-controls="creations-banners" onClick={() => navigate("next")}><ChevronRight size={18} aria-hidden="true"/></button>
      </div>
    </div>
  </section>;
}
