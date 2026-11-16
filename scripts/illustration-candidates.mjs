import { readFile } from "node:fs/promises";
import { canIllustrateMember } from "../features/illustration-eligibility.ts";
import { armorySignals, spotlightWindowDays } from "../features/spotlight-freshness.ts";
import { fullName } from "../features/member-name.ts";
import { coverCatalogue, coverMemberId, sceneParticipants } from "../lib/guild-covers.ts";

const input = process.argv[2];
const response = input ? null : await fetch("https://lgp-chronicle.github.io/data/guild.json", { cache: "no-store" });
if (response && !response.ok) throw new Error("Censo no disponible: " + response.status);
const data = input ? JSON.parse(await readFile(input, "utf8")) : await response.json();
const now = Date.now();
const appearances = new Map();
for (const scene of Object.values(coverCatalogue(data.members))) {
  const ids = scene.party ? scene.party.members.map(m => m.id) : sceneParticipants(scene).map(coverMemberId);
  for (const id of new Set(ids)) appearances.set(id, (appearances.get(id) ?? 0) + 1);
}
const candidates = data.members.filter(m => canIllustrateMember(m, now)).map(m => ({
  id: m.id, name: fullName(m), appearances: appearances.get(m.id) ?? 0,
  lastSignal: new Date(Math.max(...armorySignals(m, now).keys())).toISOString(), armory: m.armory,
})).sort((a, b) => a.appearances - b.appearances || a.name.localeCompare(b.name, "es"));
console.log(JSON.stringify({ checkedAt: new Date(now).toISOString(), inactivityDays: spotlightWindowDays, candidates }, null, 2));
