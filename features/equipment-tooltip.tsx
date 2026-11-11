import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { ExternalLink, X } from "lucide-react";
import { Popover, Tooltip } from "radix-ui";
import { itemDisplay, wowheadUrl, type Entity } from "./armory-data";
import type { Equipment } from "./types";

const qualities: Record<string, [string, string]> = {
  POOR: ["Pobre", "#9d9d9d"],
  COMMON: ["Común", "#ffffff"],
  UNCOMMON: ["Poco común", "#1eff00"],
  RARE: ["Raro", "#4d9fff"],
  EPIC: ["Épico", "#bf80ff"],
  LEGENDARY: ["Legendario", "#ff8000"],
  ARTIFACT: ["Artefacto", "#e6cc80"],
  HEIRLOOM: ["Reliquia", "#00ccff"],
};

export function itemQuality(item: Equipment) {
  return qualities[item.quality ?? ""] ?? ["", "#ffffff"];
}

function ItemLines({ item }: { item: Equipment }) {
  const { properties: p, details, effects, sets } = itemDisplay(item);
  const [rarity] = itemQuality(item);
  return (
    <>
      <p className="wow-item-name">
        {item.name}
        {rarity && <span className="sr-only"> · {rarity}</span>}
      </p>
      {item.itemLevel !== undefined && (
        <p className="wow-item-level">Nivel de objeto {item.itemLevel}</p>
      )}
      {p.binding && <p>{p.binding}</p>}
      {p.unique && <p>{p.unique}</p>}
      <p className="wow-item-pair">
        <span>{p.inventoryType ?? item.slot}</span>
        {p.subclass && <span>{p.subclass}</span>}
      </p>
      {(p.damage || p.speed) && (
        <p className="wow-item-pair">
          <span>{p.damage}</span>
          <span>{p.speed}</span>
        </p>
      )}
      {p.dps && <p>{p.dps}</p>}
      {details.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
      {p.durability && <p>{p.durability}</p>}
      {p.requirement && <p>{p.requirement}</p>}
      {effects.length > 0 && (
        <ul className="wow-item-effects" aria-label="Efectos del objeto">
          {effects.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
      {sets.length > 0 && (
        <div className="wow-item-set">
          <p>{p.setName ?? "Bonificaciones de conjunto"}</p>
          <ul>
            {sets.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

type TriggerProps = {
  side: "left" | "right" | "top";
  pinned: boolean;
  hasPinnedItem: boolean;
  onPinChange: (open: boolean) => void;
  children: ReactElement;
};

export function EquipmentTooltip({
  item,
  ...trigger
}: TriggerProps & { item: Equipment }) {
  return (
    <ArmoryTooltip
      {...trigger}
      name={item.name}
      id={item.id}
      entity="item"
      tint={itemQuality(item)[1]}
      body={<ItemLines item={item} />}
    />
  );
}

export function ArmoryTooltip({
  name,
  id,
  entity,
  tint,
  body,
  side,
  pinned,
  hasPinnedItem,
  onPinChange,
  children,
}: TriggerProps & {
  name: string;
  id?: number;
  entity: Entity;
  tint: string;
  body: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const restoringFocus = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);
  function checkPointerExit() {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      if (
        !trigger.current?.matches(":hover, :focus-visible") &&
        !preview.current?.matches(":hover")
      ) {
        setHovered(false);
      }
    }, 220);
  }
  const placement = {
    side,
    sideOffset: 7,
    collisionPadding: 10,
    hideWhenDetached: true,
  } as const;
  const cardStyle = { "--wow-rarity": tint } as CSSProperties;
  return (
    <Popover.Root
      open={pinned}
      onOpenChange={(open) => {
        setHovered(false);
        onPinChange(open);
      }}
    >
      <Tooltip.Provider delayDuration={100}>
        <Tooltip.Root
          open={hovered && !hasPinnedItem}
          onOpenChange={(open) => setHovered(open && !hasPinnedItem)}
        >
          <Popover.Trigger asChild>
            <Tooltip.Trigger
              asChild
              ref={trigger}
              onPointerLeave={checkPointerExit}
              onFocus={(e) => {
                if (restoringFocus.current) e.preventDefault();
              }}
            >
              {children}
            </Tooltip.Trigger>
          </Popover.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              {...placement}
              ref={preview}
              onPointerLeave={checkPointerExit}
              className="wow-item-card"
              style={cardStyle}
            >
              {body}
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
      <Popover.Portal>
        <Popover.Content
          {...placement}
          side="top"
          className="wow-item-card wow-item-pinned"
          style={cardStyle}
          aria-label={name}
          onCloseAutoFocus={(event) => {
            const focused = document.activeElement;
            if (
              focused &&
              focused !== document.body &&
              focused !== trigger.current
            ) {
              event.preventDefault();
              return;
            }
            // Returning focus to the slot must not reopen the hover preview.
            restoringFocus.current = true;
            queueMicrotask(() => {
              restoringFocus.current = false;
            });
          }}
        >
          <Popover.Close
            className="wow-item-close"
            aria-label={entity === "item" ? "Cerrar objeto" : "Cerrar talento"}
          >
            <X size={16} aria-hidden="true" />
          </Popover.Close>
          {body}
          <a
            className="wow-item-link"
            href={wowheadUrl(entity, id, name)}
            target="_blank"
            rel="noreferrer"
          >
            {id ? "Ver en Wowhead" : "Buscar en Wowhead"}{" "}
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
