import test from "node:test";
import assert from "node:assert/strict";
import {
  boxScore, boxScorePartita, ripartisci, quote, totaliSquadra, medieCarriera,
  chiavePersona, STAT_BOX, REB_SQUADRA, AST_PER_PUNTO,
} from "./boxscore.js";
import { simulaPartita, rngSeed } from "./partita.js";

// Un giocatore finto con la riga vera che gli si vuole dare.
function g(nome, stats = {}) {
  return {
    nome,
    stats_real: {
      pts: 10, reb: 5, ast: 3, stl: 1, blk: 0.5, tov: 2, min: 30, ...stats,
    },
  };
}

const REPARTI = { t3: 50, fin: 50, dif: 50, reb: 50, reg: 50 };
const cinque = () => [g("A"), g("B"), g("C"), g("D"), g("E")];
const base = (over = {}) => ({
  giocatori: cinque(),
  puntiQuarto: [28, 24, 30, 26],
  possessi: 99,
  reparti: REPARTI,
  rng: rngSeed(1),
  ...over,
});

// ---------------------------------------------------------------------------
// ripartisci: la somma deve tornare sempre
// ---------------------------------------------------------------------------

test("ripartisci somma esattamente al totale", () => {
  for (const tot of [0, 1, 7, 28, 113]) {
    const out = ripartisci(tot, [3, 1, 1, 2, 0.5]);
    assert.equal(out.reduce((a, b) => a + b, 0), tot, `totale ${tot}`);
  }
});

test("ripartisci rispetta l'ordine dei pesi", () => {
  const out = ripartisci(100, [4, 3, 2, 1, 0]);
  assert.ok(out[0] > out[1] && out[1] > out[2], `atteso decrescente, avuto ${out}`);
});

test("ripartisci con pesi tutti a zero divide in parti uguali", () => {
  assert.deepEqual(ripartisci(10, [0, 0, 0, 0, 0]), [2, 2, 2, 2, 2]);
});

test("ripartisci non inventa punti da un totale zero", () => {
  assert.deepEqual(ripartisci(0, [5, 1]), [0, 0]);
});

// ---------------------------------------------------------------------------
// quote: nascono dalla riga vera, al minuto
// ---------------------------------------------------------------------------

test("quote: chi segna di più al minuto pesa di più", () => {
  const q = quote([g("bomber", { pts: 28, min: 36 }), g("gregario", { pts: 6, min: 30 })], "pts");
  assert.ok(q[0] > q[1] * 3, `atteso rapporto >3, avuto ${q[0] / q[1]}`);
});

test("quote: i minuti veri non penalizzano chi giocava poco", () => {
  // Stessa produzione al minuto, minuti diversi: stessa quota.
  const q = quote([g("titolare", { pts: 20, min: 40 }), g("riserva", { pts: 10, min: 20 })], "pts");
  assert.ok(Math.abs(q[0] - q[1]) < 1e-9, `attese uguali, avute ${q}`);
});

test("quote sommano a 1", () => {
  for (const s of STAT_BOX) {
    const q = quote(cinque(), s);
    assert.ok(Math.abs(q.reduce((a, b) => a + b, 0) - 1) < 1e-9, s);
  }
});

test("quote: nessuno scende sotto il pavimento", () => {
  const q = quote([g("tutto", { blk: 4 }), g("niente", { blk: 0 })], "blk");
  assert.ok(q[1] >= 0.019, `atteso pavimento, avuto ${q[1]}`);
});

test("quote: se nessuno produce quella statistica, si divide in parti uguali", () => {
  const q = quote([g("a", { blk: 0 }), g("b", { blk: 0 })], "blk");
  assert.deepEqual(q, [0.5, 0.5]);
});

test("quote: a parità di resa, chi gioca il doppio dei minuti pesa il doppio", () => {
  const q = quote([
    { ...g("titolare"), minuti: 32 },
    { ...g("riserva"), minuti: 16 },
  ], "pts");
  assert.ok(Math.abs(q[0] / q[1] - 2) < 0.05, `atteso rapporto 2, avuto ${q[0] / q[1]}`);
});

test("quote senza minuti: tutti pesano uguale (top-5 senza rotazione)", () => {
  const q = quote([g("a"), g("b")], "pts");
  assert.deepEqual(q, [0.5, 0.5]);
});

test("box score: la riserva segna meno del titolare che rende uguale", () => {
  const box = boxScore(base({
    giocatori: [
      { ...g("titolare"), minuti: 36 },
      { ...g("riserva"), minuti: 12 },
      { ...g("C"), minuti: 32 },
      { ...g("D"), minuti: 32 },
      { ...g("E"), minuti: 32 },
    ],
  }));
  assert.equal(box.righe[0].minuti, 36);
  assert.ok(box.righe[0].tot.pts > box.righe[1].tot.pts,
    `titolare ${box.righe[0].tot.pts} vs riserva ${box.righe[1].tot.pts}`);
});

