// Mappa di sola presentazione per il voto-squadra.
//
// Perché esiste: il motore (game/rating.js) produce voti squadra su una scala
// nativa ~[71,162], NON pensata come 0-99. Mostrarli grezzi confonde
// ("Tu 119 vs 71"). Qui li rimappiamo linearmente su [60,99], stile OVR-squadra,
// coerente con le carte giocatore (62-98).
//
// IMPORTANTE: è solo display. Il motore continua a confrontare i voti NATIVI
// (run.js), quindi la mappa — lineare e monotòna — non cambia mai chi vince,
// solo l'etichetta a schermo. Lo storico salva il nativo (dato veritiero).

const NAT_LO = 71;   // voto nativo più basso osservato
const NAT_HI = 160;  // tetto nativo (i leggendari saturano a 99)
const DISP_LO = 60;
const DISP_HI = 99;

export function toDisplayOvr(nativo) {
  // Niente fallback silenzioso: input non numerico → errore chiaro, mai NaN.
  if (typeof nativo !== "number" || Number.isNaN(nativo)) {
    throw new Error(`toDisplayOvr: atteso un numero, ricevuto ${nativo}`);
  }
  const scaled = DISP_LO + ((nativo - NAT_LO) * (DISP_HI - DISP_LO)) / (NAT_HI - NAT_LO);
  const clamped = Math.min(DISP_HI, Math.max(DISP_LO, scaled));
  return Math.round(clamped);
}
