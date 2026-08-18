// Banco di taratura della difficoltà: simula corse INTERE (draft di dieci +
// coach + 16 partite) e misura quante finiscono imbattute.
//
// Perché serve: le soglie `oppMin`/`oppMax` in game/difficulty.js decidono quanto
// è forte l'avversario del round, ma il loro effetto vero - "su 100 corse, quante
// finiscono 16-0?" - non si legge dai numeri, si misura. I bersagli concordati
// sono 33 / 12 / 3 / 0,5 per Facile / Normale / Difficile / Incubo.
//
// Il "giocatore" simulato è competente ma non onnisciente: a ogni giro di draft
// prende la carta migliore disponibile per uno slot libero (per voto, non per
// overall 2K), e usa tutti gli aiuti che la difficoltà gli concede. Non conosce
// il futuro, quindi non ottimizza la rosa nel suo insieme.
//
// Uso:
//   node tools/banco-corse.mjs [corse]     (default 400 per difficoltà)

import { CARDS_BY_TEAM_SEASON } from "../prototype/imbattuto/cards.js";
import { pickCoaches } from "../prototype/imbattuto/coaches.js";
import { opponentPool, spinRoster } from "../prototype/imbattuto/pool.js";
import { SLOTS, caselleLibere, caselleDove, TITOLARE } from "../game/rosa.js";
import { votoCarta } from "../game/rating.js";
import { DIFFICULTIES, TETTI } from "../game/difficulty.js";
import { salarioCarta, limiteDuro, firmabile, prenotato, SALARIO_MIN } from "../game/salary.js";
import {
  newRun, draftPick, chooseCoach, startRun, resolveRound,
} from "../game/run.js";

const CORSE = Number(process.argv[2] ?? 400);
const POOL = opponentPool(CARDS_BY_TEAM_SEASON);

// Quanti giri di draft in più concede la difficoltà: uno per aiuto, perché da
// G6 nessun livello ha più switch illimitati.
function giriExtra(d) {
  return d.aids.squadra + d.aids.stagione + d.aids.respin;
}

// Dove il giocatore simulato mette una carta. Prima il quintetto, che gioca più
// minuti di qualsiasi posto di panchina; se il quintetto per lei è pieno, il
// posto libero più alto - e siccome ogni giro pesca la carta migliore rimasta,
// la panchina si riempie da sola in ordine di forza (6° uomo il più forte).
function scegliCasella(rosa, carta) {
  const dove = caselleDove(rosa, carta);
  if (dove.length === 0) return null;
  return dove.find((s) => s.tipo === TITOLARE) ?? dove[0];
}

// Un draft "giocato bene": per ognuna delle dieci caselle gira le rose e tiene
// la carta col voto più alto che sappia coprirla. Da G7 la casella la sceglie
// chi drafta, non più il motore: qui la sceglie `scegliCasella`.
// LE DUE TESTE DEL GM SIMULATO. Da quando c'è il tetto di spesa, "quanto è
// possibile fare" dipende da come si spende, non solo da quanto si spende: un
// bot che prende sempre il più forte firmabile brucia la cassa nei primi tre
// pick e finisce a riempire di minimi. Misurare solo lui vorrebbe dire misurare
// quanto fa un GM sprovveduto, e tarare il tetto su quel numero lo renderebbe
// troppo generoso per un umano che gioca bene.
//
//   stelle     il più forte fra i firmabili, casella per casella. Il draft
//              d'istinto, e quello che il banco misurava prima del tetto.
//   quintetto  i soldi ai titolari, il minimo alla panchina. È come ragiona un
//              GM vero, e ha una ragione dentro il motore: i titolari giocano
//              32 minuti a testa, la panchina molti meno, quindi un dollaro
//              speso nel quintetto rende di più di uno speso in fondo.
//
// SCARTATA: "il miglior voto per dollaro". Sembra la strategia furba e invece è
// la peggiore di tutte (misurato: 0,7 vittorie di media, 32 milioni spesi su un
// tetto da 200). Il rapporto voto/prezzo è massimo sui contratti al minimo,
// quindi il bot si riempiva di scarsi a poco e non spendeva mai la cassa.
//
// Il banco le misura tutte e due e tiene la migliore: il tetto va tarato su
// quello che si PUÒ fare, non sulla media dei tentativi.
//
// `tetta` dice quanto può costare al massimo la carta per questa casella.
export const STRATEGIE = {
  stelle: {
    tetta: (residuo) => residuo,
  },
  quintetto: {
    // In panchina non si spende: due volte e mezzo il minimo compra comunque un
    // rotazionale decente, e quello che resta va nel quintetto.
    tetta: (residuo, slot) => (slot.tipo === TITOLARE ? residuo : SALARIO_MIN * 2.5),
  },
};

