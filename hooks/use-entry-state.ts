import { useState } from "react";

// Filters belong to one browser history entry: Back restores them, opening
// the same section from the masthead starts a fresh visit.
export function useEntryState<T extends string | number | boolean>(
  key: string,
  initial: T,
) {
  const [value, setValue] = useState<T>(() => {
    const saved = window.history.state?.view?.[key];
    return typeof saved === typeof initial ? saved : initial;
  });
  function update(next: T) {
    const state = window.history.state;
    window.history.replaceState(
      { ...state, view: { ...state?.view, [key]: next } },
      "",
    );
    setValue(next);
  }
  return [value, update] as const;
}
