import { useEffect, useState, type CSSProperties } from "react";
import { ExternalLink, Gem, Sparkles } from "lucide-react";
import { Empty } from "@/components/guild-ui";
import { ago } from "./analytics";
import {
  itemDisplay,
  characterRenders,
  namedIcon,
  talentDisplay,
  wowheadUrl,
  type Entity,
} from "./armory-data";
import { SlotIcon, slotInfo } from "./slot-icon";
import type { Equipment, Profile, Member } from "./types";

import { Portrait, fullName } from "./member-portrait";

const quality: Record<string, [string, string]> = {
  POOR: ["Pobre", "#b7afaa"],
  COMMON: ["Común", "#ebe2cf"],
  UNCOMMON: ["Poco común", "#98d778"],
  RARE: ["Raro", "#8ab7fc"],
  EPIC: ["Épico", "#c99aff"],
  LEGENDARY: ["Legendario", "#ffb151"],
  ARTIFACT: ["Artefacto", "#e5c88a"],
  HEIRLOOM: ["Reliquia", "#82d6e9"],
};
const iconRequests = new Map<string, Promise<string | undefined>>();
function lookupIcon(kind: Entity, id: number) {
  const key = kind + "/" + id;
  const pending = iconRequests.get(key);
  if (pending) return pending;
  const request = fetch(
    "https://nether.wowhead.com/forever/tooltip/" + key + "?locale=6",
    {
      signal: AbortSignal.timeout(7000),
    },
  )
    .then(async (response) => {
      if (!response.ok) return;
      const data: unknown = await response.json();
      if (data && typeof data === "object" && "icon" in data)
        return namedIcon(data.icon);
    })
    .catch(() => undefined)
    .then((url) => {
      if (!url) iconRequests.delete(key);
      return url;
    });
  iconRequests.set(key, request);
  return request;
}

function GameIcon({
  kind,
  id,
  src,
}: {
  kind: Entity;
  id?: number;
  src?: string;
}) {
  const [failed, setFailed] = useState<string>();
  const [alternate, setAlternate] = useState<string>();
  const primary = src?.startsWith("https://") ? src : undefined;
  useEffect(() => {
    let active = true;
    if (id && (!primary || failed === primary)) {
      lookupIcon(kind, id).then((url) => {
        if (active) setAlternate(url);
      });
    }
    return () => {
      active = false;
    };
  }, [kind, id, primary, failed]);
  const url = alternate ?? primary;
  const Fallback = kind === "item" ? Gem : Sparkles;
  return (
    <span className="game-icon" aria-hidden="true">
      {url && url !== failed ? (
        <img
          src={url}
          alt=""
          width={46}
          height={46}
          onError={() => setFailed(url)}
        />
      ) : (
        <Fallback size={22} />
      )}
    </span>
  );
}

const leftSlots = [
  "Cabeza",
  "Cuello",
  "Hombros",
  "Espalda",
  "Pecho",
  "Camisola",
  "Tabardo",
  "Muñeca",
];
const rightSlots = [
  "Manos",
  "Cintura",
  "Piernas",
  "Pies",
  "Anillo 1",
  "Anillo 2",
  "Abalorio 1",
  "Abalorio 2",
];
const weaponSlots = [
  "Mano principal",
  "Mano secundaria",
  "A distancia",
  "Munición",
];

function Model({ member }: { member: Member }) {
  const src = member.data.characterRender ?? characterRenders[member.id];
  const [failed, setFailed] = useState<string>();
  return (
    <figure className="armory-model">
      {src && failed !== src ? (
        <img
          className="full-model"
          src={src}
          alt={fullName(member) + " con su equipo"}
          onError={() => setFailed(src)}
        />
      ) : (
        <div className="model-fallback">
          <Portrait member={member} />
          <small>Sin imagen de cuerpo entero</small>
        </div>
      )}
      <figcaption>{fullName(member)}</figcaption>
    </figure>
  );
}

