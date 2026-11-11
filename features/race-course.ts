export const finishLevel = 60;
export const finishTitle = {
  id: "level-60",
  title: "Colmillo de Oro",
  rule: `Alcanzar el nivel ${finishLevel}`,
} as const;

export const courseProgress = (level: number) =>
  (Math.min(Math.max(level, 1), finishLevel) - 1) / (finishLevel - 1);

// Entries arrive in standings order, from the finish back towards the start.
// A second lane separates portraits without moving anyone along the level axis.
export function raceLanes(
  levels: number[],
  width: number,
  markerWidth: number,
) {
  const leftmost: number[] = [];
  return levels.map((level) => {
    const progress = courseProgress(level);
    const x = progress * width;
    let lane = leftmost.findIndex(
      (previous) => previous - x >= markerWidth + 5,
    );
    if (lane === -1) lane = leftmost.length;
    leftmost[lane] = x;
    return { progress, lane };
  });
}