// ---------------------------------------------------------------------------
// totali di squadra
// ---------------------------------------------------------------------------

test("totali di squadra a ritmo neutro stanno sui valori NBA", () => {
  const t = totaliSquadra({ punti: 110, possessi: 99, reparti: REPARTI });
  assert.equal(t.reb, REB_SQUADRA);
  assert.ok(Math.abs(t.ast - 110 * AST_PER_PUNTO) < 1e-9);
  assert.ok(t.stl > 6 && t.stl < 9, `recuperi ${t.stl}`);
  assert.ok(t.tov > 11 && t.tov < 16, `palle perse ${t.tov}`);
});

test("più possessi, più rimbalzi", () => {
  const lento = totaliSquadra({ punti: 100, possessi: 89, reparti: REPARTI });
  const corsa = totaliSquadra({ punti: 100, possessi: 109, reparti: REPARTI });
  assert.ok(corsa.reb > lento.reb);
});

test("una difesa forte ruba e stoppa di più", () => {
  const scarsa = totaliSquadra({ punti: 100, possessi: 99, reparti: { ...REPARTI, dif: 20 } });
  const forte = totaliSquadra({ punti: 100, possessi: 99, reparti: { ...REPARTI, dif: 90 } });
  assert.ok(forte.stl > scarsa.stl && forte.blk > scarsa.blk);
});

test("una regia forte perde meno palloni", () => {
  const scarsa = totaliSquadra({ punti: 100, possessi: 99, reparti: { ...REPARTI, reg: 20 } });
  const forte = totaliSquadra({ punti: 100, possessi: 99, reparti: { ...REPARTI, reg: 90 } });
  assert.ok(forte.tov < scarsa.tov, `${forte.tov} vs ${scarsa.tov}`);
});

// ---------------------------------------------------------------------------
// boxScore: il vincolo che comanda tutto
// ---------------------------------------------------------------------------

test("i punti del box score sommano ESATTAMENTE al punteggio del motore", () => {
  for (let seme = 1; seme <= 50; seme++) {
    const puntiQuarto = [22 + (seme % 9), 30 - (seme % 7), 25, 27 + (seme % 5)];
    const { righe } = boxScore(base({ puntiQuarto, rng: rngSeed(seme) }));
    const tot = righe.reduce((a, r) => a + r.tot.pts, 0);
    assert.equal(tot, puntiQuarto.reduce((a, b) => a + b, 0), `seme ${seme}`);
  }
});

test("anche quarto per quarto la somma torna", () => {
  const puntiQuarto = [28, 24, 30, 26];
  const { righe } = boxScore(base({ puntiQuarto }));
  puntiQuarto.forEach((p, q) => {
    assert.equal(righe.reduce((a, r) => a + r.per[q].pts, 0), p, `quarto ${q + 1}`);
  });
});

test("il totale di riga è la somma dei suoi quarti", () => {
  const { righe } = boxScore(base());
  for (const r of righe) {
    for (const s of STAT_BOX) {
      assert.equal(r.tot[s], r.per.reduce((a, q) => a + q[s], 0), `${r.nome} ${s}`);
    }
  }
});

test("stesso seme, stesso box score", () => {
  const a = boxScore(base({ rng: rngSeed(7) }));
  const b = boxScore(base({ rng: rngSeed(7) }));
  assert.deepEqual(a, b);
});

test("semi diversi, box score diversi", () => {
  const a = boxScore(base({ rng: rngSeed(7) }));
  const b = boxScore(base({ rng: rngSeed(8) }));
  assert.notDeepEqual(a.righe.map((r) => r.tot.pts), b.righe.map((r) => r.tot.pts));
});

test("nessuna statistica negativa", () => {
  for (let seme = 1; seme <= 30; seme++) {
    const { righe } = boxScore(base({ rng: rngSeed(seme) }));
    for (const r of righe) for (const s of STAT_BOX) {
      assert.ok(r.tot[s] >= 0, `${r.nome} ${s} = ${r.tot[s]}`);
    }
  }
});

test("gestisce i supplementari: cinque periodi, cinque colonne", () => {
  const { righe } = boxScore(base({ puntiQuarto: [26, 24, 25, 27, 12] }));
  for (const r of righe) assert.equal(r.per.length, 5);
});

test("un quarto da zero punti non regala punti a nessuno", () => {
  const { righe } = boxScore(base({ puntiQuarto: [28, 0, 30, 26] }));
  for (const r of righe) assert.equal(r.per[1].pts, 0, r.nome);
});

