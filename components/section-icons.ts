import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Compass,
  Crown,
  Newspaper,
  Swords,
  Users,
} from "lucide-react";
import type { GuildSection } from "@/lib/guild-navigation";
import type { LucideIcon } from "lucide-react";

export const guildSectionIcons = {
  overview: Users,
  race: Compass,
  history: ChartNoAxesColumnIncreasing,
  awards: Crown,
  news: Newspaper,
  compare: Swords,
  logs: BookOpen,
} satisfies Record<GuildSection, LucideIcon>;
