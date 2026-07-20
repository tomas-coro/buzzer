import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHistoricalQuintets, pickOpponent } from "./opponents.js";
import { DIFFICULTIES } from "./difficulty.js";
import { card } from "./fixtures.js";

function team(over, n) {
  return Array.from({ length: n }, (_, i) => card({ ...over, ovr: (over.ovr ?? 80) - i }));
}

test("costruisce un quintetto (top-5 OVR) per ogni team-stagione con almeno 5 carte", () => {
  const src = {
    "GSW|2015-16": team({ team: "GSW" }, 7),
    "LAL|2015-16": team({ team: "LAL", ovr: 70 }, 5),
  };
  const pool = buildHistoricalQuintets(src);
  assert.equal(pool.length, 2);
  const gsw = pool.find((o) => o.team === "GSW");
  assert.equal(gsw.quintet.length, 5);
  assert.ok(gsw.voto.ovr > 0);
});

test("salta i gruppi con meno di 5 carte (niente quintetto finto)", () => {
  const src = { "MIA|2015-16": team({ team: "MIA" }, 4) };
  assert.deepEqual(buildHistoricalQuintets(src), []);
});

test("il quintetto prende i 5 OVR più alti", () => {
  const src = { "GSW|2015-16": team({ team: "GSW", ovr: 90 }, 8) };
  const [gsw] = buildHistoricalQuintets(src);
  const ovrs = gsw.quintet.map((c) => c.ovr).sort((a, b) => b - a);
  assert.deepEqual(ovrs, [90, 89, 88, 87, 86]);
});

test("pickOpponent sceglie il voto più vicino alla soglia crescente del round", () => {
  const pool = [
    { team: "A", season: "x", quintet: [], voto: { att: 0, dif: 0, ovr: 72 } },
    { team: "B", season: "x", quintet: [], voto: { att: 0, dif: 0, ovr: 88 } },
    { team: "C", season: "x", quintet: [], voto: { att: 0, dif: 0, ovr: 99 } },
  ];
  const d = DIFFICULTIES.incubo; // oppMin 88, oppMax 99, N 10
  const primo = pickOpponent(pool, 1, d);   // soglia = 88 → B
  const ultimo = pickOpponent(pool, 10, d);  // soglia = 99 → C
  assert.equal(primo.team, "B");
  assert.equal(ultimo.team, "C");
});
