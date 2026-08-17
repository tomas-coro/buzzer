import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCoach, GRADE_MULT, LATO_OFF, LATO_DIF } from "./coach.js";
import { votoDaReparti } from "./rating.js";

const reparti = { t3: 60, fin: 60, dif: 60, reb: 60, reg: 60 };
const base = { ovr: votoDaReparti(reparti), reparti };
const CC = { off_grade: "C", def_grade: "C" };

test("coach A/A alza il voto squadra", () => {
  const r = applyCoach(base, { off_grade: "A", def_grade: "A" });
  assert.ok(r.ovr > base.ovr);
});

test("coach C/C lascia tutto invariato", () => {
  const r = applyCoach(base, CC);
  assert.equal(r.ovr, base.ovr);
  assert.deepEqual(r.reparti, reparti);
});

test("coach F/F abbassa il voto", () => {
  assert.ok(applyCoach(base, { off_grade: "F", def_grade: "F" }).ovr < base.ovr);
});

test("il voto d'attacco muove solo tiro, finalizzazione e regia", () => {
  const r = applyCoach(base, { off_grade: "A", def_grade: "C" });
  for (const k of LATO_OFF) assert.ok(r.reparti[k] > 60, `'${k}' doveva salire`);
  for (const k of LATO_DIF) assert.equal(r.reparti[k], 60, `'${k}' non doveva muoversi`);
});

test("il voto di difesa muove difesa e rimbalzi", () => {
  const r = applyCoach(base, { off_grade: "C", def_grade: "F" });
  for (const k of LATO_DIF) assert.ok(r.reparti[k] < 60, `'${k}' doveva scendere`);
  for (const k of LATO_OFF) assert.equal(r.reparti[k], 60, `'${k}' non doveva muoversi`);
});

test("i moltiplicatori restano quelli della curva A..F", () => {
  const r = applyCoach(base, { off_grade: "A", def_grade: "C" });
  assert.equal(r.reparti.t3, 60 * GRADE_MULT.A);
});

test("champ_bonus entra nei reparti, non solo nel voto", () => {
  const con = applyCoach(base, { ...CC, champ_bonus: 3 });
  assert.equal(con.reparti.dif, 63);
  assert.ok(con.ovr > base.ovr);
});

test("i reparti restano dentro 0-99 anche col coach migliore", () => {
  const alto = { t3: 98, fin: 98, dif: 98, reb: 98, reg: 98 };
  const r = applyCoach({ ovr: votoDaReparti(alto), reparti: alto },
    { off_grade: "A", def_grade: "A", champ_bonus: 2 });
  for (const v of Object.values(r.reparti)) assert.ok(v <= 99, `reparto fuori scala: ${v}`);
});

test("il ritmo passa dal coach, neutro se non c'è", () => {
  assert.equal(applyCoach(base, CC).ritmo, 0);
  assert.equal(applyCoach(base, { ...CC, ritmo: -0.6 }).ritmo, -0.6);
});

test("input sbagliati lanciano invece di passare", () => {
  assert.throws(() => applyCoach(base, { off_grade: "Z", def_grade: "C" }), /non valido/);
  assert.throws(() => applyCoach({ ovr: 70 }, CC), /reparti/);
  assert.throws(() => applyCoach(base, { ...CC, ritmo: 3 }), /ritmo/);
});
