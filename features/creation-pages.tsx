import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { ArrowRight, Download, ExternalLink, MessageSquare, X, ZoomIn } from "lucide-react";
import { GuildIcon, type GuildIconName } from "../components/guild-icon";
import { archivePath } from "../lib/guild-navigation";
import { assetUrl, siteHref } from "../lib/public-settings";
import { CreationAuthor } from "./creation-author";
import { guildWallpaper } from "../lib/guild-wallpaper";
import type { Member } from "./types";
import "../app/creation-pages.css";

const keenUrl = "https://www.curseforge.com/wow/addons/keen";
const keenSuggestions = "https://discord.com/channels/1551288910569808112/1567877893797974076";
const diaryUrl = "https://discord.com/channels/1551288910569808112/1569452969064140830";

function CreationHero({ kind, title, eyebrow, description, image, mobile, members, authorId, author, children }: {
  kind: "keen" | "diary"; title: string; eyebrow: string; description: string; image: string; mobile: string;
  members: Member[]; authorId: string; author: string; children: ReactNode;
}) {
  return <>
    <a className="back-link" href={siteHref(archivePath("creations"))}>← Todas las creaciones</a>
    <header className={"creation-hero creation-hero--" + kind}>
      <picture><source media="(max-width: 700px)" srcSet={mobile} /><img src={image} width={2172} height={724} alt="" /></picture>
      <div className="creation-hero-copy">
        <p className="eyebrow"><GuildIcon name={kind === "keen" ? "keen" : "journal"} size={24} />{eyebrow}</p>
        <h2>{title}</h2><p className="creation-intro">{description}</p>
        <CreationAuthor members={members} id={authorId} name={author} />
        <div className="creation-page-actions">{children}</div>
      </div>
    </header>
  </>;
}

const keenFeatures: { icon: GuildIconName; title: string; description: string }[] = [
  { icon: "ring", title: "Ruedas de hechizos", description: "Mantén una tecla, apunta con el ratón y suelta para lanzar." },
  { icon: "lantern", title: "Recordatorios", description: "Avisos de beneficios, rastreos o consumibles que te faltan." },
  { icon: "staff", title: "Rangos de hechizos", description: "Compara su eficiencia y elige qué rango te conviene lanzar." },
  { icon: "intellect", title: "Recursos a la vista", description: "Personaliza las barras de maná, lanzamiento y tiempos entre golpes." },
  { icon: "spellpower", title: "Beneficios ordenados", description: "Separa los efectos breves de los beneficios de larga duración." },
  { icon: "shield", title: "Placas y nombres", description: "Escudos de facción, puntos de combo y auras con aspecto clásico." },
  { icon: "health", title: "Marcos de personaje", description: "Colores de clase y barras de experiencia, golpes o mascota." },
  { icon: "swords", title: "Modo JcJ", description: "Cambia el equipo y activa tus recordatorios de combate." },
];

type KeenScreenshot = { id: string; source: string; title: string; caption: string; alt: string; width: number; height: number; detail?: [number, number, number, number] };
const keenScreenshots: KeenScreenshot[] = [
  { id: "interfaz", source: "interfaz", title: "Los detalles que cuentan", caption: "Recordatorios, nombres y filtros de estadísticas.", alt: "Captura oficial de Keen con avisos de beneficios, nombres de personajes y el filtro de estadísticas.", width: 691, height: 302 },
  { id: "hechizos", source: "hechizos", title: "Cada rango, en perspectiva", caption: "Comparador de eficiencia del libro de hechizos.", alt: "Captura oficial de Keen: tabla de rangos y gráfica que compara daño por segundo y daño por maná.", width: 785, height: 352 },
  { id: "avisos", source: "interfaz", title: "Que no te falte nada", caption: "Avisos para beneficios y consumibles pendientes.", alt: "Detalle de los avisos Soul Shard y Demon Armor de Keen.", width: 691, height: 302, detail: [55, 20, 155, 88] },
  { id: "eficiencia", source: "hechizos", title: "El rango que te conviene", caption: "Compara el daño por segundo y por maná de cada rango.", alt: "Detalle de la tabla de eficiencia de los rangos de hechizos de Keen.", width: 785, height: 352, detail: [14, 45, 370, 292] },
  { id: "placas", source: "interfaz", title: "Cada nombre, en su sitio", caption: "Nombres y placas con el aspecto clásico de WoW.", alt: "Detalle de las placas de salud y los nombres mostrados por Keen.", width: 691, height: 302, detail: [0, 140, 470, 162] },
  { id: "filtros", source: "interfaz", title: "Busca por estadísticas", caption: "Filtra el equipo de la subasta por sus atributos.", alt: "Detalle del menú Keen: stats con filtros de atributos, hechizos y resistencias.", width: 691, height: 302, detail: [562, 165, 129, 137] },
];

