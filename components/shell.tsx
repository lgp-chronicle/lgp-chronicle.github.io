import { siteHref, assetUrl } from "@/lib/public-settings";
import { ArrowUpRight } from "lucide-react";
export function Shell({
  children,
  campaign = "forever",
}: {
  children: React.ReactNode;
  campaign?: string;
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
        <nav aria-label="Campaña" className="campaign-switch">
          <a
            className={campaign === "forever" ? "selected" : ""}
            href={siteHref("/")}
          >
            WoW Forever <span>PRÓXIMAMENTE</span>
          </a>
          <a
            className={campaign === "tbc" ? "selected" : ""}
            href={siteHref("/tbc")}
          >
            WoW TBC <ArrowUpRight size={15} />
          </a>
        </nav>
        <span className="header-note">
          {campaign === "tbc" ? "EU / SPINESHATTER" : "REALMLESS"}
        </span>
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
