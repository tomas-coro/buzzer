// La rosa da 10: cinque titolari legati al ruolo, cinque posti di panchina liberi.
//
// PERCHÉ DIECI E NON CINQUE. Con cinque carte la panchina non esiste, quindi non
// esistono i minuti, quindi il punto a punto non ha nessuno da mandare in campo
// a metà secondo quarto. E una squadra di cinque uomini che gioca 48 minuti a
// testa non è una squadra di basket: è un tabellone con cinque nomi sopra.
//
// LE TRE REGOLE CHE REGGONO IL MODULO
//
// 1. IL QUINTETTO HA I RUOLI, LA PANCHINA NO. Le cinque caselle titolari sono
//    PG SG SF PF C e accettano solo chi può giocarci. I cinque posti di
//    panchina - 6°, 7°, 8°, 9°, 10° uomo - accettano CHIUNQUE: se vuoi cinque
//    playmaker in panchina, li metti (deciso al grill del 2026-08-18, sulla
//    falsariga di eraball, che ha 5 titolari con posizione e una panchina
//    senza). Un quintetto senza ruoli invece non reggerebbe: senza nessuno che
//    porta palla la partita non ha più senso, e il draft nemmeno.
//
// 2. I MINUTI SONO IL PESO DI TUTTO, E ADESSO SONO UNA GERARCHIA. Non più
//    "titolare 32, riserva 16" per tutti: il 6° uomo gioca quasi da titolare,
//    il 7°-8° meno, il 9°-10° ancora meno. Dove piazzi una carta in panchina è
//    una scelta di minuti, cioè di strategia - è il motivo per cui i posti sono
//    numerati e non intercambiabili.
//
// 3. IL RUOLO DI UN PANCHINARO VIENE DALLA SUA CARTA. La casella non gliene dà
//    uno, ma il motore ne ha bisogno in due punti veri (chi è "lungo" per i
//    rimbalzi in playbyplay.js, e i plus/malus del coach mirati per ruolo):
//    lì si legge `carta.pos.primary`. Vedi `ruoloDi`.
//
// I minuti totali fanno sempre 240 (5 uomini in campo × 48 minuti), qualunque
// rotazione si scelga: se allunghi i titolari, la panchina perde esattamente
// quello che loro guadagnano.

import { ROLES, canPlay } from "./roster.js";
import { REPARTI } from "./reparti.js";

export const TITOLARE = "titolare";
export const PANCA = "panca";

// I posti di panchina, nell'ordine della gerarchia: il 6 è il sesto uomo.
export const POSTI_PANCA = [6, 7, 8, 9, 10];

// Le dieci caselle nell'ordine in cui si mostrano: prima il quintetto (PG→C),
// poi la panchina (6°→10°). Il box score stampa le righe in questo ordine,
// quindi cambiarlo qui cambia la tabella e nient'altro.
export const SLOTS = [
  ...ROLES.map((ruolo) => ({ tipo: TITOLARE, ruolo })),
  ...POSTI_PANCA.map((posto) => ({ tipo: PANCA, posto })),
];

// Minuti per rotazione. `corta` è l'allenatore che si fida solo dei titolari,
// `larga` quello che tiene tutti freschi. La panchina è una scala: 6° · 7° · 8°
// · 9° · 10°. Ogni riga somma 240 e c'è un test che lo verifica.
export const MINUTI = {
  corta:   { titolare: 34, panca: { 6: 26, 7: 14, 8: 14, 9: 8,  10: 8  } },
  normale: { titolare: 32, panca: { 6: 24, 7: 16, 8: 16, 9: 12, 10: 12 } },
  larga:   { titolare: 30, panca: { 6: 22, 7: 18, 8: 18, 9: 16, 10: 16 } },
};

// Quanti minuti vale una casella in questa rotazione.
export function minutiSlot(slot, rotazione = "normale") {
  const m = MINUTI[rotazione];
  if (!m) throw new Error(`Rotazione inesistente: ${rotazione}`);
  return slot.tipo === TITOLARE ? m.titolare : m.panca[slot.posto];
}

/**
 * Il ruolo con cui il motore tratta una carta in una certa casella.
 * Titolare: quello della casella. Panchina: quello della carta, perché il posto
 * in panchina non è una posizione in campo (vedi regola 3 in cima).
 */
