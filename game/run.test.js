import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newRun, draftPick, useAid, chooseCoach, startRun, resolveRound,
  esitoRound, partitaRound, boxScoreRound, playByPlayRound, titolari,
} from "./run.js";
import { ROLES } from "./roster.js";
import { SLOTS, costruisciRosa } from "./rosa.js";
import { DIFFICULTIES } from "./difficulty.js";
import { card } from "./fixtures.js";
import { votoRosa } from "./rating.js";

// `liv` è il livello di tutti e cinque i reparti: 80 = squadra forte, 30 = scarsa.
const repartiA = (liv) => ({ t3: liv, fin: liv, dif: liv, reb: liv, reg: liv });

// Dieci carte, due per ruolo: è la rosa che il draft deve riempire adesso.
// Gli id sono distinti perché `costruisciRosa` non riassegna la stessa carta
// due volte, e perché il box score aggrega per persona.
function dieciCarte(liv, prefisso) {
  return SLOTS.map(({ ruolo, tipo }) => card({
    player_id: `${prefisso}-${ruolo}-${tipo}`,
    name: `${prefisso} ${ruolo} ${tipo}`,
    pos: { primary: ruolo, secondary: null },
    reparti: repartiA(liv),
  }));
}

// Draft completo: dieci tocchi, due per ruolo (il primo va titolare, il secondo
// riserva - lo decide `slotLibero`, non chi chiama).
function fullDraft(state, liv = 50) {
  for (const carta of dieciCarte(liv, "MIO")) {
    state = draftPick(state, carta.pos.primary, carta);
  }
  return state;
}

// Un coach che non sposta niente: serve ai test che misurano il motore e non
// l'allenatore. Zero plus, zero malus, ritmo neutro, rotazione normale.
const COACH = { plus: [], malus: null, ritmo: 0, rotazione: "normale" };

// Un avversario finto con tutti i reparti a `liv`. Il seme fissato tiene le
// partite riproducibili: senza, un test su una simulazione con varianza
// fallirebbe una volta ogni tanto, che è il peggior tipo di test.
function poolAt(liv) {
  const rosa = costruisciRosa(dieciCarte(liv, "OPP"));
  return [{ team: "OPP", season: "x", rosa, voto: votoRosa(rosa) }];
}

// Venti avversari attorno a `liv`: serve ai test sul tabellone, dove un pool di
// una squadra sola non può mostrare se gli avversari si ripetono.
function poolLargo(liv) {
  return Array.from({ length: 20 }, (_, i) => {
    const rosa = costruisciRosa(dieciCarte(liv - 5 + i, `OPP${i}`));
    return { team: `OPP${i}`, season: "x", rosa, voto: votoRosa(rosa) };
  });
}

const SEME = 12345;
const nuovaRun = (difficolta = "normale") => newRun({ formato: "playoff", difficolta, seme: SEME });

// Una corsa pronta a giocare: draft, coach, primo avversario.
function pronta(mio, loro, coach = COACH) {
  let s = fullDraft(nuovaRun(), mio);
  s = chooseCoach(s, coach);
  return startRun(s, poolAt(loro));
}

test("newRun parte in fase draft con aiuti della difficoltà", () => {
  const s = newRun({ formato: "playoff", difficolta: "normale" });
  assert.equal(s.stato, "draft");
  assert.equal(s.vittorie, 0);
  assert.equal(s.aids.respin, 1);
});

test("draftPick riempie le dieci caselle; prima i titolari, poi le riserve", () => {
  let s = newRun({ formato: "playoff", difficolta: "normale" });
  const carte = dieciCarte(60, "MIO");
  s = draftPick(s, "PG", carte[0]);
  assert.equal(s.rosa.PG.titolare, carte[0], "la prima carta di un ruolo parte in quintetto");
  s = draftPick(s, "PG", carte[5]);
  assert.equal(s.rosa.PG.riserva, carte[5], "la seconda va in panchina");
  assert.equal(s.stato, "draft", "con due su dieci il draft non è finito");
});

