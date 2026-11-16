import { ExternalLink, MessageSquare } from "lucide-react";
import { assetUrl, siteHref } from "../lib/public-settings";
import "../app/keen-panel.css";

export function KeenPanel() {
  return <section className="keen-panel" aria-labelledby="keen-title">
    <picture>
      <source media="(max-width: 600px)" srcSet={assetUrl("/guild/keen-olynn-movil.webp")} />
      <img src={assetUrl("/guild/keen-olynn.webp")} width={2172} height={724} loading="lazy"
        alt="Olynn Grandwell ajusta una rueda de hechizos y unos medidores mágicos en su taller." />
    </picture>
    <div className="keen-copy">
      <p className="eyebrow">Hecho en La Ganga · WoW Forever</p>
      <h2 id="keen-title">Keen <span>El taller de Olynn</span></h2>
      <p>Barras de recursos, recordatorios y mejoras de interfaz, a tu manera.
        Un addon creado por <a className="keen-author" href={siteHref("/character/forever-eu-olynn-grandwell")}>Olynn Grandwell</a>.</p>
      <div className="keen-actions">
        <a className="button bronze" href="https://www.curseforge.com/wow/addons/keen" target="_blank" rel="noopener noreferrer">
          Ver en CurseForge <ExternalLink size={14} aria-hidden="true" />
        </a>
        <a className="button outline" href="https://discord.com/channels/1551288910569808112/1567877893797974076" target="_blank" rel="noopener noreferrer">
          <MessageSquare size={15} aria-hidden="true" /> Sugerencias en Discord
        </a>
      </div>
      <small>Propón mejoras y nuevas funciones directamente a Olynn.</small>
    </div>
  </section>;
}