function draftaBene(state, d, rng, strategia = "stelle") {
  const strat = STRATEGIE[strategia];
  if (!strat) throw new Error(`Strategia inesistente: ${strategia}`);
  const extra = giriExtra(d);
  const tocchi = SLOTS.length; // dieci caselle, dieci tocchi
  for (let i = 0; i < tocchi; i++) {
    const libere = caselleLibere(state.rosa);
    // Gli extra si spalmano sulle dieci caselle, una alla volta.
    const giri = 1 + Math.floor(extra / tocchi) + (i < extra % tocchi ? 1 : 0);
    const residuo = limiteDuro(state.tetto) - state.speso;
    let migliore = null, casella = null;
    // Il ripiego: la carta meno cara vista in tutti i giri, se non ne è
    // firmabile nessuna. Firma al minimo, come l'eccezione della NBA vera.
    let ripiego = null, ripiegoSlot = null;
    for (let g = 0; g < giri; g++) {
      const { cards } = spinRoster(CARDS_BY_TEAM_SEASON, libere, {}, rng);
      for (const c of cards) {
        const slot = scegliCasella(state.rosa, c);
        if (!slot) continue;
        const costo = salarioCarta(c);
        if (!ripiego || costo < salarioCarta(ripiego)) { ripiego = c; ripiegoSlot = slot; }
        if (!firmabile(costo, residuo, libere.length)) continue;
        if (costo > strat.tetta(residuo, slot)) continue;
        if (!migliore || votoCarta(c) > votoCarta(migliore)) { migliore = c; casella = slot; }
      }
    }
    if (migliore) state = draftPick(state, casella, migliore);
    else if (ripiego) state = draftPick(state, ripiegoSlot, ripiego, SALARIO_MIN);
    else throw new Error("draftaBene: nessuna carta copre le caselle libere");
  }
  return state;
}

// Il coach migliore dei tre proposti. Le schede di coaches.js sono già nella
// forma che vuole il motore (plus, malus, ritmo, rotazione): non c'è più niente
// da convertire.
function scegliCoach(rng) {
  const terna = pickCoaches(rng);
  return terna.reduce((best, c) =>
    (c.champ_bonus ?? 0) > (best.champ_bonus ?? 0) ? c : best, terna[0]);
}

function unaCorsa(difficolta, seme, rng, { tetto = null, strategia = "stelle" } = {}) {
  const d = DIFFICULTIES[difficolta];
  let s = newRun({ formato: "playoff", difficolta, seme });
  // Il tetto si può forzare senza toccare difficulty.js: è quello che fa lo
  // sweep in tools/taratura-tetti.mjs, che prova venti tetti di fila.
  if (tetto !== null) s = { ...s, tetto };
  s = draftaBene(s, d, rng, strategia);
  s = chooseCoach(s, scegliCoach(rng));
  s = startRun(s, POOL);
  while (s.stato === "run") s = resolveRound(s);
  return {
    imbattuto: s.esito === "imbattuto", vittorie: s.vittorie, voto: s.voto.ovr,
    speso: s.speso, sforo: Math.max(0, s.speso - s.tetto),
  };
}

