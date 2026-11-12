import { assetUrl } from "../lib/public-settings";
import { CharacterArt, hasEntrancePortrait } from "./character-art";
import { raceStature } from "./entrance-formation";
import { paintedWelcome, type WelcomeParty } from "./membership";

export function WelcomeArt({
  party,
  large = false,
}: {
  party: WelcomeParty;
  large?: boolean;
}) {
  if (party.id === paintedWelcome)
    return (
      <picture className="welcome-painting" aria-hidden="true">
        {large && (
          <source
            media="(max-width: 680px)"
            srcSet={
              new URL(
                "../app/art/bienvenida-er-manu-movil.webp",
                import.meta.url,
              ).href
            }
          />
        )}
        <img
          alt=""
          loading={large ? "eager" : "lazy"}
          src={
            large
              ? new URL("../app/art/bienvenida-er-manu.webp", import.meta.url)
                  .href
              : assetUrl("/guild/galeria/bienvenida-er-manu.webp")
          }
        />
      </picture>
    );
  return (
    <div
      className="welcome-courtyard"
      aria-hidden="true"
      style={{ backgroundImage: `url("${assetUrl("/guild/patio.webp")}")` }}
    >
      <div className="welcome-cast">
        {party.members.map((m) => (
          <div
            className="welcome-figure"
            key={m.id}
            style={{ height: Math.min(100, 90 * raceStature(m)) + "%" }}
          >
            {hasEntrancePortrait(m) ? (
              <CharacterArt member={m} />
            ) : (
              <img
                className="welcome-seal"
                src={assetUrl("/guild/sello-la-ganga.png")}
                alt=""
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
