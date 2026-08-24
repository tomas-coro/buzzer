import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newRun, draftPick, useAid, chooseCoach, startRun, resolveRound,
  esitoRound, partitaRound, boxScoreRound, playByPlayRound, titolari, sceltaAutoDraft,
} from "./run.js";
import { ROLES } from "./roster.js";
import { SLOTS, costruisciRosa, cartaIn, TITOLARE, PANCA } from "./rosa.js";
import { DIFFICULTIES, TETTI } from "./difficulty.js";
import { card } from "./fixtures.js";
import { votoRosa } from "./rating.js";
import { salarioCarta, SALARIO_MIN, limiteDuro } from "./salary.js";
import { applyCoach } from "./coach.js";

// `liv` è il livello di tutti e cinque i reparti: 80 = squadra forte, 30 = scarsa.
const repartiA = (liv) => ({ t3: liv, fin: liv, dif: liv, reb: liv, reg: liv });

// Dieci carte, due per ruolo, nell'ordine degli SLOTS: le prime cinque (una per
// ruolo, PG→C) stanno ai titolari, le seconde cinque vanno in panchina dal 6° al
// 10°. Gli id sono distinti perché `costruisciRosa` non riassegna la stessa
// carta due volte, e perché il box score aggrega per persona.
function dieciCarte(liv, prefisso) {
  return [1, 2].flatMap((giro) => ROLES.map((ruolo) => card({
    player_id: `${prefisso}-${ruolo}-${giro}`,
    name: `${prefisso} ${ruolo} ${giro}`,
    pos: { primary: ruolo, secondary: null },
    reparti: repartiA(liv),
  })));
}

// Draft completo: dieci tocchi, una casella per tocco. Adesso la casella la
// sceglie chi gioca (i posti di panchina accettano chiunque), quindi qui la
// passo esplicita: `dieciCarte` è già nell'ordine degli SLOTS.
// I test di questo file misurano il motore, non il portafogli: il draft finto
// firma dieci titolari veri, che sotto il tetto di una difficoltà vera non
// entrerebbero mai. Quindi qui il tetto si alza e basta. Il tetto di spesa ha i
// suoi test, più in basso.
const TETTO_LARGO = 10_000_000_000;

function fullDraft(state, liv = 50) {
  const carte = dieciCarte(liv, "MIO");
  let s = { ...state, tetto: TETTO_LARGO };
  SLOTS.forEach((slot, i) => { s = draftPick(s, slot, carte[i]); });
  return s;
}

// Scorciatoie per le caselle, così i test si leggono.
const tit = (ruolo) => ({ tipo: TITOLARE, ruolo });
const panca = (posto) => ({ tipo: PANCA, posto });

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

test("draftPick mette la carta nella casella scelta, quintetto o panchina", () => {
  let s = newRun({ formato: "playoff", difficolta: "normale" });
  const carte = dieciCarte(60, "MIO");
  s = draftPick(s, tit("PG"), carte[0]);
  assert.equal(cartaIn(s.rosa, tit("PG")), carte[0], "il titolare va nella casella del ruolo");
  // Un playmaker come 8° uomo: in panchina il ruolo non vincola più.
  s = draftPick(s, panca(8), carte[5]);
  assert.equal(cartaIn(s.rosa, panca(8)), carte[5], "la panchina accetta chiunque");
  assert.equal(cartaIn(s.rosa, panca(6)), null, "il 6° uomo resta libero: l'ordine lo scelgo io");
  assert.equal(s.stato, "draft", "con due su dieci il draft non è finito");
});

test("draftPick: a dieci carte si passa in fase coach", () => {
  let s = fullDraft(newRun({ formato: "playoff", difficolta: "normale" }));
  assert.equal(s.stato, "coach");
});

test("draftPick su una casella già occupata lancia", () => {
  let t = newRun({ formato: "playoff", difficolta: "normale" });
  const carte = dieciCarte(60, "MIO");
  t = draftPick(t, tit("PG"), carte[0]);
  assert.throws(() => draftPick(t, tit("PG"), carte[5]), /già occupata/);
  t = draftPick(t, panca(6), carte[5]);
  assert.throws(() => draftPick(t, panca(6), card({ player_id: "terzo" })), /già occupata/);
});

test("draftPick rifiuta un titolare fuori ruolo, la panchina no", () => {
  let t = newRun({ formato: "playoff", difficolta: "normale" });
  const centro = card({ player_id: "big", pos: { primary: "C", secondary: null } });
  assert.throws(() => draftPick(t, tit("PG"), centro), /incompatibile/);
  t = draftPick(t, panca(10), centro);
  assert.equal(cartaIn(t.rosa, panca(10)), centro);
});

