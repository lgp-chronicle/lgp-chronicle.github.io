"use client";
import { siteHref } from "@/lib/public-settings";

import { useState } from "react";
import { ArrowUpDown, Shield } from "lucide-react";
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
import { color, type Member } from "./types";
export function Roster({ members }: { members: Member[] }) {
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
      ? m.name
      : key === "professions"
        ? m.data.professions?.map((p) => p.name).join(", ")
        : (m.data as any)[key];
  const filtered = members
    .filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) &&
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
          <h3>La compañía</h3>
          <p className="subheading">
            {members.length} nombres. Una cantidad incierta de sentido común.
          </p>
        </div>
        <span className="badge">CLASSIC ANNIVERSARY / TBC</span>
      </div>
      <div className="toolbar">
        <input
          aria-label="Buscar personaje"
          placeholder="Buscar en la compañía…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                  <ArrowUpDown size={12} />
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
                    <a
                      href={siteHref(
                        `/tbc/character/${encodeURIComponent(m.id)}`,
                      )}
                      className="name-cell"
                      style={{ color: color(m) }}
                    >
                      <span className="avatar">
                        {m.data.avatar ? (
                          <img
                            alt=""
                            src={m.data.avatar}
                            width={36}
                            height={36}
                          />
                        ) : (
                          <Shield size={19} />
                        )}
                      </span>
                      {m.name}
                    </a>
                  ) : key === "observedAt" ? (
                    <span
                      title={
                        m.data.observedAt
                          ? new Date(m.data.observedAt).toLocaleString("es-ES")
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
      {!filtered.length && (
        <Empty
          title="Ese héroe no está en esta lista"
          text="Prueba otro nombre o elimina el filtro de clase."
        />
      )}
    </section>
  );
}
