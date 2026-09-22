"use client";
import type { Logs } from "./types";
import { raidActivity } from "./raid-activity";
import { display, ago } from "./analytics";
import { Empty } from "@/components/guild-ui";
export function RaidActivity({ logs }: { logs?: Logs }) {
  const activity = raidActivity(logs);
  return (
    <section className="panel" style={{ marginTop: 22 }}>
      <h3>Dentro de la raid · últimos 7 días</h3>
      <p className="subheading">
        Combates con participación confirmada en los informes consultados.
        Cobertura limitada a los últimos informes.
      </p>
      {activity ? (
        <>
          <div className="stat-grid">
            {[
              ["Kills", activity.kills],
              ["Wipes", activity.wipes],
              ["Bosses únicos", activity.bosses],
              ["Minutos de combate", activity.minutes],
            ].map(([k, v]) => (
              <div className="stat" key={String(k)}>
                <small>{k}</small>
                <strong>{display(v)}</strong>
              </div>
            ))}
          </div>
          {activity.fights.map((f) => (
            <div
              className="compare-row"
              key={f.encounterId + ":" + f.startTime}
            >
              <strong>{f.name}</strong>
              <span>{f.kill ? "Victoria" : "Otro intento"}</span>
              <span>
                {display((f.endTime - f.startTime) / 60000)} min ·{" "}
                {f.spec ?? "Spec no publicada"}
              </span>
            </div>
          ))}
        </>
      ) : (
        <Empty
          title="Sin combates atribuibles esta semana"
          text="No contamos como propios los bosses de un informe si no podemos confirmar que este personaje participó."
        />
      )}
    </section>
  );
}
