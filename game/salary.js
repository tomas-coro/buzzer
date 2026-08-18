// Il salario di una carta e il tetto di spesa del draft.
//
// PERCHÉ ESISTE. Incubo si era incagliato al 3,1% di 16-0 e non per una taratura
// sbagliata: è il pavimento del pool. Col tetto degli avversari già sulla squadra
// più forte di sempre, alzare `oppMin` non sposta più niente (vedi il commento in
// difficulty.js). L'unica leva rimasta è dall'ALTRA parte del tavolo, cioè quanto
// forte è la squadra che riesci a costruire tu.
//
// LA LEVA È PRESA DA ERABALL. Non ha livelli di difficoltà: ha la modalità Salary
// Cap, nove caselle sotto un tetto fisso, e il costo di ogni giocatore è il suo
// rating. 7-0 fa la stessa cosa in un altro modo (Blind, Daily senza re-roll):
// nessuno dei due rende il gioco più duro alzando la forza dell'avversario.
//
// LA CURVA È CONVESSA, E NON È UN VEZZO. Nella NBA vera un fuoriclasse non costa
// il doppio di un titolare qualsiasi, costa cinque volte tanto: il max contract
// vale il 35% del tetto da solo. Se il costo fosse lineare col voto, il cap
// diventerebbe solo "voto medio massimo" e non ci sarebbe niente da decidere. Con
// la curva convessa nasce la scelta vera: un fuoriclasse e nove minimi, oppure
// cinque buoni? È la domanda che si fa un GM ogni estate.
//
// GLI ANCORAGGI SONO MISURATI, NON SCELTI A OCCHIO. Sul dataset di oggi (2412
// carte, 2014-15 → 2019-20) i voti stanno fra 10 e 91, mediana 48, p95 75. La
// curva è tarata perché la carta MEDIANA costi come il salario mediano NBA vero,
// circa 6 milioni: da lì l'esponente 2.8, non da un numero tondo qualsiasi.
//
// IL RUMORE SERVE AL BUIO DI INCUBO. Il contratto è stato firmato in passato,
// quindi non fotografa il valore di oggi: esistono rookie sottopagati e veterani
// strapagati, ed è la cosa più NBA che ci sia. Senza rumore il salario sarebbe il
// voto riscalato, e in Incubo - dove il voto è nascosto - il prezzo lo rimetterebbe
// in chiaro, cancellando il draft al buio. Col rumore il prezzo è un indizio
// sporco: ti dice quanto spendi, non quanto vale.

import { votoCarta } from "./rating.js";

// Contratto minimo e max contract, in dollari veri. La NBA 2025-26 sta sui 2,1
// milioni di minimo e sui 55 di supermax: numeri tondi che chiunque riconosce.
export const SALARIO_MIN = 2_000_000;
export const SALARIO_MAX = 55_000_000;

// Sotto VOTO_MIN si firma al minimo, sopra VOTO_MAX si paga il max contract: la
// curva vive fra questi due estremi. VOTO_MAX è 90 perché la carta più forte del
// dataset vale 91, cioè il max contract deve esistere ma toccarlo in due o tre.
const VOTO_MIN = 20;
const VOTO_MAX = 90;

// L'esponente della convessità. 2.8 è quello che porta la carta mediana (48) a
// costare 6 milioni; con 1 la curva sarebbe una retta e il cap non morderebbe.
const GAMMA = 2.8;

// Quanto il contratto può scostarsi dal valore vero, in più o in meno.
export const RUMORE = 0.25;

// I salari si arrotondano ai centomila: un cartellino da "$12.4M" si legge, uno
// da "$12.437.219" no.
const PASSO = 100_000;

/**
 * Il salario "giusto" per un voto, prima del rumore del contratto.
 * Curva a potenza fra il minimo e il max contract.
 */
export function salarioDaVoto(voto, fattore = 1) {
  const t = Math.min(1, Math.max(0, (voto - VOTO_MIN) / (VOTO_MAX - VOTO_MIN)));
  const grezzo = (SALARIO_MIN + (SALARIO_MAX - SALARIO_MIN) * Math.pow(t, GAMMA)) * fattore;
  const tondo = Math.round(grezzo / PASSO) * PASSO;
  return Math.min(SALARIO_MAX, Math.max(SALARIO_MIN, tondo));
}

// Hash FNV-1a: serve un numero stabile per carta, non un numero casuale. Lo
// stesso giocatore-stagione deve avere lo stesso contratto in ogni partita, a
// ogni apertura, su ogni dispositivo - altrimenti l'affare di ieri non è più
// l'affare di oggi e il giocatore non può impararlo.
function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Il moltiplicatore del contratto di una carta: 1 - RUMORE (affare) → 1 + RUMORE
 * (zavorra). Deterministico su giocatore + stagione, come `chiaveCarta` nel pool:
 * LeBron 2016 e LeBron 2018 sono due contratti diversi.
 */
export function fattoreContratto(carta) {
  const chiave = `${carta?.player_id ?? "?"}|${carta?.season ?? "?"}`;
  // hash / 2^32 dà un numero in [0,1), che stiro sulla banda del rumore.
  const u = hash(chiave) / 0x100000000;
  return 1 - RUMORE + 2 * RUMORE * u;
}

/** Il cartellino vero di una carta: curva sul suo voto, più il suo contratto. */
export function salarioCarta(carta) {
  return salarioDaVoto(votoCarta(carta), fattoreContratto(carta));
}

