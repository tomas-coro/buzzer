import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newRun, draftPick, useAid, chooseCoach, startRun, resolveRound,
  esitoRound, partitaRound,
} from "./run.js";
import { ROLES } from "./roster.js";
import { DIFFICULTIES } from "./difficulty.js";
import { card } from "./fixtures.js";
import { votoDaReparti } from "./rating.js";

// `liv` è il livello di tutti e cinque i reparti: 80 = squadra forte, 30 = scarsa.
function fullDraft(state, liv = 50) {
  const reparti = { t3: liv, fin: liv, dif: liv, reb: liv, reg: liv };
  for (const role of ROLES) {
    state = draftPick(state, role,
      card({ pos: { primary: role, secondary: null }, reparti }));
  }
  return state;
}
const COACH = { off_grade: "C", def_grade: "C" };

// Un avversario finto con tutti i reparti a `liv`. Il seme fissato tiene le
// partite riproducibili: senza, un test su una simulazione con varianza
// fallirebbe una volta ogni tanto, che è il peggior tipo di test.
function poolAt(liv) {
  const reparti = { t3: liv, fin: liv, dif: liv, reb: liv, reg: liv };
  return [{ team: "OPP", season: "x", quintet: [], voto: { ovr: votoDaReparti(reparti), reparti } }];
}

const SEME = 12345;
const nuovaRun = (difficolta = "normale") => newRun({ formato: "playoff", difficolta, seme: SEME });

test("newRun parte in fase draft con aiuti della difficoltà", () => {
  const s = newRun({ formato: "playoff", difficolta: "normale" });
  assert.equal(s.stato, "draft");
  assert.equal(s.vittorie, 0);
  assert.equal(s.aids.respin, 1);
});

test("draftPick riempie gli slot; a 5 passa in fase coach", () => {
  let s = newRun({ formato: "playoff", difficolta: "normale" });
  s = fullDraft(s);
  assert.equal(s.stato, "coach");
});

test("useAid consuma un aiuto; se esaurito e non freeSwitch lancia", () => {
  let s = newRun({ formato: "playoff", difficolta: "difficile" }); // respin 0, squadra 1
  s = useAid(s, "squadra");
  assert.equal(s.aids.squadra, 0);
  assert.throws(() => useAid(s, "squadra"), /esaurit/);
});

test("useAid con tipo inesistente lancia (niente aiuto fantasma)", () => {
  const s = newRun({ formato: "playoff", difficolta: "normale" });
  assert.throws(() => useAid(s, "bogus"), /inesistente/);
});

test("chooseCoach/startRun fuori dalla fase coach lanciano", () => {
  let s = fullDraft(nuovaRun(), 95);
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(10));
  s = resolveRound(s); // 1 vittoria, run ancora attivo (N=16)
  assert.equal(s.stato, "run");
  assert.throws(() => chooseCoach(s, COACH), /non in fase coach/);
  assert.throws(() => startRun(s, poolAt(10)), /non in fase coach/);
});

test("Facile: switch liberi non si esauriscono", () => {
  let s = newRun({ formato: "playoff", difficolta: "facile" });
  for (let i = 0; i < 9; i++) s = useAid(s, "squadra");
  assert.ok(s.aids.squadra >= 0);
});

test("chooseCoach prima del quintetto completo lancia", () => {
  const s = newRun({ formato: "playoff", difficolta: "normale" });
  assert.throws(() => chooseCoach(s, COACH), /incompleto/);
});

test("startRun calcola il voto squadra, i reparti e il primo avversario", () => {
  let s = fullDraft(nuovaRun(), 70);
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(70));
  assert.equal(s.stato, "run");
  assert.equal(s.round, 1);
  assert.equal(s.voto.ovr, 70);
  assert.equal(s.voto.reparti.dif, 70, "i reparti devono arrivare fino alla partita");
  assert.equal(s.avversario.team, "OPP");
});

test("resolveRound: vinco contro una squadra molto più debole, la streak sale", () => {
  let s = fullDraft(nuovaRun(), 95);
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(10));
  s = resolveRound(s);
  assert.equal(s.vittorie, 1);
  assert.equal(s.stato, "run");
});

test("resolveRound: perdo contro una squadra molto più forte → sconfitta", () => {
  let s = fullDraft(nuovaRun(), 10);
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(95));
  s = resolveRound(s);
  assert.equal(s.stato, "finito");
  assert.equal(s.esito, "sconfitta");
});

test("la storia salva il punteggio vero e la cronaca, non due voti", () => {
  let s = fullDraft(nuovaRun(), 95);
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(10));
  s = resolveRound(s);
  const r = s.storia[0];
  assert.ok(r.punti.casa > r.punti.ospite, "il punteggio deve seguire l'esito");
  assert.ok(r.punti.casa > 60 && r.punti.casa < 170, `punteggio irreale: ${r.punti.casa}`);
  assert.equal(r.quarti.length >= 4, true);
  assert.equal(r.cronaca.length, r.quarti.length);
});

test("partitaRound è pura e ripetibile: la UI può animarla prima di applicarla", () => {
  let s = fullDraft(nuovaRun(), 70);
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(65));
  const a = partitaRound(s);
  const b = partitaRound(s);
  assert.deepEqual(a, b, "due chiamate devono dare la stessa partita");
  assert.equal(esitoRound(s), a.vincitore === "casa");
  // e il risultato applicato deve essere quello mostrato durante l'animazione
  const dopo = resolveRound(s);
  assert.deepEqual(dopo.storia[0].punti, a.punti);
});

test("round diversi giocano partite diverse", () => {
  let s = fullDraft(nuovaRun(), 95);
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(10));
  const primo = partitaRound(s);
  s = resolveRound(s);
  assert.notDeepEqual(partitaRound(s).punti, primo.punti);
});

test("stesso seme, stessa corsa: due partite identiche dall'inizio", () => {
  const gioca = () => {
    let s = fullDraft(nuovaRun(), 80);
    s = chooseCoach(s, COACH);
    s = startRun(s, poolAt(60));
    return resolveRound(s).storia[0];
  };
  assert.deepEqual(gioca(), gioca());
});

test("semi diversi danno corse diverse", () => {
  const gioca = (seme) => {
    let s = fullDraft(newRun({ formato: "playoff", difficolta: "normale", seme }), 60);
    s = chooseCoach(s, COACH);
    s = startRun(s, poolAt(58));
    return resolveRound(s).storia[0].punti;
  };
  assert.notDeepEqual(gioca(1), gioca(2));
});

test("newRun rifiuta un seme che non è un intero", () => {
  assert.throws(() => newRun({ formato: "playoff", difficolta: "normale", seme: "x" }), /seme/);
});

test("raggiungere N vittorie chiude come imbattuto", () => {
  const N = DIFFICULTIES.normale.N; // 16 (target playoff, uguale in ogni difficoltà)
  let s = fullDraft(nuovaRun(), 99);
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(1)); // divario massimo: 16 vittorie di fila devono uscire
  for (let i = 0; i < N; i++) s = resolveRound(s);
  assert.equal(s.stato, "finito");
  assert.equal(s.esito, "imbattuto");
  assert.equal(s.vittorie, N);
});
