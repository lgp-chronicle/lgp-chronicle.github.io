import { hasArmory, isCurrentMember } from "./membership.ts";
import { models } from "./portrait-availability.ts";
import { hasRecentUpdate } from "./spotlight-freshness.ts";
import type { Member } from "./types.ts";

export function canIllustrateMember(member: Member, now: number) {
  const art = models[member.id];
  return isCurrentMember(member) && hasRecentUpdate(member, now) && hasArmory(member) &&
    (!art?.entranceIssue || Boolean(art.illustrationReference)) &&
    Boolean(member.data.characterRender || member.data.avatar || art);
}
