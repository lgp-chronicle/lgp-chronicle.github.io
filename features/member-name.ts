import surnames from "../config/character-surnames.json" with { type: "json" };
import type { Member } from "./types.ts";

export function fullName(m: Member) {
  const official = m.data.surname ?? (surnames as Record<string, string>)[m.id];
  if (official) return m.name + " " + official;
  const prefix = "forever-" + m.region + "-" + m.name.toLowerCase() + "-";
  if (!m.id.startsWith(prefix)) return m.name;
  const surname = m.id
    .slice(prefix.length)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return m.name + " " + surname;
}
