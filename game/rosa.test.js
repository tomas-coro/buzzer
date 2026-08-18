import test from "node:test";
import assert from "node:assert/strict";
import { card } from "./fixtures.js";
import { ROLES } from "./roster.js";
import {
  SLOTS, MINUTI, POSTI_PANCA, emptyRosa, assegnaRosa, cartaIn, titolareLibero,
  postiPancaLiberi, caselleLibere, caselleDove, etichettaSlot, ruoloDi, rosaCompleta,
  listaRosa, minutiRosa, repartiRosa, costruisciRosa, TITOLARE, PANCA,
} from "./rosa.js";

const tit = (ruolo) => ({ tipo: TITOLARE, ruolo });
const panca = (posto) => ({ tipo: PANCA, posto });
const cartaDi = (ruolo, nome = ruolo) => card({ name: nome, pos: { primary: ruolo, secondary: null } });

// Una rosa piena: i cinque titolari nel loro ruolo, cinque carte qualsiasi in panchina.
function rosaPiena(fabbrica = (slot, i) => cartaDi(ROLES[i % 5], `c${i}`)) {
  let r = emptyRosa();
  SLOTS.forEach((slot, i) => {
    const c = fabbrica(slot, i);
    r = assegnaRosa(r, slot, slot.tipo === TITOLARE ? { ...c, pos: { primary: slot.ruolo, secondary: null } } : c);
  });
  return r;
}

// --- forma della rosa -------------------------------------------------------

test("SLOTS sono dieci: cinque titolari con ruolo, cinque posti di panchina", () => {
  assert.equal(SLOTS.length, 10);
  assert.deepEqual(SLOTS.slice(0, 5).map((s) => s.ruolo), ROLES);
  assert.ok(SLOTS.slice(0, 5).every((s) => s.tipo === TITOLARE));
  assert.deepEqual(SLOTS.slice(5).map((s) => s.posto), POSTI_PANCA);
  assert.ok(SLOTS.slice(5).every((s) => s.tipo === PANCA));
  // Nessun posto di panchina porta un ruolo: è il punto della panchina libera.
  assert.ok(SLOTS.slice(5).every((s) => s.ruolo === undefined));
});

test("una rosa vuota ha dieci caselle nulle", () => {
  const r = emptyRosa();
  for (const slot of SLOTS) assert.equal(cartaIn(r, slot), null);
  assert.equal(rosaCompleta(r), false);
});

// --- piazzamento ------------------------------------------------------------

test("assegnaRosa piazza la carta nella casella chiesta", () => {
  const pg = cartaDi("PG", "Regista");
  const r = assegnaRosa(emptyRosa(), tit("PG"), pg);
  assert.equal(cartaIn(r, tit("PG")).name, "Regista");
  // immutabile: la rosa di partenza non si tocca
  assert.equal(cartaIn(emptyRosa(), tit("PG")), null);
});

test("il titolare rifiuta una carta che non può giocare quel ruolo", () => {
  const centro = cartaDi("C");
  assert.throws(() => assegnaRosa(emptyRosa(), tit("PG"), centro), /incompatibile/i);
});

// LA REGOLA NUOVA (grill 2026-08-18): in panchina non esiste il ruolo. Cinque
// playmaker in panchina sono una scelta strategica, non un errore.
test("la panchina accetta chiunque, anche cinque playmaker", () => {
  let r = emptyRosa();
  POSTI_PANCA.forEach((posto, i) => { r = assegnaRosa(r, panca(posto), cartaDi("PG", `pg${i}`)); });
  assert.equal(postiPancaLiberi(r).length, 0);
  assert.equal(cartaIn(r, panca(10)).pos.primary, "PG");
});

test("assegnaRosa rifiuta una casella già occupata", () => {
  const pg = cartaDi("PG");
  const r = assegnaRosa(emptyRosa(), tit("PG"), pg);
  assert.throws(() => assegnaRosa(r, tit("PG"), pg), /occupat/i);
  const b = assegnaRosa(emptyRosa(), panca(6), pg);
  assert.throws(() => assegnaRosa(b, panca(6), pg), /occupat/i);
});

test("assegnaRosa rifiuta caselle inesistenti", () => {
  const pg = cartaDi("PG");
  assert.throws(() => assegnaRosa(emptyRosa(), tit("XX"), pg), /ruolo/i);
  assert.throws(() => assegnaRosa(emptyRosa(), panca(11), pg), /posto/i);
  assert.throws(() => assegnaRosa(emptyRosa(), { tipo: "capitano" }, pg), /tipo/i);
});

