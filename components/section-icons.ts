import type { GuildSection } from "@/lib/guild-navigation";
import type { GuildIconName } from "./guild-icon";

export const guildSectionIcons = {
  overview: "tabard",
  composicion: "shield",
  race: "boot",
  history: "steps",
  awards: "crown",
  news: "dispatch",
  movimientos: "tabard",
  cronicas: "journal",
  compare: "swords",
  logs: "journal",
  gallery: "painting",
} satisfies Record<GuildSection, GuildIconName>;
