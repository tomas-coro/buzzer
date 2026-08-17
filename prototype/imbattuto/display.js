// Mappa di sola presentazione per i voti (squadra e carta).
//
// Storia in due righe: quando il motore derivava attributi propri il voto usciva
// su una scala ~[71,162] e qui veniva rimappato; poi il voto è diventato la media
// degli overall 2K, già su scala 0-99, e la funzione è rimasta un passthrough.
//
// Da oggi il voto nasce dai REPARTI (game/rating.js), che sono PERCENTILI: 50 è
// il giocatore mediano della sua stagione. Su quella scala un quintetto di
// titolari veri mostra 56, e accanto a carte 2K da 85 sembra scarso - due scale
// diverse nella stessa schermata, di nuovo. Quindi qui si rimappa sul range che
// l'occhio si aspetta da un gioco di basket.
//
// I due estremi non sono a occhio: misurati sulle 2412 carte vere. Il percentile
// 1 delle carte sta a 19, il 99 a 83, il massimo assoluto a 91 (Westbrook
// 2016-17). Prendendo [15, 90] la mappa non taglia nessuno per davvero e lascia
// il 99 a schermo come cosa rarissima.
//
// Cosa si vede, dopo la mappa:
//   riserva di fine panchina  ~63     titolare mediano  ~77
//   quintetto storico mediano ~81     fuoriclasse       ~96
//
// IMPORTANTE: è solo display. Il motore confronta i voti NATIVI e gioca sui
// reparti (game/partita.js), quindi questa funzione non decide mai chi vince.

const NATIVO_LO = 15;
const NATIVO_HI = 90;
const DISP_LO = 60;
const DISP_HI = 99;

export function toDisplayOvr(nativo) {
  // Niente fallback silenzioso: input non numerico → errore chiaro, mai NaN.
  if (typeof nativo !== "number" || Number.isNaN(nativo)) {
    throw new Error(`toDisplayOvr: atteso un numero, ricevuto ${nativo}`);
  }
  const frazione = (nativo - NATIVO_LO) / (NATIVO_HI - NATIVO_LO);
  const disp = DISP_LO + frazione * (DISP_HI - DISP_LO);
  return Math.min(DISP_HI, Math.max(DISP_LO, Math.round(disp)));
}
