import test from "node:test";
import assert from "node:assert/strict";
import { REPARTI, per36, rawReparti, assegnaReparti, mediaReparti, affidabilita } from "./reparti.js";

// Tre profili volutamente diversi, coi numeri veri di riferimento: un tiratore
// puro, un lungo difensivo che non tira mai da tre, un attaccante fisico.
const curry = { pts: 30.1, reb: 5.4, ast: 6.7, stl: 2.1, blk: 0.2, tov: 3.3,
  fg_pct: 50.4, tp_pct: 45.4, ft_pct: 90.8, min: 34.2, gp: 79, plus_minus: 12.6 };
const gobert = { pts: 15.9, reb: 13.5, ast: 1.5, stl: 0.8, blk: 2.0, tov: 1.7,
  fg_pct: 69.3, tp_pct: 0, ft_pct: 63.0, min: 34.3, gp: 68, plus_minus: 6.2 };
const giannis = { pts: 29.5, reb: 13.6, ast: 5.6, stl: 1.0, blk: 1.0, tov: 3.7,
  fg_pct: 55.3, tp_pct: 30.4, ft_pct: 63.3, min: 30.4, gp: 63, plus_minus: 11.1 };

test("i cinque reparti hanno chiavi stabili", () => {
  assert.deepEqual(REPARTI, ["t3", "fin", "dif", "reb", "reg"]);
});

test("per36 riporta una stat sui 36 minuti", () => {
  assert.equal(per36(10, 18), 20);
  assert.ok(Math.abs(per36(7.7, 36) - 7.7) < 1e-9);
});

test("per36 rifiuta minuti nulli invece di dividere per zero", () => {
  assert.throws(() => per36(5, 0), /minuti/i);
});

test("rawReparti: il tiratore batte il lungo sul tiro da tre, e viceversa sui rimbalzi", () => {
  const c = rawReparti(curry);
  const g = rawReparti(gobert);
  assert.ok(c.t3 > g.t3, "Curry deve stare sopra Gobert sul tiro da tre");
  assert.ok(g.reb > c.reb, "Gobert deve stare sopra Curry sui rimbalzi");
  assert.ok(g.dif > c.dif, "Gobert deve stare sopra Curry in difesa (stoppate)");
  assert.ok(c.reg > g.reg, "Curry deve stare sopra Gobert in regia");
});

test("rawReparti: chi non tira mai da tre finisce in fondo a quel reparto", () => {
  assert.ok(rawReparti(gobert).t3 < rawReparti(giannis).t3);
});

test("rawReparti: finalizzazione premia percentuale e volume", () => {
  const scarso = { ...giannis, fg_pct: 38.0, pts: 9.0 };
  assert.ok(rawReparti(giannis).fin > rawReparti(scarso).fin);
});

test("rawReparti: le palle perse abbassano la regia", () => {
  const sporco = { ...curry, tov: 6.0 };
  assert.ok(rawReparti(curry).reg > rawReparti(sporco).reg);
});

test("il centro con tre triple a stagione non batte il tiratore vero", () => {
  // Enes Kanter 2015-16 nella prima versione usciva a 98 di tiro da tre: alta
  // percentuale su volume ridicolo. Senza i tentativi nei dati, la percentuale dal
  // campo dice se uno vive al ferro o dall'arco.
  const centroAlFerro = { ...gobert, tp_pct: 50.0, fg_pct: 57.0, ft_pct: 79.0, pts: 12.7 };
  const tiratore = { ...curry, pts: 12.1, tp_pct: 41.7, fg_pct: 46.8, ft_pct: 89.8, min: 32.2 };
  assert.ok(rawReparti(tiratore).t3 > rawReparti(centroAlFerro).t3);
});

// Volumi veri (totali di stagione, come li dà Basketball-Reference).
const volCurry = { fg3a: 886, fg3: 402, fg2a: 712, fg2: 403, fta: 400, ft: 363,
  orb: 68, drb: 362, min: 2700, gp: 79 };
const volGobert = { fg3a: 0, fg3: 0, fg2a: 552, fg2: 382, fta: 380, ft: 239,
  orb: 253, drb: 665, min: 2333, gp: 68 };
