"use client";
import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Pick, Empty } from "@/components/guild-ui";
import { measurements } from "./observations";
import { numeric, type Member, type Profile } from "./types";
import { fullName } from "./member-portrait";
const lineColors = ["#f9cd58", "#69d7cf", "#c6a1fa"];
export function HistoryChart({ members }: { members: Member[] }) {
  const [metric, setMetric] = useState("level"),
    [range, setRange] = useState("7");
  const start = range === "all" ? 0 : Date.now() - Number(range) * 86400000;
  const [picks, setPicks] = useState<(string | undefined)[]>();
  const readings = members.map((m) => {
    const points = measurements(m, metric as keyof Profile).filter(
      (s) => Date.parse(s.at) >= start,
    );
    return {
      member: m,
      points,
      last: points.at(-1)?.data[metric as keyof Profile],
    };
  });
  const ranked = readings
    .filter((r) => numeric(r.last))
    .sort(
      (a, b) =>
        Number(b.last) - Number(a.last) ||
        fullName(a.member).localeCompare(fullName(b.member), "es"),
    );
  const limit = Math.min(3, members.length);
  const selected =
    picks ?? Array.from({ length: limit }, (_, i) => ranked[i]?.member.id);
  const series = selected.flatMap((id, index) => {
    const row = readings.find((r) => r.member.id === id);
    return row ? [{ ...row, index }] : [];
  });
  const observations = new Map<number, Record<string, number>>();
  for (const { member, points } of series)
    for (const point of points) {
      const at = Date.parse(point.at),
        value = point.data[metric as keyof Profile];
      if (!numeric(value)) continue;
      const row = observations.get(at) ?? { at };
      row[member.id] = value;
      observations.set(at, row);
    }
  const rows = [...observations.values()].sort((a, b) => a.at - b.at);
  const sortedMembers = [...members].sort((a, b) =>
    fullName(a).localeCompare(fullName(b), "es"),
  );
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h3>Evolución del personaje</h3>
          <p className="subheading">
            {members.length > 1
              ? "Compara hasta tres personajes. Cada línea une sus registros de la armería."
              : "La línea une los registros de la armería."}
          </p>
        </div>
      </div>
      <div className="chart-controls">
        <Pick
          label="Estadística"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "level", label: "Nivel" },
            { value: "itemLevel", label: "Item level" },
            { value: "honorableKills", label: "Muertes honorables" },
            { value: "honor", label: "Honor" },
          ]}
        />
        <Pick
          label="Periodo"
          value={range}
          onChange={setRange}
          options={[
            { value: "1", label: "24 horas" },
            { value: "7", label: "7 días" },
            { value: "30", label: "30 días" },
            { value: "all", label: "Todo" },
          ]}
        />
      </div>
      {members.length > 1 && (
        <div className="chart-party" aria-label="Personajes de la gráfica">
          {selected.map((id, i) => (
            <label key={i} style={{ borderColor: lineColors[i] }}>
              <span>Línea {i + 1}</span>
              <Pick
                label={"Personaje de la línea " + (i + 1)}
                value={id ?? "none"}
                onChange={(v) => {
                  const next = [...selected];
                  next[i] = v === "none" ? undefined : v;
                  setPicks(next);
                }}
                options={[
                  { value: "none", label: "Sin personaje" },
                  ...sortedMembers
                    .filter((m) => m.id === id || !selected.includes(m.id))
                    .map((m) => ({ value: m.id, label: fullName(m) })),
                ]}
              />
            </label>
          ))}
        </div>
      )}
      {!rows.length ? (
        <Empty
          title="Sin registros en esta selección"
          text="Prueba con otro personaje, estadística o periodo."
        />
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 5"
                vertical={false}
              />
              <XAxis
                dataKey="at"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) =>
                  new Date(v).toLocaleString("es-ES", {
                    ...(range === "1"
                      ? ({ hour: "2-digit", minute: "2-digit" } as const)
                      : ({ day: "numeric", month: "short" } as const)),
                  })
                }
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <YAxis
                width={45}
                stroke="var(--muted-foreground)"
                fontSize={12}
                domain={["auto", "auto"]}
                allowDecimals={metric !== "level"}
              />
              <Tooltip
                labelFormatter={(v) =>
                  new Date(Number(v)).toLocaleString("es-ES")
                }
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              />
              {series.map(({ member: m, index, points }) => (
                <Line
                  key={m.id}
                  name={fullName(m)}
                  dataKey={m.id}
                  stroke={lineColors[index]}
                  strokeDasharray={["", "6 3", "2 3"][index]}
                  type="stepAfter"
                  connectNulls={true}
                  dot={points.length < 12 ? { r: 3 } : false}
                  activeDot={{ r: 5 }}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
export function Distribution({ members }: { members: Member[] }) {
  const [kind, setKind] = useState("className");
  const counts: Record<string, number> = {};
  for (const m of members) {
    const name = m.data[kind as keyof Profile];
    if (typeof name === "string") counts[name] = (counts[name] ?? 0) + 1;
  }
  return (
    <section className="panel">
      <h3>La composición de la hermandad</h3>
      <div className="toolbar">
        <Pick
          label="Distribución"
          value={kind}
          onChange={setKind}
          options={[
            { value: "className", label: "Clases" },
            { value: "race", label: "Razas" },
            { value: "spec", label: "Especializaciones" },
          ]}
        />
      </div>
      {Object.keys(counts).length ? (
        <ul className="distribution-bars">
          {Object.entries(counts)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
            .map(([label, count]) => (
              <li key={label}>
                <span>{label}</span>
                <span className="bar-track" aria-hidden="true">
                  <i
                    style={{
                      width:
                        (100 * count) / Math.max(...Object.values(count)) + "%",
                    }}
                  />
                </span>
                <b>{count}</b>
              </li>
            ))}
        </ul>
      ) : (
        <Empty
          title="Aún no conocemos las clases"
          text="La composición aparecerá cuando Blizzard proporcione las fichas."
        />
      )}
    </section>
  );
}
