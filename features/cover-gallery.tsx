import { Fragment, useRef, useState } from "react";
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
import { paintedWelcome } from "./membership";

function original(id: string) {
  const file = id === "mapa" ? "sala-de-la-ganga" : id;
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
  const { cast, action } = scene;
  return (
    <>
      {cast.map((name, i) => {
        const memberId = scene.party?.members[i]?.id ?? coverMemberId(name);
        const member = members.find((m) => m.id === memberId);
        return (
          <Fragment key={memberId}>
            {i > 0 && (i === cast.length - 1 ? " y " : ", ")}
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
      {action}
    </>
  );
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
  function step(direction: number) {
    if (active)
      navigateScene(
        scenes[
          (scenes.indexOf(active) + direction + scenes.length) % scenes.length
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
      <div className="gallery-grid">
        {scenes.map((id, i) => {
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
              {scene.party && active !== paintedWelcome ? (
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
                  {scenes.length > 1 && (
                    <div className="gallery-paging">
                      <button
                        type="button"
                        onClick={() => step(-1)}
                        aria-label="Ilustración anterior"
                      >
                        <ArrowLeft />
                      </button>
                      <span aria-live="polite">
                        {scenes.indexOf(active) + 1} / {scenes.length}
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
