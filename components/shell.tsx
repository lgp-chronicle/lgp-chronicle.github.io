import { siteHref, assetUrl } from "@/lib/public-settings";
import { archivePath, guildSections } from "@/lib/guild-navigation";
import { Check, ChevronDown, Play } from "lucide-react";
import { coverMemberId, guildCovers } from "@/lib/guild-covers";
import { Fragment } from "react";
import { guildSectionIcons } from "./section-icons";
import { GuildIcon } from "./guild-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export function Shell({
  children,
  path = "/",
  cover = "mapa",
  onReplay,
}: {
  children: React.ReactNode;
  path?: string;
  cover?: keyof typeof guildCovers;
  onReplay?: () => void;
}) {
  const scene = guildCovers[cover];
  const { cast, action } = scene;
  return (
    <>
      <header className="guildhall" data-home={path === "/"} data-cover={cover}>
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
          {"date" in scene && (
            <time dateTime={scene.date}>
              {scene.date.split("-").reverse().join("/")}
            </time>
          )}
          {cast.map((name, i) => (
            <Fragment key={name}>
              {i > 0 && (i === cast.length - 1 ? " y " : ", ")}
              <a
                href={siteHref(
                  "/character/" + encodeURIComponent(coverMemberId(name)),
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
          {guildSections.map(([id, label]) => {
            return (
              <a
                key={id}
                href={siteHref(archivePath(id))}
                data-quick={id === "overview" || id === "news"}
                aria-current={path === archivePath(id) ? "page" : undefined}
              >
                <GuildIcon name={guildSectionIcons[id]} />
                <span>{label}</span>
              </a>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="guild-explore"
              data-section={
                guildSections.find(([id]) => archivePath(id) === path)?.[0]
              }
            >
              <GuildIcon name="compass" />
              <span>Explorar</span>
              <ChevronDown size={13} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="guild-explore-menu" align="end">
              {guildSections.map(([id, label]) => {
                return (
                  <DropdownMenuItem asChild key={id}>
                    <a
                      aria-current={
                        path === archivePath(id) ? "page" : undefined
                      }
                      href={siteHref(archivePath(id))}
                    >
                      <GuildIcon name={guildSectionIcons[id]} />
                      {label}
                      {path === archivePath(id) && (
                        <Check size={15} aria-hidden="true" />
                      )}
                    </a>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
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