test("draftPick: a dieci carte si passa in fase coach", () => {
  let s = fullDraft(newRun({ formato: "playoff", difficolta: "normale" }));
  assert.equal(s.stato, "coach");
});

test("draftPick su un ruolo già pieno lancia (niente terza carta per ruolo)", () => {
  let s = fullDraft(nuovaRun());
  // La fase è cambiata, ma l'errore sul ruolo pieno deve restare leggibile
  // anche su una rosa a metà: lo provo su una rosa fresca.
  let t = newRun({ formato: "playoff", difficolta: "normale" });
  const carte = dieciCarte(60, "MIO");
  t = draftPick(t, "PG", carte[0]);
  t = draftPick(t, "PG", carte[5]);
  assert.throws(() => draftPick(t, "PG", card({ player_id: "terzo" })), /già titolare e riserva/);
  assert.equal(s.stato, "coach");
});

test("useAid consuma un aiuto; se esaurito lancia", () => {
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
  let s = resolveRound(pronta(95, 10)); // 1 vittoria, run ancora attivo (N=16)
  assert.equal(s.stato, "run");
  assert.throws(() => chooseCoach(s, COACH), /non in fase coach/);
  assert.throws(() => startRun(s, poolAt(10)), /non in fase coach/);
});

// Da G6 nemmeno Facile ha aiuti infiniti: il quarto "↺ squadra" deve fallire.
test("Facile: anche gli switch si esauriscono", () => {
  let s = newRun({ formato: "playoff", difficolta: "facile" }); // squadra 2
  for (let i = 0; i < 2; i++) s = useAid(s, "squadra");
  assert.equal(s.aids.squadra, 0);
  assert.throws(() => useAid(s, "squadra"), /esaurit/);
});

test("chooseCoach prima della rosa completa lancia", () => {
  const s = newRun({ formato: "playoff", difficolta: "normale" });
  assert.throws(() => chooseCoach(s, COACH), /rosa incompleta/);
});

test("startRun calcola il voto squadra, i reparti e il primo avversario", () => {
  const s = pronta(70, 70);
  assert.equal(s.stato, "run");
  assert.equal(s.round, 1);
  assert.equal(s.voto.ovr, 70);
  assert.equal(s.voto.reparti.dif, 70, "i reparti devono arrivare fino alla partita");
  assert.equal(s.avversario.team, "OPP");
});

test("startRun allena la rosa: la rosa draftata resta intatta accanto a quella allenata", () => {
  const coach = {
    plus: [{ reparto: "dif", ruoli: ["PF", "C"] }, { reparto: "reb" }],
    malus: { reparto: "t3" },
    ritmo: 0.5, rotazione: "corta",
  };
  const s = pronta(60, 60, coach);
  assert.equal(s.rosa.C.titolare.reparti.dif, 60, "la rosa draftata non si tocca");
  assert.equal(s.rosaAllenata.C.titolare.reparti.dif, 68, "il centro prende il plus mirato");
  assert.equal(s.rosaAllenata.PG.titolare.reparti.dif, 60, "il playmaker no: il plus è mirato");
  assert.equal(s.rosaAllenata.PG.titolare.reparti.t3, 55, "il malus lo paga tutta la squadra");
  assert.equal(s.ritmo, 0.5);
  assert.equal(s.rotazione, "corta");
  assert.ok(s.effetti.length > 0, "gli effetti servono alla schermata di scelta coach");
});

test("titolari: cinque carte in ordine PG→C, quelle allenate", () => {
  const s = pronta(60, 60, { plus: [{ reparto: "dif" }], malus: null });
  const q = titolari(s);
  assert.equal(q.length, 5);
  assert.deepEqual(q.map((c) => c.pos.primary), ROLES);
  assert.equal(q[0].reparti.dif, 64, "sono le carte dopo il coach, non quelle draftate");
});

