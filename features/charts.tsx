"use client";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Pick, Empty } from "@/components/guild-ui";
import { measurements, metricTime } from "./observations";
import { color, numeric, type Member } from "./types";
import { fullName } from "./member-portrait";

const metrics = [
  { value: "level", label: "Nivel" },
  { value: "itemLevel", label: "Item level" },
  { value: "honorableKills", label: "Muertes honorables" },
  { value: "honor", label: "Honor" },
] as const;
const day = 86400000;
const dateTick = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
});
const timeTick = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const valueFormat = new Intl.NumberFormat("es-ES");
const searchable = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
type Metric = (typeof metrics)[number]["value"];

function historySeries(members: Member[], key: Metric, range: string) {
  const start = range === "all" ? -Infinity : Date.now() - Number(range) * day;
  return members
    .map((member) => {
      const name = fullName(member);
      const current = { at: member.data.observedAt ?? "", data: member.data };
      const history = metricTime(current, key)
        ? [current, ...member.history]
        : member.history;
      const points = measurements({ ...member, history }, key).flatMap(
        (snapshot) => {
          const at = Date.parse(snapshot.at),
            value = snapshot.data[key];
          return Number.isFinite(at) && at >= start && numeric(value)
            ? [{ at, value, name }]
            : [];
        },
      );
      return {
        id: member.id,
        name,
        tint: color(member),
        points,
        last: points.at(-1)?.value,
      };
    })
    .sort(
      (a, b) =>
        (b.last ?? -Infinity) - (a.last ?? -Infinity) ||
        a.name.localeCompare(b.name, "es"),
    );
}

