"use client";
import { useState } from "react";
import { Pick, Empty } from "@/components/guild-ui";
import { display, leveling } from "./analytics";
import { color, type Member } from "./types";
export function Compare({ members }: { members: Member[] }) {
  const [left, setLeft] = useState(members[0]?.id ?? ""),
    [right, setRight] = useState(members[1]?.id ?? "");
  const a = members.find((m) => m.id === left),
    b = members.find((m) => m.id === right);
  if (!a || !b) return <Empty />;
  const rows: [string, (m: Member) => unknown][] = [
    ["Nivel", (m) => m.data.level],
    ["Item level", (m) => m.data.itemLevel],
    ["Muertes honorables", (m) => m.data.honorableKills],
    [
      "Profesiones",
      (m) =>
        m.data.professions
          ?.map((p) => p.name + " " + display(p.skill))
          .join(" · "),
    ],
    ["Bosses en logs", (m) => m.logs?.bosses],
    ["Best Parse", (m) => m.logs?.bestParse],
    ["Mejor DPS", (m) => m.logs?.bestDps],
    ["Mejor HPS", (m) => m.logs?.bestHps],
    ["Niveles / 24 h", (m) => leveling(m).day],
    ["Niveles / 7 días", (m) => leveling(m).week],
    ["Niveles / día observado", (m) => leveling(m).average],
  ];
  return (
    <section className="panel">
      <h3>Duelo de compañeros</h3>
      <p className="subheading">Sin /duel. Sin reparar. Con números.</p>
      <div className="duel">
        {[a, b].map((m, i) => (
          <div key={i} style={{ display: "contents" }}>
            {i === 1 && <strong>VS</strong>}
            <div className="duel-side">
              <Pick
                label={i ? "Segundo personaje" : "Primer personaje"}
                value={i ? right : left}
                onChange={i ? setRight : setLeft}
                options={members
                  .filter((x) => x.id !== (i ? left : right))
                  .map((x) => ({ value: x.id, label: x.name }))}
              />
              <h2 style={{ color: color(m) }}>{m.name}</h2>
              <p className="muted">
                {m.data.className ?? "Clase por descubrir"}
              </p>
            </div>
          </div>
        ))}
      </div>
      {rows.map(([label, get]) => (
        <div className="compare-row" key={label}>
          <strong>{display(get(a))}</strong>
          <span>{label}</span>
          <strong>{display(get(b))}</strong>
        </div>
      ))}
      <p className="subheading" style={{ marginTop: 18 }}>
        DPS y HPS son mejores registros; pueden corresponder a encuentros
        distintos.
      </p>
    </section>
  );
}
