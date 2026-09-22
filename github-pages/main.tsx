import { useState, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
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
import type { GuildData } from "../features/types";
import "../app/globals.css";
function App() {
  const [path, setPath] = useState(location.hash.slice(1) || "/");
  const [data, setData] = useState<GuildData | null>(null),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const route = () => {
      setPath(location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", route);
    return () => window.removeEventListener("hashchange", route);
  }, []);
  useEffect(() => {
    if (!path.startsWith("/tbc")) return;
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
  }, [path, attempt]);
  useEffect(() => {
    document.title =
      path === "/" ? "WoW Forever · LGP Chronicle" : "WoW TBC · LGP Chronicle";
  }, [path]);
  if (path === "/") return <Home />;
  if (!path.startsWith("/tbc"))
    return (
      <Shell>
        <main className="page-width panel">
          <h1>Ese portal no existe</h1>
          <a href={siteHref("/")}>Volver a Forever</a>
        </main>
      </Shell>
    );
  let id = "";
  try {
    id = decodeURIComponent(path.slice("/tbc/character/".length)).normalize(
      "NFC",
    );
  } catch {}
  const member = data?.members.find((m) => m.id === id);
  return (
    <Shell campaign="tbc">
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
          <h2>{error ? "El archivo no responde" : "Invocando al escriba…"}</h2>
          <p>Consultando los datos guardados de la compañía.</p>
        </main>
      ) : path === "/tbc" ? (
        <Dashboard key={data.generatedAt} initial={data} />
      ) : member ? (
        <CharacterDetail member={member} members={data.members} />
      ) : (
        <main className="page-width panel">
          <h2>Personaje no encontrado</h2>
          <a href={siteHref("/tbc")}>Volver a la compañía</a>
        </main>
      )}
    </Shell>
  );
}
createRoot(document.getElementById("root")!).render(
  <Suspense
    fallback={<main className="page-width panel">Abriendo el portal…</main>}
  >
    <App />
  </Suspense>,
);
