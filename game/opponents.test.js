import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildHistoricalRose, pickOpponent, chiaveAvversario, CANDIDATI, MIN_CARTE_ROSA,
} from "./opponents.js";
import { DIFFICULTIES } from "./difficulty.js";
import { cartaIn, TITOLARE, POSTI_PANCA, PANCA } from "./rosa.js";
import { votoDaReparti } from "./rating.js";
import { mediaReparti } from "./reparti.js";
import { card } from "./fixtures.js";
import { ROLES } from "./roster.js";

// Una squadra finta con carte distinte: id diverso (la rosa scarta i doppioni) e
// ruoli che girano su tutti e cinque, così i due posti per ruolo si coprono.
function team(over, n) {
  return Array.from({ length: n }, (_, i) => card({
    ...over,
    player_id: `${over.team ?? "TST"}-${i}`,
    name: `${over.team ?? "TST"} ${i}`,
    ovr: (over.ovr ?? 80) - i,
    pos: { primary: ROLES[i % 5], secondary: null },
    reparti: { t3: 60 - i, fin: 60 - i, dif: 60 - i, reb: 60 - i, reg: 60 - i },
  }));
}

test("costruisce una rosa da dieci per ogni squadra-stagione che ne ha almeno dieci", () => {
  const src = {
    "GSW|2015-16": team({ team: "GSW" }, 12),
    "LAL|2015-16": team({ team: "LAL", ovr: 70 }, 10),
  };
  const pool = buildHistoricalRose(src);
  assert.equal(pool.length, 2);
  const gsw = pool.find((o) => o.team === "GSW");
  assert.equal(gsw.lista.length, 10);
  assert.equal(gsw.quintet.length, 5);
  assert.ok(gsw.voto.ovr > 0);
});

test("salta le squadre con meno di dieci carte: niente panchina inventata", () => {
  const src = { "MIA|2015-16": team({ team: "MIA" }, MIN_CARTE_ROSA - 1) };
  assert.deepEqual(buildHistoricalRose(src), []);
});

test("quintetto: il migliore di ogni ruolo. Panchina: i cinque rimasti, dal più forte", () => {
  const src = { "GSW|2015-16": team({ team: "GSW", ovr: 90 }, 12) };
  const [gsw] = buildHistoricalRose(src);
  // i cinque titolari sono i cinque OVR più alti del gruppo, uno per ruolo
  assert.deepEqual(gsw.quintet.map((c) => c.ovr), [90, 89, 88, 87, 86]);
  // la panchina non ha ruoli: è una scala di forza, il 6° uomo è il più forte
  // dei rimasti (deciso al grill del 2026-08-18, come le rose del giocatore).
  const panca = POSTI_PANCA.map((posto) => cartaIn(gsw.rosa, { tipo: PANCA, posto }));
  assert.deepEqual(panca.map((c) => c.ovr), [85, 84, 83, 82, 81]);
  for (const ruolo of ROLES) {
    const titolare = cartaIn(gsw.rosa, { tipo: TITOLARE, ruolo });
    assert.ok(titolare.ovr > panca[0].ovr, `${ruolo}: il titolare vale più del 6° uomo`);
  }
});

test("il voto pesa i minuti: una panchina scarsa abbassa la rosa sotto la top-5", () => {
  const src = { "GSW|2015-16": team({ team: "GSW", ovr: 90 }, 12) };
  const [gsw] = buildHistoricalRose(src);
  const soloTitolari = votoDaReparti(mediaReparti(gsw.quintet));
  assert.ok(
    gsw.voto.ovr < soloTitolari,
    `la rosa (${gsw.voto.ovr}) deve valere meno dei soli titolari (${soloTitolari})`,
  );
});

test("pickOpponent sceglie il voto più vicino alla soglia crescente del round", () => {
  // I voti sono sulla scala nativa dei reparti (percentili): le rose storiche
  // stanno tra 38 e 67, non sulla scala 2K. Vedi difficulty.js.
  const d = DIFFICULTIES.incubo;
  const pool = [
    { team: "A", season: "x", lista: [], voto: { ovr: 20 } },
    { team: "B", season: "x", lista: [], voto: { ovr: d.oppMin } },
    { team: "C", season: "x", lista: [], voto: { ovr: d.oppMax } },
  ];
  // Senza rng l'urna resta ordinata per distanza e si prende la prima: il
  // comportamento di prima, che serve alle schermate di anteprima.
  assert.equal(pickOpponent(pool, 1, d).team, "B", "il primo round punta a oppMin");
  assert.equal(pickOpponent(pool, d.N, d).team, "C", "l'ultimo round punta a oppMax");
});

// Un pool largo: trenta squadre da 40 a 69, una per voto pari e dispari.
const poolLargo = () => Array.from({ length: 30 }, (_, i) => ({
  team: `T${i}`, season: "x", lista: [], voto: { ovr: 40 + i },
}));

test("pickOpponent pesca nell'urna: rng diversi, avversari diversi", () => {
  const d = DIFFICULTIES.normale;
  const pool = poolLargo();
  const scelti = new Set();
  for (let i = 0; i < CANDIDATI; i++) {
    scelti.add(pickOpponent(pool, 5, d, () => i / CANDIDATI).team);
  }
  assert.equal(scelti.size, CANDIDATI, `attese ${CANDIDATI} squadre diverse, avute ${scelti.size}`);
});

test("pickOpponent: l'urna resta attaccata alla soglia, non pesca a caso nel pool", () => {
  const d = { N: 16, oppMin: 50, oppMax: 60 };
  const pool = poolLargo();
  const voti = [];
  for (let i = 0; i < CANDIDATI; i++) voti.push(pickOpponent(pool, 1, d, () => i / CANDIDATI).voto.ovr);
  // Soglia del primo round = 50: le otto più vicine stanno tra 46 e 54.
  assert.ok(Math.min(...voti) >= 46 && Math.max(...voti) <= 54, `urna sbandata: ${voti}`);
});

test("pickOpponent non ripropone chi hai già affrontato", () => {
  const d = DIFFICULTIES.normale;
  const pool = poolLargo();
  const primo = pickOpponent(pool, 3, d, () => 0.4);
  const secondo = pickOpponent(pool, 3, d, () => 0.4, new Set([chiaveAvversario(primo)]));
  assert.notEqual(chiaveAvversario(secondo), chiaveAvversario(primo));
});

test("pickOpponent: se le esclusioni svuotano il pool, ripesca invece di piantarsi", () => {
  const d = DIFFICULTIES.normale;
  const pool = poolLargo();
  const tutti = new Set(pool.map(chiaveAvversario));
  const o = pickOpponent(pool, 1, d, () => 0.5, tutti);
  assert.ok(o && o.team, "deve tornare comunque un avversario");
});