test("titolareLibero e postiPancaLiberi dicono cosa resta", () => {
  const pg = cartaDi("PG");
  assert.equal(titolareLibero(emptyRosa(), "PG"), true);
  const uno = assegnaRosa(emptyRosa(), tit("PG"), pg);
  assert.equal(titolareLibero(uno, "PG"), false);
  assert.deepEqual(postiPancaLiberi(uno), POSTI_PANCA);
  const due = assegnaRosa(uno, panca(6), cartaDi("C"));
  assert.deepEqual(postiPancaLiberi(due), [7, 8, 9, 10]);
});

// Il draft mostra spenta la carta senza caselle: qui si decide quando succede.
test("caselleDove: i titolari solo dove sa giocare, la panchina sempre", () => {
  const centro = cartaDi("C");
  const dove = caselleDove(emptyRosa(), centro);
  assert.deepEqual(dove.filter((s) => s.tipo === TITOLARE).map((s) => s.ruolo), ["C"]);
  assert.equal(dove.filter((s) => s.tipo === PANCA).length, 5);
});

test("caselleDove è vuoto solo con panchina piena e ruolo coperto", () => {
  let r = emptyRosa();
  POSTI_PANCA.forEach((posto, i) => { r = assegnaRosa(r, panca(posto), cartaDi("SG", `sg${i}`)); });
  r = assegnaRosa(r, tit("C"), cartaDi("C"));
  assert.deepEqual(caselleDove(r, cartaDi("C", "altro centro")), []);
  // un playmaker invece entra ancora: il suo titolare è libero
  assert.equal(caselleDove(r, cartaDi("PG")).length, 1);
});

test("etichettaSlot scrive la casella come la legge chi gioca", () => {
  assert.equal(etichettaSlot(tit("PG")), "PG titolare");
  assert.equal(etichettaSlot(panca(6)), "6° uomo");
  assert.equal(etichettaSlot(panca(10)), "10° uomo");
});

// Il motore ha bisogno di un ruolo anche per i panchinari (rimbalzi dei lunghi,
// plus/malus del coach mirati): glielo dà la carta, non la casella.
test("ruoloDi: la casella per i titolari, la carta per i panchinari", () => {
  const centro = cartaDi("C");
  assert.equal(ruoloDi(centro, tit("PF")), "PF");
  assert.equal(ruoloDi(centro, panca(9)), "C");
});

test("rosaCompleta solo con tutte e dieci le caselle piene", () => {
  let r = emptyRosa();
  SLOTS.forEach((slot, i) => {
    assert.equal(rosaCompleta(r), false);
    assert.equal(caselleLibere(r).length, 10 - i);
    r = assegnaRosa(r, slot, slot.tipo === TITOLARE ? cartaDi(slot.ruolo) : cartaDi("SG"));
  });
  assert.equal(rosaCompleta(r), true);
  assert.deepEqual(caselleLibere(r), []);
});

test("listaRosa segue l'ordine degli slot: cinque titolari, poi la panchina 6→10", () => {
  const r = rosaPiena((slot, i) => cartaDi("SG", slot.tipo === TITOLARE ? slot.ruolo : `n${slot.posto}`));
  assert.deepEqual(listaRosa(r).map((c) => c.name), [...ROLES, "n6", "n7", "n8", "n9", "n10"]);
});

test("listaRosa su una rosa incompleta si ferma sulle caselle piene", () => {
  const r = assegnaRosa(emptyRosa(), tit("C"), cartaDi("C", "Solo"));
  assert.deepEqual(listaRosa(r).map((c) => c.name), ["Solo"]);
});

// --- minuti -----------------------------------------------------------------

test("ogni rotazione distribuisce esattamente 240 minuti", () => {
  for (const [nome, m] of Object.entries(MINUTI)) {
    const panchina = POSTI_PANCA.reduce((a, p) => a + m.panca[p], 0);
    assert.equal(m.titolare * 5 + panchina, 240, `rotazione ${nome}`);
  }
});

