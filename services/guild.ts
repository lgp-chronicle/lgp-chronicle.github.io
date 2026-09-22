import { characters, characterId } from "../config/characters";
import { database } from "../db/client";
import type { GuildData, Member, Activity } from "../features/types";
export async function readGuild(): Promise<GuildData> {
  const now = new Date().toISOString();
  const fallback: Member[] = characters
    .filter((c) => c.campaign === "tbc")
    .map((c) => ({
      ...c,
      id: characterId(c),
      data: {},
      history: [],
      status: "pending",
    }));
  try {
    const db = database();
    const rows = await db
      .prepare("SELECT * FROM characters WHERE campaign_id = ?")
      .bind("tbc")
      .all<Record<string, any>>();
    const snapshots = await db
      .prepare(
        `SELECT character_id, at, json_object(
          'level',json_extract(data,'$.level'),
          'itemLevel',json_extract(data,'$.itemLevel'),
          'honorableKills',json_extract(data,'$.honorableKills'),
          'honor',json_extract(data,'$.honor'),
          'observedAt',json_extract(data,'$.observedAt'),
          'resourceTimes',json_extract(data,'$.resourceTimes')
        ) AS data FROM character_snapshots ORDER BY at`,
      )
      .all<{ character_id: string; at: string; data: string }>();
    const events = await db
      .prepare("SELECT data FROM activity_events ORDER BY at DESC LIMIT 250")
      .all<{ data: string }>();
    return {
      members: fallback.map((c) => {
        const r = rows.results.find((x) => x.id === c.id);
        return r
          ? {
              ...c,
              addedAt: r.added_at,
              data: JSON.parse(r.profile),
              logs: r.logs ? JSON.parse(r.logs) : undefined,
              checkedAt: r.checked_at,
              status: r.status,
              errors: JSON.parse(r.errors),
              history: snapshots.results
                .filter((x) => x.character_id === c.id)
                .map((x) => ({ at: x.at, data: JSON.parse(x.data) })),
            }
          : c;
      }),
      events: events.results.map((x) => JSON.parse(x.data) as Activity),
      available: true,
      generatedAt: now,
    };
  } catch (e) {
    console.error(
      "Guild storage unavailable",
      e instanceof Error ? e.name : "error",
    );
    return {
      members: fallback,
      events: [],
      available: false,
      message:
        "El archivo de la guild no está disponible. Vuelve a intentarlo en un momento.",
      generatedAt: now,
    };
  }
}
