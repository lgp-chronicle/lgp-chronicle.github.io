import type { GuildIconName } from "@/components/guild-icon";

const slots = [
  ["HEAD", "Cabeza", "helmet"],
  ["SHOULDER", "Hombros", "shoulders"],
  ["BACK", "Espalda", "cloak"],
  ["CHEST", "Pecho", "armor"],
  ["BODY", "Camisola", "shirt"],
  ["TABARD", "Tabardo", "tabard"],
  ["WRIST", "Muñeca", "bracer"],
  ["HANDS", "Manos", "strength"],
  ["WAIST", "Cintura", "belt"],
  ["LEGS", "Piernas", "legs"],
  ["FEET", "Pies", "boot"],
  ["FINGER", "Anillo", "ring"],
  ["NECK", "Cuello", "necklace"],
  ["TRINKET", "Abalorio", "trinket"],
  ["MAIN_HAND", "Mano principal", "sword"],
  ["OFF_HAND", "Mano secundaria", "shield"],
  ["RANGED", "A distancia", "bow"],
  ["AMMO", "Munición", "quiver"],
] as const satisfies readonly (readonly [string, string, GuildIconName])[];

export function slotInfo(label: string, type?: string) {
  const normalized = (type ?? label).replace(/_?[12]$/, "").trim();
  const entry = slots.find(
    ([id, name]) =>
      id === normalized ||
      name.toLowerCase() ===
        label
          .replace(/\s*[12]$/, "")
          .trim()
          .toLowerCase(),
  );
  const numbered = type?.match(/[12]$/)?.[0] ?? label.match(/[12]$/)?.[0] ?? "";
  return {
    label: entry ? entry[1] + (numbered ? " " + numbered : "") : label,
    icon: entry?.[2] ?? ("crate" as const),
  };
}