test("resolveRound: vinco contro una squadra molto più debole, la streak sale", () => {
  const s = resolveRound(pronta(95, 10));
  assert.equal(s.vittorie, 1);
  assert.equal(s.stato, "run");
});

test("resolveRound: perdo contro una squadra molto più forte → sconfitta", () => {
  const s = resolveRound(pronta(10, 95));
  assert.equal(s.stato, "finito");
  assert.equal(s.esito, "sconfitta");
});

test("la storia salva il punteggio vero e la cronaca, non due voti", () => {
  const s = resolveRound(pronta(95, 10));
  const r = s.storia[0];
  assert.ok(r.punti.casa > r.punti.ospite, "il punteggio deve seguire l'esito");
  assert.ok(r.punti.casa > 60 && r.punti.casa < 170, `punteggio irreale: ${r.punti.casa}`);
  assert.equal(r.quarti.length >= 4, true);
  assert.equal(r.cronaca.length, r.quarti.length);
});

test("partitaRound è pura e ripetibile: la UI può animarla prima di applicarla", () => {
  const s = pronta(70, 65);
  const a = partitaRound(s);
  const b = partitaRound(s);
  assert.deepEqual(a, b, "due chiamate devono dare la stessa partita");
  assert.equal(esitoRound(s), a.vincitore === "casa");
  // e il risultato applicato deve essere quello mostrato durante l'animazione
  const dopo = resolveRound(s);
  assert.deepEqual(dopo.storia[0].punti, a.punti);
});

test("round diversi giocano partite diverse", () => {
  let s = pronta(95, 10);
  const primo = partitaRound(s);
  s = resolveRound(s);
  assert.notDeepEqual(partitaRound(s).punti, primo.punti);
});

test("stesso seme, stessa corsa: due partite identiche dall'inizio", () => {
  const gioca = () => resolveRound(pronta(80, 60)).storia[0];
  assert.deepEqual(gioca(), gioca());
});

test("semi diversi danno corse diverse", () => {
  const gioca = (seme) => {
    let s = fullDraft(newRun({ formato: "playoff", difficolta: "normale", seme }), 60);
    s = chooseCoach(s, COACH);
    return resolveRound(startRun(s, poolAt(58))).storia[0].punti;
  };
  assert.notDeepEqual(gioca(1), gioca(2));
});

test("newRun rifiuta un seme che non è un intero", () => {
  assert.throws(() => newRun({ formato: "playoff", difficolta: "normale", seme: "x" }), /seme/);
});

test("raggiungere N vittorie chiude come imbattuto", () => {
  const N = DIFFICULTIES.normale.N; // 16 (target playoff, uguale in ogni difficoltà)
  let s = pronta(99, 1); // divario massimo: 16 vittorie di fila devono uscire
  for (let i = 0; i < N; i++) s = resolveRound(s);
  assert.equal(s.stato, "finito");
  assert.equal(s.esito, "imbattuto");
  assert.equal(s.vittorie, N);
});

test("una corsa non incontra due volte la stessa squadra", () => {
  let s = chooseCoach(fullDraft(nuovaRun(), 99), COACH);
  s = startRun(s, poolLargo(20));
  const incontrati = [];
  while (s.stato === "run") {
    incontrati.push(s.avversario.team);
    s = resolveRound(s);
  }
  assert.equal(s.esito, "imbattuto", "con questo divario la corsa deve arrivare in fondo");
  assert.equal(new Set(incontrati).size, incontrati.length, `ripetuti: ${incontrati}`);
});

test("semi diversi, tabelloni diversi: gli avversari non sono sempre gli stessi", () => {
  const tabellone = (seme) => {
    let s = fullDraft(newRun({ formato: "playoff", difficolta: "normale", seme }), 99);
    s = startRun(chooseCoach(s, COACH), poolLargo(20));
    const out = [];
    for (let i = 0; i < 5 && s.stato === "run"; i++) { out.push(s.avversario.team); s = resolveRound(s); }
    return out;
  };
  assert.notDeepEqual(tabellone(1), tabellone(2));
});

