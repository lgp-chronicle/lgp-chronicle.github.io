import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { GuildIcon } from "@/components/guild-icon";
import { fullName, memberHref, Portrait } from "./member-portrait";
import { hasEntrancePortrait } from "./character-art";
import { color, type Member } from "./types";
import { courseProgress, finishLevel, raceLanes } from "./race-course";

const milestones = [1, 10, 20, 30, 40, 50, finishLevel];
type Runner = { member: Member; level: number; rank: number };

export function RaceTrack({ runners }: { runners: Runner[] }) {
  const road = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, marker: 72 });
  useLayoutEffect(() => {
    const node = road.current;
    if (!node) return;
    function measure() {
      if (!node) return;
      const width = node.getBoundingClientRect().width;
      const marker = parseFloat(
        getComputedStyle(node).getPropertyValue("--racer-width"),
      );
      setSize((old) =>
        old.width === width && old.marker === marker ? old : { width, marker },
      );
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const places = raceLanes(
    runners.map((r) => r.level),
    size.width,
    size.marker,
  );
  const lanes = places.reduce((count, p) => Math.max(count, p.lane + 1), 1);
  const finished = runners.filter((r) => r.level >= finishLevel).length;
  const firstNames = new Set<string>();
  const repeatedNames = new Set<string>();
  for (const { member } of runners) {
    if (firstNames.has(member.name)) repeatedNames.add(member.name);
    firstNames.add(member.name);
  }
  return (
    <section className="race-course" aria-label="Carrera hasta el nivel 60">
      <header className="course-heading">
        <h3>Camino al nivel 60</h3>
        <span>
          <GuildIcon name="finish" size={20} /> {finished} en meta
        </span>
      </header>
      <div
        className="course-road"
        ref={road}
        style={{ "--lanes": lanes } as CSSProperties}
      >
        <div className="course-axis" aria-hidden="true">
          {milestones.map((level) => (
            <span
              key={level}
              data-level={level}
              style={{ left: courseProgress(level) * 100 + "%" }}
            >
              {level === 1
                ? "Salida · 1"
                : level === finishLevel
                  ? "Meta · 60"
                  : level}
            </span>
          ))}
        </div>
        <div className="course-guides" aria-hidden="true">
          {milestones.map((level) => (
            <i
              key={level}
              data-level={level}
              style={{ left: courseProgress(level) * 100 + "%" }}
            />
          ))}
        </div>
        <ol className="course-runners" aria-label="Participantes por nivel">
          {runners.map(({ member, level, rank }, i) => {
            const name = fullName(member);
            const surname = name.slice(member.name.length).trim();
            const shortName =
              repeatedNames.has(member.name) && surname
                ? member.name + " " + surname[0] + "."
                : member.name;
            const { lane, progress } = places[i];
            const label = name + " · Nivel " + level + " · Puesto " + rank;
            return (
              <li
                key={member.id}
                style={
                  {
                    "--lane": lane,
                    left: progress * 100 + "%",
                    "--class-tint": color(member),
                  } as CSSProperties
                }
              >
                <a href={memberHref(member)} title={label} aria-label={label}>
                  <span className="racer-medallion">
                    {hasEntrancePortrait(member) && member.data.avatar ? (
                      <Portrait member={member} />
                    ) : (
                      <span className="racer-initial">
                        {member.name.slice(0, 1)}
                      </span>
                    )}
                    <b>{level}</b>
                  </span>
                  <span className="racer-name">{shortName}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
      {!runners.length && (
        <p className="course-empty">
          <GuildIcon name="finish" size={18} /> Ningún participante
          coincide con la búsqueda.
        </p>
      )}
    </section>
  );
}
