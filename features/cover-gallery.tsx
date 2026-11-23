import { Fragment, useEffect, useRef, useState } from "react";
import { ago } from "./analytics";
import { Dialog } from "radix-ui";
import { ArrowLeft, ArrowRight, Expand, Link, X } from "lucide-react";
import {
  coverMemberId,
  coverCatalogue,
  sceneParticipants,
  type CoverScene,
} from "@/lib/guild-covers";
import { archivePath, withGalleryScene } from "@/lib/guild-navigation";
import { assetUrl, siteHref } from "@/lib/public-settings";
import { color, type Member } from "./types";
import { fullName } from "./member-portrait";
import { WelcomeArt } from "./welcome-art";
import { welcomePaintings } from "../lib/welcome-paintings";
import { CoverAction } from "@/components/cover-action";

import { galleryCategories, galleryCategory } from "@/lib/gallery-categories";

function original(id: string) {
  const file = welcomePaintings[id]?.art ?? (id === "mapa" ? "sala-de-la-ganga" : id);
  return new URL(`../app/art/${file}.webp`, import.meta.url).href;
}

function ShareScene({ id }: { id: string }) {
  const [status, setStatus] = useState<"ready" | "copied" | "manual">("ready");
  const url = new URL(location.pathname, location.origin);
  url.hash = withGalleryScene(archivePath("gallery"), id);
  return (
    <div className="gallery-share">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url.href);
            setStatus("copied");
          } catch {
            setStatus("manual");
          }
        }}
      >
        <Link size={16} aria-hidden="true" />{" "}
        <span aria-live="polite">
          {status === "copied" ? "Enlace copiado" : "Copiar enlace"}
        </span>
      </button>
      {status === "manual" && (
        <input
          aria-label="Enlace para copiar"
          readOnly
          value={url.href}
          ref={(el) => {
            if (el) {
              el.focus();
              el.select();
            }
          }}
        />
      )}
    </div>
  );
}

function Caption({
  scene,
  members,
  currentMember,
}: {
  scene: CoverScene;
  members: Member[];
  currentMember?: string;
}) {
  const { cast } = scene;
  return (
    <>
      {scene.castPrefix}
      {cast.map((name, i) => {
        const memberId = scene.party?.members[i]?.id ?? coverMemberId(name);
        const member = members.find((m) => m.id === memberId);
        return (
          <Fragment key={memberId}>
            {i > 0 && (i === cast.length - 1 ? scene.castJoiner ?? " y " : ", ")}
            {member && member.id === currentMember ? (
              <span style={{ color: color(member) }}>{name}</span>
            ) : member ? (
              <a
                style={{ color: color(member) }}
                href={siteHref(
                  "/character/" + encodeURIComponent(memberId) + "?tab=gallery",
                )}
              >
                {name}
              </a>
            ) : (
              name
            )}
          </Fragment>
        );
      })}{" "}
      <CoverAction scene={scene} />
    </>
  );
}

