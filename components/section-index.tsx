"use client";

import { useState, type ReactNode } from "react";
import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Compass,
  Crown,
  Newspaper,
  Shield,
  Swords,
  Sparkles,
  Activity,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sectionIcons: Record<string, LucideIcon> = {
  overview: Users,
  race: Compass,
  history: ChartNoAxesColumnIncreasing,
  awards: Crown,
  news: Newspaper,
  compare: Swords,
  logs: BookOpen,
  armory: Shield,
  talents: Sparkles,
  attributes: Activity,
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
            const Icon = sectionIcons[id];
            return (
              <TabsTrigger key={id} value={id}>
                <Icon aria-hidden="true" />
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
                const Icon = sectionIcons[id];
                return (
                  <SelectItem key={id} value={id} textValue={name}>
                    <Icon aria-hidden="true" />
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
