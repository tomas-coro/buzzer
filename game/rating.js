// Voto squadra e voto carta: la sintesi in un numero solo dei cinque reparti.
//
// PERCHÉ NON È PIÙ LA MEDIA DEGLI OVERALL 2K. Il voto serve a due cose: scegliere
// l'avversario del round (opponents.js) e dare al giocatore il numero su cui
// decidere il draft. Se quel numero è l'overall 2K, ma la partita la giocano i
// reparti, il giocatore decide su un dato e ne subisce un altro: al banco, la
// correlazione tra media OVR e forza vera nei reparti è appena 0.50, e in una
// partita su cinque la squadra con l'OVR più alto era davvero la più debole.
// Non è una sorpresa emozionante, è una trappola. Ora il numero che leggi è lo
// stesso che scende in campo.
//
// L'OVR 2K resta sulla carta come dato reale (è il rating vero del gioco), ma non
// decide più niente.
//
// I PESI NON SONO A OCCHIO: escono dall'impatto che un punto di reparto ha sul
// margine finale in partita.js. Se un domani si tara il motore, i pesi si
// spostano da soli - il voto non può mentire su come funziona la partita.

import { mediaReparti, REPARTI } from "./reparti.js";
import {
  attacco, K_EFFICIENZA, K_RIMBALZI, PPP_BASE, POSSESSI_BASE,
} from "./partita.js";

export const DEFAULT_K = {};

// Punti di margine guadagnati da UN punto in più di ciascun reparto, su una
// partita intera:
// - attacco e difesa passano dall'efficienza: +1 vale K_EFFICIENZA/100 punti per
//   possesso, per tutti i possessi della partita. La difesa conta come tutto
//   l'attacco messo insieme, perché toglie all'avversario quello che l'attacco
//   aggiunge a te;
// - i rimbalzi passano dai possessi, e contano DOPPIO: il pallone che prendi tu
//   è quello che l'altro non ha.
function pesiGrezzi() {
  const perEfficienza = (K_EFFICIENZA / 100) * POSSESSI_BASE;
  const perRimbalzo = 2 * (K_RIMBALZI / 100) * POSSESSI_BASE * PPP_BASE;
  // Quanto ogni reparto d'attacco pesa dentro `attacco()`: lo chiedo alla
  // funzione vera invece di ricopiarne i coefficienti, che si sfaserebbero.
  const zero = { t3: 0, fin: 0, dif: 0, reb: 0, reg: 0 };
  const quota = (r) => attacco({ ...zero, [r]: 1 });
  return {
    t3: quota("t3") * perEfficienza,
    fin: quota("fin") * perEfficienza,
    reg: quota("reg") * perEfficienza,
    dif: perEfficienza,
    reb: perRimbalzo,
  };
}

// Pesi normalizzati a somma 1. Con i valori attuali: attacco 39.7% (tiro 11.9,
// finalizzazione 15.9, regia 11.9), difesa 39.7%, rimbalzi 22.4%.
export const PESI = (() => {
  const g = pesiGrezzi();
  const somma = REPARTI.reduce((s, r) => s + g[r], 0);
  const out = {};
  for (const r of REPARTI) out[r] = g[r] / somma;
  return out;
})();

function checkReparti(reparti, chi) {
  if (!reparti || typeof reparti !== "object") {
    throw new Error(`${chi}: mancano i reparti`);
  }
  for (const r of REPARTI) {
    const v = reparti[r];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new Error(`${chi}: reparto '${r}' mancante o non numerico`);
    }
  }
}

// Voto 0-99 da un gruppo di reparti. È la scala nativa del motore: i reparti sono
// percentili dentro la stagione, quindi 50 è il giocatore mediano. Per il numero
// da mostrare a schermo c'è la mappa in prototype/imbattuto/display.js.
export function votoDaReparti(reparti) {
  checkReparti(reparti, "votoDaReparti");
  let v = 0;
  for (const r of REPARTI) v += PESI[r] * reparti[r];
  return Math.round(v);
}

// Voto di una singola carta: il numero grande della scheda nel draft.
export function votoCarta(carta) {
  if (!carta || typeof carta !== "object") throw new Error("votoCarta: carta mancante");
  checkReparti(carta.reparti, `votoCarta: carta '${carta.name ?? "?"}'`);
  return votoDaReparti(carta.reparti);
}

// Voto di squadra. Restituisce anche i reparti medi, perché è quello che serve
// alla simulazione: il voto è una sintesi per il giocatore e per la scelta
// dell'avversario, ma la partita si gioca sui cinque numeri, non su uno.
export function teamRating(cards, _k = DEFAULT_K) {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("teamRating: servono almeno una carta");
  }
  const reparti = mediaReparti(cards);
  return { ovr: votoDaReparti(reparti), reparti };
}
