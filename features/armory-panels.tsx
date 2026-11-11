import { useEffect, useState, type CSSProperties } from "react";
import { ExternalLink, Info } from "lucide-react";
import { Empty } from "@/components/guild-ui";
import { ago } from "./analytics";
import {
  itemDisplay,
  namedIcon,
  talentDisplay,
  wowheadUrl,
  type Entity,
} from "./armory-data";
import { GuildIcon } from "@/components/guild-icon";
import { slotInfo } from "./slot-icon";
import { color, type Equipment, type Profile, type Member } from "./types";

import { Portrait, fullName } from "./member-portrait";
import { useCharacterArt } from "./character-art";
import { ClassRoom, classRoomName } from "./class-frame";
import {
  ArmoryTooltip,
  EquipmentTooltip,
  itemQuality,
} from "./equipment-tooltip";
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
        <GuildIcon name={kind === "item" ? "amber" : "staff"} size={24} />
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
  const { image, avatar, style, onError } = useCharacterArt(member);
  const room = classRoomName(member);
  return (
    <figure className="armory-model" style={style}>
      <div className="armory-scene">
        <ClassRoom member={member} large />
        {image && !avatar ? (
          <>
            <span className="model-shadow" aria-hidden="true" />
            <img className="model-cast" src={image} alt="" aria-hidden="true" />
            <img
              className="full-model"
              src={image}
              alt={fullName(member) + " con su equipo"}
              onError={onError}
            />
          </>
        ) : (
          <div className="model-fallback">
            <Portrait member={member} />
            <small>Sin imagen de cuerpo entero</small>
          </div>
        )}
      </div>
      <figcaption>
        <strong style={{ color: color(member) }}>{fullName(member)}</strong>
        {room && <span>{room}</span>}
      </figcaption>
    </figure>
  );
}

function ItemSlot({
  label,
  item,
  selected,
  hasPinnedItem,
  side,
  onPinChange,
}: {
  label: string;
  item?: Equipment;
  selected: boolean;
  hasPinnedItem: boolean;
  side: "left" | "right" | "top";
  onPinChange: (open: boolean) => void;
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
          <GuildIcon name={slot.icon} className="slot-mark" />
        </span>
        <span className="slot-copy">
          {label}
          <small>Sin registrar</small>
        </span>
      </div>
    );
  const { icon } = itemDisplay(item);
  const [, tint] = itemQuality(item);
  return (
    <div
      className="item-slot equipped"
      data-selected={selected}
      style={{ "--rarity": tint } as CSSProperties}
    >
      <EquipmentTooltip
        item={item}
        side={side}
        pinned={selected}
        hasPinnedItem={hasPinnedItem}
        onPinChange={onPinChange}
      >
        <button
          type="button"
          className="select-gear"
          aria-label={label + " · " + item.name}
        >
          <GameIcon
            key={item.id + String(icon)}
            kind="item"
            id={item.id}
            src={icon}
          />
          <span className="slot-copy">
            <span className="slot-label">
              <GuildIcon name={slot.icon} className="slot-mark" />
              {label}
            </span>
            <strong>{item.name}</strong>
          </span>
        </button>
      </EquipmentTooltip>
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
        <div className="empty-armory-room">
          <ClassRoom member={member} large />
          <Empty
            title="Sin equipo registrado"
            text="La armería todavía no ha publicado las piezas de este personaje."
          />
        </div>
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
  const renderSlot = (label: string, index: number | undefined) => (
    <ItemSlot
      key={index ?? label}
      label={label}
      item={index === undefined ? undefined : items[index]}
      selected={index !== undefined && index === chosen}
      hasPinnedItem={chosen !== undefined}
      side={
        leftSlots.includes(label)
          ? "right"
          : rightSlots.includes(label)
            ? "left"
            : "top"
      }
      onPinChange={(open) =>
        setChosen((current) =>
          open ? index : current === index ? undefined : current,
        )
      }
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
    </section>
  );
}

export function TalentsPanel({
  profile,
  memberId,
}: {
  profile: Profile;
  memberId: string;
}) {
  const [pinned, setPinned] = useState<string | null>(null);
  const talents = (profile.talents ?? []).map((t) =>
    talentDisplay(t, profile.classId, memberId, profile.level),
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
                {entries.map((talent, i) => {
                  const key = tree + "/" + talent.name + "/" + i;
                  const rank =
                    talent.rank === undefined
                      ? undefined
                      : "Rango " +
                        talent.rank +
                        (talent.maxRank ? " / " + talent.maxRank : "");
                  return (
                    <ArmoryTooltip
                      key={key}
                      entity="spell"
                      id={talent.spellId}
                      name={talent.name}
                      side="right"
                      tint="#ffe3a0"
                      pinned={pinned === key}
                      hasPinnedItem={pinned !== null}
                      onPinChange={(open) =>
                        setPinned((current) =>
                          open ? key : current === key ? null : current,
                        )
                      }
                      body={
                        <>
                          <p className="wow-item-name">{talent.name}</p>
                          <p className="wow-item-level">
                            {[talent.tree, rank].filter(Boolean).join(" · ")}
                          </p>
                          {[
                            talent.cost,
                            talent.range,
                            talent.cast,
                            talent.cooldown,
                          ]
                            .filter(Boolean)
                            .map((line, index) => (
                              <p key={index}>{line}</p>
                            ))}
                          <p className="wow-talent-effect">
                            {talent.description ||
                              "La armería aún no ha registrado el efecto de este rango."}
                          </p>
                        </>
                      }
                    >
                      <button
                        type="button"
                        className="talent-link"
                        aria-label={[talent.name, rank]
                          .filter(Boolean)
                          .join(" · ")}
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
                        </span>
                        <Info
                          className="entry-external"
                          size={13}
                          aria-hidden="true"
                        />
                      </button>
                    </ArmoryTooltip>
                  );
                })}
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
