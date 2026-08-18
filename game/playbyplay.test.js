import test from "node:test";
import assert from "node:assert/strict";
import { card } from "./fixtures.js";
import { ROLES } from "./roster.js";
import {
  emptyRosa, assegnaRosa, minutiRosa, repartiRosa, POSTI_PANCA, TITOLARE, PANCA,
} from "./rosa.js";
import { simulaPartita, rngSeed } from "./partita.js";
import { boxScorePartita } from "./boxscore.js";
import {
  playByPlay, log, profiloTiro, decomponi, segmentiPeriodo, sparpaglia, cognome,
  profiloRacconto, SEC_QUARTO, SEC_SUPPL, MIX_RIPIEGO,
} from "./playbyplay.js";

// --- attrezzatura -----------------------------------------------------------

// Volumi di tiro credibili: un profilo si passa per nome invece che a mano.
const VOLUMI = {
  tiratore: { fg3a: 700, fg3: 280, fg2a: 400, fg2: 200, fta: 250, ft: 225, orb: 40, drb: 300 },
  lungo: { fg3a: 10, fg3: 2, fg2a: 800, fg2: 480, fta: 400, ft: 240, orb: 250, drb: 600 },
  medio: { fg3a: 300, fg3: 105, fg2a: 600, fg2: 300, fta: 300, ft: 240, orb: 90, drb: 400 },
};

function carta(nome, profilo = "medio", over = {}) {
  return card({
    player_id: nome.toLowerCase().replace(/\s+/g, "-"),
    name: nome,
    stats_vol: { ...VOLUMI[profilo], min: 2400, gp: 75 },
    ...over,
  });
}

// Una rosa da dieci: cinque titolari coi ruoli giusti, e cinque panchinari che
// li ricalcano uno per uno. Il ruolo dei panchinari viene dalla loro CARTA (la
// casella 6°-10° non ne dà uno), ed è quello che il racconto legge per sapere
// chi è un lungo da rimbalzo.
function rosaFinta(prefisso, profili = ["medio", "tiratore", "medio", "lungo", "lungo"]) {
  let r = emptyRosa();
  ROLES.forEach((ruolo, i) => {
    const pos = { primary: ruolo, secondary: null };
    r = assegnaRosa(r, { tipo: TITOLARE, ruolo },
      carta(`${prefisso} Titolare${i}`, profili[i], { pos }));
    r = assegnaRosa(r, { tipo: PANCA, posto: POSTI_PANCA[i] },
      carta(`${prefisso} Riserva${i}`, profili[i], { pos }));
  });
  return r;
}

function giocatori(rosa, rotazione = "normale") {
  return minutiRosa(rosa, rotazione).map(({ carta: c, minuti, ruolo, tipo }) =>
    ({ ...c, minuti, ruolo, tipo }));
}

// Una partita completa: motore, box score e punto a punto sullo stesso seme.
function partitaCompleta(seme = 7, rotazione = "normale") {
  const rosaCasa = rosaFinta("Casa");
  const rosaOspite = rosaFinta("Ospite");
  const casa = {
    nome: "Casa", giocatori: giocatori(rosaCasa, rotazione),
    reparti: repartiRosa(rosaCasa, rotazione), ritmo: 0,
  };
  const ospite = {
    nome: "Ospite", giocatori: giocatori(rosaOspite, rotazione),
    reparti: repartiRosa(rosaOspite, rotazione), ritmo: 0,
  };
  const partita = simulaPartita({ casa, ospite, rng: rngSeed(seme) });
  const box = boxScorePartita({
    partita,
    casa: { giocatori: casa.giocatori, reparti: casa.reparti },
    ospite: { giocatori: ospite.giocatori, reparti: ospite.reparti },
    rng: rngSeed(seme + 11),
  });
  const pbp = playByPlay({ partita, box, casa, ospite, rng: rngSeed(seme + 23) });
  return { partita, box, casa, ospite, pbp };
}

// --- profilo di tiro --------------------------------------------------------

