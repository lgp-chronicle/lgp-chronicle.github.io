"use client";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ScrollText } from "lucide-react";
export function Pick({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem value={o.value} key={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function Empty({
  title = "Todavía no hay historia que contar",
  text = "Las estadísticas aparecerán cuando llegue el primer registro real.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty-state">
      <ScrollText size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
