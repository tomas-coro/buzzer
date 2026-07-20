import { test } from "node:test";
import assert from "node:assert/strict";
import { ROLES, canPlay, emptyQuintet, assign, isComplete } from "./roster.js";
import { card } from "./fixtures.js";

test("ROLES sono i 5 ruoli in ordine", () => {
  assert.deepEqual(ROLES, ["PG", "SG", "SF", "PF", "C"]);
});

test("canPlay accetta primaria e secondaria", () => {
  const c = card({ pos: { primary: "SG", secondary: "PG" } });
  assert.equal(canPlay(c, "SG"), true);
  assert.equal(canPlay(c, "PG"), true);
  assert.equal(canPlay(c, "C"), false);
});

test("assign riempie uno slot compatibile", () => {
  const q = assign(emptyQuintet(), "PG", card({ pos: { primary: "PG", secondary: null } }));
  assert.equal(q.PG.name, "Test Player");
});

test("assign su ruolo incompatibile lancia (niente fuori ruolo silenzioso)", () => {
  const c = card({ pos: { primary: "C", secondary: null } });
  assert.throws(() => assign(emptyQuintet(), "PG", c), /incompatibile/);
});

test("assign su slot già occupato lancia", () => {
  const q = assign(emptyQuintet(), "PG", card({ pos: { primary: "PG", secondary: null } }));
  assert.throws(() => assign(q, "PG", card({ pos: { primary: "PG", secondary: null } })), /occupato/);
});

test("isComplete vero solo con tutti e 5 gli slot pieni", () => {
  let q = emptyQuintet();
  assert.equal(isComplete(q), false);
  for (const role of ROLES) q = assign(q, role, card({ pos: { primary: role, secondary: null } }));
  assert.equal(isComplete(q), true);
});
