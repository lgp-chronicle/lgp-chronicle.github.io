"use client";

import { useState, type ReactNode } from "react";
import { GuildIcon, type GuildIconName } from "./guild-icon";
import { guildSectionIcons } from "./section-icons";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sectionIcons: Record<string, GuildIconName> = {
  ...guildSectionIcons,
  armory: "shield",
  talents: "staff",
  attributes: "ruby",
};

export function SectionIndex({
  items,
  label,
  value,
  onChange,
  children,
}: {
  items: readonly (readonly [string, string])[];
  label: string;
  value?: string;
  onChange?: (id: string) => void;
  children: ReactNode;
}) {
  const [localValue, setLocalValue] = useState(items[0][0]);
  const selected = value ?? localValue;
  const select = onChange ?? setLocalValue;
  return (
    <Tabs activationMode="manual" value={selected} onValueChange={select}>
      <div className="section-index">
        <TabsList className="folio-tabs" aria-label={label}>
          {items.map(([id, name]) => {
            return (
              <TabsTrigger key={id} value={id}>
                <GuildIcon name={sectionIcons[id]} size={22} />
                <span>{name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        <div className="folio-picker">
          <Select value={selected} onValueChange={select}>
            <SelectTrigger className="index-trigger" aria-label={label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              className="index-options"
              position="popper"
              align="start"
              sideOffset={3}
            >
              {items.map(([id, name]) => {
                return (
                  <SelectItem key={id} value={id} textValue={name}>
                    <GuildIcon name={sectionIcons[id]} size={22} />
                    {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      {children}
    </Tabs>
  );
}
