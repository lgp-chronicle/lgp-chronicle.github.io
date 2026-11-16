"use client";
import { useEntryState } from "@/hooks/use-entry-state";
import { Pick, Empty } from "@/components/guild-ui";
import { display, ago } from "./analytics";
import { numeric, type Member } from "./types";
import { GuildIcon } from "@/components/guild-icon";
import { MemberLink, fullName } from "./member-portrait";
import { duelPath, sectionFromPath } from "@/lib/guild-navigation";
import { siteHref } from "@/lib/public-settings";
import { duelGroups } from "./duel-metrics";
import { ChevronDown } from "lucide-react";
import "../app/duel-groups.css";
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
  const groups = duelGroups(a,b);
  return (
    <section className="panel duel-panel">
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
              <small className="duel-last-update">Último cambio: {ago(m.data.sourceModified)}</small>
            </div>
          </div>
        ))}
      </div>
      <p className="duel-help">Despliega cada categoría para comparar. Una corona marca el valor más alto; «—» significa que falta el dato.</p>
      {groups.map(group => <details className="duel-group" key={group.id} open={["general","collections","pvp"].includes(group.id)}>
        <summary><GuildIcon name={group.icon} size={25}/><h4>{group.title}</h4><small>{group.rows.length} datos</small><ChevronDown size={17} aria-hidden="true"/></summary>
        {group.rows.map(({label,left:leftValue,right:rightValue,unit,crown}) => {
        const comparable = numeric(leftValue) && numeric(rightValue);
        const marker = (
          <span className="duel-crown" role="img" aria-label="Mejor valor">
            <GuildIcon name="crown" size={20} />
          </span>
        );
        return (
          <div className="compare-row" key={label}>
            <strong>
              {crown && comparable && leftValue > rightValue && marker}
              {display(leftValue)}{numeric(leftValue) && unit && " " + unit}
            </strong>
            <span>
              {label}
              {crown && comparable && leftValue === rightValue && (
                <small className="tied-value">Empate</small>
              )}
            </span>
            <strong>
              {crown && comparable && rightValue > leftValue && marker}
              {display(rightValue)}{numeric(rightValue) && unit && " " + unit}
            </strong>
          </div>
        );
        })}
        {group.note && <p className="duel-group-note">{group.note}</p>}
      </details>)}
    </section>
  );
}
