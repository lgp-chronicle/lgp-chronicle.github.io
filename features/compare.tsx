"use client";
import { useState } from "react";
import { Pick, Empty } from "@/components/guild-ui";
import { display, leveling } from "./analytics";
import { numeric, type Member } from "./types";
import { Crown } from "lucide-react";
import { MemberLink, fullName } from "./member-portrait";
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
    ...[
      "Aguante",
      "Intelecto",
      "Fuerza",
      "Agilidad",
      "Espíritu",
      "Armadura",
    ].map((attribute): [string, (m: Member) => unknown] => [
      attribute,
      (m) => m.data.statistics?.[attribute],
    ]),
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
                  .map((x) => ({ value: x.id, label: fullName(x) }))}
              />
              <h2 className="banner-lineup">
                <MemberLink
                  member={m}
                  banner
                  subtitle={m.data.className ?? "Clase por descubrir"}
                />
              </h2>
            </div>
          </div>
        ))}
      </div>
      {rows.map(([label, get]) => {
        const leftValue = get(a),
          rightValue = get(b);
        const comparable = numeric(leftValue) && numeric(rightValue);
        const marker = (
          <span className="duel-crown" role="img" aria-label="Mejor valor">
            <Crown size={16} aria-hidden="true" />
          </span>
        );
        return (
          <div className="compare-row" key={label}>
            <strong>
              {comparable && leftValue > rightValue && marker}
              {display(leftValue)}
            </strong>
            <span>
              {label}
              {comparable && leftValue === rightValue && (
                <small className="tied-value">Empate</small>
              )}
            </span>
            <strong>
              {comparable && rightValue > leftValue && marker}
              {display(rightValue)}
            </strong>
          </div>
        );
      })}
      <p className="subheading" style={{ marginTop: 18 }}>
        DPS y HPS son mejores registros; pueden corresponder a encuentros
        distintos.
      </p>
    </section>
  );
}