function ItemSlot({
  label,
  item,
  selected,
  onSelect,
}: {
  label: string;
  item?: Equipment;
  selected: boolean;
  onSelect: () => void;
}) {
  const slot = slotInfo(label, item?.slotType);
  if (!item)
    return (
      <div
        className="item-slot vacant"
        aria-label={label + " sin equipamiento registrado"}
        title={label + " · Sin registrar"}
      >
        <span className="empty-slot">
          <SlotIcon path={slot.path} />
        </span>
        <span className="slot-copy">
          {label}
          <small>Sin registrar</small>
        </span>
      </div>
    );
  const { icon } = itemDisplay(item);
  const tint = quality[item.quality ?? ""]?.[1] ?? "#e7d09b";
  return (
    <div
      className="item-slot equipped"
      data-selected={selected}
      style={{ "--rarity": tint } as CSSProperties}
    >
      <button
        type="button"
        className="select-gear"
        aria-pressed={selected}
        aria-controls="equipped-item-detail"
        onClick={onSelect}
        aria-label={label + " · " + item.name}
        title={label + " · " + item.name}
      >
        <GameIcon
          key={item.id + String(icon)}
          kind="item"
          id={item.id}
          src={icon}
        />
        <span className="slot-copy">
          <span className="slot-label">
            <SlotIcon path={slot.path} />
            {label}
          </span>
          <strong>{item.name}</strong>
        </span>
      </button>
      <a
        className="slot-external"
        href={wowheadUrl("item", item.id, item.name)}
        target="_blank"
        rel="noreferrer"
        aria-label={(item.id ? "Ver " : "Buscar ") + item.name + " en Wowhead"}
        title="Wowhead"
      >
        <ExternalLink size={13} aria-hidden="true" />
      </a>
    </div>
  );
}