test("profiloTiro legge i volumi veri e non dichiara nulla di stimato", () => {
  const p = profiloTiro(carta("Tiratore", "tiratore"));
  assert.equal(p.stimato, false);
  assert.ok(Math.abs(p.pct3 - 280 / 700) < 1e-9);
  assert.ok(Math.abs(p.pct2 - 200 / 400) < 1e-9);
  assert.ok(Math.abs(p.pctTl - 225 / 250) < 1e-9);
  // 840 punti da tre, 400 da due, 225 dalla lunetta.
  assert.ok(Math.abs(p.q3 - 840 / 1465) < 1e-9);
});

test("un lungo ha una quota da tre quasi nulla, non zero secco", () => {
  const p = profiloTiro(carta("Lungo", "lungo"));
  assert.ok(p.q3 > 0, "un tentativo da tre in stagione esiste");
  assert.ok(p.q3 < 0.02, `quota da tre troppo alta per un centro: ${p.q3}`);
  assert.ok(p.q2 > 0.6);
});

test("senza volumi il profilo ripiega sul mix di lega e lo dichiara", () => {
  const c = card({ stats_real: { pts: 12, min: 30, fg_pct: 48, tp_pct: 38, ft_pct: 80 } });
  delete c.stats_vol;
  const p = profiloTiro(c);
  assert.equal(p.stimato, true);
  assert.equal(p.q3, MIX_RIPIEGO.q3);
  // Le percentuali vere ci sono comunque: quelle non si stimano.
  assert.ok(Math.abs(p.pct3 - 0.38) < 1e-9);
  assert.ok(Math.abs(p.pctTl - 0.80) < 1e-9);
});

test("le percentuali assurde vengono riportate dentro limiti umani", () => {
  const c = carta("Perfetto", "medio", {
    stats_vol: { fg3a: 4, fg3: 4, fg2a: 4, fg2: 4, fta: 4, ft: 4, min: 100, gp: 5 },
  });
  const p = profiloTiro(c);
  assert.ok(p.pct3 <= 0.72, `nessuno tira il ${p.pct3} da tre`);
  assert.ok(p.pct2 <= 0.72);
});

// --- scomposizione dei punti ------------------------------------------------

const MIX = { q3: 0.30, q2: 0.55, qtl: 0.15 };

test("decomponi somma sempre esattamente i punti dati", () => {
  const rng = rngSeed(3);
  for (let punti = 0; punti <= 60; punti++) {
    const d = decomponi(punti, MIX, rng);
    assert.equal(3 * d.t3 + 2 * d.t2 + d.tl, punti, `scomposizione rotta su ${punti} punti`);
  }
});

test("chi non tira mai da tre non ne segna mai", () => {
  const rng = rngSeed(9);
  const soloDentro = { q3: 0, q2: 0.85, qtl: 0.15 };
  for (let n = 0; n < 300; n++) {
    assert.equal(decomponi(20, soloDentro, rng).t3, 0);
  }
});

test("zero punti non producono nessun tiro", () => {
  const d = decomponi(0, MIX, rngSeed(1));
  assert.deepEqual(d, { t3: 0, t2: 0, tl: 0, viaggi: 0 });
});

test("un punto solo può venire solo dalla lunetta", () => {
  const d = decomponi(1, MIX, rngSeed(5));
  assert.equal(d.tl, 1);
  assert.equal(d.viaggi, 1);
  assert.equal(d.t2 + d.t3, 0);
});

test("i tiri liberi escono in viaggi, non uno per volta", () => {
  const rng = rngSeed(17);
  let tl = 0;
  let viaggi = 0;
  for (let n = 0; n < 200; n++) {
    const d = decomponi(25, MIX, rng);
    tl += d.tl;
    viaggi += d.viaggi;
  }
  assert.ok(tl / viaggi > 1.4, `troppi viaggi da un tiro solo: ${(tl / viaggi).toFixed(2)}`);
});

test("su tanti punti il mix rispetta le quote chieste", () => {
  const rng = rngSeed(41);
  let p3 = 0;
  let p2 = 0;
  let ptl = 0;
  for (let n = 0; n < 400; n++) {
    const d = decomponi(100, MIX, rng);
    p3 += 3 * d.t3;
    p2 += 2 * d.t2;
    ptl += d.tl;
  }
  const tot = p3 + p2 + ptl;
  assert.ok(Math.abs(p3 / tot - 0.30) < 0.06, `punti da tre fuori scala: ${p3 / tot}`);
  assert.ok(Math.abs(ptl / tot - 0.15) < 0.06, `punti dalla lunetta fuori scala: ${ptl / tot}`);
});

