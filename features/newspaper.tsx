"use client";
import { apiUrl } from "@/lib/public-settings";
import { useState, useEffect } from "react";
import { Pick, Empty } from "@/components/guild-ui";
import type { Activity } from "./types";
export function Newspaper({ events }: { events: Activity[] }) {
  const [archivedDays, setArchivedDays] = useState<string[]>([]);
  const [archivedEvents, setArchivedEvents] = useState<Activity[] | null>(null);
  const [archiveError, setArchiveError] = useState(false);
  const days = Array.from(
    new Set([
      new Date().toISOString().slice(0, 10),
      ...archivedDays,
      ...events.map((e) => e.at.slice(0, 10)),
    ]),
  )
    .sort()
    .reverse();
  const [day, setDay] = useState(days[0]);
  useEffect(() => {
    const abort = new AbortController();
    fetch(apiUrl("/api/editions"), { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setArchivedDays((d as { days: string[] }).days))
      .catch(() => {});
    return () => abort.abort();
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    setArchivedEvents(null);
    setArchiveError(false);
    fetch(apiUrl("/api/editions?day=" + day), { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setArchivedEvents((d as { events: Activity[] }).events))
      .catch(() => {
        if (!abort.signal.aborted) setArchiveError(true);
      });
    return () => abort.abort();
  }, [day]);
  const rows =
    archivedEvents ?? events.filter((e) => e.at.slice(0, 10) === day);
  const sums = (metric: string) =>
    rows
      .filter((e) => e.metric === metric)
      .reduce((n, e) => n + (e.delta ?? 0), 0);
  return (
    <section className="news-paper">
      <div className="paper-meta">
        <span>EDICIÓN DE SPINESHATTER</span>
        <span>PRENSA INDEPENDIENTE*</span>
      </div>
      <h2 className="paper-title">El Heraldo de Azeroth</h2>
      <div className="toolbar">
        <Pick
          label="Edición del periódico"
          value={day}
          onChange={setDay}
          options={days.map((d) => ({
            value: d,
            label: new Date(d + "T12:00:00Z").toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
          }))}
        />
        <small>Ediciones diarias · UTC</small>
      </div>
      {archiveError && (
        <p role="status">
          No se ha podido cargar la edición completa. Mostrando los registros
          disponibles.
        </p>
      )}
      {rows.length ? (
        <>
          <h3>Hoy en la guild</h3>
          <p>
            {sums("level")} niveles · {sums("itemLevel")} puntos de equipo ·{" "}
            {sums("honorableKills")} HK ganadas
          </p>
          {rows.map((e) => (
            <article key={e.id}>
              <small>
                {new Date(e.at).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · CAMBIO OBSERVADO
              </small>
              <h3>{e.text}</h3>
            </article>
          ))}
        </>
      ) : (
        <Empty
          title="La rotativa espera su primer titular."
          text="Todavía no se han detectado cambios en esta edición. Volveremos cuando haya hechos, no rumores."
        />
      )}
      <p
        style={{
          fontSize: 11,
          marginTop: 22,
          borderTop: "1px solid #96886a",
          paddingTop: 12,
        }}
      >
        * Independiente del loot council. Titulares generados a partir de
        registros reales.
      </p>
    </section>
  );
}
