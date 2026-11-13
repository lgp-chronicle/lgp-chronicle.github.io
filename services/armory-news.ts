import type { DatabaseSync } from "node:sqlite";
import { battlegrounds } from "../features/battlegrounds.ts";
import type { Activity, CollectionKind, Member, Profile } from "../features/types.ts";

type Reading = { at: string; count: number; owned?: Set<number> };
type Change = { event: Activity; key: string; count: number };

// The public history only carries level and equipment. Read the original observations
// so past editions and future editions use the same evidence.
export function armoryNews(db: DatabaseSync, members: Member[]): Activity[] {
  const rows = db.prepare(`SELECT character_id, at,
    json_extract(data, '$.surveyAt') AS survey,
    json_extract(data, '$.resourceTimes') AS times,
    json_extract(data, '$.collections') AS collections,
    json_extract(data, '$.pvp.pvp_map_statistics') AS maps,
    json_type(data, '$.pvp') AS pvp
    FROM character_snapshots
    WHERE json_extract(data, '$.armoryVerified') IS NOT 0 AND json_extract(data, '$.level') >= 10
    ORDER BY at, id`).iterate();
  const roster = new Map(members.map(m => [m.id, m]));
  const readings = new Map<string, Map<string, Reading>>();
  const firstCensus = new Set<string>();
  const records = new Map<string, number>();
  const news: Activity[] = [];
  const changes: Change[] = [];
  const scores = new Map<string, Map<string, number>>();
  const census = new Map<CollectionKind, { members: Set<string>; items: Set<number>; at: string }>();
  function finishSurvey() {
    for (const { event, key, count } of changes) {
      const previous = records.get(key) ?? 0;
      const current = scores.get(key)!;
      const best = Math.max(previous, ...current.values());
      if (previous > 0 && count === best) {
        event.text += count === previous ? " Iguala la mejor marca registrada" :
          [...current.values()].filter(n => n === best).length > 1 ? " Comparte la nueva mejor marca" : " Firma una nueva mejor marca";
        event.text += " de la hermandad con " + count + ".";
      }
      news.push(event);
    }
    for (const [key, values] of scores) records.set(key, Math.max(records.get(key) ?? 0, ...values.values()));
    for (const [kind, data] of census) {
      if (firstCensus.has(kind) || !data.items.size) continue;
      firstCensus.add(kind);
      const label = kind === "mounts" ? "monturas" : "mascotas";
      news.push({ id: "census/" + kind, kind: "collections", at: data.at, characterId: "",
        text: "Primer censo de " + label + " de La Ganga. La armería registra " + data.items.size +
          " " + label + " distintas entre " + data.members.size + " personajes." });
    }
    census.clear(); scores.clear(); changes.length = 0;
  }
  let batch = "", last = 0;
  const seen = new Set<string>();
  for (const row of rows) {
    const id = String(row.character_id), captured = String(row.at);
    const member = roster.get(id);
    if (!member) continue;
    const time = Date.parse(captured);
    const survey = row.survey ? String(row.survey) :
      (!batch || time - last >= 180000 || seen.has(id) ? captured : batch);
    if (survey !== batch) { finishSurvey(); seen.clear(); batch = survey; }
    last = time; seen.add(id);
    const times: Record<string, string> = JSON.parse(String(row.times ?? "{}"));
    const previous = readings.get(id) ?? new Map<string, Reading>();
    readings.set(id, previous);
    const given = member.name;
    function observe(key: string, value: Reading, kind: string, headline?: string) {
      const old = previous.get(key);
      if (old && old.at >= value.at) return;
      previous.set(key, value);
      const values = scores.get(key) ?? new Map<string, number>();
      values.set(id, value.count); scores.set(key, values);
      if (headline) changes.push({ key, count: value.count, event: {
        id: [kind, id, key, value.at].join("/"), kind, characterId: id,
        at: value.at, text: given + " " + headline,
      } });
    }
    const collections: Profile["collections"] = JSON.parse(String(row.collections ?? "{}"));
    for (const kind of ["mounts", "pets"] as const) {
      const items = collections?.[kind], at = times[kind], old = previous.get(kind);
      if (!items || !at || (old && at <= old.at)) continue;
      const owned = new Set(items.map(i => i.id));
      const additions = old?.owned ? items.filter(i => !old.owned?.has(i.id)) : [];
      const label = kind === "mounts" ? "monturas" : "mascotas";
      const headline = additions.length ? "añade " + additions.map(i => i.name).join(", ") + " a su colección de " + label + "." : undefined;
      // Remember previously recorded species through temporary omissions.
      observe(kind, { at, count: owned.size, owned: new Set([...(old?.owned ?? []), ...owned]) }, "collections", headline);
      if (!firstCensus.has(kind)) {
        const sample = census.get(kind) ?? { members: new Set<string>(), items: new Set<number>(), at };
        sample.members.add(id);
        for (const item of owned) sample.items.add(item);
        if (at > sample.at) sample.at = at;
        census.set(kind, sample);
      }
    }
    if (row.pvp !== "object") continue;
    const at = times.pvp_summary ?? (!row.survey ? captured : undefined);
    if (!at || (previous.get("pvp_summary")?.at ?? "") >= at) continue;
    const knownPvp = previous.has("pvp_summary");
    previous.set("pvp_summary", { at, count: 0 });
    const maps = battlegrounds({ pvp: { pvp_map_statistics: JSON.parse(String(row.maps ?? "[]")) } });
    for (const map of maps) {
      const key = "bg-map-" + map.id;
      const before = previous.get(key)?.count ?? 0;
      const gain = map.won - before;
      const headline = knownPvp && gain > 0 ? "suma " + gain +
        (gain === 1 ? " victoria" : " victorias") + " en " + map.name + "." : undefined;
      observe(key, { at, count: Math.max(before, map.won) }, "battlefields", headline);
    }
  }
  finishSurvey();
  return news;
}
