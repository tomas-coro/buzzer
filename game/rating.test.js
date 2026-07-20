import { test } from "node:test";
import assert from "node:assert/strict";
import { offW, defW, teamRating, WOFF, WDEF, DEFAULT_K } from "./rating.js";
import { card } from "./fixtures.js";

test("offW è la media pesata nota", () => {
  const att = [99, 0, 0, 0, 0, 0, 0]; // solo tiro da 3
  const sumW = WOFF.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(offW(att) - (99 * WOFF[0]) / sumW) < 1e-9);
});

test("defW è la media pesata nota", () => {
  const def = [0, 99, 0, 0, 0]; // solo dif. interna
  const sumW = WDEF.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(defW(def) - (99 * WDEF[1]) / sumW) < 1e-9);
});

test("teamRating restituisce att/dif/ovr interi in range", () => {
  const five = [card(), card(), card(), card(), card()];
  const r = teamRating(five);
  for (const key of ["att", "dif", "ovr"]) {
    assert.ok(Number.isInteger(r[key]), `${key} intero`);
    assert.ok(r[key] >= 0 && r[key] <= 120, `${key} in range`);
  }
});

test("squadra migliore ha ovr più alto di squadra scarsa", () => {
  const forte = Array.from({ length: 5 }, () => card({ ovr: 95, att: [95,95,95,95,95,95,95], def: [95,95,95,95,95] }));
  const scarsa = Array.from({ length: 5 }, () => card({ ovr: 65, att: [60,60,60,60,60,60,60], def: [60,60,60,60,60] }));
  assert.ok(teamRating(forte).ovr > teamRating(scarsa).ovr);
});

test("teamRating con costanti custom usa ovrMix", () => {
  const five = [card(), card(), card(), card(), card()];
  const soloAtt = teamRating(five, { ...DEFAULT_K, ovrMix: 1 });
  assert.equal(soloAtt.ovr, soloAtt.att);
});
