// Mappa di sola presentazione per il voto-squadra.
//
// Storia: quando il motore derivava attributi propri, il voto squadra usciva su
// una scala nativa ~[71,162] e qui veniva rimappato su [60,99]. Dal passaggio al
// modello "stats reali" (game/rating.js) il voto squadra è la MEDIA degli overall
// 2K delle cinque carte, quindi è già nato sulla scala 0-99: rimapparlo una
// seconda volta faceva vedere 68 per un quintetto di carte da 85, cioè due scale
// diverse nella stessa schermata.
//
// Oggi la funzione è quindi un passthrough con arrotondamento e clamp. Resta come
// unico punto di passaggio: se un domani il motore cambia scala di nuovo, si
// corregge qui e non in dieci schermate.
//
// IMPORTANTE: è solo display. Il motore confronta i voti NATIVI (game/run.js),
// quindi questa funzione non decide mai chi vince, solo l'etichetta a schermo.

const DISP_LO = 40;  // pavimento: sotto non si scende (quintetti impossibili)
const DISP_HI = 99;  // tetto: scala 2K

export function toDisplayOvr(nativo) {
  // Niente fallback silenzioso: input non numerico → errore chiaro, mai NaN.
  if (typeof nativo !== "number" || Number.isNaN(nativo)) {
    throw new Error(`toDisplayOvr: atteso un numero, ricevuto ${nativo}`);
  }
  return Math.min(DISP_HI, Math.max(DISP_LO, Math.round(nativo)));
}
