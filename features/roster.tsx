"use client";
import { MemberLink, fullName } from "./member-portrait";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Pick, Empty } from "@/components/guild-ui";
import { display, ago } from "./analytics";
import { type Member } from "./types";
export function Roster({ members }: { members: Member[] }) {
  const [layout, setLayout] = useState("table");
  const [search, setSearch] = useState(""),
    [cls, setCls] = useState("all"),
    [sort, setSort] = useState("level"),
    [asc, setAsc] = useState(false);
  const columns = [
    ["name", "Personaje"],
    ["level", "Nivel"],
    ["className", "Clase"],
    ["spec", "Spec"],
    ["race", "Raza"],
    ["itemLevel", "iLvl"],
    ["honorableKills", "HK"],
    ["professions", "Profesiones"],
    ["raidBosses", "Bosses PvE"],
    ["observedAt", "Consultado"],
  ];
  const value = (m: Member, key: string): any =>
    key === "name"
      ? fullName(m)
      : key === "professions"
        ? m.data.professions?.map((p) => p.name).join(", ")
        : (m.data as any)[key];
  const filtered = members
    .filter(
      (m) =>
        fullName(m).toLowerCase().includes(search.trim().toLowerCase()) &&
        (cls === "all" || m.data.className === cls),
    )
    .sort((a, b) => {
      const x = value(a, sort),
        y = value(b, sort);
      if (x == null) return y == null ? 0 : 1;
      if (y == null) return -1;
      return (
        (typeof x === "number"
          ? x - y
          : String(x).localeCompare(String(y), "es")) * (asc ? 1 : -1)
      );
    });
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h3>La hermandad</h3>
          <p className="subheading">
            {members.length} nombres. Una cantidad incierta de sentido común.
          </p>
        </div>
        <span className="badge">CLASSIC ERA / FOREVER</span>
      </div>
      <div className="toolbar">
        <label className="roster-search">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Buscar personaje"
            placeholder="Buscar en la hermandad…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <Pick
          label="Filtrar por clase"
          value={cls}
          onChange={setCls}
          options={[
            { value: "all", label: "Todas las clases" },
            ...Array.from(
              new Set(members.map((m) => m.data.className).filter(Boolean)),
            ).map((x) => ({ value: x!, label: x! })),
          ]}
        />
      </div>
      <div className="roster-controls">
        <div className="view-toggle" aria-label="Vista de la hermandad">
          {[
            ["table", "Tabla"],
            ["cards", "Tarjetas"],
          ].map(([key, label]) => (
            <button
              key={key}
              aria-pressed={layout === key}
              onClick={() => setLayout(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {layout === "cards" && (
          <div className="order-controls">
            <Pick
              label="Ordenar personajes"
              value={sort}
              onChange={(key) => {
                setSort(key);
                setAsc(key === "name");
              }}
              options={columns.map(([value, label]) => ({
                value,
                label: "Por " + label.toLowerCase(),
              }))}
            />
            <button
              className="order-direction"
              onClick={() => setAsc(!asc)}
              aria-label={
                asc ? "Cambiar a descendente" : "Cambiar a ascendente"
              }
            >
              {asc ? <ArrowUp size={17} /> : <ArrowDown size={17} />}
            </button>
          </div>
        )}
      </div>
      {layout === "cards" ? (
        <div className="member-grid roster-cards">
          {filtered.map((m) => (
            <article className="roster-card" key={m.id}>
              <MemberLink member={m} />
              <p>
                {[m.data.race, m.data.className, m.data.spec]
                  .filter(Boolean)
                  .join(" · ") || "Clase sin registrar"}
              </p>
              <dl className="race-metrics">
                {[
                  ["Nivel", m.data.level],
                  ["Equipo", m.data.itemLevel],
                  ["HK", m.data.honorableKills],
                ].map(([label, v]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{display(v)}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <Table className="data-table">
          <TableHeader>
            <TableRow>
              {columns.map(([key, label]) => (
                <TableHead
                  key={key}
                  aria-sort={
                    sort === key ? (asc ? "ascending" : "descending") : "none"
                  }
                >
                  <button
                    className="table-sort"
                    onClick={() => {
                      if (sort === key) setAsc(!asc);
                      else {
                        setSort(key);
                        setAsc(key === "name");
                      }
                    }}
                  >
                    {label}
                    {sort !== key ? (
                      <ArrowUpDown size={12} />
                    ) : asc ? (
                      <ArrowUp size={13} />
                    ) : (
                      <ArrowDown size={13} />
                    )}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id}>
                {columns.map(([key]) => (
                  <TableCell key={key}>
                    {key === "name" ? (
                      <MemberLink member={m} />
                    ) : key === "observedAt" ? (
                      <span
                        title={
                          m.data.observedAt
                            ? new Date(m.data.observedAt).toLocaleString(
                                "es-ES",
                              )
                            : "Esperando datos"
                        }
                      >
                        {ago(m.data.observedAt)}
                      </span>
                    ) : (
                      display(value(m, key))
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {!filtered.length && (
        <Empty
          title="Ese héroe no está en esta lista"
          text="Prueba otro nombre o elimina el filtro de clase."
        />
      )}
    </section>
  );
}