const volKanter = { fg3a: 9, fg3: 1, fg2a: 741, fg2: 415, fta: 289, ft: 227,
  orb: 219, drb: 349, min: 1746, gp: 82 };

test("coi volumi veri, chi non tira da tre resta in fondo anche se tira bene i liberi", () => {
  const conVolumi = rawReparti(curry, volCurry);
  const centro = rawReparti(gobert, volGobert);
  const kanter = rawReparti({ ...gobert, ft_pct: 79.5 }, volKanter);
  assert.ok(conVolumi.t3 > kanter.t3 * 3, "il tiratore deve staccare di molto");
  assert.ok(centro.t3 < 0.05, "chi non tira nemmeno una tripla deve stare a zero");
  assert.ok(kanter.t3 < 0.15, "nove triple in stagione non fanno un tiratore");
});

test("coi volumi veri la finalizzazione usa la percentuale da DUE", () => {
  // Stesse medie, ma uno segna dentro e l'altro no: la fg% totale li confonderebbe.
  const dentro = rawReparti(gobert, { ...volGobert, fg2: 382, fg2a: 552 });
  const fuori = rawReparti(gobert, { ...volGobert, fg2: 220, fg2a: 552 });
  assert.ok(dentro.fin > fuori.fin);
});

test("coi volumi veri la difesa guarda i rimbalzi difensivi, non quelli offensivi", () => {
  const difensivo = rawReparti(gobert, { ...volGobert, drb: 665, orb: 100 });
  const offensivo = rawReparti(gobert, { ...volGobert, drb: 200, orb: 565 });
  assert.ok(difensivo.dif > offensivo.dif);
  assert.ok(offensivo.reb > 0, "i rimbalzi offensivi contano comunque a rimbalzo");
});

test("rawReparti lancia se i volumi sono monchi invece di trattarli come zero", () => {
  const monco = { ...volCurry };
  delete monco.fg2a;
  assert.throws(() => rawReparti(curry, monco), /fg2a/);
});

test("affidabilità cresce coi minuti totali e resta tra 0 e 1", () => {
  const titolare = affidabilita({ min: 34, gp: 79 });
  const riserva = affidabilita({ min: 4, gp: 6 });
  assert.ok(titolare > 0.7 && titolare < 1);
  assert.ok(riserva < 0.05);
});

test("la correzione per minuti non tocca il tiro da tre", () => {
  // Kanter: 82 partite, nove triple tentate. Se il suo t3 venisse tirato verso la
  // mediana della stagione uscirebbe da tiratore medio, che è il contrario del vero.
  const cards = [
    carta("Tiratore", "2015-16", curry),
    carta("Lungo", "2015-16", gobert),
    carta("Kanter", "2015-16", { ...gobert, tp_pct: 11.1, min: 21.3, gp: 82 }),
  ];
  cards[0].stats_vol = volCurry;
  cards[1].stats_vol = volGobert;
  cards[2].stats_vol = volKanter;
  const out = assegnaReparti(cards, { minMinuti: 0, minPartite: 0 });
  const kanter = out.find((c) => c.name === "Kanter").reparti.t3;
  const tiratore = out.find((c) => c.name === "Tiratore").reparti.t3;
  assert.ok(kanter < tiratore, "chi non tira non può stare vicino al tiratore");
});

test("i numeri di chi gioca 4 minuti vengono tirati verso la mediana", () => {
  // Stesse medie per 36' di un fuoriclasse, ma su 6 partite da 4 minuti: non deve
  // uscire in cima al reparto.
  const cards = [
    carta("Titolare1", "2015-16", curry),
    carta("Titolare2", "2015-16", giannis),
    carta("Titolare3", "2015-16", gobert),
    carta("Titolare4", "2015-16", { ...curry, pts: 12, ast: 2.0, min: 28, gp: 70 }),
    carta("Meteora", "2015-16", { ...curry, min: 4, gp: 6 }),
  ];
  const out = assegnaReparti(cards);
  const meteora = out.find((c) => c.name === "Meteora").reparti.reg;
  const vero = out.find((c) => c.name === "Titolare1").reparti.reg;
  assert.ok(meteora < vero, "la riserva non deve superare il titolare con gli stessi ritmi");
});

