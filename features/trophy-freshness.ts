export const trophyNoticeDays = 3;
export function isNewTrophy(at: string | undefined, now: number) {
  const age=now-Date.parse(at??"");
  return Number.isFinite(age)&&age>=0&&age<trophyNoticeDays*86400000;
}
