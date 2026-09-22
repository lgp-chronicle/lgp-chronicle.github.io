export type Equipment = {
  slot: string;
  name: string;
  quality?: string;
  itemLevel?: number;
  id?: number;
  details?: string[];
};
export type Profession = { name: string; skill?: number; max?: number };
export type Profile = {
  level?: number;
  className?: string;
  classId?: number;
  race?: string;
  spec?: string;
  faction?: string;
  gender?: string;
  itemLevel?: number;
  honorableKills?: number;
  honor?: number;
  equipment?: Equipment[];
  professions?: Profession[];
  talents?: string[];
  talentTrees?: { name: string; points: number }[];
  specDerived?: boolean;
  statistics?: Record<string, number>;
  pvpRank?: number;
  reputations?: { name: string; standing: string; value?: number }[];
  achievementPoints?: number;
  achievements?: string[];
  avatar?: string;
  raidBosses?: number;
  raids?: string[];
  pvp?: Record<string, unknown>;
  sourceModified?: string;
  observedAt?: string;
  resourceTimes?: Record<string, string>;
};
export type Logs = {
  id: number;
  name: string;
  zones: { id: number; dps?: unknown; hps?: unknown; observedAt?: string }[];
  reports: {
    code: string;
    title: string;
    startTime: number;
    endTime: number;
    observedAt?: string;
    fights?: {
      id: number;
      encounterId: number;
      name: string;
      kill: boolean;
      startTime: number;
      endTime: number;
      spec?: string;
    }[];
  }[];
  errors?: string[];
  bestParse?: number;
  bestDps?: number;
  bestHps?: number;
  bosses?: number;
  observedAt: string;
};
export type Snapshot = { at: string; data: Profile };
export type Member = {
  id: string;
  name: string;
  realm: string;
  region: string;
  armory?: string;
  addedAt?: string;
  data: Profile;
  logs?: Logs;
  history: Snapshot[];
  checkedAt?: string;
  status: string;
  errors?: string[];
};
export type Activity = {
  id: string;
  characterId: string;
  at: string;
  kind: string;
  text: string;
  metric?: string;
  delta?: number;
};
export type GuildData = {
  members: Member[];
  events: Activity[];
  available: boolean;
  message?: string;
  generatedAt: string;
};
export const classColors: Record<number, string> = {
  1: "#c79c6e",
  2: "#f58cba",
  3: "#abd473",
  4: "#fff569",
  5: "#eee",
  6: "#c41f3b",
  7: "#4995ef",
  8: "#69ccf0",
  9: "#b19fea",
  11: "#ff984c",
};
export const color = (m: Member) =>
  classColors[m.data.classId ?? 0] ?? "#c4b47a";
export const numeric = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