test("rawReparti rifiuta un box score incompleto invece di inventare uno zero", () => {
  const monco = { ...curry };
  delete monco.tp_pct;
  assert.throws(() => rawReparti(monco), /tp_pct/);
});

// --- percentile dentro la stagione -----------------------------------------

function carta(name, season, stats) {
  return { name, season, ovr: 80, stats_real: stats };
}

test("assegnaReparti mette cinque valori 0-99 su ogni carta", () => {
  const cards = [
    carta("Curry", "2015-16", curry),
    carta("Gobert", "2015-16", gobert),
    carta("Giannis", "2015-16", giannis),
  ];
  const out = assegnaReparti(cards, { minMinuti: 0, minPartite: 0 });
  for (const c of out) {
    assert.equal(Object.keys(c.reparti).length, 5);
    for (const r of REPARTI) {
      assert.ok(Number.isInteger(c.reparti[r]), `${r} deve essere intero`);
      assert.ok(c.reparti[r] >= 0 && c.reparti[r] <= 99, `${r} fuori scala`);
    }
  }
});

test("assegnaReparti non tocca la carta originale", () => {
  const cards = [carta("Curry", "2015-16", curry), carta("Gobert", "2015-16", gobert)];
  assegnaReparti(cards, { minMinuti: 0, minPartite: 0 });
  assert.equal(cards[0].reparti, undefined);
});

test("il percentile è calcolato dentro la stagione, non su tutte le carte", () => {
  // Stessa identica prestazione in due stagioni diverse. Nella stagione A è la
  // migliore, nella stagione B è la peggiore: il valore deve cambiare.
  const forte = { ...gobert, reb: 20 };
  const cards = [
    carta("Tizio", "2014-15", gobert),
    carta("Scarso", "2014-15", curry),
    carta("Caio", "2018-19", gobert),
    carta("Mostro", "2018-19", forte),
  ];
  const out = assegnaReparti(cards, { minMinuti: 0, minPartite: 0 });
  const tizio = out.find((c) => c.name === "Tizio").reparti.reb;
  const caio = out.find((c) => c.name === "Caio").reparti.reb;
  assert.ok(tizio > caio, "in una stagione è il migliore a rimbalzo, nell'altra no");
});

test("i minuti da riserva non definiscono il vertice della scala", () => {
  // Un giocatore da 4 minuti con numeri gonfiati per 36' resta fuori dalla
  // popolazione di riferimento: non deve schiacciare i titolari a percentile basso.
  const meteora = { ...curry, min: 4.0, gp: 6, pts: 8, ast: 3 };
  const base = [
    carta("A", "2015-16", curry),
    carta("B", "2015-16", giannis),
    carta("C", "2015-16", gobert),
  ];
  const senza = assegnaReparti(base);
  const con = assegnaReparti([...base, carta("Meteora", "2015-16", meteora)]);
  const primaA = senza.find((c) => c.name === "A").reparti.reg;
  const dopoA = con.find((c) => c.name === "A").reparti.reg;
  assert.equal(primaA, dopoA, "il fuori-soglia non deve spostare la scala dei titolari");
});

test("chi è sotto soglia riceve comunque i suoi cinque valori", () => {
  const meteora = { ...curry, min: 4.0, gp: 6 };
  const out = assegnaReparti([
    carta("A", "2015-16", curry),
    carta("B", "2015-16", gobert),
    carta("Meteora", "2015-16", meteora),
  ]);
  const m = out.find((c) => c.name === "Meteora");
  assert.equal(Object.keys(m.reparti).length, 5);
});

test("assegnaReparti lancia se una carta non ha stats_real", () => {
  assert.throws(
    () => assegnaReparti([{ name: "Vuoto", season: "2015-16", ovr: 70 }]),
    /Vuoto/,
  );
});

test("mediaReparti fa la media reparto per reparto di un quintetto", () => {
  const q = [
    { reparti: { t3: 90, fin: 80, dif: 40, reb: 30, reg: 95 } },
    { reparti: { t3: 30, fin: 60, dif: 90, reb: 90, reg: 25 } },
  ];
  assert.deepEqual(mediaReparti(q), { t3: 60, fin: 70, dif: 65, reb: 60, reg: 60 });
});

test("mediaReparti lancia su una squadra vuota", () => {
  assert.throws(() => mediaReparti([]), /vuot/i);
});
