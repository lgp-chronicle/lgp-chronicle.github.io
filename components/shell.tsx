import { siteHref, assetUrl } from "@/lib/public-settings";
import {
  archiveGroups,
  archivePath,
  groupForSection,
  sectionFromPath,
} from "@/lib/guild-navigation";
import { Play } from "lucide-react";
import { coverMemberId, guildCovers, type CoverScene } from "@/lib/guild-covers";
import { WelcomeArt } from "../features/welcome-art";
import { Fragment } from "react";
import { guildSectionIcons } from "./section-icons";
import { GuildIcon } from "./guild-icon";
export function Shell({
  children,
  path = "/",
  cover = "mapa",
  scene = guildCovers.mapa,
  onReplay,
}: {
  children: React.ReactNode;
  path?: string;
  cover?: string;
  scene?: CoverScene;
  onReplay?: () => void;
}) {
  const { cast, action } = scene;
  const activeGroup = groupForSection(
    path.startsWith("/character/") ? "overview" : sectionFromPath(path),
  );
  return (
    <>
      <header className="guildhall" data-home={path === "/"} data-cover={cover}>
        {scene.party && <div className="guildhall-welcome"><WelcomeArt party={scene.party} large /></div>}
        <div className="guildhall-inner">
          <a
            className="guildhall-brand"
            href={siteHref("/")}
            aria-label="La Ganga · Portada"
          >
            <img
              src={assetUrl("/guild/escudo-la-ganga.webp?v=estandarte")}
              alt=""
              width="800"
              height="800"
            />
            {path === "/" && <h1 className="sr-only">La Ganga</h1>}
          </a>
        </div>
        <p className="guildhall-caption">
          {scene.date && (
            <time dateTime={scene.date}>
              {scene.date.split("-").reverse().join("/")}
            </time>
          )}
          {cast.map((name, i) => (
            <Fragment key={name}>
              {i > 0 && (i === cast.length - 1 ? " y " : ", ")}
              <a
                href={siteHref(
                  "/character/" + encodeURIComponent(scene.party?.members[i]?.id ?? coverMemberId(name)),
                )}
              >
                {name}
              </a>
            </Fragment>
          ))}{" "}
          {action}
        </p>
      </header>
      <nav aria-label="Navegación principal" className="guildhall-nav">
        <div>
          <a
            href={siteHref("/")}
            aria-current={path === "/" ? "page" : undefined}
          >
            <GuildIcon name="keep" />
            <span>Portada</span>
          </a>
          {archiveGroups.map((group) => {
            const [id] = group.sections[0];
            return (
              <a
                key={id}
                href={siteHref(archivePath(id))}
                aria-current={
                  path === archivePath(id)
                    ? "page"
                    : activeGroup === group
                      ? "location"
                      : undefined
                }
              >
                <GuildIcon name={guildSectionIcons[id]} />
                <span>{group.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
      {children}
      <footer>
        <a className="footer-brand" href={siteHref("/")}>
          <img
            src={assetUrl("/guild/sello-la-ganga.png?v=estandarte")}
            alt=""
            width="32"
            height="32"
          />{" "}
          La Ganga <span>· WoW Forever</span>
        </a>
        <a href={siteHref("/fortaleza")}>Visitar la fortaleza</a>
        {onReplay && (
          <button type="button" className="entrance-replay" onClick={onReplay}>
            <Play size={15} aria-hidden="true" /> Ver la presentación
          </button>
        )}
        <span>
          Proyecto de fans. World of Warcraft © Blizzard Entertainment.
        </span>
      </footer>
    </>
  );
}
