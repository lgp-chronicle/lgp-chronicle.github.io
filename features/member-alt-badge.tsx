import { useState } from "react";
import { Tooltip } from "radix-ui";
import { characterAlts } from "../config/character-alts";

export function MemberAltBadge({ memberId }: { memberId: string }) {
  const main = characterAlts[memberId];
  const [open, setOpen] = useState(false);
  if (!main) return null;
  const label = "Alter de " + main.name;
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <span
            className="alt-member-mark"
            tabIndex={0}
            aria-label={label}
            onClick={(event) => {
              // Cards link to the character; tapping the label only reveals ownership.
              event.preventDefault();
              event.stopPropagation();
              setOpen(!open);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                setOpen(!open);
              }
            }}
          >
            Alter
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="alt-member-tooltip" sideOffset={7} collisionPadding={12}>
            Alter de <strong>{main.name}</strong>
            <Tooltip.Arrow className="alt-member-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
