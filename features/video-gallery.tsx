import { useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Play, Search, Link, X, ArrowRight, Plus } from "lucide-react";
import { GuildIcon } from "../components/guild-icon";
import { archivePath, searchable } from "../lib/guild-navigation";
import { siteHref, assetUrl } from "../lib/public-settings";
import { isNewVideo, videoAuthor, videoEmbed, videoPoster, videoPublicationUrl, videosForMember, withGalleryVideo, type GuildVideo } from "../lib/guild-videos";
import { useEntryState } from "../hooks/use-entry-state";
import { useActivityClock } from "../hooks/use-activity-clock";
import { fullName, memberHref } from "./member-portrait";
import { color, type Member } from "./types";
import { ago } from "./analytics";
import "../app/video-gallery.css";

function Cast({ video, members }: { video: GuildVideo; members: Member[] }) {
  return <div className="video-cast" aria-label="Protagonistas">{video.memberIds.map(id => {
    const m = members.find(m => m.id === id);
    return m ? <a key={id} href={memberHref(m) + "?tab=gallery&vista=videos"} style={{ color: color(m) }}>{fullName(m)}</a> : null;
  })}</div>;
}

function Poster({ video }: { video: GuildVideo }) {
  const [failed, setFailed] = useState(false);
  return <img src={failed ? assetUrl("/guild/galeria/despensa.webp") : videoPoster(video)} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

function VincieBanner() {
  return <picture className="vincie-story-art">
    <source media="(max-width: 600px)" srcSet={assetUrl("/guild/historias-vincie-movil.webp")} />
    <img src={assetUrl("/guild/historias-vincie.webp")} width={2172} height={724}
      alt="Vincie exagera una de sus hazañas en la taberna; Loqe ríe y Lua lo escucha con una sonrisa incrédula." />
  </picture>;
}

function PublishVideo() {
  return <details className="video-publish">
    <summary><Plus size={15} aria-hidden="true" />Publicar un vídeo</summary>
    <div>
      <h3>Añadir un relato de Vincie</h3>
      <ol>
        <li>En YouTube, usa <strong>No listado</strong> y permite la inserción.</li>
        <li>Abre el formulario y pulsa <strong>Run workflow</strong>.</li>
        <li>Pega el enlace, escribe el título y los nombres completos de los protagonistas, separados por comas.</li>
      </ol>
      <p>Al confirmar, la web se actualiza y el vídeo aparece también en las fichas de sus protagonistas. El formulario requiere una cuenta con acceso de escritura al repositorio.</p>
      <a className="button outline" href={videoPublicationUrl} target="_blank" rel="noopener noreferrer">Abrir formulario de publicación <ArrowRight size={15}/></a>
    </div>
  </details>;
}

function ShareVideo({ video }: { video: GuildVideo }) {
  const [state, setState] = useState("ready");
  const url = new URL(location.pathname, location.origin);
  url.hash = withGalleryVideo(archivePath("videos"), video.id);
  return <div className="video-share">
    <button type="button" onClick={async () => {
      try { await navigator.clipboard.writeText(url.href); setState("copied"); }
      catch { setState("manual"); }
    }}><Link size={16}/><span aria-live="polite">{state === "copied" ? "Enlace copiado" : "Compartir relato"}</span></button>
    {state === "manual" && <input aria-label="Enlace al relato en La Ganga" readOnly value={url.href} ref={el => { el?.focus(); el?.select(); }} />}
  </div>;
}

export function VideoGallery({ members, member }: { members: Member[]; member?: Member }) {
  const now = useActivityClock();
  const videos = videosForMember(member?.id, now);
  const author = members.find(m => m.id === videoAuthor);
  const [search, setSearch] = useEntryState<string>("video-search", "");
  const [cast, setCast] = useEntryState<string>("video-cast", "all");
  const opener = useRef<HTMLButtonElement | null>(null);
  const requested = new URLSearchParams(location.hash.split("?")[1]).get("video");
  const active = videos.find(v => v.id === requested);
  const actors = members.filter(m => videos.some(v => v.memberIds.includes(m.id))).sort((a, b) => fullName(a).localeCompare(fullName(b), "es"));
  const visible = videos.filter(v => (cast === "all" || v.memberIds.includes(cast)) && searchable(v.title + " " + v.description + " " + v.memberIds.map(id => {
    const m = members.find(m => m.id === id); return m ? fullName(m) : "";
  }).join(" ")).includes(searchable(search)));
  function navigate(id: string | null, push = false) {
    const oldURL = location.href;
    const next = siteHref(withGalleryVideo(location.hash.slice(1), id));
    if (push) history.pushState({ ...history.state, videoOpened: true }, "", next);
    else history.replaceState(history.state, "", next);
    window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL: location.href }));
  }
  return <section className="video-gallery" aria-labelledby="video-gallery-title">
    {!member && <a className="back-link" href={siteHref(archivePath("creations"))}>← Todas las creaciones</a>}
    <header className="cinema-heading">
      <VincieBanner />
      <div className="vincie-story-copy"><p className="eyebrow"><GuildIcon name="spyglass" size={20}/>Relatos en movimiento</p>
        <h2 id="video-gallery-title" tabIndex={-1}>{member ? "Los relatos de " + fullName(member) : "Las historias de Vincie"}</h2>
        <p>Grandes hazañas, según quien las cuenta.</p>
        <div className="cinema-byline">Por {author ? <a href={memberHref(author)} style={{ color: color(author) }}>{fullName(author)}</a> : <strong>Vincie Quickhands</strong>}</div>
      </div>
    </header>
    <div className="cinema-toolbar">
      <span>{videos.length} {videos.length === 1 ? "vídeo" : "vídeos"}{member && <> · <a href={siteHref(archivePath("videos"))}>Ver todos los relatos</a></>}</span>
      {!member && <PublishVideo />}
    </div>
    {videos.length > 0 && <div className="video-filters">
      <label><Search size={17}/><input type="search" aria-label="Buscar vídeo o personaje" placeholder="Buscar vídeo o personaje…" value={search} onChange={e => setSearch(e.target.value)} /></label>
      {!member && <select aria-label="Filtrar vídeos por protagonista" value={cast} onChange={e => setCast(e.target.value)}><option value="all">Todos los protagonistas</option>{actors.map(m => <option key={m.id} value={m.id}>{fullName(m)}</option>)}</select>}
      <span aria-live="polite">{visible.length} {visible.length === 1 ? "resultado" : "resultados"}</span>
    </div>}
    {requested && !active && <p role="status" className="notice">Este vídeo no está disponible en esta galería. <a href={siteHref(archivePath("videos"))}>Ver todos los vídeos</a></p>}
    {videos.length === 0 ? <div className="cinema-empty"><GuildIcon name="journal" size={64}/><h3>{member ? "Aún no tiene relatos" : "La primera historia está por contar"}</h3><p>{member ? "Sus vídeos aparecerán aquí cuando se publiquen." : "Aquí guardaremos los relatos en movimiento de Vincie."}</p></div>
      : visible.length === 0 ? <div className="cinema-empty"><Search size={30}/><h3>No hay vídeos con ese filtro</h3><button type="button" className="button outline" onClick={() => { setSearch(""); setCast("all"); }}>Ver todas</button></div>
      : <div className="video-grid">{visible.map(v => <article className="video-card" key={v.id}>
        <button type="button" className="video-thumbnail" aria-label={"Ver " + v.title} onClick={e => { opener.current = e.currentTarget; navigate(v.id, true); }}><Poster video={v}/><span><Play size={26} fill="currentColor"/></span><small>Ver relato</small></button>
        <div className="video-caption"><time dateTime={v.publishedAt} title={new Date(v.publishedAt).toLocaleDateString("es-ES")}>{ago(v.publishedAt, now)}</time><h3>{v.title}</h3>{v.description && <p>{v.description}</p>}<Cast video={v} members={members}/></div>
      </article>)}</div>}
    <Dialog.Root open={Boolean(active)} onOpenChange={open => { if (!open) { if (history.state?.videoOpened) history.back(); else navigate(null); } }}>
      {active && <Dialog.Portal><Dialog.Overlay className="gallery-shade"/><Dialog.Content className="video-viewer" onCloseAutoFocus={event => { event.preventDefault(); (opener.current ?? document.getElementById("video-gallery-title"))?.focus(); }}>
        <header><div><span>Las historias de Vincie</span><Dialog.Title>{active.title}</Dialog.Title></div><Dialog.Close aria-label="Cerrar vídeo"><X/></Dialog.Close></header>
        <iframe key={active.id} src={videoEmbed(active)} title={active.title} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        <div className="video-viewer-footer"><Dialog.Description>{active.description || "Un relato de Vincie Quickhands para La Ganga."}</Dialog.Description><Cast video={active} members={members}/><ShareVideo key={active.id} video={active}/></div>
      </Dialog.Content></Dialog.Portal>}
    </Dialog.Root>
  </section>;
}

export function CinemaShortcut() {
  const now = useActivityClock();
  const video = videosForMember(undefined, now)[0];
  const hasNewStory = isNewVideo(video, now);
  return <section className="cinema-shortcut"><a href={siteHref(archivePath("videos"))}>
    <VincieBanner /><div className="vincie-story-copy"><div className="vincie-story-meta"><small>Relatos de Vincie Quickhands</small>{hasNewStory && <strong className="video-new-badge">Nueva historia</strong>}</div><h2>Las historias de Vincie</h2>{video && <p>{video.title}</p>}<span><Play size={15}/>{hasNewStory ? "Ver nueva historia" : video ? "Ver el último relato" : "Explorar sus relatos"} <ArrowRight size={14}/></span></div>
  </a></section>;
}
