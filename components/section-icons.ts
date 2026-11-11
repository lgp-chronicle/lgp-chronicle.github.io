import type { GuildSection } from "@/lib/guild-navigation";
import type { GuildIconName } from "./guild-icon";

export const guildSectionIcons = {
  overview: "tabard",
  race: "boot",
  history: "steps",
  awards: "crown",
  news: "dispatch",
  compare: "swords",
  logs: "journal",
  gallery: "painting",
} satisfies Record<GuildSection, GuildIconName>;