export function ruoloDi(carta, slot) {
  return slot.tipo === TITOLARE ? slot.ruolo : carta?.pos?.primary ?? null;
}

export function emptyRosa() {
  const titolari = {};
  for (const ruolo of ROLES) titolari[ruolo] = null;
  const panca = {};
  for (const posto of POSTI_PANCA) panca[posto] = null;
  return { titolari, panca };
}

function checkSlot(slot) {
  if (!slot || typeof slot !== "object") throw new Error("Casella mancante");
  if (slot.tipo === TITOLARE) {
    if (!ROLES.includes(slot.ruolo)) throw new Error(`Ruolo inesistente: ${slot.ruolo}`);
    return;
  }
  if (slot.tipo === PANCA) {
    if (!POSTI_PANCA.includes(slot.posto)) throw new Error(`Posto di panchina inesistente: ${slot.posto}`);
    return;
  }
  throw new Error(`Tipo di casella inesistente: ${slot.tipo}`);
}

// La carta che sta in una casella (null se vuota).
export function cartaIn(rosa, slot) {
  checkSlot(slot);
  return slot.tipo === TITOLARE ? rosa.titolari[slot.ruolo] : rosa.panca[slot.posto];
}

/**
 * Piazza una carta in una casella. Torna una rosa nuova, non tocca quella data.
 * In panchina non c'è nessun controllo di ruolo: è il punto della panchina.
 */
export function assegnaRosa(rosa, slot, carta) {
  checkSlot(slot);
  if (cartaIn(rosa, slot) !== null) throw new Error(`Casella ${etichettaSlot(slot)} già occupata`);
  if (slot.tipo === TITOLARE) {
    if (!canPlay(carta, slot.ruolo)) throw new Error(`Carta incompatibile con ${slot.ruolo}`);
    return { ...rosa, titolari: { ...rosa.titolari, [slot.ruolo]: carta } };
  }
  return { ...rosa, panca: { ...rosa.panca, [slot.posto]: carta } };
}

// Come si chiama una casella quando bisogna scriverlo: "PG titolare", "6° uomo".
export function etichettaSlot(slot) {
  checkSlot(slot);
  if (slot.tipo === TITOLARE) return `${slot.ruolo} titolare`;
  return slot.posto === 6 ? "6° uomo" : `${slot.posto}° uomo`;
}

// Il titolare di questo ruolo è ancora da riempire?
export function titolareLibero(rosa, ruolo) {
  checkSlot({ tipo: TITOLARE, ruolo });
  return rosa.titolari[ruolo] === null;
}

// I posti di panchina ancora vuoti, dal 6° in giù.
export function postiPancaLiberi(rosa) {
  return POSTI_PANCA.filter((posto) => rosa.panca[posto] === null);
}

// Tutte le caselle ancora vuote, nell'ordine degli SLOTS.
export function caselleLibere(rosa) {
  return SLOTS.filter((slot) => cartaIn(rosa, slot) === null);
}

/**
 * Dove può andare QUESTA carta: i titolari liberi che sa giocare, più tutti i
 * posti di panchina liberi. Se torna vuoto, la carta non è piazzabile e il
 * draft la mostra spenta.
 */
export function caselleDove(rosa, carta) {
  return caselleLibere(rosa).filter((slot) => slot.tipo === PANCA || canPlay(carta, slot.ruolo));
}

export function rosaCompleta(rosa) {
  return SLOTS.every((slot) => cartaIn(rosa, slot) !== null);
}

// Le carte in ordine di casella. Su una rosa incompleta salta i buchi, così le
// schermate del draft possono mostrare quello che c'è già.
export function listaRosa(rosa) {
  return SLOTS.map((slot) => cartaIn(rosa, slot)).filter(Boolean);
}

function checkPiena(rosa, chi) {
  if (!rosaCompleta(rosa)) throw new Error(`${chi}: rosa incompleta, servono dieci giocatori`);
}

/**
 * Una riga per giocatore coi minuti che gioca: è l'unico posto dove si decide
 * chi sta in campo quanto. Box score e punto a punto leggono da qui.
 *
 * `ruolo` è quello con cui il motore tratta la carta (vedi `ruoloDi`), `slot`
 * la casella vera: chi deve stampare "8° uomo" usa quella.
 */