export function EquipmentPanel({ member }: { member: Member }) {
  const items = member.data.equipment ?? [];
  const [chosen, setChosen] = useState<number>();
  if (!items.length)
    return (
      <section className="panel dossier-panel">
        <div className="dossier-heading">
          <h2>Equipo</h2>
        </div>
        <Empty
          title="Sin equipo registrado"
          text="La armería todavía no ha publicado las piezas de este personaje."
        />
      </section>
    );
  const bySlot = new Map<string, number>();
  const extra: number[] = [];
  for (const [i, item] of items.entries()) {
    let label = slotInfo(item.slot, item.slotType).label;
    if (label === "Anillo" || label === "Abalorio")
      label += bySlot.has(label + " 1") ? " 2" : " 1";
    if (
      [...leftSlots, ...rightSlots, ...weaponSlots].includes(label) &&
      !bySlot.has(label)
    )
      bySlot.set(label, i);
    else extra.push(i);
  }
  const selected =
    chosen !== undefined && items[chosen]
      ? chosen
      : (bySlot.get("Mano principal") ?? 0);
  const item = items[selected],
    details = itemDisplay(item);
  const renderSlot = (label: string, index: number | undefined) => (
    <ItemSlot
      key={index ?? label}
      label={label}
      item={index === undefined ? undefined : items[index]}
      selected={index === selected}
      onSelect={() => setChosen(index)}
    />
  );
  return (
    <section className="panel dossier-panel armory-panel">
      <div className="dossier-heading">
        <h2>Equipo</h2>
        <p>
          {items.length} piezas · {ago(member.data.resourceTimes?.equipment)}
        </p>
      </div>
      <div className="paperdoll">
        <div className="slot-rail rail-left">
          {leftSlots.map((label) => renderSlot(label, bySlot.get(label)))}
        </div>
        <Model member={member} />
        <div className="slot-rail rail-right">
          {rightSlots.map((label) => renderSlot(label, bySlot.get(label)))}
        </div>
      </div>
      <div className="weapon-rack" aria-label="Armas y munición">
        {weaponSlots.map((label) => renderSlot(label, bySlot.get(label)))}
        {extra.map((i) => renderSlot(items[i].slot, i))}
      </div>
      <section
        id="equipped-item-detail"
        className="inspected-item"
        aria-label="Pieza seleccionada"
        aria-live="polite"
      >
        <div className="inspect-title">
          <h3 style={{ color: quality[item.quality ?? ""]?.[1] }}>
            {item.name}
          </h3>
          <p>
            {[
              item.slot,
              quality[item.quality ?? ""]?.[0],
              item.itemLevel !== undefined &&
                "Nivel de objeto " + item.itemLevel,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <a
            href={wowheadUrl("item", item.id, item.name)}
            target="_blank"
            rel="noreferrer"
          >
            {item.id ? "Ver en Wowhead" : "Buscar en Wowhead"}{" "}
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
        <div>
          {details.effects.length > 0 && (
            <ul className="item-effects" aria-label="Efectos del objeto">
              {details.effects.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {details.details.length > 0 && (
            <ul className="inspect-stats">
              {details.details.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
          {details.sets.length > 0 && (
            <details className="item-details">
              <summary>Bonificaciones de conjunto</summary>
              <ul>
                {details.sets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </details>
          )}
          {!details.effects.length &&
            !details.details.length &&
            !details.sets.length && (
              <p className="muted">Sin efectos ni estadísticas registrados.</p>
            )}
        </div>
      </section>
    </section>
  );
}

export function TalentsPanel({ profile }: { profile: Profile }) {
  const talents = (profile.talents ?? []).map((t) =>
    talentDisplay(t, profile.classId),
  );
  const unknown = "Rama sin identificar";
  const trees = [
    ...new Set([
      ...(profile.talentTrees ?? []).map((t) => t.name),
      ...talents.map((t) => t.tree ?? unknown),
    ]),
  ];
  return (
    <section className="panel dossier-panel">
      <div className="dossier-heading">
        <h2>Talentos</h2>
        {!!trees.length && (
          <p>Grupo activo · {ago(profile.resourceTimes?.specializations)}</p>
        )}
      </div>
      {trees.length > 0 && (
        <div className="talent-trees">
          {trees.map((tree) => {
            const points = profile.talentTrees?.find(
              (t) => t.name === tree,
            )?.points;
            const entries = talents.filter((t) => (t.tree ?? unknown) === tree);
            return (
              <section className="talent-tree" key={tree}>
                <div className="tree-heading">
                  <h3>{tree}</h3>
                  {points !== undefined && (
                    <span>
                      {points} {points === 1 ? "punto" : "puntos"}
                    </span>
                  )}
                </div>
                {entries.map((talent, i) => (
                  <a
                    className="talent-link"
                    key={talent.name + i}
                    href={wowheadUrl("spell", talent.spellId, talent.name)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={
                      (talent.spellId ? "Ver " : "Buscar ") +
                      talent.name +
                      " en Wowhead"
                    }
                  >
                    <GameIcon
                      key={String(talent.spellId) + talent.icon}
                      kind="spell"
                      id={talent.spellId}
                      src={talent.icon}
                    />
                    <span>
                      <strong>{talent.name}</strong>
                      {talent.rank !== undefined && (
                        <small>
                          Rango {talent.rank}
                          {talent.maxRank ? " / " + talent.maxRank : ""}
                        </small>
                      )}
                      {!talent.spellId && <small>Buscar en Wowhead</small>}
                    </span>
                    <ExternalLink
                      className="entry-external"
                      size={13}
                      aria-hidden="true"
                    />
                  </a>
                ))}
                {!entries.length && (
                  <p className="empty-tree">
                    {points === 0
                      ? "Sin puntos asignados."
                      : "Sin detalle de talentos."}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
      {!trees.length && (
        <Empty
          title="Sin talentos registrados"
          text="Aquí aparecerán las ramas y los puntos cuando Blizzard publique la especialización activa."
        />
      )}
      {!!talents.length && (
        <p className="catalog-credit">
          Catálogo de talentos adaptado de{" "}
          <a href="https://zephras.com/data/" target="_blank" rel="noreferrer">
            Zephras
          </a>{" "}
          ·{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
        </p>
      )}
    </section>
  );
}
