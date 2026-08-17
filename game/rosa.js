// La rosa da 10: due giocatori per ruolo, un titolare e una riserva.
//
// PERCHÉ DIECI E NON CINQUE. Con cinque carte la panchina non esiste, quindi non
// esistono i minuti, quindi il punto a punto non ha nessuno da mandare in campo
// a metà secondo quarto. E una squadra di cinque uomini che gioca 48 minuti a
// testa non è una squadra di basket: è un tabellone con cinque nomi sopra.
//
// LE DUE REGOLE CHE REGGONO IL MODULO
//
// 1. DIECI CASELLE FISSE: PG SG SF PF C in versione titolare, gli stessi cinque
//    ruoli in versione riserva. Il draft riempie una casella per turno; niente
//    slot liberi da assegnare dopo, niente schermata di smistamento ruoli.
//
// 2. I MINUTI SONO IL PESO DI TUTTO. Un titolare gioca 32 minuti e una riserva
//    16, quindi il titolare conta il doppio nei reparti di squadra. È da qui che
//    una panchina scarsa costa punti veri: non da un malus appiccicato sopra.
//
// I minuti totali fanno sempre 240 (5 uomini in campo × 48 minuti), qualunque
// rotazione si scelga: se allunghi i titolari, la panchina perde esattamente
// quello che loro guadagnano.

import { ROLES, canPlay } from "./roster.js";
import { REPARTI } from "./reparti.js";

export const TITOLARE = "titolare";
export const RISERVA = "riserva";
const TIPI = [TITOLARE, RISERVA];

// Le dieci caselle nell'ordine in cui si mostrano: prima il quintetto (PG→C),
// poi la panchina (PG→C). Il box score stampa le righe in questo ordine, quindi
// cambiarlo qui cambia la tabella e nient'altro.
export const SLOTS = TIPI.flatMap((tipo) => ROLES.map((ruolo) => ({ ruolo, tipo })));

// Minuti per rotazione. `corta` è l'allenatore che si fida solo dei titolari,
// `larga` quello che tiene tutti freschi. Somma sempre 240.
export const MINUTI = {
  corta:   { titolare: 36, riserva: 12 },
  normale: { titolare: 32, riserva: 16 },
  larga:   { titolare: 28, riserva: 20 },
};

export function emptyRosa() {
  const r = {};
  for (const ruolo of ROLES) r[ruolo] = { [TITOLARE]: null, [RISERVA]: null };
  return r;
}

function checkSlot(ruolo, tipo) {
  if (!ROLES.includes(ruolo)) throw new Error(`Ruolo inesistente: ${ruolo}`);
  if (!TIPI.includes(tipo)) throw new Error(`Tipo di slot inesistente: ${tipo}`);
}

/**
 * Piazza una carta in una casella. Torna una rosa nuova, non tocca quella data.
 */
export function assegnaRosa(rosa, ruolo, tipo, carta) {
  checkSlot(ruolo, tipo);
  if (rosa[ruolo][tipo] !== null) throw new Error(`Slot ${ruolo} ${tipo} già occupato`);
  if (!canPlay(carta, ruolo)) throw new Error(`Carta incompatibile con ${ruolo}`);
  return { ...rosa, [ruolo]: { ...rosa[ruolo], [tipo]: carta } };
}

// Dove va la prossima carta di questo ruolo: prima il titolare, poi la riserva.
// Serve al draft, dove si mira il RUOLO con un tocco e non la singola casella.
export function slotLibero(rosa, ruolo) {
  checkSlot(ruolo, TITOLARE);
  return TIPI.find((tipo) => rosa[ruolo][tipo] === null) ?? null;
}

export function rosaCompleta(rosa) {
  return SLOTS.every(({ ruolo, tipo }) => rosa[ruolo][tipo] !== null);
}

// Le carte in ordine di casella. Su una rosa incompleta salta i buchi, così le
// schermate del draft possono mostrare quello che c'è già.
export function listaRosa(rosa) {
  return SLOTS.map(({ ruolo, tipo }) => rosa[ruolo][tipo]).filter(Boolean);
}

function checkPiena(rosa, chi) {
  if (!rosaCompleta(rosa)) throw new Error(`${chi}: rosa incompleta, servono dieci giocatori`);
}

/**
 * Una riga per giocatore coi minuti che gioca: è l'unico posto dove si decide
 * chi sta in campo quanto. Box score e punto a punto leggono da qui.
 */
export function minutiRosa(rosa, rotazione = "normale") {
  checkPiena(rosa, "minutiRosa");
  const m = MINUTI[rotazione];
  if (!m) throw new Error(`Rotazione inesistente: ${rotazione}`);
  return SLOTS.map(({ ruolo, tipo }) => ({
    carta: rosa[ruolo][tipo], ruolo, tipo, minuti: m[tipo],
  }));
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
 * La regola, dettata al grill: per ogni ruolo i due migliori che possono
 * giocarlo (prima chi ce l'ha come ruolo primario, poi chi ce l'ha come
 * secondario); i posti che restano scoperti vanno al miglior OVR rimasto,
 * qualunque ruolo abbia - come una squadra vera che mette il quarto lungo da
 * ala piccola perché non ha altri.
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
    for (const tipo of TIPI) {
      const disponibili = liberi();
      const scelto = disponibili.filter((c) => c.pos?.primary === ruolo).sort(perForza)[0]
        ?? disponibili.filter((c) => c.pos?.secondary === ruolo).sort(perForza)[0];
      if (!scelto) { scoperti.push({ ruolo, tipo }); continue; }
      presi.add(scelto.player_id);
      rosa = assegnaRosa(rosa, ruolo, tipo, scelto);
    }
  }

  for (const { ruolo, tipo } of scoperti) {
    const scelto = liberi().sort(perForza)[0];
    if (!scelto) throw new Error("costruisciRosa: carte finite prima di riempire la rosa");
    presi.add(scelto.player_id);
    // Piazzamento fuori ruolo: `assegnaRosa` lo rifiuterebbe, ed è giusto che lo
    // rifiuti nel draft. Qui è la regola voluta - meglio un'ala grande da centro
    // che una casella vuota - quindi si scrive diretto, con questa nota accanto.
    rosa = { ...rosa, [ruolo]: { ...rosa[ruolo], [tipo]: scelto } };
  }
  return rosa;
}