// --- segmenti ---------------------------------------------------------------

test("i tre segmenti di un quarto sommano al quarto, con la panchina in mezzo", () => {
  const s = segmentiPeriodo(SEC_QUARTO, 1 / 3);
  assert.equal(s.length, 3);
  assert.equal(s.reduce((a, x) => a + x.durata, 0), SEC_QUARTO);
  assert.deepEqual(s.map((x) => x.panchina), [false, true, false]);
  assert.equal(s[1].durata, SEC_QUARTO / 3);
});

test("senza panchina il quarto resta tutto ai titolari", () => {
  const s = segmentiPeriodo(SEC_QUARTO, 0);
  assert.ok(s.every((x) => !x.panchina));
  assert.equal(s.reduce((a, x) => a + x.durata, 0), SEC_QUARTO);
});

test("il supplementare si divide con le stesse proporzioni", () => {
  const s = segmentiPeriodo(SEC_SUPPL, 1 / 3);
  assert.equal(s.reduce((a, x) => a + x.durata, 0), SEC_SUPPL);
});

// --- sparpagliamento --------------------------------------------------------

function canestriFinti(valori) {
  return valori.map((v) => ({ tipo: v === 3 ? "t3" : "t2", punti: v, fgm: 1, tpm: v === 3 ? 1 : 0 }));
}

test("sparpaglia dà a ogni periodo esattamente i punti che gli spettano", () => {
  const liste = [canestriFinti([3, 2, 2, 3, 2]), canestriFinti([2, 2, 3, 2])];
  const punti = [8, 7, 6, 0];
  const out = sparpaglia(liste, punti, rngSeed(2));
  punti.forEach((p, q) => {
    const somma = out[q].reduce((a, l) => a + l.reduce((b, c) => b + c.punti, 0), 0);
    assert.equal(somma, p, `periodo ${q + 1} sbagliato`);
  });
});

test("sparpaglia non perde nemmeno un punto", () => {
  // Il CONTEGGIO dei canestri può cambiare - un canestro spezzato ne diventa
  // due - ma la somma dei punti no: quella è il vincolo.
  const liste = [canestriFinti([3, 2, 2, 3, 2, 2]), canestriFinti([2, 3, 3, 2])];
  const totale = liste.flat().reduce((a, c) => a + c.punti, 0);
  const out = sparpaglia(liste, [10, 9, 5, 0], rngSeed(4));
  const piazzati = out.reduce(
    (a, per) => a + per.reduce((b, l) => b + l.reduce((x, c) => x + c.punti, 0), 0), 0);
  assert.equal(piazzati, totale);
});

test("un periodo da un punto solo si chiude spezzando un canestro", () => {
  const liste = [canestriFinti([3, 2])];
  const out = sparpaglia(liste, [1, 4], rngSeed(6));
  assert.equal(out[0][0].reduce((a, c) => a + c.punti, 0), 1);
  assert.equal(out[1][0].reduce((a, c) => a + c.punti, 0), 4);
});

test("i viaggi a vuoto finiscono in un periodo, non nel nulla", () => {
  const vuoto = { tipo: "tl", punti: 0, fatti: 0, tentati: 2, ftm: 0, fta: 2 };
  const liste = [[...canestriFinti([2, 2]), vuoto]];
  const out = sparpaglia(liste, [2, 2], rngSeed(8));
  const piazzati = out.reduce((a, per) => a + per.reduce((b, l) => b + l.length, 0), 0);
  assert.equal(piazzati, 3);
});

test("punti che i canestri non possono coprire danno un errore leggibile", () => {
  assert.throws(
    () => sparpaglia([canestriFinti([2, 2])], [10], rngSeed(1)),
    /sparpaglia/);
});

// --- nomi -------------------------------------------------------------------

test("cognome tiene il suffisso ma non lo scambia per un cognome", () => {
  assert.equal(cognome("Stephen Curry"), "Curry");
  assert.equal(cognome("Jaren Jackson Jr."), "Jackson Jr.");
  assert.equal(cognome("Nene"), "Nene");
  assert.equal(cognome("Karl-Anthony Towns"), "Towns");
});