// Riempie le prime nove caselle (SLOTS.slice(0,9): i cinque titolari e la
// panchina dal 6° al 9°) con filler deboli e a budget largo, lasciando libero
// solo il 10° uomo: serve ai test di sceltaAutoDraft che vogliono un budget
// residuo piccolo e controllato, senza farlo dipendere da nove costi veri.
function statoUltimaCasella(tetto, speso) {
  let s = { ...newRun({ formato: "playoff", difficolta: "normale" }), tetto: TETTO_LARGO };
  const filler = dieciCarte(20, "FILL");
  SLOTS.slice(0, 9).forEach((slot, i) => { s = draftPick(s, slot, filler[i]); });
  return { ...s, tetto, speso };
}

test("sceltaAutoDraft: fra le carte piazzabili sceglie l'OVR più alto", () => {
  const s = newRun({ formato: "playoff", difficolta: "normale" }); // rosa vuota, budget largo
  const debole = card({ player_id: "debole", ovr: 60, pos: { primary: "PG", secondary: null }, reparti: repartiA(40) });
  const forte = card({ player_id: "forte", ovr: 88, pos: { primary: "SG", secondary: null }, reparti: repartiA(70) });
  const scelta = sceltaAutoDraft(s, [debole, forte], 0);
  assert.equal(scelta.carta, forte);
  assert.deepEqual(scelta.slot, { tipo: TITOLARE, ruolo: "SG" }, "il titolare libero viene prima della panchina");
  assert.equal(scelta.costo, salarioCarta(forte));
});

test("sceltaAutoDraft: con malusPunti 0 resta sotto il tetto pulito anche a costo dell'OVR più alto", () => {
  const s = statoUltimaCasella(20_000_000, 15_000_000); // 5M puliti rimasti, un'unica casella libera
  const economica = card({ player_id: "eco", ovr: 60, reparti: repartiA(25) });
  const cara = card({ player_id: "cara", ovr: 95, reparti: repartiA(88) });
  assert.ok(salarioCarta(cara) > 5_000_000, "il fixture deve sforare i 5M rimasti, o il test non prova niente");
  assert.ok(salarioCarta(economica) <= 5_000_000, "l'economica deve starci dentro");
  const scelta = sceltaAutoDraft(s, [economica, cara], 0);
  assert.equal(scelta.carta, economica, "la cara sfora il tetto pulito: resta fuori anche col suo OVR più alto");
});

test("sceltaAutoDraft: alzando malusPunti la stessa carta cara ora entra nel budget", () => {
  const cara = card({ player_id: "cara2", ovr: 95, reparti: repartiA(88) });
  const costo = salarioCarta(cara);
  // Tetto derivato dal costo vero della carta (non un numero a caso): sfora il
  // pulito del 10% ma sta comodo sotto l'apron (+25%), qualunque sia il rumore
  // del suo contratto.
  const tetto = Math.round(costo / 1.1);
  const speso = 1_000_000;
  assert.ok(costo > tetto - speso, "deve sforare il tetto pulito, o il test non prova niente");
  assert.ok(costo <= limiteDuro(tetto) - speso, "deve starci sotto l'apron, o il test non prova niente");
  const s = statoUltimaCasella(tetto, speso);

  const pulito = sceltaAutoDraft(s, [cara], 0);
  assert.equal(pulito.costo, SALARIO_MIN, "pulito: non ce la fa, ripiega al minimo");

  const conMalus = sceltaAutoDraft(s, [cara], 25); // abbastanza da arrivare all'apron
  assert.equal(conMalus.carta, cara);
  assert.equal(conMalus.costo, costo, "col budget alzato firma al prezzo pieno, non al minimo");
});

test("sceltaAutoDraft: il budget non supera mai l'apron, qualunque malusPunti", () => {
  const s = statoUltimaCasella(20_000_000, 0);
  const fuoriApron = card({ player_id: "top", ovr: 99, reparti: repartiA(90) });
  assert.ok(salarioCarta(fuoriApron) > limiteDuro(20_000_000),
    "il fixture deve costare più dell'apron, o il test non prova niente");
  const scelta = sceltaAutoDraft(s, [fuoriApron], 1000); // malus enorme, apposta
  // È l'unica carta piazzabile (l'ultima casella): sopra l'apron non si firma
  // al prezzo pieno, quindi ripiega sul minimo - stesso criterio del draft
  // manuale bloccato (vedi firmaDiRipiego in game/salary.js).
  assert.equal(scelta.carta, fuoriApron);
  assert.equal(scelta.costo, SALARIO_MIN);
});

