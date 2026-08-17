import { test } from "node:test";
import assert from "node:assert/strict";
import { COACHES, pickCoaches, toEngineCoach } from "./coaches.js";
import { applyCoach, GRADE_MULT } from "../../game/coach.js";

test("dodici coach, tutti con id diverso", () => {
  assert.equal(COACHES.length, 12);
  assert.equal(new Set(COACHES.map((c) => c.id)).size, 12);
});

test("ogni coach ha voti validi per il motore", () => {
  for (const c of COACHES) {
    assert.ok(GRADE_MULT[c.off], `${c.id}: voto OFF non valido (${c.off})`);
    assert.ok(GRADE_MULT[c.def], `${c.id}: voto DEF non valido (${c.def})`);
    assert.ok(Number.isInteger(c.champ_bonus) && c.champ_bonus >= 0, `${c.id}: bonus non valido`);
  }
});

test("la tattica sta in una riga sola sul telefono (max 30 caratteri)", () => {
  for (const c of COACHES) {
    assert.ok(c.tattica.length <= 30, `${c.id}: tattica troppo lunga (${c.tattica.length})`);
  }
});

test("il bonus segue gli anelli: 0 → 0, 1-3 → +1, 4+ → +2", () => {
  for (const c of COACHES) {
    const atteso = c.anelli === 0 ? 0 : c.anelli <= 3 ? 1 : 2;
    assert.equal(c.champ_bonus, atteso, `${c.id}: bonus ${c.champ_bonus} con ${c.anelli} anelli`);
  }
});

test("pickCoaches dà sempre un offensivo, un equilibrato e un difensivo", () => {
  for (let i = 0; i < 50; i++) {
    const tre = pickCoaches();
    assert.equal(tre.length, 3);
    assert.deepEqual(tre.map((c) => c.profilo), ["off", "bil", "dif"]);
  }
});

test("pickCoaches non ripete mai lo stesso coach nella stessa terna", () => {
  for (let i = 0; i < 50; i++) {
    const ids = pickCoaches().map((c) => c.id);
    assert.equal(new Set(ids).size, 3);
  }
});

test("pickCoaches cambia terna tra una run e l'altra", () => {
  const terne = new Set();
  for (let i = 0; i < 60; i++) terne.add(pickCoaches().map((c) => c.id).join("|"));
  assert.ok(terne.size > 1, "la terna è sempre identica: manca la rigiocabilità");
});

// Il rating che applyCoach si aspetta ora porta i reparti, non solo un numero:
// il coach agisce su quelli, perché sono l'unica cosa che la partita legge.
const RATING = { ovr: 60, reparti: { t3: 60, fin: 60, dif: 60, reb: 60, reg: 60 } };

test("toEngineCoach produce la forma che applyCoach si aspetta", () => {
  const c = toEngineCoach(COACHES.find((x) => x.id === "jackson"));
  const voto = applyCoach(RATING, c);
  assert.ok(voto.ovr > RATING.ovr, "Jackson (A/B + 2 anelli) deve alzare il voto");
  assert.ok(voto.reparti.t3 > 60 && voto.reparti.dif > 60, "deve muovere i reparti");
});

test("un coach offensivo puro vale meno di uno pluri-titolato", () => {
  const dantoni = applyCoach(RATING, toEngineCoach(COACHES.find((x) => x.id === "dantoni")));
  const jackson = applyCoach(RATING, toEngineCoach(COACHES.find((x) => x.id === "jackson")));
  assert.ok(jackson.ovr > dantoni.ovr, "il bonus anelli non si vede nel voto");
});
