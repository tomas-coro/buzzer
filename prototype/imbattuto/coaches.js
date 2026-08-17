// Panchina: 30 allenatori NBA veri, storici e attuali.
//
// Perché veri e non "Coach d'Attacco": il draft pesca squadre e giocatori reali,
// e un nome inventato accanto a loro suona finto. Il nome dice CHI, la tattica
// dice COSA FA, i plus e il malus dicono QUANTO - e su chi.
//
// COME SI LEGGE UNA SCHEDA (la forma la controlla game/coach.js)
//   tattica     riga breve che spiega l'idea di gioco. Massimo 30 caratteri:
//               nella riga coach a 390px la colonna della tattica è larga ~150px,
//               oltre i 30 caratteri va a capo e lascia parole orfane
//   plus        DUE interventi. Con `ruoli` è MIRATO: vale VALORE_MIRATO (+8) ma
//               solo su quei ruoli. Senza `ruoli` è DIFFUSO: vale VALORE_DIFFUSO
//               (+4) su tutta la rosa. È la differenza tra "i miei lunghi
//               difendono" e "la mia squadra difende un po' meglio"
//   malus       UN reparto che peggiora, il prezzo della tattica (-5 a tutti).
//               Nessun coach è un regalo: chi corre difende peggio, chi difende
//               segna meno
//   ritmo       -1 (palla in mano) … +1 (corsa continua). Decide i possessi
//   rotazione   "corta" 36'/12' · "normale" 32'/16' · "larga" 28'/20'
//   anelli      titoli NBA veri da capo allenatore: colore, il gioco usa champ_bonus
//   champ_bonus punti su tutti i reparti di tutti. Scalato dagli anelli
//               (0 → 0, 1-3 → +1, 4+ → +2): gli 11 titoli di Jackson come +11
//               avrebbero spaccato la scala 0-99
//   profilo     "off" | "bil" | "dif" - serve solo a pescare tre coach che
//               offrano una scelta vera (vedi pickCoaches)
//
// Dieci per profilo: con 30 schede e una terna per run, due corse di fila non
// propongono quasi mai gli stessi tre nomi.
export const COACHES = [
  // ── profilo offensivo ────────────────────────────────────────────────────
  { id: "dantoni", name: "Mike D'Antoni", tattica: "Seven seconds or less",
    plus: [{ reparto: "t3", ruoli: ["PG", "SG", "SF"] }, { reparto: "reg" }],
    malus: { reparto: "dif" }, ritmo: 1, rotazione: "corta",
    anelli: 0, champ_bonus: 0, profilo: "off" },

  { id: "auerbach", name: "Red Auerbach", tattica: "Tutti in contropiede",
    plus: [{ reparto: "fin" }, { reparto: "reb", ruoli: ["PF", "C"] }],
    malus: { reparto: "t3" }, ritmo: 0.8, rotazione: "larga",
    anelli: 9, champ_bonus: 2, profilo: "off" },

  { id: "nelson", name: "Don Nelson", tattica: "Small ball, quintetti storti",
    plus: [{ reparto: "t3" }, { reparto: "reg", ruoli: ["PG", "SG"] }],
    malus: { reparto: "reb" }, ritmo: 0.9, rotazione: "larga",
    anelli: 0, champ_bonus: 0, profilo: "off" },

  { id: "mazzulla", name: "Joe Mazzulla", tattica: "Tiro da tre o niente",
    plus: [{ reparto: "t3", ruoli: ["SG", "SF", "PF"] }, { reparto: "dif" }],
    malus: { reparto: "fin" }, ritmo: 0.3, rotazione: "normale",
    anelli: 1, champ_bonus: 1, profilo: "off" },

  { id: "kerr", name: "Steve Kerr", tattica: "Palla che gira, mai ferma",
    plus: [{ reparto: "reg", ruoli: ["PG", "SG"] }, { reparto: "t3" }],
    malus: { reparto: "reb" }, ritmo: 0.5, rotazione: "larga",
    anelli: 4, champ_bonus: 2, profilo: "off" },

  { id: "westhead", name: "Paul Westhead", tattica: "Il sistema: 130 a sera",
    plus: [{ reparto: "fin" }, { reparto: "t3", ruoli: ["SG", "SF"] }],
    malus: { reparto: "dif" }, ritmo: 1, rotazione: "larga",
    anelli: 1, champ_bonus: 1, profilo: "off" },

  { id: "adelman", name: "Rick Adelman", tattica: "Corner offense, palla dentro",
    plus: [{ reparto: "fin", ruoli: ["PF", "C"] }, { reparto: "reg" }],
    malus: { reparto: "dif" }, ritmo: 0.2, rotazione: "normale",
    anelli: 0, champ_bonus: 0, profilo: "off" },

  { id: "karl", name: "George Karl", tattica: "Transizione a tutta",
    plus: [{ reparto: "fin" }, { reparto: "reg", ruoli: ["PG"] }],
    malus: { reparto: "reb" }, ritmo: 0.9, rotazione: "larga",
    anelli: 0, champ_bonus: 0, profilo: "off" },

  { id: "moe", name: "Doug Moe", tattica: "Passing game, zero blocchi",
    plus: [{ reparto: "reg", ruoli: ["PG", "SG", "SF"] }, { reparto: "fin" }],
    malus: { reparto: "dif" }, ritmo: 0.7, rotazione: "normale",
    anelli: 0, champ_bonus: 0, profilo: "off" },

  { id: "daigneault", name: "Mark Daigneault", tattica: "Cinque che tirano",
    plus: [{ reparto: "t3" }, { reparto: "dif", ruoli: ["PG", "SG", "SF"] }],
    malus: { reparto: "reb" }, ritmo: 0.4, rotazione: "larga",
    anelli: 1, champ_bonus: 1, profilo: "off" },

  // ── profilo equilibrato ──────────────────────────────────────────────────
  { id: "jackson", name: "Phil Jackson", tattica: "Attacco a triangolo",
    plus: [{ reparto: "reg", ruoli: ["SF", "PF"] }, { reparto: "fin" }],
    malus: { reparto: "t3" }, ritmo: -0.2, rotazione: "normale",
    anelli: 11, champ_bonus: 2, profilo: "bil" },

  { id: "riley", name: "Pat Riley", tattica: "Showtime, poi pugni chiusi",
    plus: [{ reparto: "fin", ruoli: ["PG", "SF"] }, { reparto: "reb" }],
    malus: { reparto: "t3" }, ritmo: 0.3, rotazione: "corta",
    anelli: 5, champ_bonus: 2, profilo: "bil" },

  { id: "sloan", name: "Jerry Sloan", tattica: "Pick and roll, all'infinito",
    plus: [{ reparto: "fin", ruoli: ["PG", "PF", "C"] }, { reparto: "reb" }],
    malus: { reparto: "t3" }, ritmo: -0.2, rotazione: "corta",
    anelli: 0, champ_bonus: 0, profilo: "bil" },

  { id: "carlisle", name: "Rick Carlisle", tattica: "Sistemi imparati a memoria",
    plus: [{ reparto: "reg" }, { reparto: "t3", ruoli: ["SG", "SF"] }],
    malus: { reparto: "reb" }, ritmo: 0, rotazione: "normale",
    anelli: 1, champ_bonus: 1, profilo: "bil" },

  { id: "rivers", name: "Doc Rivers", tattica: "Ubuntu, tutti insieme",
    plus: [{ reparto: "dif" }, { reparto: "reg", ruoli: ["PG"] }],
    malus: { reparto: "fin" }, ritmo: 0, rotazione: "normale",
    anelli: 1, champ_bonus: 1, profilo: "bil" },

  { id: "wilkens", name: "Lenny Wilkens", tattica: "Squadra prima del talento",
    plus: [{ reparto: "dif" }, { reparto: "reg" }],
    malus: { reparto: "fin" }, ritmo: 0, rotazione: "larga",
    anelli: 1, champ_bonus: 1, profilo: "bil" },

  { id: "nurse", name: "Nick Nurse", tattica: "Zone strane a sorpresa",
    plus: [{ reparto: "dif", ruoli: ["SF", "PF", "C"] }, { reparto: "t3" }],
    malus: { reparto: "reb" }, ritmo: 0.2, rotazione: "normale",
    anelli: 1, champ_bonus: 1, profilo: "bil" },

  { id: "tomjanovich", name: "Rudy Tomjanovich", tattica: "Mai dubitare del cuore",
    plus: [{ reparto: "fin" }, { reparto: "t3", ruoli: ["SG", "SF"] }],
    malus: { reparto: "dif" }, ritmo: 0.3, rotazione: "normale",
    anelli: 2, champ_bonus: 1, profilo: "bil" },

  { id: "kcjones", name: "K.C. Jones", tattica: "Palla dentro, ai lunghi",
    plus: [{ reparto: "fin", ruoli: ["PF", "C"] }, { reparto: "reb", ruoli: ["PF", "C"] }],
    malus: { reparto: "t3" }, ritmo: -0.1, rotazione: "corta",
    anelli: 2, champ_bonus: 1, profilo: "bil" },

  { id: "malone", name: "Michael Malone", tattica: "Dentro e fuori, due tocchi",
    plus: [{ reparto: "fin", ruoli: ["C"] }, { reparto: "t3" }],
    malus: { reparto: "dif" }, ritmo: 0.1, rotazione: "normale",
    anelli: 1, champ_bonus: 1, profilo: "bil" },

  // ── profilo difensivo ────────────────────────────────────────────────────
  { id: "popovich", name: "Gregg Popovich", tattica: "Bella palla, zero eroi",
    plus: [{ reparto: "dif" }, { reparto: "reg" }],
    malus: { reparto: "reb" }, ritmo: -0.3, rotazione: "larga",
    anelli: 5, champ_bonus: 2, profilo: "dif" },

  { id: "daly", name: "Chuck Daly", tattica: "Bad Boys, si passa sul corpo",
    plus: [{ reparto: "dif", ruoli: ["PF", "C"] }, { reparto: "reb" }],
    malus: { reparto: "t3" }, ritmo: -0.4, rotazione: "corta",
    anelli: 2, champ_bonus: 1, profilo: "dif" },

  { id: "thibodeau", name: "Tom Thibodeau", tattica: "Muro e ICE sul blocco",
    plus: [{ reparto: "dif", ruoli: ["PF", "C"] }, { reparto: "reb", ruoli: ["PF", "C"] }],
    malus: { reparto: "reg" }, ritmo: -0.5, rotazione: "corta",
    anelli: 0, champ_bonus: 0, profilo: "dif" },

  { id: "spoelstra", name: "Erik Spoelstra", tattica: "Heat culture, pressing",
    plus: [{ reparto: "dif", ruoli: ["PG", "SG", "SF"] }, { reparto: "fin" }],
    malus: { reparto: "reb" }, ritmo: 0.2, rotazione: "normale",
    anelli: 2, champ_bonus: 1, profilo: "dif" },

  { id: "hubiebrown", name: "Hubie Brown", tattica: "Difesa a tutto campo",
    plus: [{ reparto: "dif" }, { reparto: "reb", ruoli: ["PF", "C"] }],
    malus: { reparto: "t3" }, ritmo: -0.3, rotazione: "corta",
    anelli: 0, champ_bonus: 0, profilo: "dif" },

  { id: "fratello", name: "Mike Fratello", tattica: "Il Czar: 82 possessi",
    plus: [{ reparto: "dif" }, { reparto: "reb" }],
    malus: { reparto: "fin" }, ritmo: -1, rotazione: "corta",
    anelli: 0, champ_bonus: 0, profilo: "dif" },

  { id: "vangundy", name: "Jeff Van Gundy", tattica: "Ogni canestro costa sangue",
    plus: [{ reparto: "dif", ruoli: ["SF", "PF", "C"] }, { reparto: "reb" }],
    malus: { reparto: "fin" }, ritmo: -0.6, rotazione: "corta",
    anelli: 0, champ_bonus: 0, profilo: "dif" },

  { id: "udoka", name: "Ime Udoka", tattica: "Cambi su tutto, niente aiuti",
    plus: [{ reparto: "dif", ruoli: ["SG", "SF", "PF"] }, { reparto: "reg" }],
    malus: { reparto: "t3" }, ritmo: -0.2, rotazione: "normale",
    anelli: 0, champ_bonus: 0, profilo: "dif" },

  { id: "larrybrown", name: "Larry Brown", tattica: "Giocare nel modo giusto",
    plus: [{ reparto: "dif" }, { reparto: "reg", ruoli: ["PG"] }],
    malus: { reparto: "fin" }, ritmo: -0.5, rotazione: "corta",
    anelli: 1, champ_bonus: 1, profilo: "dif" },

  { id: "ramsay", name: "Jack Ramsay", tattica: "Difesa, poi si corre",
    plus: [{ reparto: "dif", ruoli: ["PG", "SG"] }, { reparto: "fin" }],
    malus: { reparto: "reb" }, ritmo: 0.4, rotazione: "normale",
    anelli: 1, champ_bonus: 1, profilo: "dif" },
];

