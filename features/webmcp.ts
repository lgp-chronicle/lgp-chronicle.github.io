import { useEffect } from "react";
import type { GuildData } from "./types";
export function useGuildTools(data: GuildData) {
  useEffect(() => {
    const ctx = (
      document as unknown as {
        modelContext?: {
          registerTool: (tool: unknown, options: unknown) => unknown;
        };
      }
    ).modelContext;
    if (!ctx) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        ctx.registerTool(
          {
            name: "read_guild_progress",
            title: "Consultar progreso de la guild",
            description:
              "Lee los últimos datos guardados, sin consultar APIs externas ni modificar datos.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute: (input: unknown) => {
              if (
                !input ||
                typeof input !== "object" ||
                Object.keys(input).length
              )
                throw Error("Expected an empty object");
              return {
                available: data.available,
                characters: data.members.map((m) => ({
                  name: m.name,
                  level: m.data.level ?? null,
                  itemLevel: m.data.itemLevel ?? null,
                  honorableKills: m.data.honorableKills ?? null,
                  observedAt: m.data.observedAt ?? null,
                })),
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [data]);
}