test("la prima opzione segna più del quinto uomo, su tante partite", () => {
  const giocatori = [
    g("stella", { pts: 30, min: 36 }), g("seconda", { pts: 20, min: 34 }),
    g("terza", { pts: 12, min: 32 }), g("quarta", { pts: 8, min: 28 }),
    g("quinto", { pts: 5, min: 24 }),
  ];
  const somma = [0, 0, 0, 0, 0];
  for (let seme = 1; seme <= 200; seme++) {
    const { righe } = boxScore(base({ giocatori, rng: rngSeed(seme) }));
    righe.forEach((r, i) => { somma[i] += r.tot.pts; });
  }
  for (let i = 1; i < somma.length; i++) {
    assert.ok(somma[i - 1] > somma[i], `posizione ${i}: ${somma}`);
  }
});

test("su una singola partita la seconda opzione può superare la prima", () => {
  const giocatori = [g("prima", { pts: 26, min: 36 }), g("seconda", { pts: 22, min: 35 }),
    g("c"), g("d"), g("e")];
  let sorpassi = 0;
  for (let seme = 1; seme <= 200; seme++) {
    const { righe } = boxScore(base({ giocatori, rng: rngSeed(seme) }));
    if (righe[1].tot.pts > righe[0].tot.pts) sorpassi++;
  }
  assert.ok(sorpassi > 20 && sorpassi < 120, `sorpassi ${sorpassi}/200`);
});

// ---------------------------------------------------------------------------
// Validazione
// ---------------------------------------------------------------------------

test("errori leggibili, mai un box score inventato", () => {
  assert.throws(() => boxScore(base({ giocatori: [] })), /almeno un giocatore/);
  assert.throws(() => boxScore(base({ giocatori: [{ nome: "x" }] })), /stats_real/);
  assert.throws(() => boxScore(base({ puntiQuarto: [] })), /puntiQuarto/);
  assert.throws(() => boxScore(base({ puntiQuarto: [28, -1] })), /non validi/);
  assert.throws(() => boxScore(base({ possessi: 0 })), /possessi/);
  assert.throws(() => boxScore(base({ reparti: {} })), /reparti/);
  assert.throws(() => boxScore(base({ rng: null })), /rng/);
});

// ---------------------------------------------------------------------------
// Aggancio a partita.js
// ---------------------------------------------------------------------------

test("boxScorePartita segue il punteggio vero delle due squadre", () => {
  const rng = rngSeed(42);
  const casa = { nome: "Tu", reparti: { t3: 60, fin: 65, dif: 55, reb: 50, reg: 58 } };
  const ospite = { nome: "Loro", reparti: { t3: 45, fin: 50, dif: 60, reb: 62, reg: 48 } };
  const p = simulaPartita({ casa, ospite, rng });
  const box = boxScorePartita({
    partita: p,
    casa: { ...casa, giocatori: cinque() },
    ospite: { ...ospite, giocatori: cinque() },
    rng: rngSeed(42),
  });
  assert.equal(box.casa.totali.pts, p.punti.casa);
  assert.equal(box.ospite.totali.pts, p.punti.ospite);
});

// ---------------------------------------------------------------------------
// Medie di carriera: LeBron è LeBron
// ---------------------------------------------------------------------------

test("chiavePersona ignora annata, accenti e punteggiatura", () => {
  assert.equal(chiavePersona("LeBron James"), chiavePersona("lebron  james"));
  assert.equal(chiavePersona("Nikola Jokić"), "nikola jokic");
  assert.equal(chiavePersona("C.J. McCollum"), "c j mccollum");
});

test("medieCarriera aggrega la stessa persona di annate diverse", () => {
  const righe = [
    { nome: "LeBron James", tot: { pts: 30, reb: 8, ast: 9, stl: 2, tov: 3, blk: 1 } },
    { nome: "LeBron James", tot: { pts: 20, reb: 6, ast: 7, stl: 0, tov: 1, blk: 1 } },
    { nome: "Kevin Durant", tot: { pts: 40, reb: 7, ast: 4, stl: 1, tov: 2, blk: 2 } },
  ];
  const m = medieCarriera(righe);
  assert.equal(m.length, 2);
  const lebron = m.find((v) => v.chiave === "lebron james");
  assert.equal(lebron.gp, 2);
  assert.equal(lebron.medie.pts, 25);
  assert.equal(lebron.somma.pts, 50);
});

test("medieCarriera ordina per punti medi", () => {
  const riga = (nome, pts) => ({ nome, tot: { pts, reb: 0, ast: 0, stl: 0, tov: 0, blk: 0 } });
  const m = medieCarriera([riga("piccolo", 5), riga("grande", 30), riga("medio", 15)]);
  assert.deepEqual(m.map((v) => v.nome), ["grande", "medio", "piccolo"]);
});

test("medieCarriera tiene il massimo di una singola partita", () => {
  const riga = (nome, pts, reb) => ({ nome, tot: { pts, reb, ast: 0, stl: 0, tov: 0, blk: 0 } });
  const m = medieCarriera([riga("Tizio", 12, 4), riga("Tizio", 34, 2), riga("Tizio", 20, 9)]);
  assert.equal(m[0].max.pts, 34);
  assert.equal(m[0].max.reb, 9);
  assert.equal(m[0].medie.pts, 22);
});
