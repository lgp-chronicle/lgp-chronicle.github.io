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
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Pick, Empty } from "@/components/guild-ui";
import { measurements } from "./observations";
import { color, numeric, type Member, type Profile } from "./types";
export function HistoryChart({ members }: { members: Member[] }) {
  const [metric, setMetric] = useState("level"),
    [range, setRange] = useState("7");
  const start = range === "all" ? 0 : Date.now() - Number(range) * 86400000;
  const times = Array.from(
    new Set(
      members.flatMap((m) =>
        measurements(m, metric as keyof Profile)
          .filter(
            (s) =>
              Date.parse(s.at) >= start &&
              numeric(s.data[metric as keyof Profile]),
          )
          .map((s) => s.at),
      ),
    ),
  ).sort();
  const rows = times.map((at) => {
    const row: Record<string, number | string> = { at: Date.parse(at) };
    for (const m of members) {
      const p = measurements(m, metric as keyof Profile).find(
        (s) => s.at === at,
      );
      if (p && numeric(p.data[metric as keyof Profile]))
        row[m.name] = p.data[metric as keyof Profile] as number;
    }
    return row;
  });
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h3>Todo progreso deja huella.</h3>
          <p className="subheading">
            La línea une observaciones; no indica el instante exacto del cambio.
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
      {!rows.length ? (
        <Empty
          title="La primera línea empieza contigo"
          text="En cuanto tengamos registros, aquí podrás seguir la evolución del grupo. No rellenamos el pasado con estimaciones."
        />
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid
                stroke="#303e50"
                strokeDasharray="3 5"
                vertical={false}
              />
              <XAxis
                dataKey="at"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                  })
                }
                stroke="#8292a6"
                fontSize={12}
              />
              <YAxis
                stroke="#8292a6"
                fontSize={12}
                domain={["auto", "auto"]}
                allowDecimals={metric !== "level"}
              />
              <Tooltip
                labelFormatter={(v) =>
                  new Date(Number(v)).toLocaleString("es-ES")
                }
                contentStyle={{
                  background: "#172231",
                  border: "1px solid #52627a",
                }}
              />
              <Legend />
              {members.map((m) => (
                <Line
                  key={m.id}
                  name={m.name}
                  dataKey={m.name}
                  stroke={color(m)}
                  type="stepAfter"
                  connectNulls={true}
                  dot={{ r: 3 }}
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
      <h3>La composición de la compañía</h3>
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
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={Object.entries(counts).map(([name, count]) => ({
                name,
                count,
              }))}
            >
              <XAxis dataKey="name" stroke="#9caabd" fontSize={12} />
              <YAxis allowDecimals={false} stroke="#9caabd" />
              <Tooltip contentStyle={{ background: "#172231" }} />
              <Bar dataKey="count" name="Personajes" fill="#568fc5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Empty
          title="Aún no conocemos las clases"
          text="La composición aparecerá cuando Blizzard proporcione las fichas."
        />
      )}
    </section>
  );
}
