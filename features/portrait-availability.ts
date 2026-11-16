import archive from "../config/character-art.json" with { type: "json" };
import type { Member } from "./types.ts";
import { isCurrentMember } from "./membership.ts";

type ArchivedModel = {
  url: string;
  modified: number;
  frame: { x: number; top: number; height: number };
  entranceIssue?: string;
  illustrationReference?: string;
};
export const models: Record<string, ArchivedModel> = archive;

export function hasEntrancePortrait(member: Member) {
  const archived = models[member.id];
  if (!isCurrentMember(member) || archived?.entranceIssue || member.data.armoryVerified === false)
    return false;
  return Boolean(archived || member.data.characterRender || member.data.avatar);
}
