// Salario stagionale nominale reale, indicizzato per giocatore+stagione.
// Dove manca il dato resta esplicitamente null; il gioco usa allora l'OVR.

import { SALARI_STORICI } from "./salary-data.js";

// Contratto minimo e max contract, in dollari veri. La NBA 2025-26 sta sui 2,1
// milioni di minimo e sui 55 di supermax: numeri tondi che chiunque riconosce.
export const SALARIO_MIN = 2_000_000;
export const SALARIO_MAX = 55_000_000;

// Sotto VOTO_MIN si firma al minimo, a VOTO_MAX si paga il max contract: la
// curva vive fra questi due estremi. La base è l'OVR 2K mostrato sulla carta,
// che nel dataset può arrivare a 99.
const VOTO_MIN = 20;
const VOTO_MAX = 99;

// L'esponente della convessità. Mantiene molto più costosi gli OVR d'élite
// rispetto agli OVR bassi; con 1 la curva sarebbe una retta e il cap morderebbe meno.
const GAMMA = 2.8;

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

/** Il dato storico grezzo; null significa davvero mancante. */
export function salarioStorico(carta) {
  return SALARI_STORICI[`${carta?.player_id}|${carta?.season}`] ?? null;
}

// Il salario storico resta quello vero, ma non può allontanarsi più di tanto
// da quello che l'OVR implicherebbe. Senza banda, un rookie sottopagato per
// davvero (contratto di scala) può costare meno di un veterano mediocre con
// contratto gonfiato: playtest del 15/09, caso Davis 88 a 11.4M contro
// Campbell 83 a 29M nello stesso spin - il più forte costava meno, ed era un
// pasto gratis che toglieva ogni tensione al tetto. La banda tiene vivo il
// sapore storico (bargain e contratti-capestro restano) ma taglia le
// inversioni: sopra o sotto un certo punto, il prezzo torna a seguire l'OVR.
// Il floor è 0.6 e non 0.5: verificato sul caso reale (Davis 88 vs Campbell 83,
// stesso spin) che con 0.5 il più forte restava comunque più economico - il
// pavimento doveva salire abbastanza da chiudere anche quel gap, non solo
// stringerlo.
export const BANDA_STORICO_MIN = 0.6;
export const BANDA_STORICO_MAX = 1.5;

/** Il salario storico, tenuto dentro la banda attorno alla formula OVR. */
export function clampStorico(formula, storico) {
  const min = Math.round((formula * BANDA_STORICO_MIN) / PASSO) * PASSO;
  const max = Math.round((formula * BANDA_STORICO_MAX) / PASSO) * PASSO;
  return Math.min(max, Math.max(min, storico));
}

/** Salario reale quando disponibile (dentro la banda), altrimenti costo dall'OVR. */
export function salarioCarta(carta) {
  const formula = salarioDaVoto(carta?.ovr);
  const storico = salarioStorico(carta);
  return storico === null ? formula : clampStorico(formula, storico);
}

export function etichettaSalarioCarta(carta) {
  return salarioStorico(carta) === null ? "Costo draft" : "Salario stagionale";
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
// PERCHÉ SERVE. Cinque carte da 90+ stanno nella fascia più costosa della curva:
// insieme possono superare facilmente qualunque tetto ragionevole. Se il tetto è un muro,
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