// La gerarchia è il senso della panchina numerata: il 6° gioca più del 7°-8°,
// che giocano più del 9°-10°.
test("i minuti della panchina calano dal 6° al 10° in ogni rotazione", () => {
  for (const [nome, m] of Object.entries(MINUTI)) {
    const scala = POSTI_PANCA.map((p) => m.panca[p]);
    for (let i = 1; i < scala.length; i++) {
      assert.ok(scala[i] <= scala[i - 1], `rotazione ${nome}: il posto ${POSTI_PANCA[i]} non può giocare di più`);
    }
    assert.ok(scala[0] > scala[4], `rotazione ${nome}: il 6° uomo deve giocare più del 10°`);
    assert.ok(m.titolare > scala[0], `rotazione ${nome}: un titolare gioca più del 6° uomo`);
  }
});

test("minutiRosa dà una riga per giocatore, coi minuti della sua casella", () => {
  const r = rosaPiena();
  const righe = minutiRosa(r);
  assert.equal(righe.length, 10);
  assert.equal(righe[0].minuti, MINUTI.normale.titolare);
  assert.equal(righe[5].minuti, MINUTI.normale.panca[6]);
  assert.equal(righe[9].minuti, MINUTI.normale.panca[10]);
  assert.equal(righe.reduce((a, x) => a + x.minuti, 0), 240);

  const corta = minutiRosa(r, "corta");
  assert.equal(corta[0].minuti, MINUTI.corta.titolare);
  assert.ok(corta[0].minuti > righe[0].minuti);
  assert.ok(corta[9].minuti < righe[9].minuti);
});

test("minutiRosa rifiuta una rotazione che non esiste", () => {
  assert.throws(() => minutiRosa(rosaPiena(), "fantasia"), /rotazione/i);
});

// --- reparti pesati ---------------------------------------------------------

const forte = () => card({ reparti: { t3: 90, fin: 90, dif: 90, reb: 90, reg: 90 } });
const scarso = () => card({ reparti: { t3: 30, fin: 30, dif: 30, reb: 30, reg: 30 } });

function rosaForteConPanchina(cartaPanca) {
  let r = emptyRosa();
  for (const ruolo of ROLES) r = assegnaRosa(r, tit(ruolo), { ...forte(), pos: { primary: ruolo, secondary: null } });
  for (const posto of POSTI_PANCA) r = assegnaRosa(r, panca(posto), cartaPanca());
  return r;
}

test("i reparti pesano ogni carta per i minuti della sua casella", () => {
  const r = rosaForteConPanchina(scarso);
  // 160 minuti a 90 e 80 a 30: (160·90 + 80·30) / 240 = 70
  const rep = repartiRosa(r);
  for (const k of ["t3", "fin", "dif", "reb", "reg"]) assert.equal(rep[k], 70);
});

test("una panchina scarsa costa reparti: la rosa vale meno dei soli titolari", () => {
  assert.ok(repartiRosa(rosaForteConPanchina(scarso)).dif < 90);
});

test("con la rotazione corta la panchina pesa meno", () => {
  const r = rosaForteConPanchina(scarso);
  assert.ok(repartiRosa(r, "corta").dif > repartiRosa(r, "larga").dif);
});

// Il 6° uomo vale più del 10°: mettere il migliore al posto giusto cambia il voto.
test("dove metti la carta forte in panchina cambia i reparti", () => {
  const base = () => {
    let r = emptyRosa();
    for (const ruolo of ROLES) r = assegnaRosa(r, tit(ruolo), { ...scarso(), pos: { primary: ruolo, secondary: null } });
    return r;
  };
  let sesto = base();
  let decimo = base();
  POSTI_PANCA.forEach((posto) => {
    sesto = assegnaRosa(sesto, panca(posto), posto === 6 ? forte() : scarso());
    decimo = assegnaRosa(decimo, panca(posto), posto === 10 ? forte() : scarso());
  });
  assert.ok(repartiRosa(sesto).dif > repartiRosa(decimo).dif,
    "il fenomeno da 6° uomo deve pesare più dello stesso fenomeno da 10°");
});

