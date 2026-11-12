import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, MapPin, Pause, Play } from "lucide-react";
import { archivePath, withGalleryScene } from "../lib/guild-navigation";
import { assetUrl, siteHref } from "../lib/public-settings";
import "../app/fortress.css";

const rooms = [
  ["Cuartel", "Miembros de la hermandad", archivePath("overview"), 12, 31],
  ["Salón de la fama", "Premios y trofeos", archivePath("awards"), 34, 29],
  ["Sala de expediciones", "Carrera al nivel 60", archivePath("race"), 59, 31],
  ["Galería", "Ilustraciones de la hermandad", archivePath("gallery"), 87, 35],
  ["Cocina", "La paella de múrloc", withGalleryScene(archivePath("gallery"), "paella"), 13, 69],
  ["Patio de armas", "Cara a cara", archivePath("compare"), 40, 69],
  ["Tablón", "El Heraldo", archivePath("news"), 60, 65],
  ["Taberna", "Tablón de taberna", archivePath("overview") + "?ver=taberna", 88, 68],
] as const;

export default function Fortress() {
  const video = useRef<HTMLVideoElement>(null);
  const [motion, setMotion] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [mediaError, setMediaError] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setMotion(!preference.matches);
    preference.addEventListener("change", change);
    return () => preference.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!element || mediaError) return;
    let active = true;
    const sync = () => {
      if (motion && !document.hidden) {
        if (!element.getAttribute("src")) element.src = assetUrl("/guild/fortaleza/patio.mp4");
        element.play().catch((error: Error) => {
          if (active && error.name !== "AbortError") setMotion(false);
        });
      } else element.pause();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => { active = false; document.removeEventListener("visibilitychange", sync); };
  }, [motion, mediaError]);

  return <main className="fortress">
    <header className="fortress-bar">
      <a href={siteHref("/")}><ArrowLeft size={17} /> Portada</a>
      <h1>La fortaleza de La Ganga</h1>
      {!mediaError && <button type="button" aria-pressed={motion} aria-label="Animación del patio"
        onClick={() => setMotion(!motion)}>{motion ? <Pause size={15} /> : <Play size={15} />}
        <span>{motion ? "Pausar" : "Animar"}</span></button>}
    </header>
    <div className="fortress-scene">
      <img className="fortress-painting" src={assetUrl("/guild/fortaleza/patio.webp")} alt="Dos terrazas de piedra rodean el patio de La Ganga. Un estandarte amarillo con las serpientes negras ondea sobre la fuente." width="3840" height="2160" />
      {!mediaError && <video ref={video} poster={assetUrl("/guild/fortaleza/patio.webp")} aria-hidden="true" muted loop playsInline preload="none" onError={() => setMediaError(true)} />}
      <svg className="fortress-doors" viewBox="0 0 100 56.25" aria-hidden="true">
        {rooms.map(([name, , path, x, y]) => <a key={name} href={siteHref(path)} tabIndex={-1}>
          <title>{name}</title>
          <rect x={x - 9} y={y * .5625 - 6.8} width="18" height="12.5" rx="1" />
        </a>)}
      </svg>
      <nav aria-label="Estancias de la fortaleza">
        {rooms.map(([name, destination, path, x, y]) =>
          <a className="fortress-place" key={name} href={siteHref(path)}
            style={{left: x + "%", top: y + "%"}} aria-label={name + " · " + destination}>
            <span className="fortress-pin"><MapPin size={16} aria-hidden="true" /></span>
            <span className="fortress-name">{name}</span>
            <span className="fortress-destination">{destination} <ArrowUpRight size={12} /></span>
          </a>)}
      </nav>
    </div>
  </main>;
}