export function minutiRosa(rosa, rotazione = "normale") {
  checkPiena(rosa, "minutiRosa");
  if (!MINUTI[rotazione]) throw new Error(`Rotazione inesistente: ${rotazione}`);
  return SLOTS.map((slot) => {
    const carta = cartaIn(rosa, slot);
    return {
      carta, slot, tipo: slot.tipo,
      ruolo: ruoloDi(carta, slot),
      minuti: minutiSlot(slot, rotazione),
    };
  });
}

/**
 * I cinque reparti della rosa, pesati per minuti giocati. È il numero che entra
 * in `simulaPartita`: la panchina conta, ma per quanto gioca.
 */
export function repartiRosa(rosa, rotazione = "normale") {
  checkPiena(rosa, "repartiRosa");
  const righe = minutiRosa(rosa, rotazione);
  const totale = righe.reduce((a, r) => a + r.minuti, 0);
  const out = {};
  for (const rep of REPARTI) {
    let somma = 0;
    for (const r of righe) {
      const v = r.carta.reparti?.[rep];
      if (typeof v !== "number" || !Number.isFinite(v)) {
        throw new Error(`repartiRosa: la carta '${r.carta.name ?? "?"}' non ha il reparto '${rep}'`);
      }
      somma += v * r.minuti;
    }
    out[rep] = Math.round(somma / totale);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Rosa costruita da un pool (avversari storici, e anteprima del draft)
// ---------------------------------------------------------------------------

// Ordine di forza. Il pareggio si rompe sull'id e non a caso: la stessa
// squadra-stagione deve produrre sempre la stessa rosa, o la partita di ieri non
// si può rigiocare.
const perForza = (a, b) => b.ovr - a.ovr || String(a.player_id).localeCompare(String(b.player_id));

/**
 * Da un gruppo di carte a una rosa da 10.
 *
 * La regola, dettata al grill: il quintetto prende il migliore di ogni ruolo
 * (prima chi ce l'ha come ruolo primario, poi chi ce l'ha come secondario, e se
 * il ruolo resta scoperto il miglior OVR rimasto - come una squadra vera che
 * mette il quarto lungo da ala piccola perché non ha altri); la panchina prende
 * i cinque migliori rimasti in ordine di forza, quindi il più forte è il 6°
 * uomo. Stessa struttura per le rose avversarie e per l'anteprima del draft.
 */
export function costruisciRosa(carte) {
  if (!Array.isArray(carte) || carte.length < 10) {
    throw new Error("costruisciRosa: serve un pool di almeno dieci carte");
  }
  const presi = new Set();
  const liberi = () => carte.filter((c) => !presi.has(c.player_id));

  let rosa = emptyRosa();
  const scoperti = [];
  for (const ruolo of ROLES) {
    const disponibili = liberi();
    const scelto = disponibili.filter((c) => c.pos?.primary === ruolo).sort(perForza)[0]
      ?? disponibili.filter((c) => c.pos?.secondary === ruolo).sort(perForza)[0];
    if (!scelto) { scoperti.push(ruolo); continue; }
    presi.add(scelto.player_id);
    rosa = assegnaRosa(rosa, { tipo: TITOLARE, ruolo }, scelto);
  }

  for (const ruolo of scoperti) {
    const scelto = liberi().sort(perForza)[0];
    if (!scelto) throw new Error("costruisciRosa: carte finite prima di riempire il quintetto");
    presi.add(scelto.player_id);
    // Piazzamento fuori ruolo: `assegnaRosa` lo rifiuterebbe, ed è giusto che lo
    // rifiuti nel draft. Qui è la regola voluta - meglio un'ala grande da centro
    // che una casella vuota - quindi si scrive diretto, con questa nota accanto.
    rosa = { ...rosa, titolari: { ...rosa.titolari, [ruolo]: scelto } };
  }

  // La panchina non ha ruoli: i cinque migliori rimasti, dal 6° al 10°.
  const panchina = liberi().sort(perForza).slice(0, POSTI_PANCA.length);
  if (panchina.length < POSTI_PANCA.length) {
    throw new Error("costruisciRosa: carte finite prima di riempire la panchina");
  }
  POSTI_PANCA.forEach((posto, i) => {
    presi.add(panchina[i].player_id);
    rosa = assegnaRosa(rosa, { tipo: PANCA, posto }, panchina[i]);
  });
  return rosa;
}
