import { ArrowRight } from "lucide-react";
import { archivePath } from "../lib/guild-navigation";
import { assetUrl, siteHref } from "../lib/public-settings";
import "../app/keen-panel.css";

export function KeenPanel() {
  return <a className="keen-panel creation-shortcut" href={siteHref(archivePath("keen"))} aria-labelledby="keen-title">
    <picture>
      <source media="(max-width: 600px)" srcSet={assetUrl("/guild/keen-olynn-movil.webp")} />
      <img src={assetUrl("/guild/keen-olynn.webp")} width={2172} height={724} loading="lazy"
        alt="Olynn Grandwell ajusta una rueda de hechizos y unos medidores mágicos en su taller." />
    </picture>
    <div className="keen-copy">
      <p className="eyebrow">Hecho en La Ganga · WoW Forever</p>
      <h2 id="keen-title">Keen <span>El taller de Olynn</span></h2>
      <p>Barras de recursos, recordatorios y mejoras de interfaz, a tu manera.
        Un addon creado por <span className="keen-author">Olynn Grandwell</span>.</p>
      <div className="keen-actions">
        <span className="button bronze">Descubrir Keen <ArrowRight size={15} aria-hidden="true" /></span>
      </div>
      <small>Funciones, capturas y puesta en marcha.</small>
    </div>
  </a>;
}
