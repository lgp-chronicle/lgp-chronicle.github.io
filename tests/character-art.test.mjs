import assert from "node:assert/strict";
import test from "node:test";
import { armoryImageUrl, characterArtSources } from "../features/character-art-sources.ts";
import { models } from "../features/portrait-availability.ts";

const id = "forever-eu-rast-puñotormenta";
const archived = models[id];
const member = (data = {}, extra = {}) => ({
  id, name: "Rast", realm: "jcj", region: "eu", status: "ok", history: [],
  data: {
    characterRender: archived.url,
    avatar: "https://render.worldofwarcraft.com/avatar.jpg",
    sourceModified: new Date(archived.modified + 3600000).toISOString(),
    ...data,
  },
  ...extra,
});

test("activity and honor cards use the same current model as the character sheet", () => {
  const m = member();
  const expected = new URL(archived.url);
  expected.searchParams.set("v", String(archived.modified + 3600000));
  for (const mode of ["current", "honor", "entrance"]) {
    const art = characterArtSources(m, mode);
    assert.equal(art.sources[0], expected.href, mode);
    assert.ok(art.sources.every(src => !src.includes("/guild/")), mode);
    assert.equal(art.cutout, undefined);
    assert.equal(art.sources.at(-1), art.avatar);
  }
});

test("optimized snapshots are reused only when both URL and modification date match", () => {
  const matching = member({ sourceModified: new Date(archived.modified).toISOString() });
  const art = characterArtSources(matching, "entrance");
  assert.ok(art.sources[0].includes("/guild/formacion/"));
  assert.ok(art.sources[1].includes("/guild/personajes/"));
  assert.equal(art.cutout, art.sources[0]);
  const differentImage = member({
    sourceModified: matching.data.sourceModified,
    characterRender: "https://render.worldofwarcraft.com/new-model.png",
  });
  assert.ok(characterArtSources(differentImage, "honor").sources.every(src => !src.includes("/guild/")));
});

test("a gear update refreshes model and avatar URLs without changing the API path", () => {
  const before = member().data;
  const after = { ...before, sourceModified: new Date(archived.modified + 7200000).toISOString() };
  for (const source of [before.characterRender, before.avatar]) {
    const oldUrl = new URL(armoryImageUrl(source, before));
    const nextUrl = new URL(armoryImageUrl(source, after));
    assert.equal(oldUrl.pathname, nextUrl.pathname);
    assert.notEqual(oldUrl.search, nextUrl.search);
    assert.equal(armoryImageUrl(source, after), armoryImageUrl(source, {
      ...after, observedAt: "2030-01-01T00:00:00Z",
    }), "an unchanged profile keeps its cache key");
  }
});

test("cache versions preserve other URL parameters and use confirmed media time when needed", () => {
  const profile = { sourceModified: "invalid", resourceTimes: { media: "2026-11-17T10:00:00Z" } };
  const url = new URL(armoryImageUrl("https://render.worldofwarcraft.com/a.png?quality=80#model", profile));
  assert.equal(url.searchParams.get("quality"), "80");
  assert.equal(url.searchParams.get("v"), String(Date.parse(profile.resourceTimes.media)));
  assert.equal(url.hash, "#model");
  assert.equal(armoryImageUrl(undefined, profile), undefined);
  assert.equal(armoryImageUrl("https://example.com/a.png", {}), "https://example.com/a.png");
});

test("characters without an archived model can use their current avatar", () => {
  const m = member({ characterRender: undefined }, { id: "forever-eu-new-member" });
  const art = characterArtSources(m, "honor");
  assert.deepEqual(art.sources, [armoryImageUrl(m.data.avatar, m.data)]);
  assert.equal(art.avatar, art.sources[0]);
});

test("departed members never supply character art", () => {
  assert.deepEqual(characterArtSources(member({}, { inRoster: false }), "honor").sources, []);
});
