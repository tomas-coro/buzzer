import test from "node:test";
import assert from "node:assert/strict";
import { card } from "./fixtures.js";
import { ROLES } from "./roster.js";
import {
  SLOTS, MINUTI, emptyRosa, assegnaRosa, slotLibero, rosaCompleta,
  listaRosa, minutiRosa, repartiRosa, costruisciRosa, TITOLARE, RISERVA,
} from "./rosa.js";

// --- forma della rosa -------------------------------------------------------

test("SLOTS sono dieci: due per ruolo, i titolari prima", () => {
  assert.equal(SLOTS.length, 10);
  assert.deepEqual(SLOTS.slice(0, 5).map((s) => s.ruolo), ROLES);
  assert.deepEqual(SLOTS.slice(5).map((s) => s.ruolo), ROLES);
  assert.ok(SLOTS.slice(0, 5).every((s) => s.tipo === TITOLARE));
  assert.ok(SLOTS.slice(5).every((s) => s.tipo === RISERVA));
});

test("una rosa vuota ha dieci caselle nulle", () => {
  const r = emptyRosa();
  for (const { ruolo, tipo } of SLOTS) assert.equal(r[ruolo][tipo], null);
  assert.equal(rosaCompleta(r), false);
});

// --- piazzamento ------------------------------------------------------------

test("assegnaRosa piazza la carta nello slot chiesto", () => {
  const pg = card({ name: "Regista", pos: { primary: "PG", secondary: null } });
  const r = assegnaRosa(emptyRosa(), "PG", TITOLARE, pg);
  assert.equal(r.PG[TITOLARE].name, "Regista");
  // immutabile: la rosa di partenza non si tocca
  assert.equal(emptyRosa().PG[TITOLARE], null);
});

test("assegnaRosa rifiuta una carta che non può giocare quel ruolo", () => {
  const centro = card({ pos: { primary: "C", secondary: null } });
  assert.throws(() => assegnaRosa(emptyRosa(), "PG", TITOLARE, centro), /incompatibile/i);
});

test("assegnaRosa rifiuta uno slot già occupato", () => {
  const pg = card({ pos: { primary: "PG", secondary: null } });
  const r = assegnaRosa(emptyRosa(), "PG", TITOLARE, pg);
  assert.throws(() => assegnaRosa(r, "PG", TITOLARE, pg), /occupat/i);
});

test("assegnaRosa rifiuta ruolo e tipo inesistenti", () => {
  const pg = card({ pos: { primary: "PG", secondary: null } });
  assert.throws(() => assegnaRosa(emptyRosa(), "XX", TITOLARE, pg), /ruolo/i);
  assert.throws(() => assegnaRosa(emptyRosa(), "PG", "capitano", pg), /tipo/i);
});

// Il piazzamento a un tocco del draft: miri il ruolo, non lo slot. Prima il
// titolare, poi la riserva.
test("slotLibero dà titolare, poi riserva, poi niente", () => {
  const pg = card({ pos: { primary: "PG", secondary: null } });
  const vuota = emptyRosa();
  assert.equal(slotLibero(vuota, "PG"), TITOLARE);
  const uno = assegnaRosa(vuota, "PG", TITOLARE, pg);
  assert.equal(slotLibero(uno, "PG"), RISERVA);
  const due = assegnaRosa(uno, "PG", RISERVA, pg);
  assert.equal(slotLibero(due, "PG"), null);
});

test("rosaCompleta solo con tutte e dieci le caselle piene", () => {
  let r = emptyRosa();
  for (const { ruolo, tipo } of SLOTS) {
    assert.equal(rosaCompleta(r), false);
    r = assegnaRosa(r, ruolo, tipo, card({ pos: { primary: ruolo, secondary: null } }));
  }
  assert.equal(rosaCompleta(r), true);
});

test("listaRosa segue l'ordine degli slot: cinque titolari, poi cinque riserve", () => {
  let r = emptyRosa();
  for (const { ruolo, tipo } of SLOTS) {
    r = assegnaRosa(r, ruolo, tipo, card({ name: `${ruolo}-${tipo}`, pos: { primary: ruolo, secondary: null } }));
  }
  assert.deepEqual(listaRosa(r).map((c) => c.name), SLOTS.map((s) => `${s.ruolo}-${s.tipo}`));
});

test("listaRosa su una rosa incompleta si ferma sulle caselle piene", () => {
  const r = assegnaRosa(emptyRosa(), "C", TITOLARE, card({ name: "Solo", pos: { primary: "C", secondary: null } }));
  assert.deepEqual(listaRosa(r).map((c) => c.name), ["Solo"]);
});

// --- minuti -----------------------------------------------------------------

test("i minuti di una rotazione normale fanno i 240 di una partita", () => {
  const somma = MINUTI.normale.titolare * 5 + MINUTI.normale.riserva * 5;
  assert.equal(somma, 240);
});

test("ogni rotazione distribuisce esattamente 240 minuti", () => {
  for (const [nome, m] of Object.entries(MINUTI)) {
    assert.equal(m.titolare * 5 + m.riserva * 5, 240, `rotazione ${nome}`);
  }
});

