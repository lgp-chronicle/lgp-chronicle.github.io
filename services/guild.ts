import { memberArmoryUrl } from "../config/characters";
import { database } from "../db/client";
import type { GuildData, Member, Activity } from "../features/types";
export async function readGuild(): Promise<GuildData> {
  const now = new Date().toISOString();
  try {
    const db = database();
    const rows = await db
      .prepare("SELECT * FROM characters WHERE campaign_id = ?")
      .bind("forever")
      .all<Record<string, any>>();
    const snapshots = await db
      .prepare(
        `SELECT character_id, at, json_object(
          'level',json_extract(data,'$.level'),
          'itemLevel',json_extract(data,'$.itemLevel'),
          'honorableKills',json_extract(data,'$.honorableKills'),
          'honor',json_extract(data,'$.honor'),
          'sourceModified',CASE WHEN json_extract(data,'$.armoryVerified') IS NOT 0
            THEN json_extract(data,'$.sourceModified') END,
          'observedAt',json_extract(data,'$.observedAt'),
          'resourceTimes',json_extract(data,'$.resourceTimes')
        ) AS data FROM character_snapshots ORDER BY at`,
      )
      .all<{ character_id: string; at: string; data: string }>();
    const events = await db
      .prepare("SELECT data FROM activity_events ORDER BY at DESC LIMIT 250")
      .all<{ data: string }>();

    const members: Member[] = rows.results.map((r) => ({
      id: r.id,
      name: r.name,
      realm: r.realm,
      region: r.region,
      armory: memberArmoryUrl(r.id, r.region),
      addedAt: r.added_at,
      data: JSON.parse(r.profile),
      logs: r.logs ? JSON.parse(r.logs) : undefined,
      checkedAt: r.checked_at,
      status: r.status,
      errors: JSON.parse(r.errors),
      history: snapshots.results
        .filter((x) => x.character_id === r.id)
        .map((x) => ({ at: x.at, data: JSON.parse(x.data) })),
    }));

    return {
      members,
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
      members: [],
      events: [],
      available: false,
      message:
        "El archivo de la guild no está disponible. Vuelve a intentarlo en un momento.",
      generatedAt: now,
    };
  }
}