const PROFILI = ["off", "bil", "dif"];

// Etichette dei reparti per la scheda coach. Stanno qui e non nella schermata
// perché le usano sia il coach sia il briefing della partita, e due elenchi
// diversi finiscono per divergere.
export const NOME_REPARTO = {
  t3: "Tiro da tre", fin: "Finalizzazione", dif: "Difesa",
  reb: "Rimbalzi", reg: "Regia",
};

export const NOME_RUOLO = {
  PG: "playmaker", SG: "guardie", SF: "ali piccole", PF: "ali forti", C: "centri",
};

// Come si legge un plus o un malus in italiano: "Difesa · ali forti e centri"
// oppure "Regia · tutta la squadra". Serve alla riga del coach.
export function descriviEffetto(eff) {
  if (!eff) return "";
  const dove = eff.ruoli
    ? eff.ruoli.map((r) => NOME_RUOLO[r]).join(" e ")
    : "tutta la squadra";
  return `${NOME_REPARTO[eff.reparto]} · ${dove}`;
}

// Pesca tre coach: uno offensivo, uno equilibrato, uno difensivo.
// Non tre a caso: tre a caso possono uscire tutti difensivi e la scelta smette
// di essere una scelta. Così ogni run cambia i nomi ma tiene il bivio.
export function pickCoaches(rnd = Math.random) {
  return PROFILI.map((p) => {
    const gruppo = COACHES.filter((c) => c.profilo === p);
    if (gruppo.length === 0) throw new Error(`Nessun coach con profilo '${p}'`);
    return gruppo[Math.floor(rnd() * gruppo.length)];
  });
}
