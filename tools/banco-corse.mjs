// Banco di taratura della difficoltà: simula corse INTERE (draft + coach + 16
// partite) e misura quante finiscono imbattute.
//
// Perché serve: le soglie `oppMin`/`oppMax` in game/difficulty.js decidono quanto
// è forte l'avversario del round, ma il loro effetto vero - "su 100 corse, quante
// finiscono 16-0?" - non si legge dai numeri, si misura. I bersagli concordati
// sono 40 / 12 / 3 / 0,5 per Facile / Normale / Difficile / Incubo.
//
// Il "giocatore" simulato è competente ma non onnisciente: a ogni giro di draft
// prende la carta migliore disponibile per uno slot libero (per voto, non per
// overall 2K), e usa tutti gli aiuti che la difficoltà gli concede. Non conosce
// il futuro, quindi non ottimizza il quintetto nel suo insieme.
//
// Uso:
//   node tools/banco-corse.mjs [corse]     (default 400 per difficoltà)

import { CARDS_BY_TEAM_SEASON } from "../prototype/imbattuto/cards.js";
import { COACHES, toEngineCoach, pickCoaches } from "../prototype/imbattuto/coaches.js";
import { opponentPool, spinRoster } from "../prototype/imbattuto/pool.js";
import { ROLES, canPlay } from "../game/roster.js";
import { votoCarta } from "../game/rating.js";
import { DIFFICULTIES } from "../game/difficulty.js";
import {
  newRun, draftPick, chooseCoach, startRun, resolveRound,
} from "../game/run.js";

const CORSE = Number(process.argv[2] ?? 400);
const POOL = opponentPool(CARDS_BY_TEAM_SEASON);

// Quanti giri di draft in più concede la difficoltà. Facile ha gli switch
// illimitati: gli do tre giri extra per slot, oltre i quali un giocatore vero
// smette di ruotare per noia.
function giriExtra(d) {
  if (d.freeSwitch) return 15;
  return d.aids.squadra + d.aids.stagione + d.aids.respin;
}

// Un draft "giocato bene": per ogni slot libero gira le rose e tiene la carta
// col voto più alto che sappia coprirlo.
function draftaBene(state, d, rng) {
  const extra = giriExtra(d);
  for (const [i, _] of ROLES.entries()) {
    const liberi = ROLES.filter((r) => state.quintetto[r] === null);
    // Gli extra si spalmano sui cinque slot, uno alla volta.
    const giri = 1 + Math.floor(extra / 5) + (i < extra % 5 ? 1 : 0);
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

// Il coach migliore dei tre proposti, scelto sul voto che produce.
function scegliCoach(rng) {
  const terna = pickCoaches(rng).map(toEngineCoach);
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

const BERSAGLI = { facile: 40, normale: 12, difficile: 3, incubo: 0.5 };

console.log(`banco: ${CORSE} corse per difficoltà\n`);
console.log("livello    soglie      voto tuo  vittorie medie   16-0    bersaglio");
for (const difficolta of Object.keys(DIFFICULTIES)) {
  const d = DIFFICULTIES[difficolta];
  let imbattute = 0, vittorie = 0, voto = 0;
  for (let i = 0; i < CORSE; i++) {
    // rng del draft separato dal seme della corsa: due sorgenti, due ruoli.
    let x = (i + 1) * 2654435761 % 2147483647;
    const rng = () => { x = (x * 48271) % 2147483647; return x / 2147483647; };
    const r = unaCorsa(difficolta, 1000 + i * 97, rng);
    if (r.imbattuto) imbattute++;
    vittorie += r.vittorie;
    voto += r.voto;
  }
  const pct = 100 * imbattute / CORSE;
  console.log(
    difficolta.padEnd(10),
    `${d.oppMin}-${d.oppMax}`.padEnd(11),
    (voto / CORSE).toFixed(1).padStart(6),
    (vittorie / CORSE).toFixed(1).padStart(14),
    (pct.toFixed(1) + "%").padStart(8),
    (BERSAGLI[difficolta] + "%").padStart(10),
  );
}
