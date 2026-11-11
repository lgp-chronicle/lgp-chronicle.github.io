import assert from "node:assert/strict";
import test from "node:test";
import { positions, raceStature } from "../features/entrance-formation.ts";
import { silhouetteFrame } from "../features/entrance-frame.ts";

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
