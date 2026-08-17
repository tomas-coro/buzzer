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
  // I voti sono sulla scala nativa dei reparti (percentili): i quintetti storici
  // veri stanno tra 40 e 74, non sulla scala 2K. Vedi difficulty.js.
  const d = DIFFICULTIES.incubo;
  const pool = [
    { team: "A", season: "x", quintet: [], voto: { ovr: 40 } },
    { team: "B", season: "x", quintet: [], voto: { ovr: d.oppMin } },
    { team: "C", season: "x", quintet: [], voto: { ovr: d.oppMax } },
  ];
  assert.equal(pickOpponent(pool, 1, d).team, "B", "il primo round punta a oppMin");
  assert.equal(pickOpponent(pool, d.N, d).team, "C", "l'ultimo round punta a oppMax");
});
