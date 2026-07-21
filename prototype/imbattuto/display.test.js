import { test } from "node:test";
import assert from "node:assert/strict";
import { toDisplayOvr } from "./display.js";

// Mappa lineare voto-squadra nativo [71,162] → display [60,99], con clamp.
// Ancore e punti attesi calcolati da: 60 + (nativo-71)*39/89, arrotondato.

test("ancora bassa: nativo 71 → 60", () => {
  assert.equal(toDisplayOvr(71), 60);
});

test("nativo 106 → 75", () => {
  assert.equal(toDisplayOvr(106), 75);
});

test("nativo 119 (Tu col coach) → 81", () => {
  assert.equal(toDisplayOvr(119), 81);
});

test("nativo 123 (avversario mediano) → 83", () => {
  assert.equal(toDisplayOvr(123), 83);
});

test("ancora alta: nativo 160 → 99", () => {
  assert.equal(toDisplayOvr(160), 99);
});

test("clamp sotto: nativo < 71 non scende sotto 60", () => {
  assert.equal(toDisplayOvr(50), 60);
});

test("clamp sopra: nativo > 160 non supera 99", () => {
  assert.equal(toDisplayOvr(162), 99);
});

test("monotòna: display non decresce al crescere del nativo", () => {
  let prev = -Infinity;
  for (let n = 60; n <= 170; n++) {
    const d = toDisplayOvr(n);
    assert.ok(d >= prev, `regressione a nativo ${n}`);
    prev = d;
  }
});

test("input non numerico → errore chiaro, mai NaN nascosto", () => {
  assert.throws(() => toDisplayOvr(undefined), /toDisplayOvr/);
});