test("repartiRosa vuole la rosa piena: mezza rosa è un errore, non una media", () => {
  const r = assegnaRosa(emptyRosa(), tit("PG"), cartaDi("PG"));
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

test("costruisciRosa riempie dieci caselle senza doppioni", () => {
  const r = costruisciRosa(pool());
  assert.equal(rosaCompleta(r), true);
  const lista = listaRosa(r);
  assert.equal(lista.length, 10);
  assert.equal(new Set(lista.map((c) => c.player_id)).size, 10);
});

test("costruisciRosa mette il migliore di ogni ruolo nel quintetto", () => {
  const r = costruisciRosa(pool());
  assert.equal(cartaIn(r, tit("PG")).player_id, "pg1");
  assert.equal(cartaIn(r, tit("SF")).player_id, "sf1");
  assert.equal(cartaIn(r, tit("C")).player_id, "c1");
});

// La panchina non ha ruoli: conta solo la forza, e il più forte è il 6° uomo.
test("costruisciRosa ordina la panchina per forza, dal 6° al 10°", () => {
  const r = costruisciRosa(pool());
  const ovrPanca = POSTI_PANCA.map((p) => cartaIn(r, panca(p)).ovr);
  assert.deepEqual(ovrPanca, [...ovrPanca].sort((a, b) => b - a));
  assert.equal(cartaIn(r, panca(6)).player_id, "sf3", "il migliore rimasto è il sesto uomo");
});

// La regola dettata dal grill: se un ruolo non ha candidati, il titolare va al
// miglior OVR rimasto, qualunque sia il suo ruolo.
test("un ruolo senza candidati prende il miglior OVR rimasto", () => {
  const senzaCentri = [
    card({ player_id: "pg1", ovr: 80, pos: { primary: "PG", secondary: null } }),
    card({ player_id: "pg2", ovr: 70, pos: { primary: "PG", secondary: null } }),
    card({ player_id: "avanzo-forte", ovr: 75, pos: { primary: "PG", secondary: null } }),
    card({ player_id: "sg1", ovr: 79, pos: { primary: "SG", secondary: null } }),
    card({ player_id: "sg2", ovr: 69, pos: { primary: "SG", secondary: null } }),
    card({ player_id: "sf1", ovr: 78, pos: { primary: "SF", secondary: null } }),
    card({ player_id: "sf2", ovr: 68, pos: { primary: "SF", secondary: null } }),
    card({ player_id: "pf1", ovr: 77, pos: { primary: "PF", secondary: null } }),
    card({ player_id: "pf2", ovr: 67, pos: { primary: "PF", secondary: null } }),
    card({ player_id: "sg3", ovr: 60, pos: { primary: "SG", secondary: null } }),
  ];
  const r = costruisciRosa(senzaCentri);
  assert.equal(rosaCompleta(r), true);
  assert.equal(cartaIn(r, tit("C")).player_id, "avanzo-forte");
});

test("il ruolo secondario copre il titolare quando i primari non bastano", () => {
  const conSecondari = [
    card({ player_id: "pg1", ovr: 80, pos: { primary: "PG", secondary: null } }),
    card({ player_id: "sg1", ovr: 79, pos: { primary: "SG", secondary: null } }),
    card({ player_id: "sf1", ovr: 78, pos: { primary: "SF", secondary: null } }),
    card({ player_id: "pf1", ovr: 77, pos: { primary: "PF", secondary: null } }),
    // nessun centro primario: il PF con C secondario deve battere un avanzo più forte
    card({ player_id: "pf-c", ovr: 50, pos: { primary: "PF", secondary: "C" } }),
    card({ player_id: "avanzo", ovr: 65, pos: { primary: "SG", secondary: null } }),
    card({ player_id: "r1", ovr: 60, pos: { primary: "SG", secondary: null } }),
    card({ player_id: "r2", ovr: 59, pos: { primary: "SF", secondary: null } }),
    card({ player_id: "r3", ovr: 58, pos: { primary: "PG", secondary: null } }),
    card({ player_id: "r4", ovr: 57, pos: { primary: "PF", secondary: null } }),
  ];
  const r = costruisciRosa(conSecondari);
  assert.equal(cartaIn(r, tit("C")).player_id, "pf-c");
});

test("costruisciRosa rifiuta un pool troppo corto invece di inventare una rosa", () => {
  assert.throws(() => costruisciRosa(pool().slice(0, 7)), /almeno dieci/i);
});

test("costruisciRosa è deterministica: stesso pool, stessa rosa", () => {
  const a = listaRosa(costruisciRosa(pool())).map((c) => c.player_id);
  const b = listaRosa(costruisciRosa(pool())).map((c) => c.player_id);
  assert.deepEqual(a, b);
});
