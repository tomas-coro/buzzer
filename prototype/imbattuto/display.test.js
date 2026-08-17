import { test } from "node:test";
import assert from "node:assert/strict";
import { toDisplayOvr } from "./display.js";

// Il voto squadra nasce già su scala 2K (media degli overall delle carte):
// toDisplayOvr è un passthrough con arrotondamento e clamp [40,99].

test("passthrough: 85 resta 85", () => {
  assert.equal(toDisplayOvr(85), 85);
});

test("passthrough: 89 (quintetto col coach) resta 89", () => {
  assert.equal(toDisplayOvr(89), 89);
});

test("arrotonda: 84.6 → 85", () => {
  assert.equal(toDisplayOvr(84.6), 85);
});

test("clamp sopra: 104 (coach su quintetto leggendario) → 99", () => {
  assert.equal(toDisplayOvr(104), 99);
});

test("clamp sotto: 12 → 40", () => {
  assert.equal(toDisplayOvr(12), 40);
});

test("coerenza con le carte: media di cinque carte 2K resta nel loro intervallo", () => {
  const carte = [92, 88, 85, 81, 77];
  const media = carte.reduce((s, o) => s + o, 0) / carte.length; // 84.6
  const display = toDisplayOvr(media);
  assert.ok(display >= Math.min(...carte) && display <= Math.max(...carte),
    `il voto squadra ${display} è fuori dall'intervallo delle carte`);
});

test("monotòna: display non decresce al crescere del nativo", () => {
  let prev = -Infinity;
  for (let n = 30; n <= 110; n++) {
    const d = toDisplayOvr(n);
    assert.ok(d >= prev, `regressione a nativo ${n}`);
    prev = d;
  }
});

test("input non numerico → errore chiaro, mai NaN nascosto", () => {
  assert.throws(() => toDisplayOvr(undefined), /toDisplayOvr/);
});
