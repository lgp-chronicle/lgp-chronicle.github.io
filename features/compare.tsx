"use client";
import { useEntryState } from "@/hooks/use-entry-state";
import { Pick, Empty } from "@/components/guild-ui";
import { display, leveling } from "./analytics";
import { numeric, type Member } from "./types";
import { Crown } from "lucide-react";
import { MemberLink, fullName } from "./member-portrait";
import { duelPath, sectionFromPath } from "@/lib/guild-navigation";
import { siteHref } from "@/lib/public-settings";
export function Compare({
  members,
  initialPair,
}: {
  members: Member[];
  initialPair?: URLSearchParams;
}) {
  const first =
    members.find((m) => m.id === initialPair?.get("left")) ?? members[0];
  const second =
    members.find(
      (m) => m.id !== first?.id && m.id === initialPair?.get("right"),
    ) ?? members.find((m) => m.id !== first?.id);
  const [left, setLeft] = useEntryState<string>("duelLeft", first?.id ?? ""),
    [right, setRight] = useEntryState<string>("duelRight", second?.id ?? "");
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
      {initialPair &&
        sectionFromPath(window.history.state?.origin ?? "") === "news" && (
          <a
            className="back-link"
            href={siteHref(window.history.state.origin)}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                history.back();
              }
            }}
          >
            ← Volver a la jugada
          </a>
        )}
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
                onChange={(value) => {
                  if (i) setRight(value);
                  else setLeft(value);
                  if (initialPair)
                    history.replaceState(
                      history.state,
                      "",
                      siteHref(duelPath(i ? left : value, i ? value : right)),
                    );
                }}
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
