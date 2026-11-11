import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Shell } from "../components/shell";
const Dashboard = lazy(() =>
  import("../features/dashboard").then((m) => ({ default: m.Dashboard })),
);
const CharacterDetail = lazy(() =>
  import("../features/character-detail").then((m) => ({
    default: m.CharacterDetail,
  })),
);
import { apiUrl, siteHref } from "../lib/public-settings";
import { sectionFromPath } from "../lib/guild-navigation";
import { browserCover } from "../lib/guild-covers";
import type { GuildData } from "../features/types";
import { GuildEntrance, initialEntrance } from "../features/guild-entrance";
import "../app/globals.css";
import "../app/guild-views.css";
import "../app/race-course.css";
import "../app/honor-cards.css";
import "../app/character-records.css";
import "../app/guild-entrance.css";
import "../app/guildhall.css";
import "../app/cover-gallery.css";
function App() {
  const [cover] = useState(browserCover);
  const [entrance, setEntrance] = useState(initialEntrance);
  const closeEntrance = useCallback(() => setEntrance(null), []);
  const [path, setPath] = useState(location.hash.slice(1) || "/");
  const [routePath, query] = path.split("?");
  const dataRoute = sectionFromPath(routePath) ? "/" : routePath;
  const [data, setData] = useState<GuildData | null>(null),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let departure: { from: string; to: string } | undefined;
    const remember = (event: MouseEvent) => {
      departure = undefined;
      if (
        event.button ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        !(event.target instanceof Element)
      )
        return;
      const a = event.target.closest<HTMLAnchorElement>('a[href^="#/"]');
      const to = a?.hash.slice(1);
      if (
        !to ||
        !a ||
        a.target === "_blank" ||
        (!to.startsWith("/character/") && !to.startsWith("/archivo/compare?"))
      )
        return;
      const from = location.hash.slice(1) || "/";
      if (from === to) return;
      departure = { from, to };
      history.replaceState(
        {
          ...history.state,
          returnY: scrollY,
          returnStory: a.closest<HTMLElement>("[data-story]")?.dataset.story,
        },
        "",
      );
    };
    const route = () => {
      if (departure?.to === location.hash.slice(1))
        history.replaceState({ ...history.state, origin: departure.from }, "");
      departure = undefined;
      setEntrance(null);
      setPath(location.hash.slice(1) || "/");
      if (!sectionFromPath(location.hash.slice(1))) window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", route);
    document.addEventListener("click", remember, true);
    return () => {
      window.removeEventListener("hashchange", route);
      document.removeEventListener("click", remember, true);
    };
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    setError(false);
    fetch(apiUrl("/api/guild"), { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((raw) => {
        const d = raw as GuildData;
        if (!Array.isArray(d?.members)) throw Error();
        setData(d);
      })
      .catch(() => {
        if (!abort.signal.aborted) setError(true);
      });
    return () => abort.abort();
  }, [dataRoute, attempt]);
  useEffect(() => {
    document.title = "La Ganga · Crónicas de la hermandad";
  }, [path]);

  let id = "";
  const charPrefix = "/character/";
  if (path.startsWith(charPrefix)) {
    try {
      id = decodeURIComponent(routePath.slice(charPrefix.length)).normalize(
        "NFC",
      );
    } catch {}
  }
  const member = data?.members.find((m) => m.id === id);
  const section = sectionFromPath(path);

  return (
    <>
      <Suspense
        fallback={<main className="page-width panel">Abriendo el portal…</main>}
      >
        <Shell
          cover={cover}
          path={routePath}
          onReplay={
            data?.members.length ? () => setEntrance("replay") : undefined
          }
        >
          {error && (
            <div className="page-width notice" role="alert">
              No hemos podido consultar el archivo.{" "}
              {data ? "Se conserva la última vista." : ""}{" "}
              <button
                className="button outline"
                onClick={() => setAttempt((x) => x + 1)}
              >
                Reintentar
              </button>
            </div>
          )}
          {!data ? (
            <main className="page-width panel" aria-busy={!error}>
              <h2>
                {error ? "El archivo no responde" : "Invocando al escriba…"}
              </h2>
              <p>Consultando los datos guardados de la hermandad.</p>
            </main>
          ) : path === "/" || path === "" || section ? (
            <Dashboard
              key={path + data.generatedAt}
              initial={data}
              section={section}
            />
          ) : member ? (
            <CharacterDetail
              key={member.id}
              member={member}
              members={data.members}
              initialTab={new URLSearchParams(query).get("tab")}
            />
          ) : (
            <main className="page-width panel">
              <h2>Personaje no encontrado</h2>
              <a href={siteHref("/")}>Volver a la hermandad</a>
            </main>
          )}
        </Shell>
      </Suspense>
      {entrance && data && data.members.length > 0 && (
        <GuildEntrance
          members={data.members}
          mode={entrance}
          onDone={closeEntrance}
        />
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