test("minutiRosa dà una riga per giocatore, coi minuti della rotazione", () => {
  let r = emptyRosa();
  for (const { ruolo, tipo } of SLOTS) {
    r = assegnaRosa(r, ruolo, tipo, card({ name: `${ruolo}-${tipo}`, pos: { primary: ruolo, secondary: null } }));
  }
  const righe = minutiRosa(r);
  assert.equal(righe.length, 10);
  assert.equal(righe[0].minuti, MINUTI.normale.titolare);
  assert.equal(righe[9].minuti, MINUTI.normale.riserva);
  assert.equal(righe.reduce((a, x) => a + x.minuti, 0), 240);

  const corta = minutiRosa(r, "corta");
  assert.equal(corta[0].minuti, MINUTI.corta.titolare);
  assert.ok(corta[0].minuti > righe[0].minuti);
});

test("minutiRosa rifiuta una rotazione che non esiste", () => {
  let r = emptyRosa();
  for (const { ruolo, tipo } of SLOTS) {
    r = assegnaRosa(r, ruolo, tipo, card({ pos: { primary: ruolo, secondary: null } }));
  }
  assert.throws(() => minutiRosa(r, "fantasia"), /rotazione/i);
});

// --- reparti pesati ---------------------------------------------------------

test("i reparti della rosa pesano il titolare il doppio della riserva", () => {
  const forte = card({ reparti: { t3: 90, fin: 90, dif: 90, reb: 90, reg: 90 } });
  const scarso = card({ reparti: { t3: 30, fin: 30, dif: 30, reb: 30, reg: 30 } });
  let r = emptyRosa();
  for (const ruolo of ROLES) {
    r = assegnaRosa(r, ruolo, TITOLARE, { ...forte, pos: { primary: ruolo, secondary: null } });
    r = assegnaRosa(r, ruolo, RISERVA, { ...scarso, pos: { primary: ruolo, secondary: null } });
  }
  // 32 minuti a 90 e 16 minuti a 30: (2·90 + 1·30) / 3 = 70
  const rep = repartiRosa(r);
  for (const k of ["t3", "fin", "dif", "reb", "reg"]) assert.equal(rep[k], 70);
});

test("una panchina scarsa costa reparti: la rosa vale meno dei soli titolari", () => {
  const forte = card({ reparti: { t3: 80, fin: 80, dif: 80, reb: 80, reg: 80 } });
  const scarso = card({ reparti: { t3: 40, fin: 40, dif: 40, reb: 40, reg: 40 } });
  let r = emptyRosa();
  for (const ruolo of ROLES) {
    r = assegnaRosa(r, ruolo, TITOLARE, { ...forte, pos: { primary: ruolo, secondary: null } });
    r = assegnaRosa(r, ruolo, RISERVA, { ...scarso, pos: { primary: ruolo, secondary: null } });
  }
  assert.ok(repartiRosa(r).dif < 80);
});

test("con la rotazione corta la panchina pesa meno", () => {
  const forte = card({ reparti: { t3: 90, fin: 90, dif: 90, reb: 90, reg: 90 } });
  const scarso = card({ reparti: { t3: 30, fin: 30, dif: 30, reb: 30, reg: 30 } });
  let r = emptyRosa();
  for (const ruolo of ROLES) {
    r = assegnaRosa(r, ruolo, TITOLARE, { ...forte, pos: { primary: ruolo, secondary: null } });
    r = assegnaRosa(r, ruolo, RISERVA, { ...scarso, pos: { primary: ruolo, secondary: null } });
  }
  assert.ok(repartiRosa(r, "corta").dif > repartiRosa(r, "larga").dif);
});

test("repartiRosa vuole la rosa piena: mezza rosa è un errore, non una media", () => {
  const r = assegnaRosa(emptyRosa(), "PG", TITOLARE, card({ pos: { primary: "PG", secondary: null } }));
  assert.throws(() => repartiRosa(r), /rosa incompleta/i);
});

// --- rosa costruita da un pool (avversari) ----------------------------------

const pool = () => [
  card({ player_id: "pg1", name: "PG Uno", ovr: 88, pos: { primary: "PG", secondary: null } }),
  card({ player_id: "pg2", name: "PG Due", ovr: 74, pos: { primary: "PG", secondary: null } }),
  card({ player_id: "pg3", name: "PG Tre", ovr: 70, pos: { primary: "PG", secondary: null } }),
  card({ player_id: "sg1", name: "SG Uno", ovr: 85, pos: { primary: "SG", secondary: "PG" } }),
  card({ player_id: "sg2", name: "SG Due", ovr: 72, pos: { primary: "SG", secondary: null } }),
  card({ player_id: "sf1", name: "SF Uno", ovr: 90, pos: { primary: "SF", secondary: "PF" } }),
  card({ player_id: "sf2", name: "SF Due", ovr: 76, pos: { primary: "SF", secondary: null } }),
  card({ player_id: "pf1", name: "PF Uno", ovr: 84, pos: { primary: "PF", secondary: "C" } }),
  card({ player_id: "pf2", name: "PF Due", ovr: 68, pos: { primary: "PF", secondary: null } }),
  card({ player_id: "c1", name: "C Uno", ovr: 82, pos: { primary: "C", secondary: null } }),
  card({ player_id: "c2", name: "C Due", ovr: 66, pos: { primary: "C", secondary: null } }),
  card({ player_id: "sf3", name: "SF Tre", ovr: 79, pos: { primary: "SF", secondary: null } }),
];

