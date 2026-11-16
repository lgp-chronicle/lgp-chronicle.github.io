import type { CoverScene } from "@/lib/guild-covers";

export function CoverAction({ scene }: { scene: CoverScene }) {
  return (
    <>
      {scene.action}
      {scene.quest && (
        <a href={scene.quest.href} target="_blank" rel="noreferrer" className="cover-quest">
          {scene.quest.name}
        </a>
      )}
      {scene.actionSuffix}
    </>
  );
}