export function RecentImages({ members }: { members: Member[] }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const scenes = Object.entries(coverCatalogue(members)).flatMap(([id, scene]) =>
    scene.publishedAt ? [{ id, scene, publishedAt: scene.publishedAt }] : [],
  ).sort((a,b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 3);
  if (!scenes.length) return null;
  return <section className="recent-art" aria-labelledby="recent-art-title">
    <header><h2 id="recent-art-title">Últimas imágenes</h2><a href={siteHref(archivePath("gallery"))}>Ver galería →</a></header>
    <ul>{scenes.map(({ id, scene, publishedAt }) => (
      <li key={id}><a href={siteHref(withGalleryScene(archivePath("gallery"), id))}>
        {scene.party ? <WelcomeArt party={scene.party} /> : <img src={assetUrl("/guild/galeria/" + id + ".webp")} alt="" width={768} height={256} loading="lazy" />}
        <div><strong>{scene.title}</strong><time dateTime={publishedAt} title={new Date(publishedAt).toLocaleString("es-ES")}>{ago(publishedAt, now)}</time></div>
      </a></li>
    ))}</ul>
  </section>;
}

export function CoverGallery({
  members,
  member,
}: {
  members: Member[];
  member?: Member;
}) {
  const catalogue = coverCatalogue(members);
  const scenes = Object.keys(catalogue).filter(
    (id) =>
      !member ||
      (catalogue[id].party
        ? catalogue[id].party!.members.some((m) => m.id === member.id)
        : sceneParticipants(catalogue[id]).some((name) => coverMemberId(name) === member.id)),
  );
  scenes.sort((a, b) => (catalogue[b].publishedAt ?? catalogue[b].date ?? "").localeCompare(catalogue[a].publishedAt ?? catalogue[a].date ?? ""));
  const params = new URLSearchParams(location.hash.split("?")[1]);
  const selected = params.get("categoria") ?? "resumen";
  const category = galleryCategories.some(c => c.id === selected) || selected === "todas" ? selected : "resumen";
  const groups = galleryCategories.map(c => ({ ...c, ids: scenes.filter(id => galleryCategory(id, catalogue[id]) === c.id) })).filter(c => c.ids.length);
  const visibleGroups = member ? [{ id: "personaje", title: "", description: "", ids: scenes }] : category === "todas" ? [{ id: "todas", title: "Todas las ilustraciones", description: "De más reciente a más antigua.", ids: scenes }] : groups.filter(c => category === "resumen" || c.id === category);
  function categoryHref(id: string) {
    const [base, query] = location.hash.slice(1).split("?");
    const next = new URLSearchParams(query);
    next.delete("escena");
    if (id === "resumen") next.delete("categoria"); else next.set("categoria", id);
    return siteHref(base + (next.size ? "?" + next : ""));
  }
  const opener = useRef<HTMLButtonElement | null>(null);
  const requested = new URLSearchParams(location.hash.split("?")[1]).get(
    "escena",
  );
  const active = requested && scenes.includes(requested) ? requested : null;
  const scene = active ? catalogue[active] : null;
  function navigateScene(id: string | null, push = false) {
    const oldURL = location.href;
    const hash = siteHref(withGalleryScene(location.hash.slice(1), id));
    if (push)
      history.pushState({ ...history.state, galleryOpened: true }, "", hash);
    else history.replaceState(history.state, "", hash);
    window.dispatchEvent(
      new HashChangeEvent("hashchange", { oldURL, newURL: location.href }),
    );
  }
  const browsing = !member && category !== "resumen" && category !== "todas" && active && galleryCategory(active, catalogue[active]) === category
    ? scenes.filter(id => galleryCategory(id, catalogue[id]) === category) : scenes;
  function step(direction: number) {
    if (active)
      navigateScene(
        browsing[
          (browsing.indexOf(active) + direction + browsing.length) % browsing.length
        ],
      );
  }

  return (
    <section
      className="cover-gallery"
      aria-label={
        member ? "Ilustraciones del personaje" : "Galería de la hermandad"
      }
    >
      <header className="gallery-heading">
        <h2>
          {member
            ? "Ilustraciones de " + fullName(member)
            : "Galería de la hermandad"}
        </h2>
        {member ? (
          <a href={siteHref(archivePath("gallery"))}>Ver galería completa</a>
        ) : (
          <span>{scenes.length} portadas</span>
        )}
      </header>
      {scenes.length === 0 && (
        <p>Este personaje aún no aparece en las portadas.</p>
      )}
      {!member && <nav className="gallery-categories" aria-label="Categorías de ilustraciones">
        <a href={categoryHref("resumen")} aria-current={category === "resumen" ? "page" : undefined}>Explorar</a>
        {groups.map(c => <a key={c.id} href={categoryHref(c.id)} aria-current={category === c.id ? "page" : undefined}>
          <img src={assetUrl("/guild/iconos/" + c.icon + ".webp")} alt="" />{c.title}<span>{c.ids.length}</span>
        </a>)}
        <a href={categoryHref("todas")} aria-current={category === "todas" ? "page" : undefined}>Todas <span>{scenes.length}</span></a>
      </nav>}
      {visibleGroups.map(group => <section className="gallery-collection" key={group.id} aria-label={group.title || "Ilustraciones"}>
        {!member && <header className="gallery-collection-heading"><div><h3>{group.title} <small>{group.ids.length}</small></h3><p>{group.description}</p></div>
          {category === "resumen" && <a href={categoryHref(group.id)}>Ver todas <ArrowRight size={16} aria-hidden="true" /></a>}
        </header>}
      <div className="gallery-grid">
        {(category === "resumen" && !member ? group.ids.slice(0, 2) : group.ids).map((id, i) => {
          const item = catalogue[id];
          return (
            <article key={id} className="gallery-card">
              <button
                type="button"
                className="gallery-thumbnail"
                ref={(el) => {
                  if (el && active === id && !opener.current)
                    opener.current = el;
                }}
                aria-label={"Ampliar " + item.title}
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  navigateScene(id, true);
                }}
              >
                {item.party ? (
                  <WelcomeArt party={item.party} />
                ) : (
                  <img
                    src={assetUrl("/guild/galeria/" + id + ".webp")}
                    alt=""
                    width={768}
                    height={256}
                    loading={i < 2 ? "eager" : "lazy"}
                  />
                )}
                <Expand size={16} aria-hidden="true" />
              </button>
              <div className="gallery-caption">
                <h3>{item.title}</h3>
                {item.date && (
                  <time dateTime={item.date}>
                    {item.date.split("-").reverse().join("/")}
                  </time>
                )}
                <p>
                  <Caption
                    scene={item}
                    members={members}
                    currentMember={member?.id}
                  />
                </p>
              </div>
            </article>
          );
        })}
      </div>
      </section>)}
      <Dialog.Root
        open={active !== null}
        onOpenChange={(open) => {
          if (open) return;
          if (history.state?.galleryOpened) history.back();
          else navigateScene(null);
        }}
      >
        {active && scene && (
          <Dialog.Portal>
            <Dialog.Overlay className="gallery-shade" />
            <Dialog.Content
              className="gallery-viewer"
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                opener.current?.focus();
              }}
              onKeyDown={(event) => {
                if (
                  !(event.target instanceof HTMLInputElement) &&
                  (event.key === "ArrowLeft" || event.key === "ArrowRight")
                ) {
                  event.preventDefault();
                  step(event.key === "ArrowLeft" ? -1 : 1);
                }
              }}
            >
              <div className="gallery-viewer-bar">
                <Dialog.Title>{scene.title}</Dialog.Title>
                <Dialog.Close aria-label="Cerrar ilustración">
                  <X />
                </Dialog.Close>
              </div>
              {scene.party && !welcomePaintings[active] ? (
                <div className="welcome-original">
                  <WelcomeArt party={scene.party} large />
                </div>
              ) : (
                <a
                  href={original(active)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={"Abrir a tamaño original: " + scene.title}
                >
                  <img
                    className="gallery-original"
                    src={original(active)}
                    alt={scene.title}
                  />
                </a>
              )}
              <div className="gallery-viewer-footer">
                <Dialog.Description>
                  {scene.date && (
                    <time dateTime={scene.date}>
                      {scene.date.split("-").reverse().join("/")} ·{" "}
                    </time>
                  )}
                  <Caption
                    scene={scene}
                    members={members}
                    currentMember={member?.id}
                  />
                </Dialog.Description>
                <div className="gallery-actions">
                  <ShareScene key={active} id={active} />
                  {browsing.length > 1 && (
                    <div className="gallery-paging">
                      <button
                        type="button"
                        onClick={() => step(-1)}
                        aria-label="Ilustración anterior"
                      >
                        <ArrowLeft />
                      </button>
                      <span aria-live="polite">
                        {browsing.indexOf(active) + 1} / {browsing.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => step(1)}
                        aria-label="Ilustración siguiente"
                      >
                        <ArrowRight />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </section>
  );
}