function KeenScreenshotImage({ shot, preview = false }: { shot: KeenScreenshot; preview?: boolean }) {
  const src = assetUrl("/guild/keen/" + shot.source + ".webp");
  if (!shot.detail) return <img src={src} alt={shot.alt} width={shot.width} height={shot.height} loading="lazy" />;
  const [x, y, width, height] = shot.detail;
  return <svg className={preview ? "keen-detail-preview" : "keen-detail-full"} viewBox={preview ? shot.detail.join(" ") : `0 0 ${shot.width} ${shot.height}`} role="img" aria-label={shot.alt} width={preview ? width : shot.width} height={preview ? height : shot.height}>
    {preview && <defs><clipPath id={"keen-detail-" + shot.id}><rect x={x} y={y} width={width} height={height} /></clipPath></defs>}
    <image href={src} width={shot.width} height={shot.height} clipPath={preview ? `url(#keen-detail-${shot.id})` : undefined} />
    {!preview && <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} fill="none" stroke="#ffda78" strokeWidth={2} />}
  </svg>;
}

function KeenScreenshots() {
  return <section className="keen-screenshots" aria-labelledby="keen-screenshots-title">
    <div className="creation-section-heading"><div><p className="eyebrow">Dentro de Azeroth</p><h3 id="keen-screenshots-title">Así se ve en el juego</h3></div><span>2 capturas oficiales y 4 detalles · Pulsa para ampliar</span></div>
    <div className="keen-screenshot-grid">{keenScreenshots.map(shot => <figure key={shot.id} className={shot.detail ? "keen-screenshot-detail" : "keen-screenshot-complete"}>
      <Dialog.Root>
        <Dialog.Trigger asChild><button type="button" className="keen-screenshot-open" aria-label={"Ampliar: " + shot.title}>
          <KeenScreenshotImage shot={shot} preview />
          <span><ZoomIn size={17} aria-hidden="true" />Ampliar</span>
        </button></Dialog.Trigger>
        <Dialog.Portal><Dialog.Overlay className="keen-image-shade" /><Dialog.Content className="keen-image-dialog">
          <header><Dialog.Title>{shot.title}</Dialog.Title><Dialog.Close className="button outline" aria-label="Cerrar captura"><X size={20} /></Dialog.Close></header>
          <KeenScreenshotImage shot={shot} />
          <Dialog.Description>{shot.caption}</Dialog.Description>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>
      <figcaption><h4>{shot.title}</h4><p>{shot.caption}</p></figcaption>
    </figure>)}</div>
  </section>;
}

export function KeenPage({ members }: { members: Member[] }) {
  return <article className="creation-page keen-page">
    <CreationHero kind="keen" title="Keen" eyebrow="El taller de Olynn · WoW Forever" description="Tu interfaz, a tu manera. Pequeñas mejoras para que te concentres en la aventura."
      image={assetUrl("/guild/keen-olynn.webp")} mobile={assetUrl("/guild/keen-olynn-movil.webp")} members={members} authorId="forever-eu-olynn-grandwell" author="Olynn Grandwell">
      <a className="button bronze" href={keenUrl} target="_blank" rel="noopener noreferrer"><Download size={16} />Descargar en CurseForge</a>
      <a className="button outline" href={keenSuggestions} target="_blank" rel="noopener noreferrer"><MessageSquare size={16} />Sugerir una mejora</a>
    </CreationHero>
    <section className="keen-features" aria-labelledby="keen-features-title">
      <div className="creation-section-heading"><div><p className="eyebrow">Activa solo lo que necesitas</p><h3 id="keen-features-title">¿Qué puede hacer por ti?</h3></div><span>Todo empieza desactivado.</span></div>
      <div className="keen-feature-grid">{keenFeatures.map(feature => <div className="keen-feature" key={feature.title}>
        <GuildIcon name={feature.icon} size={38} /><div><h4>{feature.title}</h4><p>{feature.description}</p></div>
      </div>)}</div>
      <p className="keen-extra"><GuildIcon name="clue" size={21} />También incluye filtros en la subasta, indicadores para las misiones de mazmorra y una rueda de botones del minimapa.</p>
    </section>
    <KeenScreenshots />
    <div className="keen-bottom-grid">
      <section className="keen-start" aria-labelledby="keen-start-title"><GuildIcon name="compass" size={38} /><div>
        <h3 id="keen-start-title">Listo para la aventura</h3>
        <ol><li>Instala Keen desde CurseForge.</li><li>Abre sus ajustes con <code>/keen</code> o desde el minimapa.</li><li>Activa tus módulos y guarda un perfil. Puedes compartirlo.</li></ol>
        <p>Solo WoW Forever. Opciones en inglés; compatible con cualquier idioma del juego.</p>
      </div></section>
      <aside className="keen-suggestions"><GuildIcon name="dispatch" size={38} /><div><h3>Una idea para el taller</h3><p>Cuéntale a Olynn qué mejorarías o qué echas de menos.</p><a href={keenSuggestions} target="_blank" rel="noopener noreferrer">Dejar una sugerencia en Discord <ArrowRight size={16} /></a></div></aside>
    </div>
    <p className="creation-source">Información y capturas: <a href={keenUrl} target="_blank" rel="noopener noreferrer">Keen, por Olynn, en CurseForge <ExternalLink size={12} /></a></p>
  </article>;
}

