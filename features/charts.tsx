"use client";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Popover } from "radix-ui";
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
import { searchable } from "@/lib/guild-navigation";
import { composition, type DistributionRow, type DistributionKind } from "./composition";

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

type RaceInspection = { race: string; pinned: boolean } | null;
function RaceBar({ row, max, inspection, inspect }: {
  row: DistributionRow;
  max: number;
  inspection: RaceInspection;
  inspect: Dispatch<SetStateAction<RaceInspection>>;
}) {
  const open = inspection?.race === row.label;
  const [highlight, setHighlight] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const button = useRef<HTMLButtonElement>(null);
  const cancelClose = () => window.clearTimeout(timer.current);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const close = () => inspect(active => active?.race === row.label ? null : active);
  function preview() {
    cancelClose();
    inspect(active => active?.race === row.label ? active : { race: row.label, pinned: false });
  }
  function leave() {
    cancelClose();
    timer.current = window.setTimeout(() =>
      inspect(active => active?.race === row.label && !active.pinned ? null : active), 140);
  }
  const entries = [...row.classes.values()].sort((a, b) => a.label.localeCompare(b.label, "es"));
  const total = row.count + (row.count === 1 ? " personaje" : " personajes");
  return (
    <Popover.Root open={open} onOpenChange={next => { if (!next) close(); }}>
      <Popover.Anchor asChild>
        <button ref={button} type="button" className="race-bar"
          aria-label={row.label + ", " + total + ". Ver clases"}
          aria-expanded={open} aria-haspopup="dialog"
          onPointerEnter={event => {
            if (event.pointerType !== "touch") preview();
          }}
          onPointerLeave={leave}
          onFocus={event => { if (event.currentTarget.matches(":focus-visible")) preview(); }}
          onBlur={close}
          onClick={() => { cancelClose(); inspect(active =>
            active?.race === row.label && active.pinned ? null : { race: row.label, pinned: true }); }}
        >
          <span className="bar-track" aria-hidden="true">
            {entries.map(entry => (
              <i key={entry.label} style={{ width: (100 * entry.count) / max + "%", backgroundColor: entry.tint }}
                onPointerEnter={() => setHighlight(entry.label)} onPointerLeave={() => setHighlight("")} />
            ))}
          </span>
        </button>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content side="top" align="center" sideOffset={2} collisionPadding={8}
          className="race-breakdown" aria-label={"Desglose de " + row.label}
          onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()}
          onInteractOutside={event => { if (button.current?.contains(event.target as Node)) event.preventDefault(); }}
          onPointerEnter={cancelClose} onPointerLeave={leave}
        >
          <strong>{row.label} · {total}</strong>
          <dl>{entries.map(entry => (
            <div key={entry.label} data-highlighted={highlight === entry.label || undefined}>
              <dt><i className="class-swatch" style={{ backgroundColor: entry.tint }} />{entry.label}</dt>
              <dd>{entry.count}</dd>
            </div>
          ))}</dl>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function Distribution({ members }: { members: Member[] }) {
  const [kind, setKind] = useState<DistributionKind>("className");
  const [inspection, inspect] = useState<RaceInspection>(null);
  const { rows, max, legend } = useMemo(() => composition(members, kind), [members, kind]);
  return (
    <section className="panel">
      <h2 className="section-title">La composición de la hermandad</h2>
      <div className="toolbar">
        <Pick
          label="Distribución"
          value={kind}
          onChange={(v) => { inspect(null); setKind(v as DistributionKind); }}
          options={[
            { value: "className", label: "Clases" },
            { value: "race", label: "Razas" },
            { value: "spec", label: "Especializaciones" },
            { value: "role", label: "Roles" },
          ]}
        />
      </div>
      {kind === "role" && <p className="muted">Rol estimado según la clase y la especialización de la armería. Las ramas ambiguas figuran como «Sin determinar».</p>}
      {rows.length ? (
        <ul className="distribution-bars">
          {rows.map(row => (
            <li key={row.label}>
              <span>{row.label}</span>
              {kind === "race" ? <RaceBar row={row} max={max} inspection={inspection} inspect={inspect} /> : (
                <span className="bar-track" aria-hidden="true">
                  <i style={{ width: (100 * row.count) / max + "%", backgroundColor: row.tint }} />
                </span>
              )}
              <b>{row.count}</b>
            </li>
          ))}
        </ul>
      ) : (
        <Empty
          title="Sin datos de composición"
          text="La armería todavía no ha registrado este dato para la hermandad."
        />
      )}
      {kind === "race" && legend.length > 0 && (
        <ul className="race-legend" aria-label="Colores de clase">
          {legend.map(([name, tint]) => <li key={name}><i className="class-swatch" style={{ backgroundColor: tint }} />{name}</li>)}
        </ul>
      )}
    </section>
  );
}