test("il profilo di racconto segue ruolo e reparti", () => {
  assert.equal(profiloRacconto({ ruolo: "C", reparti: { reb: 80 } }), "lungo");
  assert.equal(profiloRacconto({ ruolo: "PG", reparti: { t3: 90, reb: 20 } }), "tiratore");
  assert.equal(profiloRacconto({ ruolo: "SG", reparti: {} }), "generico");
});

// --- la partita srotolata ---------------------------------------------------

test("il punteggio progressivo arriva a quello del motore, quarto per quarto", () => {
  const { partita, pbp } = partitaCompleta(7);
  for (const q of partita.quarti) {
    const dentro = pbp.azioni.filter((a) => a.q === q.n - 1);
    const ultima = dentro[dentro.length - 1];
    assert.equal(ultima.casa, q.cumCasa, `fine periodo ${q.n}, casa`);
    assert.equal(ultima.ospite, q.cumOspite, `fine periodo ${q.n}, ospiti`);
  }
  const fine = pbp.azioni[pbp.azioni.length - 1];
  assert.equal(fine.casa, partita.punti.casa);
  assert.equal(fine.ospite, partita.punti.ospite);
});

test("i punti delle azioni di una squadra fanno il suo punteggio", () => {
  const { partita, pbp } = partitaCompleta(13);
  for (const lato of ["casa", "ospite"]) {
    const somma = pbp.azioni
      .filter((a) => a.lato === lato)
      .reduce((a, x) => a + x.punti, 0);
    assert.equal(somma, partita.punti[lato], lato);
  }
});

test("i tiri di ogni giocatore fanno i punti che il box score gli dà", () => {
  const { box, pbp } = partitaCompleta(21);
  for (const lato of ["casa", "ospite"]) {
    pbp.tiri[lato].forEach((t, i) => {
      const punti = 2 * (t.fgm - t.tpm) + 3 * t.tpm + t.ftm;
      assert.equal(punti, box[lato].righe[i].tot.pts,
        `${box[lato].righe[i].nome}: i tiri non fanno i suoi punti`);
    });
  }
});

test("nessuno segna più di quanto tira", () => {
  const { pbp } = partitaCompleta(33);
  for (const lato of ["casa", "ospite"]) {
    for (const t of pbp.tiri[lato]) {
      assert.ok(t.fgm <= t.fga, "canestri oltre i tentativi");
      assert.ok(t.tpm <= t.tpa, "triple oltre i tentativi");
      assert.ok(t.ftm <= t.fta, "liberi oltre i tentativi");
      assert.ok(t.tpa <= t.fga, "più tentativi da tre che tiri dal campo");
    }
  }
});

test("ogni tiro sbagliato ha il suo rimbalzo", () => {
  const { pbp } = partitaCompleta(45);
  const errori = pbp.azioni.filter((a) => a.tipo === "errore" || a.tipo === "stoppata").length;
  const rimbalzi = pbp.azioni.filter((a) => a.tipo === "rimbalzo").length;
  assert.equal(errori, rimbalzi);
});

test("i rimbalzi delle azioni sono quelli del box score", () => {
  const { box, pbp } = partitaCompleta(51);
  for (const lato of ["casa", "ospite"]) {
    const daBox = box[lato].righe.reduce((a, r) => a + r.tot.reb, 0);
    const daAzioni = pbp.azioni.filter((a) => a.lato === lato && a.tipo === "rimbalzo").length;
    assert.equal(daAzioni, daBox, lato);
  }
});

test("un assist non se lo fa mai da solo", () => {
  const { pbp } = partitaCompleta(57);
  for (const a of pbp.azioni) {
    if (a.tipo === "canestro" && a.chi2) assert.notEqual(a.chi2, a.chi);
  }
});

test("l'orologio scorre all'indietro dentro ogni periodo", () => {
  const { pbp } = partitaCompleta(63);
  let periodo = -1;
  let ultimo = Infinity;
  for (const a of pbp.azioni) {
    if (a.q !== periodo) { periodo = a.q; ultimo = Infinity; }
    assert.ok(a.secondi <= ultimo, `tempo che risale a ${a.tempo} nel periodo ${a.q + 1}`);
    ultimo = a.secondi;
  }
});

test("ogni azione ha un testo e un periodo scritti", () => {
  const { pbp } = partitaCompleta(69);
  for (const a of pbp.azioni) {
    assert.ok(a.testo.length > 0, `azione '${a.tipo}' senza testo`);
    assert.match(a.tempo, /^\d+:\d\d$/);
    assert.ok(a.periodo.length > 0);
  }
});