export function FerrogardPage({ members }: { members: Member[] }) {
  return <article className="creation-page diary-page">
    <CreationHero kind="diary" title="El diario de Ferrogard" eyebrow="Las crónicas de un aventurero" description="Cuando la fortaleza se queda en silencio, las aventuras de La Ganga encuentran su lugar entre estas páginas."
      image={new URL("../app/art/diario.webp", import.meta.url).href} mobile={new URL("../app/art/diario-movil.webp", import.meta.url).href}
      members={members} authorId="forever-eu-ferrogard-escudoferreo" author="Ferrogard Escudoferreo">
      <a className="button bronze" href={diaryUrl} target="_blank" rel="noopener noreferrer"><GuildIcon name="journal" size={21} />Leer el diario en Discord <ExternalLink size={15} /></a>
    </CreationHero>
    <section className="diary-reading" aria-labelledby="diary-reading-title">
      <div className="diary-reading-mark"><GuildIcon name="journal" size={64} /><span>De puño y letra</span></div>
      <div><p className="eyebrow">La hermandad también se cuenta</p><h3 id="diary-reading-title">Al otro lado de la batalla</h3>
        <p>Las hazañas tienen sus cifras. Ferrogard les pone palabras. Su diario recoge las aventuras de la hermandad desde la mirada de quien las vive.</p>
        <p>El cuaderno continúa en nuestro canal de Discord, donde puedes leer sus entradas.</p>
        <a className="diary-reading-link" href={diaryUrl} target="_blank" rel="noopener noreferrer">Abrir sus páginas <ArrowRight size={17} /></a>
      </div>
    </section>
  </article>;
}

export function WallpaperPage({ members }: { members: Member[] }) {
  return <article className="creation-page wallpaper-page">
    <a className="back-link" href={siteHref(archivePath("creations"))}>← Todas las creaciones</a>
    <header className="wallpaper-hero">
      <img className="wallpaper-preview" src={guildWallpaper.image} alt="El patio de La Ganga, con Naisen leyendo junto a la hoguera." width={800} height={450} />
      <div className="wallpaper-copy">
        <p className="eyebrow"><GuildIcon name="keep" size={24} />Wallpaper Engine</p>
        <h2>{guildWallpaper.title}</h2>
        <p className="creation-intro">{guildWallpaper.description}</p>
        <CreationAuthor members={members} id={guildWallpaper.authorId} name={guildWallpaper.author} />
        <p className="wallpaper-request">«{guildWallpaper.requestNote}»</p>
        <a className="button bronze" href={guildWallpaper.workshopUrl} target="_blank" rel="noopener noreferrer">Añadir desde Steam Workshop <ExternalLink size={16} /></a>
        <small>Necesitas Wallpaper Engine para usar este fondo.</small>
      </div>
    </header>
    <section className="wallpaper-guide" aria-labelledby="wallpaper-guide-title">
      <div><p className="eyebrow">La Ganga, también en tu escritorio</p><h3 id="wallpaper-guide-title">Cómo añadirlo</h3></div>
      <ol><li><span>1</span><div><strong>Abre Workshop</strong><p>Usa el botón de arriba para ir a la publicación.</p></div></li><li><span>2</span><div><strong>Pulsa «Suscribirse»</strong><p>Hazlo con la cuenta de Steam donde tienes Wallpaper Engine.</p></div></li><li><span>3</span><div><strong>Elige el fondo</strong><p>Ábrelo en Wallpaper Engine y ajusta el ambiente a tu gusto.</p></div></li></ol>
    </section>
    <p className="wallpaper-note"><GuildIcon name="campfire" size={24} />Un patio animado, ambiente opcional y nuevos compañeros que se irán sumando.</p>
  </article>;
}
