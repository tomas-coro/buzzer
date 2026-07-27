import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCoach, GRADE_MULT } from "./coach.js";

const base = { ovr: 80 };

test("coach A/A alza il voto squadra", () => {
  const r = applyCoach(base, { off_grade: "A", def_grade: "A" });
  assert.ok(r.ovr > base.ovr);
  assert.equal(r.ovr, Math.round(80 * GRADE_MULT.A));
});

test("coach C/C lascia il voto invariato", () => {
  const r = applyCoach(base, { off_grade: "C", def_grade: "C" });
  assert.equal(r.ovr, 80);
});

test("coach F/F abbassa il voto", () => {
  const r = applyCoach(base, { off_grade: "F", def_grade: "F" });
  assert.ok(r.ovr < base.ovr);
});

test("i due voti si fondono nella media dei moltiplicatori", () => {
  const r = applyCoach(base, { off_grade: "A", def_grade: "F" });
  const m = (GRADE_MULT.A + GRADE_MULT.F) / 2;
  assert.equal(r.ovr, Math.round(80 * m));
});

test("champ_bonus si somma all'ovr", () => {
  const senza = applyCoach(base, { off_grade: "C", def_grade: "C", champ_bonus: 0 });
  const con = applyCoach(base, { off_grade: "C", def_grade: "C", champ_bonus: 3 });
  assert.equal(con.ovr - senza.ovr, 3);
});

test("voto coach non valido lancia", () => {
  assert.throws(() => applyCoach(base, { off_grade: "Z", def_grade: "C" }), /non valido/);
});