test("i falli non sono mai meno dei viaggi in lunetta che hanno causato", () => {
  const { pbp } = partitaCompleta(75);
  for (const lato of ["casa", "ospite"]) {
    const altro = lato === "casa" ? "ospite" : "casa";
    const viaggi = pbp.azioni.filter((a) => a.lato === altro && a.tipo === "liberi").length;
    const falli = pbp.falli[lato].reduce((a, b) => a + b, 0);
    assert.ok(falli >= viaggi, `${lato}: ${falli} falli per ${viaggi} viaggi in lunetta`);
  }
});

test("ogni viaggio in lunetta sa chi ha fatto fallo", () => {
  const { pbp } = partitaCompleta(81);
  const liberi = pbp.azioni.filter((a) => a.tipo === "liberi");
  assert.ok(liberi.length > 0);
  assert.ok(liberi.every((a) => a.chi2), "viaggio in lunetta senza fallo attribuito");
});

test("le riserve entrano e i cambi si vedono nel log", () => {
  const { pbp } = partitaCompleta(87);
  const cambi = pbp.azioni.filter((a) => a.tipo === "sostituzione");
  // Due segmenti di titolari e uno di panchina per periodo: due cambi per
  // squadra per periodo, quattro periodi.
  assert.equal(cambi.length, 16);
  assert.ok(cambi.every((a) => a.dentro.length === 5));
});

test("stesso seme, stessa partita raccontata uguale", () => {
  const a = partitaCompleta(99).pbp;
  const b = partitaCompleta(99).pbp;
  assert.deepEqual(a.azioni.map((x) => x.testo), b.azioni.map((x) => x.testo));
  assert.deepEqual(a.tiri, b.tiri);
  assert.deepEqual(a.falli, b.falli);
});

test("i supplementari vengono srotolati come i quarti", () => {
  // Si cercano semi che producano un supplementare: capita nel 2% delle partite.
  let trovato = null;
  for (let s = 1; s < 400 && !trovato; s++) {
    const r = partitaCompleta(s);
    if (r.partita.quarti.length > 4) trovato = r;
  }
  assert.ok(trovato, "nessun supplementare in 400 partite: taratura da rivedere");
  const ultimo = trovato.partita.quarti[trovato.partita.quarti.length - 1];
  const azioni = trovato.pbp.azioni.filter((a) => a.q === ultimo.n - 1);
  assert.ok(azioni.length > 0, "supplementare senza azioni");
  assert.match(azioni[0].periodo, /suppl/);
});

test("la rotazione corta e quella larga producono minuti diversi in campo", () => {
  for (const rot of ["corta", "larga"]) {
    const { pbp, partita } = partitaCompleta(7, rot);
    const fine = pbp.azioni[pbp.azioni.length - 1];
    assert.equal(fine.casa, partita.punti.casa, `rotazione ${rot}`);
  }
});

// --- i due livelli del log --------------------------------------------------

test("l'essenziale è un sottoinsieme del completo, e molto più corto", () => {
  const { pbp } = partitaCompleta(111);
  const completo = log(pbp.azioni, "completo");
  const essenziale = log(pbp.azioni);
  assert.equal(completo.length, pbp.azioni.length);
  assert.ok(essenziale.length < completo.length / 2,
    `essenziale troppo lungo: ${essenziale.length} su ${completo.length}`);
  assert.ok(essenziale.every((a) => completo.includes(a)));
});

test("ogni tripla e ogni stoppata finiscono nell'essenziale", () => {
  const { pbp } = partitaCompleta(117);
  const dentro = new Set(log(pbp.azioni));
  for (const a of pbp.azioni) {
    if (a.tipo === "stoppata") assert.ok(dentro.has(a), "stoppata fuori dall'essenziale");
    if (a.tipo === "canestro" && a.dettaglio === "t3") {
      assert.ok(dentro.has(a), "tripla fuori dall'essenziale");
    }
  }
});

test("un livello che non esiste è un errore, non un log vuoto", () => {
  const { pbp } = partitaCompleta(123);
  assert.throws(() => log(pbp.azioni, "verboso"), /livello inesistente/);
});

