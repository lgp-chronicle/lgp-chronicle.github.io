import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { positions, raceStature } from "../features/entrance-formation.ts";
import { silhouetteFrame } from "../features/entrance-frame.ts";
import {
  coverMemberId,
  coversForMember,
  drawCover,
  guildCovers,
  sceneParticipants,
} from "../lib/guild-covers.ts";
import portraits from "../config/character-art.json" with { type: "json" };

test("each illustrated party has distinct members with an armory or manual art reference", () => {
  const included = Object.values(guildCovers).flatMap((scene) =>
    sceneParticipants(scene).map(coverMemberId),
  );
  for (const scene of Object.values(guildCovers)) {
    const cast = sceneParticipants(scene);
    assert.equal(new Set(cast).size, cast.length);
  }
  for (const id of new Set(included)) {
    const portrait = portraits[id];
    assert.ok(portrait, id);
    if (portrait.entranceIssue) {
      assert.ok(portrait.illustrationReference, id);
      const file = new URL("../config/" + portrait.illustrationReference, import.meta.url);
      assert.ok(existsSync(file), id);
    }
  }
  assert.ok(!included.includes("forever-eu-aloqes-dloqe"));
});

test("a character's gallery includes every appearance, including expeditions", () => {
  assert.deepEqual(coversForMember(coverMemberId("Naisen Grandwell")).sort(), [
    "humedales",
    "invocacion",
    "mapa",
    "paella",
  ]);
  assert.deepEqual(coversForMember(coverMemberId("Juninho Delbosque")).sort(), [
    "grifon",
    "paella",
    "pique",
    "santuario",
  ]);
  assert.deepEqual(coversForMember("forever-eu-alexion-grandwell").sort(), [
    "halcon",
    "paella",
    "rastro",
  ]);
});

test("the fortress shows every cover before repeating, including across cycles", () => {
  let saved = "invalid";
  const store = {
    getItem: () => saved,
    setItem: (_, value) => {
      saved = value;
    },
  };
  const ids = Object.keys(guildCovers);
  let previous;
  for (let i = 0; i < 20; i++) {
    const cycle = Array.from({ length: ids.length }, () => drawCover(store));
    assert.deepEqual(new Set(cycle), new Set(ids));
    assert.notEqual(cycle[0], previous);
    previous = cycle.at(-1);
  }
  const blocked = () => {
    throw Error("Storage blocked");
  };
  assert.ok(ids.includes(drawCover({ getItem: blocked, setItem: blocked })));
});

test("new armory figures are grounded and scaled by their visible bodies", () => {
  const width = 100,
    height = 100;
  const data = new Uint8ClampedArray(width * height * 4);
  assert.equal(silhouetteFrame({ width, height, data }), undefined);
  for (let y = 42; y < 82; y++) {
    for (let x = 24; x < 68; x++) data[(y * width + x) * 4 + 3] = 255;
  }
  data[3] = 2;
  assert.deepEqual(silhouetteFrame({ width, height, data }), {
    center: 46,
    feet: 82,
    height: 40,
  });
  data.fill(255);
  assert.equal(silhouetteFrame({ width, height, data }), undefined);
});

test("growing formations keep every member, a common short-race scale and open space below the crest", () => {
  for (const n of [0, 1, 2, 23, 24, 25, 32, 40, 60, 100, 150]) {
    for (const shortCount of new Set([
      0,
      Math.min(n, 1),
      Math.floor(n / 3),
      n,
    ])) {
      const members = Array.from({ length: n }, (_, i) => ({
        data: {
          race: i < n - shortCount ? "Humano" : i % 2 ? "Enano" : "Gnomo",
        },
      })).sort((a, b) => raceStature(b) - raceStature(a));
      for (const compact of [false, true]) {
        const slots = positions(members, compact);
        assert.equal(slots.length, n);
        const occupied = new Set();
        for (const [i, s] of slots.entries()) {
          assert.ok(s.x > 0 && s.x < 100 && s.height > 0 && s.maxHeight > 0);
          const seat = [i % 2, s.x, s.row].join("/");
          assert.ok(!occupied.has(seat));
          occupied.add(seat);
          if (compact)
            assert.ok(s.feet - s.height * raceStature(members[i]) >= 26);
        }
        if (!shortCount) continue;
        const front = slots.slice(-shortCount);
        assert.ok(
          front.every(
            (s) =>
              s.height === front[0].height &&
              s.maxHeight === front[0].maxHeight,
          ),
        );
        if (shortCount < n)
          assert.ok(slots[n - shortCount - 1].feet < front[0].feet);
      }
    }
  }
});