export function HistoryChart({ members }: { members: Member[] }) {
  const [key, setKey] = useState<Metric>("level");
  const [range, setRange] = useState("7");
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const series = useMemo(
    () => historySeries(members, key, range),
    [members, key, range],
  );
  const visible = series.filter((s) => s.points.length);
  const focus = visible.find((s) => s.id === selected);
  const guild = members.length > 1;
  const searchTerm = searchable(query.trim());
  const listed = series.filter((s) => searchable(s.name).includes(searchTerm));
  const metric = metrics.find((option) => option.value === key)!;
  const first = Math.min(...visible.map((s) => s.points[0].at));
  const last = Math.max(
    ...visible.map((s) => s.points[s.points.length - 1].at),
  );
  const singleInstant = first === last;
  const formatTick = last - first < 2 * day ? timeTick : dateTick;
  return (
    <section className="panel history-panel">
      <div className="section-heading">
        <h3>
          {guild ? "Evolución de la hermandad" : "Evolución del personaje"}
        </h3>
        {guild && (
          <span className="history-coverage">
            {visible.length} de {members.length} con registros
          </span>
        )}
      </div>
      <div className="chart-controls">
        <Pick
          label="Estadística"
          value={key}
          onChange={(v) => setKey(v as Metric)}
          options={[...metrics]}
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
      {!visible.length ? (
        <Empty
          title="Sin registros en este periodo"
          text="Prueba otra estadística o amplía el periodo."
        />
      ) : (
        <div className={guild ? "history-layout" : ""}>
          <div className="history-plot">
            {focus && (
              <button
                type="button"
                className="history-focus"
                onClick={() => setSelected("")}
                aria-label={"Quitar el resaltado de " + focus.name}
              >
                {focus.name} <X size={14} aria-hidden="true" />
              </button>
            )}
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 14, right: 13, bottom: 4, left: 0 }}
                  title={
                    metric.label +
                    " · " +
                    (guild ? "La Ganga" : series[0]?.name)
                  }
                >
                  <CartesianGrid
                    stroke="var(--border)"
                    strokeDasharray="2 6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="at"
                    type="number"
                    scale="time"
                    domain={
                      singleInstant
                        ? [first - 1800000, last + 1800000]
                        : [first, last]
                    }
                    tickFormatter={(v) => formatTick.format(v)}
                    minTickGap={22}
                    tickMargin={8}
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                  />
                  <YAxis
                    dataKey="value"
                    width="auto"
                    stroke="var(--muted-foreground)"
                    tickMargin={7}
                    fontSize={12}
                    domain={["auto", "auto"]}
                    allowDecimals={key === "itemLevel"}
                  />
                  <Tooltip
                    shared={false}
                    cursor={false}
                    isAnimationActive={false}
                    content={({ active, payload }) => {
                      const point = payload?.[0]?.payload;
                      return active && point ? (
                        <div className="history-tooltip">
                          <strong>{point.name}</strong>
                          <span>
                            {metric.label} · {valueFormat.format(point.value)}
                          </span>
                          <time>{timeTick.format(point.at)}</time>
                        </div>
                      ) : null;
                    }}
                  />
                  {visible.map((s) => {
                    const focused = focus?.id === s.id;
                    const dimmed = !!focus && !focused;
                    const radius = focused || s.points.length === 1 ? 3.8 : 2.4;
                    return (
                      <Scatter
                        key={s.id}
                        name={s.name}
                        data={s.points}
                        fill={s.tint}
                        opacity={dimmed ? 0.24 : 1}
                        zIndex={focused ? 451 : 450}
                        line={{
                          stroke: s.tint,
                          strokeWidth: focused ? 3 : 1.7,
                        }}
                        lineJointType="stepAfter"
                        isAnimationActive={false}
                        shape={({ cx, cy }) => (
                          <g opacity={dimmed ? 0.24 : 1}>
                            <circle cx={cx} cy={cy} r={7} fill="transparent" />
                            <circle
                              cx={cx}
                              cy={cy}
                              r={radius}
                              fill={s.tint}
                              stroke="#16221b"
                              strokeWidth={0.8}
                            />
                          </g>
                        )}
                      />
                    );
                  })}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          {guild && (
            <div className="history-directory">
              <label className="history-search">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Buscar personaje para resaltar"
                  placeholder="Resaltar personaje…"
                />
              </label>
              <ul aria-label="Personajes y último valor del periodo">
                {listed.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={s.last === undefined}
                      aria-pressed={focus?.id === s.id}
                      onClick={() =>
                        setSelected(focus?.id === s.id ? "" : s.id)
                      }
                      title={
                        s.last === undefined
                          ? "Sin registros en el periodo"
                          : s.name
                      }
                    >
                      <i
                        aria-hidden="true"
                        style={{ backgroundColor: s.tint }}
                      />
                      <span>{s.name}</span>
                      <b>
                        {s.last === undefined
                          ? "—"
                          : valueFormat.format(s.last)}
                      </b>
                    </button>
                  </li>
                ))}
              </ul>
              {!listed.length && (
                <p className="muted">Ningún personaje con ese nombre.</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function Distribution({ members }: { members: Member[] }) {
  const [kind, setKind] = useState<"className" | "race" | "spec">("className");
  const counts = new Map<string, number>();
  const tints = new Map<string, string>();
  for (const member of members) {
    const label = member.data[kind]?.trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
    if (kind === "className") tints.set(label, color(member));
  }
  const groups = [...counts].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"),
  );
  const max = groups[0]?.[1];
  return (
    <section className="panel">
      <h3>La composición de la hermandad</h3>
      <div className="toolbar">
        <Pick
          label="Distribución"
          value={kind}
          onChange={(v) => setKind(v as typeof kind)}
          options={[
            { value: "className", label: "Clases" },
            { value: "race", label: "Razas" },
            { value: "spec", label: "Especializaciones" },
          ]}
        />
      </div>
      {groups.length ? (
        <ul className="distribution-bars">
          {groups.map(([label, count]) => (
            <li key={label}>
              <span>{label}</span>
              <span className="bar-track" aria-hidden="true">
                <i
                  style={{
                    width: (100 * count) / max + "%",
                    backgroundColor: tints.get(label),
                  }}
                />
              </span>
              <b>{count}</b>
            </li>
          ))}
        </ul>
      ) : (
        <Empty
          title="Sin datos de composición"
          text="La armería todavía no ha registrado este dato para la hermandad."
        />
      )}
    </section>
  );
}
