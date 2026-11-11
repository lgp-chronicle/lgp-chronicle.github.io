import { siteHref, assetUrl } from "@/lib/public-settings";
import { archivePath } from "@/lib/guild-navigation";
export function Shell({
  children,
  path = "/",
}: {
  children: React.ReactNode;
  path?: string;
}) {
  return (
    <>
      <header className="masthead">
        <div className="masthead-inner">
          <a href={siteHref("/")} className="brand">
            <img
              src={assetUrl("/guild/sello-la-ganga.png")}
              alt=""
              width="54"
              height="54"
            />
            <span>
              La Ganga<small>Hermandad</small>
            </span>
          </a>
          <nav aria-label="Navegación principal" className="guild-nav">
            {[
              ["/", "Portada"],
              [archivePath("overview"), "Hermandad"],
              [archivePath("news"), "El Heraldo"],
            ].map(([route, label]) => (
              <a
                href={siteHref(route)}
                key={route}
                aria-current={route === path ? "page" : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
          <span className="realm-note">
            WoW Forever <span>·</span> EU
          </span>
        </div>
      </header>
      {children}
      <footer>
        <a className="footer-brand" href={siteHref("/")}>
          <img
            src={assetUrl("/guild/sello-la-ganga.png")}
            alt=""
            width="32"
            height="32"
          />{" "}
          La Ganga <span>· WoW Forever</span>
        </a>
        <span>
          Proyecto de fans. World of Warcraft © Blizzard Entertainment.
        </span>
      </footer>
    </>
  );
}
