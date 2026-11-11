import { siteHref, assetUrl } from "@/lib/public-settings";
import { archivePath, guildSections } from "@/lib/guild-navigation";
import { ChevronDown, Compass, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export function Shell({
  children,
  path = "/",
  onReplay,
}: {
  children: React.ReactNode;
  path?: string;
  onReplay?: () => void;
}) {
  return (
    <>
      <header className="guildhall" data-home={path === "/"}>
        {path === "/" && (
          <p className="sr-only">
            Rast Puñotormenta y Naisen Grandwell estudian un mapa bajo los
            estandartes de La Ganga.
          </p>
        )}
        <div className="guildhall-inner">
          <a
            className="guildhall-brand"
            href={siteHref("/")}
            aria-label="La Ganga · Portada"
          >
            <img
              src={assetUrl("/guild/escudo-la-ganga.webp")}
              alt=""
              width="800"
              height="797"
            />
            <div>
              <p className="eyebrow">Hermandad · WoW Forever EU</p>
              {path === "/" ? <h1>La Ganga</h1> : <strong>La Ganga</strong>}
              {path === "/" && (
                <p className="guildhall-legend">
                  Las crónicas de nuestra hermandad en Azeroth.
                </p>
              )}
            </div>
          </a>
        </div>
      </header>
      <nav aria-label="Navegación principal" className="guildhall-nav">
        <div>
          <a
            href={siteHref("/")}
            aria-current={path === "/" ? "page" : undefined}
          >
            Portada
          </a>
          {guildSections.map(([id, label]) => (
            <a
              key={id}
              href={siteHref(archivePath(id))}
              data-quick={id === "overview" || id === "news"}
              aria-current={path === archivePath(id) ? "page" : undefined}
            >
              {label}
            </a>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="guild-explore">
              <Compass size={16} aria-hidden="true" /> Explorar{" "}
              <ChevronDown size={13} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="guild-explore-menu" align="end">
              {guildSections.map(([id, label]) => (
                <DropdownMenuItem asChild key={id}>
                  <a
                    aria-current={path === archivePath(id) ? "page" : undefined}
                    href={siteHref(archivePath(id))}
                  >
                    {label}
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
      {children}
      <footer>
        <a className="footer-brand" href={siteHref("/")}>
          <img
            src={assetUrl("/guild/sello-la-ganga.png?v=2")}
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
