import type { Member } from "./types";

// Grounded heights relative to a human at the same distance from the camera.
const stature: Record<string, number> = {
  gnomo: 0.6,
  gnome: 0.6,
  enano: 0.78,
  dwarf: 0.78,
  "elfo de la noche": 1.1,
  "night elf": 1.1,
  tauren: 1.22,
  trol: 1.12,
  troll: 1.12,
  draenei: 1.12,
};

export function raceStature(member: Member) {
  return stature[member.data.race?.toLowerCase() ?? ""] ?? 1;
}

// Reserve the front ranks for shorter races even when a back rank has room.
export function positions(members: Member[], compact: boolean) {
  const total = members.length;
  const columns = Math.max(
    1,
    Math.ceil(Math.sqrt(Math.ceil(total / 2) * (compact ? 0.52 : 2))),
  );
  const short = members.filter((member) => raceStature(member) < 1).length;
  const ranks = [total - short, short].flatMap((size) => {
    const rows = Math.ceil(size / (2 * columns));
    return Array.from(
      { length: rows },
      (_, i) => Math.floor(size / rows) + Number(i < size % rows),
    );
  });
  const slots = [];
  const wingWidth = compact ? 47.5 : 40;
  // All short races share the same figure scale, even when they span two steps.
  const shortRanks = Math.ceil(short / (2 * columns));
  const densestWing = Math.ceil(Math.max(0, ...ranks) / 2);
  const shortColumns = Math.max(
    shortRanks ? Math.ceil(short / (2 * shortRanks)) : 0,
    // A lone gnome in front of a full wing still belongs to the same scene.
    densestWing - 1,
  );
  for (const [row, count] of ranks.entries()) {
    const depth = ranks.length > 1 ? row / (ranks.length - 1) : 0.7;
    const shortRank = row >= ranks.length - shortRanks;
    const scaleDepth = shortRank ? 1 : depth;
    const scaleColumns = shortRank ? shortColumns : Math.ceil(count / 2);
    for (let col = 0; col < count; col++) {
      const wingCount = col % 2 ? Math.floor(count / 2) : Math.ceil(count / 2);
      const stagger = wingCount > 2 ? (row % 2 ? 0.22 : -0.15) : 0;
      const x = 5 + ((Math.floor(col / 2) + 0.5 + stagger) * 90) / wingCount;
      slots.push({
        x: Math.min(94, x),
        feet: (compact ? 44 : 64) + depth * (compact ? 42 : 24),
        height: (compact ? 13 : 18) + scaleDepth * (compact ? 9 : 10),
        maxHeight: Math.min(
          compact ? 36 : 23,
          (wingWidth / scaleColumns) * (1.3 + scaleDepth * 0.16),
        ),
        width: Math.min(95, 98 / wingCount),
        depth,
        row,
      });
    }
  }
  return slots;
}
