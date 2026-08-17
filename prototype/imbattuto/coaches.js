// Panchina: 12 allenatori NBA veri, storici e attuali.
//
// Perché veri e non "Coach d'Attacco": il draft pesca squadre e giocatori reali,
// e un nome inventato accanto a loro suona finto. Il nome dice CHI, la tattica
// dice COSA FA: sono le due righe della scheda in screens/coach.js.
//
// Campi:
//   tattica     riga breve che spiega l'effetto senza numeri. Massimo 30 caratteri:
//               nella riga coach a 390px la colonna della tattica è larga ~150px,
//               oltre i 30 caratteri va a capo e lascia una o due parole orfane
//               sulla seconda riga
//   off/def     voto A..F → moltiplicatore in game/coach.js (A 1.06 … F 0.91)
//   anelli      titoli NBA veri da capo allenatore: è solo colore, il gioco usa
//               champ_bonus
//   champ_bonus punti sommati al voto squadra dopo il moltiplicatore. Scalato
//               dagli anelli (0 → 0, 1-3 → +1, 4+ → +2): 11 anelli di Jackson
//               come +11 avrebbe spaccato la scala 0-99.
//   profilo     "off" | "bil" | "dif" - serve solo a pescare tre coach che
//               offrano una scelta vera (vedi pickCoaches)
export const COACHES = [
  // ── profilo offensivo ────────────────────────────────────────────────────
  { id: "dantoni", name: "Mike D'Antoni", tattica: "Seven seconds or less",
    off: "A", def: "D", anelli: 0, champ_bonus: 0, profilo: "off" },
  { id: "auerbach", name: "Red Auerbach", tattica: "Tutti a correre in contropiede",
    off: "A", def: "C", anelli: 9, champ_bonus: 2, profilo: "off" },
  { id: "nelson", name: "Don Nelson", tattica: "Small ball, quintetti storti",
    off: "A", def: "D", anelli: 0, champ_bonus: 0, profilo: "off" },
  { id: "mazzulla", name: "Joe Mazzulla", tattica: "Tiro da tre o niente",
    off: "A", def: "C", anelli: 1, champ_bonus: 1, profilo: "off" },

  // ── profilo equilibrato ──────────────────────────────────────────────────
  { id: "jackson", name: "Phil Jackson", tattica: "Attacco a triangolo",
    off: "A", def: "B", anelli: 11, champ_bonus: 2, profilo: "bil" },
  { id: "kerr", name: "Steve Kerr", tattica: "Palla che gira, mai ferma",
    off: "A", def: "B", anelli: 4, champ_bonus: 2, profilo: "bil" },
  { id: "riley", name: "Pat Riley", tattica: "Showtime, poi pugni chiusi",
    off: "B", def: "B", anelli: 5, champ_bonus: 2, profilo: "bil" },
  { id: "sloan", name: "Jerry Sloan", tattica: "Pick and roll, all'infinito",
    off: "B", def: "B", anelli: 0, champ_bonus: 0, profilo: "bil" },

  // ── profilo difensivo ────────────────────────────────────────────────────
  { id: "popovich", name: "Gregg Popovich", tattica: "Bella palla, zero eroi",
    off: "B", def: "A", anelli: 5, champ_bonus: 2, profilo: "dif" },
  { id: "daly", name: "Chuck Daly", tattica: "Bad Boys, si passa sul corpo",
    off: "C", def: "A", anelli: 2, champ_bonus: 1, profilo: "dif" },
  { id: "thibodeau", name: "Tom Thibodeau", tattica: "Muro difensivo, ICE sul blocco",
    off: "C", def: "A", anelli: 0, champ_bonus: 0, profilo: "dif" },
  { id: "spoelstra", name: "Erik Spoelstra", tattica: "Heat culture, pressing totale",
    off: "B", def: "A", anelli: 2, champ_bonus: 1, profilo: "dif" },
];

const PROFILI = ["off", "bil", "dif"];

// Forma attesa dal motore (game/coach.js): off_grade, def_grade, champ_bonus.
// Il resto (nome, tattica, anelli) viaggia insieme perché serve all'esito e
// alla leaderboard, non solo alla schermata di scelta.
export function toEngineCoach(c) {
  return { ...c, off_grade: c.off, def_grade: c.def, champ_bonus: c.champ_bonus };
}

// Pesca tre coach: uno offensivo, uno equilibrato, uno difensivo.
// Non tre a caso: tre a caso possono uscire tutti difensivi e la scelta smette
// di essere una scelta. Così ogni run cambia i nomi ma tiene il bivio.
export function pickCoaches(rnd = Math.random) {
  return PROFILI.map((p) => {
    const gruppo = COACHES.filter((c) => c.profilo === p);
    if (gruppo.length === 0) throw new Error(`Nessun coach con profilo '${p}'`);
    return toEngineCoach(gruppo[Math.floor(rnd() * gruppo.length)]);
  });
}
