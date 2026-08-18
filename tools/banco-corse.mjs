// Banco di taratura della difficoltà: simula corse INTERE (draft di dieci +
// coach + 16 partite) e misura quante finiscono imbattute.
//
// Perché serve: le soglie `oppMin`/`oppMax` in game/difficulty.js decidono quanto
// è forte l'avversario del round, ma il loro effetto vero - "su 100 corse, quante
// finiscono 16-0?" - non si legge dai numeri, si misura. I bersagli concordati
// sono 40 / 12 / 3 / 0,5 per Facile / Normale / Difficile / Incubo.
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
import { ROLES, canPlay } from "../game/roster.js";
import { SLOTS, slotLibero } from "../game/rosa.js";
import { votoCarta } from "../game/rating.js";
import { DIFFICULTIES } from "../game/difficulty.js";
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

// Un draft "giocato bene": per ognuna delle dieci caselle gira le rose e tiene
// la carta col voto più alto che sappia coprirla. Il ruolo si mira, la casella
// (titolare o riserva) la sceglie `draftPick`.
function draftaBene(state, d, rng) {
  const extra = giriExtra(d);
  const tocchi = SLOTS.length; // dieci: 2 per ruolo
  for (let i = 0; i < tocchi; i++) {
    const liberi = ROLES.filter((r) => slotLibero(state.rosa, r) !== null);
    // Gli extra si spalmano sulle dieci caselle, una alla volta.
    const giri = 1 + Math.floor(extra / tocchi) + (i < extra % tocchi ? 1 : 0);
    let migliore = null;
    let ruolo = null;
    for (let g = 0; g < giri; g++) {
      const { cards } = spinRoster(CARDS_BY_TEAM_SEASON, liberi, {}, rng);
      for (const c of cards) {
        for (const r of liberi) {
          if (!canPlay(c, r)) continue;
          const v = votoCarta(c);
          if (!migliore || v > votoCarta(migliore)) { migliore = c; ruolo = r; }
        }
      }
    }
    if (!migliore) throw new Error("draftaBene: nessuna carta copre gli slot liberi");
    state = draftPick(state, ruolo, migliore);
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

function unaCorsa(difficolta, seme, rng) {
  const d = DIFFICULTIES[difficolta];
  let s = newRun({ formato: "playoff", difficolta, seme });
  s = draftaBene(s, d, rng);
  s = chooseCoach(s, scegliCoach(rng));
  s = startRun(s, POOL);
  while (s.stato === "run") s = resolveRound(s);
  return { imbattuto: s.esito === "imbattuto", vittorie: s.vittorie, voto: s.voto.ovr };
}

export const BERSAGLI = { facile: 40, normale: 12, difficile: 3, incubo: 0.5 };

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
export function misura(difficolta, corse = CORSE, over = null) {
  const d = DIFFICULTIES[difficolta];
  const soglieVere = { oppMin: d.oppMin, oppMax: d.oppMax };
  if (over) Object.assign(d, over);
  try {
    let imbattute = 0, vittorie = 0, voto = 0;
    for (let i = 0; i < corse; i++) {
      // rng del draft separato dal seme della corsa: due sorgenti, due ruoli.
      let x = (i + 1) * 2654435761 % 2147483647;
      const rng = () => { x = (x * 48271) % 2147483647; return x / 2147483647; };
      const r = unaCorsa(difficolta, 1000 + i * 97, rng);
      if (r.imbattuto) imbattute++;
      vittorie += r.vittorie;
      voto += r.voto;
    }
    return {
      corse,
      oppMin: d.oppMin, oppMax: d.oppMax,
      pct: 100 * imbattute / corse,
      vittorie: vittorie / corse,
      voto: voto / corse,
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
