import type { CharacterConfig } from "../config/characters";
import type { Profile } from "../features/types";
import { numeric } from "../features/types";
import { request, token, ProviderError } from "./http";
type Json = Record<string, any>;
const name = (v: any): string | undefined =>
  typeof v === "string" ? v : typeof v?.name === "string" ? v.name : undefined;
export async function blizzard(
  c: CharacterConfig,
  s: Record<string, string | undefined>,
  old: Profile,
): Promise<{
  data: Profile;
  errors: string[];
  success: boolean;
  retryAfter: number;
}> {
  const auth = await token(
    "https://oauth.battle.net/token",
    s.BLIZZARD_CLIENT_ID,
    s.BLIZZARD_CLIENT_SECRET,
  );
  const now = new Date().toISOString();
  const base = `https://${c.region}.api.blizzard.com/profile/wow/character/${encodeURIComponent(c.realm)}/${encodeURIComponent(c.name.toLowerCase())}`;
  const ns = s.BLIZZARD_NAMESPACE ?? `profile-classicann-${c.region}`;
  if (!ns.startsWith("profile-classicann-"))
    throw new ProviderError("wrong-campaign-namespace");
  const read = async (path: string) => {
    const u = new URL(base + path);
    u.searchParams.set("namespace", ns);
    u.searchParams.set("locale", "es_ES");
    const r = await request(u.href, {
      headers: { Authorization: `Bearer ${auth}` },
    });
    return {
      json: (await r.json()) as Json,
      modified: r.headers.get("last-modified"),
    };
  };
  const { json: p, modified } = await read("");
  if (
    typeof p.name !== "string" ||
    p.name.toLowerCase() !== c.name.toLowerCase() ||
    p.realm?.slug !== c.realm
  )
    throw new ProviderError("identity-mismatch");
  const data: Profile = {
    ...old,
    observedAt: now,
    resourceTimes: { ...old.resourceTimes, summary: now },
  };
  const assign = (key: keyof Profile, value: any) => {
    if (value !== undefined && value !== null) (data as any)[key] = value;
  };
  assign("level", numeric(p.level) ? p.level : undefined);
  assign("className", name(p.character_class));
  assign("classId", p.character_class?.id);
  assign("race", name(p.race));
  assign("spec", name(p.active_spec));
  assign("faction", name(p.faction));
  assign("gender", name(p.gender));
  assign(
    "itemLevel",
    numeric(p.equipped_item_level) ? p.equipped_item_level : undefined,
  );
  assign(
    "achievementPoints",
    numeric(p.achievement_points) ? p.achievement_points : undefined,
  );
  if (modified) assign("sourceModified", modified);
  const resources: [string, string, (j: Json) => void][] = [
    [
      "equipment",
      "/equipment",
      (j) => {
        if (Array.isArray(j.equipped_items))
          data.equipment = j.equipped_items.map((x: any) => ({
            slot: name(x.slot) ?? x.slot?.type ?? "Equipo",
            name: name(x) ?? "Objeto",
            quality: x.quality?.type,
            itemLevel: x.level?.value,
            id: x.item?.id,
            details: [
              x.armor?.display?.display_string,
              ...(x.stats ?? []).map((s: any) => s.display?.display_string),
              ...(x.enchantments ?? []).map((e: any) => e.display_string),
            ].filter((v): v is string => typeof v === "string"),
          }));
      },
    ],
    [
      "media",
      "/character-media",
      (j) => {
        const u = j.assets?.find((a: any) => a.key === "avatar")?.value;
        if (typeof u === "string" && u.startsWith("https://")) data.avatar = u;
      },
    ],
    [
      "professions",
      "/professions",
      (j) => {
        if (Array.isArray(j.primaries))
          data.professions = [...j.primaries, ...(j.secondaries ?? [])].flatMap(
            (x: any) =>
              (x.tiers?.length ? x.tiers : [x]).map((t: any) => ({
                name: name(x.profession) ?? "Profesión",
                skill: t.skill_points,
                max: t.max_skill_points,
              })),
          );
      },
    ],
    [
      "specializations",
      "/specializations",
      (j) => {
        const active = j.specialization_groups?.find(
          (g: any) => g.is_active === true,
        );
        if (Array.isArray(active?.specializations)) {
          const trees = active.specializations;
          data.talentTrees = trees
            .filter(
              (t: any) =>
                typeof t.specialization_name === "string" &&
                numeric(t.spent_points),
            )
            .map((t: any) => ({
              name: t.specialization_name,
              points: t.spent_points,
            }));
          const max = Math.max(...data.talentTrees!.map((t) => t.points));
          data.spec =
            data
              .talentTrees!.filter((t) => t.points === max && max > 0)
              .map((t) => t.name)
              .join(" / ") || undefined;
          data.specDerived = true;
          data.talents = trees
            .flatMap((t: any) =>
              (t.talents ?? []).map((x: any) => {
                const n = name(x.spell_tooltip?.spell);
                return n
                  ? `${n}${numeric(x.talent_rank) ? ` · ${x.talent_rank} puntos` : ""}`
                  : undefined;
              }),
            )
            .filter((v: unknown): v is string => typeof v === "string");
        }
        if (Array.isArray(j.specializations))
          data.talents = j.specializations.flatMap((x: any) =>
            (x.talents ?? [])
              .map((t: any) => name(t.talent) ?? name(t.spell))
              .filter((x: unknown): x is string => typeof x === "string"),
          );
      },
    ],
    [
      "pvp_summary",
      "/pvp-summary",
      (j) => {
        assign(
          "honorableKills",
          numeric(j.honorable_kills) ? j.honorable_kills : undefined,
        );
        assign("honor", numeric(j.honor) ? j.honor : undefined);
        assign("pvpRank", numeric(j.pvp_rank) ? j.pvp_rank : undefined);
        data.pvp = j;
      },
    ],
    [
      "reputations",
      "/reputations",
      (j) => {
        if (Array.isArray(j.reputations))
          data.reputations = j.reputations.map((x: any) => ({
            name: name(x.faction) ?? "Reputación",
            standing: name(x.standing) ?? String(x.standing?.raw ?? ""),
            value: x.standing?.value,
          }));
      },
    ],
    [
      "achievements",
      "/achievements",
      (j) => {
        if (Array.isArray(j.achievements))
          data.achievements = j.achievements
            .map((x: any) => name(x.achievement))
            .filter((x: unknown): x is string => typeof x === "string");
      },
    ],
    [
      "encounters",
      "/encounters/raids",
      (j) => {
        if (Array.isArray(j.expansions)) {
          const raids = j.expansions.flatMap((x: any) => x.instances ?? []);
          const kills = raids
            .flatMap((x: any) => x.modes ?? [])
            .flatMap((x: any) => x.progress?.encounters ?? [])
            .filter((x: any) => x.completed_count > 0);
          data.raidBosses = new Set(
            kills.map((x: any) => x.encounter?.id),
          ).size;
          data.raids = raids
            .filter((x: any) =>
              x.modes?.some(
                (m: any) =>
                  m.progress?.completed_count === m.progress?.total_count &&
                  m.progress?.total_count > 0,
              ),
            )
            .map((x: any) => name(x.instance))
            .filter((x: unknown): x is string => typeof x === "string");
        }
      },
    ],
  ];
  resources.push([
    "statistics",
    "/statistics",
    (j) => {
      const labels: Record<string, string> = {
        health: "Salud",
        strength: "Fuerza",
        agility: "Agilidad",
        intellect: "Intelecto",
        stamina: "Aguante",
        spirit: "Espíritu",
        armor: "Armadura",
        attack_power: "Poder de ataque",
        spell_power: "Poder con hechizos",
        melee_crit: "Crítico cuerpo a cuerpo (%)",
        spell_crit: "Crítico con hechizos (%)",
        ranged_crit: "Crítico a distancia (%)",
        defense: "Defensa",
        dodge: "Esquivar (%)",
        parry: "Parar (%)",
        block: "Bloquear (%)",
      };
      data.statistics = Object.fromEntries(
        Object.entries(labels).flatMap(([key, label]) => {
          const v = numeric(j[key])
            ? j[key]
            : (j[key]?.effective ?? j[key]?.value);
          return numeric(v) ? [[label, v]] : [];
        }),
      );
    },
  ]);
  const errors: string[] = [];
  let retryAfter = 0;
  // Follow only resources advertised by this Classic profile. Retail parity is not assumed.
  for (const [key, path, normalize] of resources) {
    if (!p[key]?.href) continue;
    try {
      const { json } = await read(path);
      normalize(json);
      data.resourceTimes![key] = now;
    } catch (e) {
      errors.push(
        `${key}:${e instanceof ProviderError ? e.code : "invalid-response"}`,
      );
      if (e instanceof ProviderError && e.code === "rate-limited") {
        retryAfter = e.retryAfter;
        break;
      }
    }
  }
  return { data, errors, success: true, retryAfter };
}