test("costruisciRosa mette due giocatori per ruolo, dieci in tutto e senza doppioni", () => {
  const r = costruisciRosa(pool());
  assert.equal(rosaCompleta(r), true);
  const lista = listaRosa(r);
  assert.equal(lista.length, 10);
  assert.equal(new Set(lista.map((c) => c.player_id)).size, 10);
});

test("costruisciRosa mette il migliore del ruolo tra i titolari", () => {
  const r = costruisciRosa(pool());
  assert.equal(r.PG[TITOLARE].player_id, "pg1");
  assert.equal(r.PG[RISERVA].player_id, "pg2");
  assert.equal(r.C[TITOLARE].player_id, "c1");
});

// La regola dettata dal grill: se un ruolo non ha due candidati, il posto va al
// miglior OVR rimasto, qualunque sia il suo ruolo.
test("un ruolo con un solo candidato prende il miglior OVR rimasto", () => {
  const scarno = [
    // quattro playmaker: i due migliori prendono le caselle PG, gli altri due
    // restano fuori ruolo e si giocano il posto scoperto
    card({ player_id: "pg1", ovr: 80, pos: { primary: "PG", secondary: null } }),
    card({ player_id: "pg2", ovr: 70, pos: { primary: "PG", secondary: null } }),
    card({ player_id: "avanzo-forte", ovr: 65, pos: { primary: "PG", secondary: null } }),
    card({ player_id: "avanzo-debole", ovr: 40, pos: { primary: "PG", secondary: null } }),
    card({ player_id: "sg1", ovr: 79, pos: { primary: "SG", secondary: null } }),
    card({ player_id: "sg2", ovr: 69, pos: { primary: "SG", secondary: null } }),
    card({ player_id: "sf1", ovr: 78, pos: { primary: "SF", secondary: null } }),
    card({ player_id: "sf2", ovr: 68, pos: { primary: "SF", secondary: null } }),
    card({ player_id: "pf1", ovr: 77, pos: { primary: "PF", secondary: null } }),
    card({ player_id: "pf2", ovr: 67, pos: { primary: "PF", secondary: null } }),
    // un solo centro: la casella di riserva C resta scoperta
    card({ player_id: "c1", ovr: 76, pos: { primary: "C", secondary: null } }),
  ];
  const r = costruisciRosa(scarno);
  assert.equal(rosaCompleta(r), true);
  assert.equal(r.C[RISERVA].player_id, "avanzo-forte");
});

test("il ruolo secondario copre uno slot quando i primari non bastano", () => {
  const conSecondari = [
    card({ player_id: "pg1", ovr: 80, pos: { primary: "PG", secondary: null } }),
    card({ player_id: "pg2", ovr: 70, pos: { primary: "PG", secondary: null } }),
    card({ player_id: "sg1", ovr: 79, pos: { primary: "SG", secondary: null } }),
    card({ player_id: "sg2", ovr: 69, pos: { primary: "SG", secondary: null } }),
    card({ player_id: "sf1", ovr: 78, pos: { primary: "SF", secondary: null } }),
    card({ player_id: "sf2", ovr: 68, pos: { primary: "SF", secondary: null } }),
    card({ player_id: "pf1", ovr: 77, pos: { primary: "PF", secondary: null } }),
    card({ player_id: "pf2", ovr: 67, pos: { primary: "PF", secondary: null } }),
    card({ player_id: "c1", ovr: 76, pos: { primary: "C", secondary: null } }),
    // secondo centro solo di ruolo secondario: deve essere preferito a un avanzo
    // che il ruolo non lo copre affatto
    card({ player_id: "pf-c", ovr: 50, pos: { primary: "PF", secondary: "C" } }),
    card({ player_id: "avanzo", ovr: 65, pos: { primary: "SG", secondary: null } }),
  ];
  const r = costruisciRosa(conSecondari);
  assert.equal(r.C[RISERVA].player_id, "pf-c");
});

test("costruisciRosa rifiuta un pool troppo corto invece di inventare una rosa", () => {
  assert.throws(() => costruisciRosa(pool().slice(0, 7)), /almeno dieci/i);
});

test("costruisciRosa è deterministica: stesso pool, stessa rosa", () => {
  const a = listaRosa(costruisciRosa(pool())).map((c) => c.player_id);
  const b = listaRosa(costruisciRosa(pool())).map((c) => c.player_id);
  assert.deepEqual(a, b);
});
