import { test } from "node:test";
import assert from "node:assert/strict";
import { COACHES, pickCoaches, descriviEffetto, NOME_REPARTO } from "./coaches.js";
import { applyCoach, VALORE_MIRATO, VALORE_DIFFUSO, VALORE_MALUS } from "../../game/coach.js";
import { REPARTI } from "../../game/reparti.js";
import { ROLES } from "../../game/roster.js";
import {
  emptyRosa, assegnaRosa, cartaIn, MINUTI, TITOLARE, PANCA,
} from "../../game/rosa.js";
import { card } from "../../game/fixtures.js";

test("trenta coach, tutti con id diverso", () => {
  assert.equal(COACHES.length, 30);
  assert.equal(new Set(COACHES.map((c) => c.id)).size, 30);
});

test("dieci coach per profilo: la terna esce sempre varia", () => {
  for (const p of ["off", "bil", "dif"]) {
    assert.equal(COACHES.filter((c) => c.profilo === p).length, 10, `profilo ${p}`);
  }
});

test("ogni coach ha due plus, un malus, ritmo e rotazione validi", () => {
  for (const c of COACHES) {
    assert.equal(c.plus.length, 2, `${c.id}: servono due plus`);
    for (const p of c.plus) {
      assert.ok(REPARTI.includes(p.reparto), `${c.id}: reparto plus '${p.reparto}' inesistente`);
      if (p.ruoli) {
        assert.ok(p.ruoli.length >= 1 && p.ruoli.length <= 3, `${c.id}: bersaglio da 1 a 3 ruoli`);
        for (const r of p.ruoli) assert.ok(ROLES.includes(r), `${c.id}: ruolo '${r}' inesistente`);
      }
    }
    assert.ok(c.malus && REPARTI.includes(c.malus.reparto), `${c.id}: malus mancante o non valido`);
    assert.ok(c.ritmo >= -1 && c.ritmo <= 1, `${c.id}: ritmo fuori scala (${c.ritmo})`);
    assert.ok(MINUTI[c.rotazione], `${c.id}: rotazione '${c.rotazione}' inesistente`);
  }
});

test("i due plus non insistono sullo stesso reparto, e il malus non annulla un plus", () => {
  for (const c of COACHES) {
    assert.notEqual(c.plus[0].reparto, c.plus[1].reparto, `${c.id}: due plus sullo stesso reparto`);
    for (const p of c.plus) {
      assert.notEqual(p.reparto, c.malus.reparto, `${c.id}: dà e toglie sullo stesso reparto`);
    }
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

test("almeno un plus mirato e almeno uno diffuso esistono nella panchina", () => {
  const mirati = COACHES.filter((c) => c.plus.some((p) => p.ruoli));
  const diffusi = COACHES.filter((c) => c.plus.some((p) => !p.ruoli));
  assert.ok(mirati.length >= 10, "servono coach che alzano ruoli precisi");
  assert.ok(diffusi.length >= 10, "servono coach che alzano tutta la squadra");
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

// --- le schede funzionano davvero nel motore --------------------------------

// La casella del titolare di un ruolo, e quella del panchinaro che gli sta
// dietro in questi test (6°=PG, 7°=SG ... 10°=C). La panchina non ha ruoli:
// l'accoppiata è una convenzione del test, non una regola del motore.
const tit = (ruolo) => ({ tipo: TITOLARE, ruolo });
const panca = (ruolo) => ({ tipo: PANCA, posto: 6 + ROLES.indexOf(ruolo) });

// Rosa da 10 tutta a 50: quello che si muove viene dal coach e da nient'altro.
function rosaPiatta() {
  let r = emptyRosa();
  for (const ruolo of ROLES) {
    for (const [slot, tipo] of [[tit(ruolo), TITOLARE], [panca(ruolo), PANCA]]) {
      r = assegnaRosa(r, slot, card({
        player_id: `${ruolo}-${tipo}`, pos: { primary: ruolo, secondary: null },
        reparti: { t3: 50, fin: 50, dif: 50, reb: 50, reg: 50 },
      }));
    }
  }
  return r;
}

test("ogni scheda passa nel motore e sposta qualcosa in campo", () => {
  for (const c of COACHES) {
    const out = applyCoach(rosaPiatta(), c);
    assert.ok(out.effetti.length > 0, `${c.id}: coach senza alcun effetto sui giocatori`);
    assert.equal(out.rotazione, c.rotazione);
    assert.equal(out.ritmo, c.ritmo);
  }
});

test("Thibodeau alza la difesa dei lunghi e non quella dei playmaker", () => {
  const thibs = COACHES.find((c) => c.id === "thibodeau");
  const out = applyCoach(rosaPiatta(), thibs);
  assert.equal(cartaIn(out.rosa, tit("C")).reparti.dif, 50 + VALORE_MIRATO);
  assert.equal(cartaIn(out.rosa, tit("PG")).reparti.dif, 50);
  // e il prezzo lo paga tutta la squadra
  assert.equal(cartaIn(out.rosa, tit("PG")).reparti.reg, 50 - VALORE_MALUS);
});

test("D'Antoni fa correre e alza il tiro degli esterni", () => {
  const dantoni = COACHES.find((c) => c.id === "dantoni");
  const out = applyCoach(rosaPiatta(), dantoni);
  assert.equal(out.ritmo, 1);
  assert.equal(cartaIn(out.rosa, tit("SG")).reparti.t3, 50 + VALORE_MIRATO);
  assert.equal(cartaIn(out.rosa, tit("C")).reparti.t3, 50, "il centro non tira da tre per decreto");
  assert.equal(cartaIn(out.rosa, tit("C")).reparti.reg, 50 + VALORE_DIFFUSO);
});

test("gli anelli si sentono: Jackson alza il voto più di un coach senza titoli", () => {
  const jackson = applyCoach(rosaPiatta(), COACHES.find((c) => c.id === "jackson"));
  const moe = applyCoach(rosaPiatta(), COACHES.find((c) => c.id === "moe"));
  assert.ok(jackson.voto.ovr > moe.voto.ovr, "il bonus anelli non si vede nel voto");
});

test("descriviEffetto scrive dove agisce il coach, in italiano", () => {
  assert.equal(descriviEffetto({ reparto: "dif", ruoli: ["PF", "C"] }), "Difesa · ali forti e centri");
  assert.equal(descriviEffetto({ reparto: "reg" }), "Regia · tutta la squadra");
  for (const r of REPARTI) assert.ok(NOME_REPARTO[r], `manca l'etichetta del reparto ${r}`);
});