test("sceltaAutoDraft: budget a zero forza la firma di ripiego sulla più economica", () => {
  const s = { ...newRun({ formato: "playoff", difficolta: "normale" }), tetto: 0 };
  const carte = dieciCarte(50, "SPIN").slice(0, 3);
  const scelta = sceltaAutoDraft(s, carte, 0);
  const laPiuEconomica = carte.reduce((m, c) => (salarioCarta(c) < salarioCarta(m) ? c : m));
  assert.equal(scelta.carta, laPiuEconomica);
  assert.equal(scelta.costo, SALARIO_MIN);
});

test("sceltaAutoDraft: nessuna carta ha una casella libera → null, serve un altro spin", () => {
  const s = fullDraft(newRun({ formato: "playoff", difficolta: "normale" }));
  const carta = card({ player_id: "senza-posto" });
  assert.equal(sceltaAutoDraft(s, [carta], 0), null);
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
  assert.equal(cartaIn(s.rosa, tit("C")).reparti.dif, 60, "la rosa draftata non si tocca");
  assert.equal(cartaIn(s.rosaAllenata, tit("C")).reparti.dif, 68, "il centro prende il plus mirato");
  assert.equal(cartaIn(s.rosaAllenata, tit("PG")).reparti.dif, 60, "il playmaker no: il plus è mirato");
  assert.equal(cartaIn(s.rosaAllenata, tit("PG")).reparti.t3, 55, "il malus lo paga tutta la squadra");
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
  assert.equal(righe[0].minuti, 34, "titolare con rotazione corta");
  assert.equal(righe[5].minuti, 26, "il 6° uomo con rotazione corta gioca quasi da titolare");
  assert.equal(righe[9].minuti, 8, "il 10° uomo raccoglie le briciole");
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

// ---- il tetto di spesa e il secondo apron ----

test("una corsa nuova parte col tetto della sua difficoltà e la cassa intatta", () => {
  for (const liv of ["facile", "normale", "difficile", "incubo"]) {
    const s = newRun({ formato: "playoff", difficolta: liv, seme: SEME });
    assert.equal(s.tetto, TETTI[liv]);
    assert.equal(s.speso, 0);
  }
});

test("ogni firma toglie dalla cassa quello che costa il cartellino", () => {
  const carte = dieciCarte(50, "MIO");
  let s = { ...nuovaRun(), tetto: TETTO_LARGO };
  s = draftPick(s, tit("PG"), carte[0]);
  assert.equal(s.speso, salarioCarta(carte[0]));
  s = draftPick(s, tit("SG"), carte[1]);
  assert.equal(s.speso, salarioCarta(carte[0]) + salarioCarta(carte[1]));
});

test("oltre il secondo apron non si firma, e l'errore dice perché", () => {
  const carte = dieciCarte(50, "MIO");
  // Tetto piccolo apposta: la prima carta vera non ci sta nemmeno con l'apron.
  const s = { ...nuovaRun(), tetto: 10_000_000 };
  assert.throws(() => draftPick(s, tit("PG"), carte[0]), /costa troppo/);
});

test("la firma di ripiego passa il suo costo e non quello del cartellino", () => {
  const carte = dieciCarte(50, "MIO");
  const s = draftPick({ ...nuovaRun(), tetto: 30_000_000 }, tit("PG"), carte[0], SALARIO_MIN);
  assert.equal(s.speso, SALARIO_MIN);
  assert.notEqual(SALARIO_MIN, salarioCarta(carte[0]));
});

test("chi resta sotto il tetto non paga nessuna tassa", () => {
  let s = fullDraft(nuovaRun(), 50);
  s = chooseCoach({ ...s, tetto: TETTO_LARGO }, COACH);
  const lordo = applyCoach(s.rosa, COACH).voto;
  const run = startRun(s, poolAt(50));
  assert.deepEqual(run.voto.reparti, lordo.reparti);
});

test("chi sfora il tetto scende di reparti, in proporzione allo sforo", () => {
  const base = fullDraft(nuovaRun(), 50);
  const lordo = applyCoach(base.rosa, COACH).voto;
  // 25 milioni sopra il tetto: cinque punti di reparto, cioè circa cinque punti
  // di margine a partita.
  const s = chooseCoach({ ...base, tetto: 100_000_000, speso: 125_000_000 }, COACH);
  const run = startRun(s, poolAt(50));
  for (const [r, v] of Object.entries(lordo.reparti)) {
    assert.equal(run.voto.reparti[r], Math.max(0, v - 5), `reparto ${r} non tassato`);
  }
  assert.ok(run.voto.ovr <= lordo.ovr, "il voto della squadra non è sceso");
});