test("newRun accetta il nome della squadra e lo porta nella cronaca", () => {
  let s = newRun({ formato: "playoff", difficolta: "normale", seme: SEME, squadra: "Dinamo Sofà" });
  s = fullDraft(s, 80);
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(30));
  const testo = partitaRound(s).cronaca.map((r) => r.testo).join(" ");
  assert.ok(testo.includes("Dinamo Sofà"), `nome squadra assente: ${testo}`);
});

test("newRun rifiuta un nome squadra vuoto", () => {
  assert.throws(
    () => newRun({ formato: "playoff", difficolta: "normale", seme: SEME, squadra: "   " }),
    /nome squadra/);
});

test("boxScoreRound: dieci righe per lato, i punti tornano al punteggio", () => {
  const s = pronta(70, 50);
  const p = partitaRound(s);
  const box = boxScoreRound(s, p);
  assert.equal(box.casa.righe.length, 10);
  assert.equal(box.ospite.righe.length, 10);
  assert.equal(box.casa.righe.reduce((a, r) => a + r.tot.pts, 0), p.punti.casa);
  assert.equal(box.ospite.righe.reduce((a, r) => a + r.tot.pts, 0), p.punti.ospite);
});

test("boxScoreRound: i minuti sono quelli della rotazione del coach", () => {
  const s = pronta(70, 50, { ...COACH, rotazione: "corta" });
  const righe = boxScoreRound(s).casa.righe;
  assert.equal(righe[0].minuti, 36, "titolare con rotazione corta");
  assert.equal(righe[5].minuti, 12, "riserva con rotazione corta");
  assert.equal(righe.reduce((a, r) => a + r.minuti, 0), 240, "cinque uomini per 48 minuti");
});

test("boxScoreRound: i titolari segnano più delle riserve, a parità di carta", () => {
  const s = pronta(70, 50);
  const righe = boxScoreRound(s).casa.righe;
  const titolari5 = righe.slice(0, 5).reduce((a, r) => a + r.tot.pts, 0);
  const panchina = righe.slice(5).reduce((a, r) => a + r.tot.pts, 0);
  assert.ok(titolari5 > panchina, `titolari ${titolari5} vs panchina ${panchina}`);
});

test("boxScoreRound è puro e ripetibile: due chiamate, stesso box score", () => {
  const s = pronta(70, 50);
  assert.deepEqual(boxScoreRound(s), boxScoreRound(s));
});

test("la storia salva il box score, non solo il punteggio", () => {
  const s = resolveRound(pronta(85, 25));
  const h = s.storia[0];
  assert.equal(h.box.casa.righe.length, 10);
  assert.equal(h.box.casa.righe.reduce((a, r) => a + r.tot.pts, 0), h.punti.casa);
});

test("playByPlayRound racconta la stessa partita che partitaRound decide", () => {
  const s = pronta(70, 50);
  const p = partitaRound(s);
  const pbp = playByPlayRound(s);
  const fine = pbp.azioni[pbp.azioni.length - 1];
  assert.equal(fine.casa, p.punti.casa);
  assert.equal(fine.ospite, p.punti.ospite);
  assert.equal(pbp.tiri.casa.length, 10, "dieci righe di tiro per lato");
});

test("playByPlayRound è puro e ripetibile: due chiamate, stesse azioni", () => {
  const s = pronta(70, 50);
  const a = playByPlayRound(s).azioni.map((x) => x.testo);
  const b = playByPlayRound(s).azioni.map((x) => x.testo);
  assert.deepEqual(a, b);
});

test("le azioni NON finiscono in storia: si ricalcolano dal seme", () => {
  const s = resolveRound(pronta(85, 25));
  assert.equal(s.storia[0].azioni, undefined);
});

test("playByPlayRound fuori dal run è un errore, non un log vuoto", () => {
  const s = pronta(70, 50);
  assert.throws(() => playByPlayRound({ ...s, stato: "draft" }), /run non attivo/);
});
