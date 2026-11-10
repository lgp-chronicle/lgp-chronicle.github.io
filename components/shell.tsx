import { siteHref, assetUrl } from "@/lib/public-settings";
import { guildConfig } from "@/config/characters";
export function Shell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="masthead">
        <a href={siteHref("/")} className="brand">
          <img src={assetUrl("/logo.png")} alt="LGP" width="48" height="48" />
          <span>
            LGP · CHRONICLE<small>NUESTRA HISTORIA EN AZEROTH</small>
          </span>
        </a>
        <nav aria-label="Guild" className="campaign-switch">
          <a className="selected" href={siteHref("/")}>
            WoW Forever
          </a>
          <span className="header-note">
            {guildConfig.name.toUpperCase()} · EU
          </span>
        </nav>
      </header>
      {children}
      <footer>
        <span>LGP · CHRONICLE · Hecho para volver a encontrarnos.</span>
        <span>
          Proyecto de fans. World of Warcraft © Blizzard Entertainment.
        </span>
      </footer>
    </>
  );
}
