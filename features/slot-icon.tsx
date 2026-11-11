// Slot outlines share a 24-unit grid so they stay legible beside the slot name.
const slots = [
  [
    "HEAD",
    "Cabeza",
    "M4 15V11a8 8 0 0 1 16 0v4l-5 4v-6l-3 2-3-2v6z M4 11l5 1m6 0 5-1",
  ],
  [
    "SHOULDER",
    "Hombros",
    "M2 15l3-7 5-3h4l5 3 3 7-6 3-2-5h-4l-2 5z M5 13l4-2m6 0 4 2",
  ],
  [
    "BACK",
    "Espalda",
    "M8 4q4-3 8 0l4 16-4-1-4 2-4-2-4 1z M8 5l4 3 4-3m-4 3-2 9",
  ],
  [
    "CHEST",
    "Pecho",
    "M5 3l4 1 3 3 3-3 4-1 1 7-3 2v8l-5 2-5-2v-8l-3-2z M8 12l4 2 4-2",
  ],
  ["BODY", "Camisola", "M8 4l4 2 4-2 6 5-3 4-3-2v10H8V11l-3 2-3-4z"],
  ["TABARD", "Tabardo", "M6 3h4l2 3 2-3h4v17l-6-3-6 3z M12 10v5"],
  ["WRIST", "Muñeca", "M7 3l12 3-4 15-12-3z M6 7l12 3M4 15l12 3"],
  [
    "HANDS",
    "Manos",
    "M7 20l-4-8q0-3 2-2l3 3V6q1-3 3-1v5-7q2-2 3 0v7-6q2-2 3 1v6-4q2-2 3 0v7l-4 6z",
  ],
  ["WAIST", "Cintura", "M2 8h7m6 0h7v8h-7m-6 0H2z M9 6h6v12H9z M11 12h3"],
  ["LEGS", "Piernas", "M6 3h12l2 18h-6l-2-10-2 10H4z M6 6h12"],
  ["FEET", "Pies", "M10 3h9l-1 9 3 5v4H3v-4l6-3z M3 18h18M10 6h8"],
  ["FINGER", "Anillo", "M8 7l2-4h4l2 4-4 4z M8 8a7 7 0 1 0 8 0"],
  ["NECK", "Cuello", "M3 3q1 8 9 12 8-4 9-12 M12 13l4 4-4 5-4-5z"],
  [
    "TRINKET",
    "Abalorio",
    "M12 3l2 3-2 3-2-3z M12 9l6 4v5l-6 4-6-4v-5z M9 15l3-2 3 2-3 3z",
  ],
  ["MAIN_HAND", "Mano principal", "M20 3l-1 6-9 9-4-4 9-9z M4 12l8 8m-4-4-5 5"],
  ["OFF_HAND", "Mano secundaria", "M12 2l8 3v7q0 6-8 10-8-4-8-10V5z M12 5v13"],
  ["RANGED", "A distancia", "M4 3q17 0 17 17L4 3z M3 21l14-14m-4 0h4v4"],
  ["AMMO", "Munición", "M4 20L19 5m-6 2 7-4-3 7 M4 14v5h5"],
] as const;
const fallback = "M12 2l9 5v10l-9 5-9-5V7z M3 7l9 5 9-5m-9 5v10";

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
    path: entry?.[2] ?? fallback,
  };
}

export function SlotIcon({ path }: { path: string }) {
  return (
    <svg
      className="slot-mark"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