test("il comprimario porta il suo indice, non solo il cognome", () => {
  const { pbp, casa, ospite } = partitaCompleta(31);
  const rose = { casa: casa.giocatori, ospite: ospite.giocatori };
  // L'assist sta nella rosa di chi segna, tutto il resto in quella avversaria:
  // chi ruba, chi stoppa e chi commette il fallo giocano dall'altra parte.
  const dove = { canestro: (l) => l, recupero: altro, stoppata: altro, liberi: altro };
  let visti = 0;
  for (const a of pbp.azioni) {
    if (!a.chi2) continue;
    assert.notEqual(a.chi2Idx, null, `${a.tipo}: chi2 senza indice`);
    const lato = dove[a.tipo](a.lato);
    const g = rose[lato][a.chi2Idx];
    assert.ok(g, `${a.tipo}: indice ${a.chi2Idx} fuori dalla rosa ${lato}`);
    assert.equal(cognome(g.name ?? g.nome), a.chi2);
    visti++;
  }
  assert.ok(visti > 20, `troppi pochi comprimari con indice: ${visti}`);
});

function altro(lato) { return lato === "casa" ? "ospite" : "casa"; }

test("due giocatori con lo stesso cognome restano distinti nelle azioni", () => {
  // Il caso vero: due Harden nella stessa rosa. Senza indice, chi legge il log
  // per cognome darebbe tutti gli assist di uno all'altro.
  const rosaCasa = rosaFinta("Casa");
  const rosaOspite = rosaFinta("Ospite");
  const casa = {
    nome: "Casa", giocatori: giocatori(rosaCasa).map((g) => ({ ...g, name: "James Harden" })),
    reparti: repartiRosa(rosaCasa), ritmo: 0,
  };
  const ospite = {
    nome: "Ospite", giocatori: giocatori(rosaOspite), reparti: repartiRosa(rosaOspite), ritmo: 0,
  };
  const partita = simulaPartita({ casa, ospite, rng: rngSeed(9) });
  const box = boxScorePartita({
    partita,
    casa: { giocatori: casa.giocatori, reparti: casa.reparti },
    ospite: { giocatori: ospite.giocatori, reparti: ospite.reparti },
    rng: rngSeed(20),
  });
  const pbp = playByPlay({ partita, box, casa, ospite, rng: rngSeed(32) });
  const assist = pbp.azioni.filter((a) => a.tipo === "canestro" && a.chi2);
  assert.ok(assist.length > 5, "servono assist per provare qualcosa");
  // Tutti si chiamano Harden, ma gli indici devono essere più di uno e non
  // devono mai coincidere con chi ha segnato.
  assert.ok(new Set(assist.map((a) => a.chi2Idx)).size > 1);
  for (const a of assist) assert.notEqual(a.chi2Idx, a.chiIdx);
});

// --- validazione ------------------------------------------------------------

test("senza partita, box score o rng l'errore dice cosa manca", () => {
  const { partita, box, casa, ospite } = partitaCompleta(5);
  const rng = rngSeed(1);
  assert.throws(() => playByPlay({ box, casa, ospite, rng }), /serve la partita/);
  assert.throws(() => playByPlay({ partita, casa, ospite, rng }), /serve il box score/);
  assert.throws(() => playByPlay({ partita, box, casa, ospite }), /serve un rng/);
  assert.throws(() => playByPlay({ partita, box, casa: {}, ospite, rng }), /non ha giocatori/);
});

test("un box score che non combacia con la rosa si ferma subito", () => {
  const { partita, box, casa, ospite } = partitaCompleta(5);
  const mutilata = { ...casa, giocatori: casa.giocatori.slice(0, 8) };
  assert.throws(
    () => playByPlay({ partita, box, casa: mutilata, ospite, rng: rngSeed(1) }),
    /righe di box score/);
});

test("una panchina senza minuti è un errore, non un quintetto che gioca 48 minuti", () => {
  const { partita, box, casa, ospite } = partitaCompleta(5);
  const senzaMinuti = { ...casa, giocatori: casa.giocatori.map((g) => ({ ...g, minuti: 0 })) };
  assert.throws(
    () => playByPlay({ partita, box, casa: senzaMinuti, ospite, rng: rngSeed(1) }),
    /nessun minuto/);
});