// FACILE È SCESO DA 40 A 33 (Tomas, 2026-08-18, dopo G7). Non è una resa: con
// la panchina libera ogni pick è utile e il 16-0 è più facile ovunque, quindi il
// 40% si sarebbe preso solo mettendo a Facile avversari da livello Normale. Il
// numero viene dalla misura, guardata e accettata.
//
// BERSAGLI RIVISTI IL 2026-08-18 (G10), quando il tetto di spesa è diventato una
// leva vera a tutti e quattro i livelli e non più un meccanismo del solo Incubo:
// 30 / 15 / 3,25 / 0,5. Normale SALE da 12 a 15 e non è un ammorbidimento: la
// difficoltà che prima stava tutta negli avversari adesso è divisa in due, e la
// metà nuova - il tetto - si paga durante il draft. Detto da Tomas così: "a
// Facile va bene potersi fare lo squadrone, ma già a Normale non dev'essere
// scontato".
export const BERSAGLI = { facile: 30, normale: 15, difficile: 3.25, incubo: 0.5 };

/**
 * Misura un livello: quante corse su cento finiscono 16-0.
 *
 * `over` permette di provare soglie diverse da quelle scritte in
 * difficulty.js senza toccare il file - serve al cercatore di soglie
 * (tools/taratura-soglie.mjs). Le soglie vere vengono rimesse a posto in ogni
 * caso, anche se la misura esplode a metà: un banco che lascia la
 * configurazione sporca falserebbe tutte le misure successive.
 *
 * I semi sono FISSI: due misure con le stesse soglie danno lo stesso numero, e
 * la differenza fra due soglie è la differenza delle soglie, non del caso.
 */
export function misura(difficolta, corse = CORSE, over = null, { tetto = null, strategia = "stelle" } = {}) {
  const d = DIFFICULTIES[difficolta];
  const soglieVere = { oppMin: d.oppMin, oppMax: d.oppMax };
  if (over) Object.assign(d, over);
  try {
    let imbattute = 0, vittorie = 0, voto = 0, speso = 0, sforate = 0;
    for (let i = 0; i < corse; i++) {
      // rng del draft separato dal seme della corsa: due sorgenti, due ruoli.
      let x = (i + 1) * 2654435761 % 2147483647;
      const rng = () => { x = (x * 48271) % 2147483647; return x / 2147483647; };
      const r = unaCorsa(difficolta, 1000 + i * 97, rng, { tetto, strategia });
      if (r.imbattuto) imbattute++;
      vittorie += r.vittorie;
      voto += r.voto;
      speso += r.speso;
      if (r.sforo > 0) sforate++;
    }
    return {
      corse, strategia,
      tetto: tetto ?? TETTI[difficolta],
      oppMin: d.oppMin, oppMax: d.oppMax,
      pct: 100 * imbattute / corse,
      vittorie: vittorie / corse,
      voto: voto / corse,
      speso: speso / corse,
      sforate: 100 * sforate / corse,
    };
  } finally {
    Object.assign(d, soglieVere);
  }
}

// Il banco si usa anche come libreria (dal cercatore di soglie): la stampa
// parte solo quando lo lanci a mano.
if (process.argv[1]?.endsWith("banco-corse.mjs")) {
  console.log(`banco: ${CORSE} corse per difficoltà\n`);
  console.log("livello    soglie      voto tuo  vittorie medie   16-0    bersaglio");
  for (const difficolta of Object.keys(DIFFICULTIES)) {
    const m = misura(difficolta, CORSE);
    console.log(
      difficolta.padEnd(10),
      `${m.oppMin}-${m.oppMax}`.padEnd(11),
      m.voto.toFixed(1).padStart(6),
      m.vittorie.toFixed(1).padStart(14),
      (m.pct.toFixed(1) + "%").padStart(8),
      (BERSAGLI[difficolta] + "%").padStart(10),
    );
  }
}
