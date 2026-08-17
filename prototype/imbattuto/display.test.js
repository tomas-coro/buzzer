import { test } from "node:test";
import assert from "node:assert/strict";
import { toDisplayOvr } from "./display.js";

// Il voto nativo è un PERCENTILE (50 = mediano della stagione). toDisplayOvr lo
// porta sul range 60-99 che l'occhio si aspetta da un gioco di basket.

test("il mediano della lega esce da titolare, non da riserva", () => {
  const d = toDisplayOvr(50);
  assert.ok(d >= 74 && d <= 80, `un giocatore mediano mostra ${d}`);
});

test("un quintetto storico mediano (nativo 56) sta sopra l'80", () => {
  assert.ok(toDisplayOvr(56) >= 80);
});

test("il fuoriclasse assoluto sfiora il 99, senza arrivarci per caso", () => {
  const d = toDisplayOvr(85); // top 1% delle carte vere
  assert.ok(d >= 93 && d <= 99, `un fuoriclasse mostra ${d}`);
});

test("clamp sopra: oltre la scala nativa si ferma a 99", () => {
  assert.equal(toDisplayOvr(120), 99);
  assert.equal(toDisplayOvr(90), 99);
});

test("clamp sotto: l'ultimo della panchina non scende sotto 60", () => {
  assert.equal(toDisplayOvr(0), 60);
  assert.equal(toDisplayOvr(-5), 60);
});

test("monotòna: display non decresce al crescere del nativo", () => {
  let prev = -Infinity;
  for (let n = -10; n <= 110; n++) {
    const d = toDisplayOvr(n);
    assert.ok(d >= prev, `regressione a nativo ${n}`);
    prev = d;
  }
});

test("resta dentro 60-99 su tutta la scala nativa", () => {
  for (let n = 0; n <= 99; n++) {
    const d = toDisplayOvr(n);
    assert.ok(d >= 60 && d <= 99, `nativo ${n} → ${d}, fuori scala`);
  }
});

test("distingue davvero: due squadre a 6 punti di scarto nativo non mostrano lo stesso numero", () => {
  assert.ok(toDisplayOvr(56) > toDisplayOvr(50));
});

test("input non numerico → errore chiaro, mai NaN nascosto", () => {
  assert.throws(() => toDisplayOvr(undefined), /toDisplayOvr/);
  assert.throws(() => toDisplayOvr("80"), /toDisplayOvr/);
});