/**
 * Quanto budget va tenuto da parte per le caselle ancora da riempire.
 *
 * È la rete che impedisce il draft bloccato: senza, con due caselle vuote e tre
 * milioni in cassa il draft si inchioda e la partita non finisce. Nella NBA vera
 * la stessa cosa si chiama eccezione del minimo - una squadra sotto il tetto può
 * sempre firmare un contratto al minimo.
 */
export function prenotato(caselleVuote) {
  return Math.max(0, caselleVuote) * SALARIO_MIN;
}

/**
 * Puoi firmare questa carta?
 * `vuote` sono le caselle vuote PRIMA della firma, quindi dopo ne restano
 * `vuote - 1` da coprire con almeno il minimo a testa.
 */
export function firmabile(costo, residuo, vuote) {
  return costo <= residuo - prenotato(vuote - 1);
}

/** "$12.4M" - come lo scrive un sito di basket, non un bilancio. */
export function formattaSalario(dollari) {
  return `$${(dollari / 1_000_000).toFixed(1)}M`;
}

/**
 * La firma di ripiego, cioè l'ultima rete contro il draft bloccato.
 *
 * `prenotato` garantisce di avere in cassa un minimo per ogni casella vuota, ma
 * non che esista una carta a quel prezzo: al banco il draft si è inchiodato a
 * 6 caselle su 10 con 8 milioni in cassa e nessun candidato sotto i 2,6. Da qui
 * la regola, che è poi l'eccezione del minimo della NBA vera: se NESSUNA carta
 * dello spin è firmabile al suo prezzo, la meno cara accetta il contratto minimo.
 *
 * Non è una scappatoia per avere i fuoriclasse a poco: la carta che scende al
 * minimo è sempre quella che costa meno, cioè la peggiore del mazzo.
 *
 * Restituisce l'indice della carta di ripiego, oppure -1 se non serve perché
 * qualcosa di firmabile c'è già.
 */
export function firmaDiRipiego(costi, residuo, vuote) {
  if (!Array.isArray(costi) || costi.length === 0) return -1;
  if (costi.some((c) => firmabile(c, residuo, vuote))) return -1;
  let iMin = 0;
  for (let i = 1; i < costi.length; i++) if (costi[i] < costi[iMin]) iMin = i;
  return iMin;
}

// ---------------------------------------------------------------------------
// IL SECONDO APRON, cioè la valvola che tiene vivo il sogno dello squadrone.
// ---------------------------------------------------------------------------
//
// PERCHÉ SERVE. Cinque carte da 90+ costano circa 50 milioni l'una: 250 in
// tutto, che non entrano sotto nessun tetto ragionevole. Se il tetto è un muro,
// "mi sono capitati cinque fuoriclasse" diventa "ne firmo due e guardo gli altri
// tre passare", che è la sensazione peggiore che un draft possa dare. Deciso con
// Tomas il 2026-08-18: il tetto non è un muro, è la soglia oltre cui PAGHI.
//
// È la regola vera della NBA di oggi. Sopra il tetto c'è la luxury tax, e sopra
// ancora i due apron: più spendi, più cose non puoi più fare. Qui la scala è
// ridotta a una sola: puoi salire fino al secondo apron, e ogni milione speso
// oltre il tetto ti toglie qualcosa in campo.
//
// LA TASSA SI PAGA IN REPARTI, NON IN PUNTI. Il bersaglio concordato è "1 punto
// di margine a partita ogni 5 milioni di sforo", ma il motore non sa togliere
// punti: sa solo far giocare due squadre. Toglierli a fine partita spaccherebbe
// il tabellino, che a quel punto non sommerebbe più il punteggio. Quindi la
// tassa abbassa i CINQUE REPARTI della tua squadra, e i punti si perdono da soli
// dove si perdono davvero: tiri meno bene, difendi peggio, prendi meno rimbalzi.
//
// DA DOVE ESCE 0.2. Con K_EFFICIENZA 0.45 e 99 possessi, un punto di reparto
// d'attacco vale ~0,45 punti a partita, e altrettanto ne vale uno di difesa
// (peggiora il loro attacco). Cinque punti di reparto su tutti e cinque i
// reparti valgono quindi circa 5 punti di margine, cioè 1 punto ogni 5 milioni
// di sforo: il bersaglio. Resta PROVVISORIA come i tetti, perché la
// saturazione (`satura` in partita.js) morde sugli scarti grandi e solo il banco
// dice quanto.
export const APRON = 0.25;
export const TASSA_PER_MILIONE = 0.2;

/** Il tetto vero vero: oltre questo non si firma, nemmeno pagando. */
export function limiteDuro(tetto) {
  return Math.round(tetto * (1 + APRON));
}

/** Di quanto hai superato il tetto. Zero se sei sotto. */
export function sforo(speso, tetto) {
  return Math.max(0, speso - tetto);
}

/**
 * Quanti punti di reparto costa lo sforo, da togliere a tutti e cinque.
 * Zero se stai sotto il tetto: chi non sfora non paga niente.
 */
export function malusApron(speso, tetto) {
  return (sforo(speso, tetto) / 1_000_000) * TASSA_PER_MILIONE;
}

/** Il monte ingaggi di una lista di carte. */
export function monteIngaggi(carte) {
  return carte.reduce((s, c) => s + (c ? salarioCarta(c) : 0), 0);
}
