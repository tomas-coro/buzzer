import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCoach, GRADE_MULT } from "./coach.js";

const base = { att: 80, dif: 80, ovr: 80 };

test("coach OFF 'A' alza l'attacco, DEF 'C' lascia la difesa", () => {
  const r = applyCoach(base, { off_grade: "A", def_grade: "C" });
  assert.ok(r.att > base.att);
  assert.equal(r.dif, Math.round(80 * GRADE_MULT.C));
});

test("coach DEF 'A' alza la difesa", () => {
  const r = applyCoach(base, { off_grade: "C", def_grade: "A" });
  assert.ok(r.dif > base.dif);
});

test("coach 'F' abbassa il lato corrispondente", () => {
  const r = applyCoach(base, { off_grade: "F", def_grade: "F" });
  assert.ok(r.att < base.att && r.dif < base.dif);
});

test("champ_bonus si somma all'ovr", () => {
  const senza = applyCoach(base, { off_grade: "C", def_grade: "C", champ_bonus: 0 });
  const con = applyCoach(base, { off_grade: "C", def_grade: "C", champ_bonus: 3 });
  assert.equal(con.ovr - senza.ovr, 3);
});

test("ovr resta coerente con att/dif dopo il coach", () => {
  const r = applyCoach(base, { off_grade: "A", def_grade: "A" });
  assert.equal(r.ovr, Math.round(0.5 * r.att + 0.5 * r.dif));
});
