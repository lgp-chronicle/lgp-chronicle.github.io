import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { ArrowRight, Download, ExternalLink, MessageSquare, X, ZoomIn } from "lucide-react";
import { GuildIcon, type GuildIconName } from "../components/guild-icon";
import { archivePath } from "../lib/guild-navigation";
import { assetUrl, siteHref } from "../lib/public-settings";
import { fullName, memberHref, Portrait } from "./member-portrait";
import { color, type Member } from "./types";
import "../app/creation-pages.css";

const keenUrl = "https://www.curseforge.com/wow/addons/keen";
const keenSuggestions = "https://discord.com/channels/1551288910569808112/1567877893797974076";
const diaryUrl = "https://discord.com/channels/1551288910569808112/1569452969064140830";

function Author({ members, id, name }: { members: Member[]; id: string; name: string }) {
  const member = members.find(m => m.id === id);
  return <div className="creation-author">
    {member && <Portrait member={member} />}
    <span>Una creación de <a href={member ? memberHref(member) : siteHref("/character/" + id)} style={member ? { color: color(member) } : undefined}>{member ? fullName(member) : name}</a></span>
  </div>;
}

function CreationHero({ kind, title, eyebrow, description, image, mobile, members, authorId, author, children }: {
  kind: "keen" | "diary"; title: string; eyebrow: string; description: string; image: string; mobile: string;
  members: Member[]; authorId: string; author: string; children: ReactNode;
}) {
  return <>
    <a className="back-link" href={siteHref(archivePath("creations"))}>← Todas las creaciones</a>
    <header className={"creation-hero creation-hero--" + kind}>
      <picture><source media="(max-width: 700px)" srcSet={mobile} /><img src={image} width={2172} height={724} alt="" /></picture>
      <div className="creation-hero-copy">
        <p className="eyebrow"><GuildIcon name={kind === "keen" ? "engineering" : "journal"} size={24} />{eyebrow}</p>
        <h2>{title}</h2><p className="creation-intro">{description}</p>
        <Author members={members} id={authorId} name={author} />
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

const keenScreenshots = [
  { id: "interfaz", title: "Los detalles que cuentan", caption: "Recordatorios, nombres y filtros de estadísticas.", alt: "Captura oficial de Keen con avisos de beneficios, nombres de personajes y el filtro de estadísticas.", width: 690, height: 302 },
  { id: "hechizos", title: "Cada rango, en perspectiva", caption: "Comparador de eficiencia del libro de hechizos.", alt: "Captura oficial de Keen: tabla de rangos y gráfica que compara daño por segundo y daño por maná.", width: 785, height: 355 },
];

function KeenScreenshots() {
  return <section className="keen-screenshots" aria-labelledby="keen-screenshots-title">
    <div className="creation-section-heading"><div><p className="eyebrow">Dentro de Azeroth</p><h3 id="keen-screenshots-title">Así se ve en el juego</h3></div><span>Capturas oficiales · Pulsa para ampliar</span></div>
    <div className="keen-screenshot-grid">{keenScreenshots.map(shot => <figure key={shot.id}>
      <Dialog.Root>
        <Dialog.Trigger asChild><button type="button" className="keen-screenshot-open" aria-label={"Ampliar: " + shot.title}>
          <img src={assetUrl("/guild/keen/" + shot.id + ".webp")} alt={shot.alt} width={shot.width} height={shot.height} loading="lazy" />
          <span><ZoomIn size={17} aria-hidden="true" />Ampliar</span>
        </button></Dialog.Trigger>
        <Dialog.Portal><Dialog.Overlay className="keen-image-shade" /><Dialog.Content className="keen-image-dialog">
          <header><Dialog.Title>{shot.title}</Dialog.Title><Dialog.Close className="button outline" aria-label="Cerrar captura"><X size={20} /></Dialog.Close></header>
          <img src={assetUrl("/guild/keen/" + shot.id + ".webp")} alt={shot.alt} width={shot.width} height={shot.height} />
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
      <p className="keen-extra"><GuildIcon name="clue" size={21} />También incluye filtros en la subasta, marcas de misión y una rueda de botones del minimapa.</p>
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
