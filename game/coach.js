// L'allenatore: due plus, un malus, e una mano sui minuti.
//
// COS'ERA PRIMA E PERCHÉ NON BASTAVA. Il coach aveva due voti A-F che
// moltiplicavano i reparti di squadra. Problemi: il giocatore leggeva "A" e non
// sapeva cosa cambiava in campo; tutti i coach facevano la stessa cosa con
// intensità diversa; e nessun giocatore della tua rosa migliorava - migliorava
// un numero medio.
//
// COM'È ADESSO. Un coach dichiara:
//   - due PLUS su due reparti. Un plus può essere MIRATO (vale tanto, ma solo su
//     certi ruoli: "i lunghi difendono meglio") o DIFFUSO (vale poco, su tutti);
//   - un MALUS su un reparto, che paga tutta la squadra: è il prezzo della
//     tattica. Chi corre a perdifiato difende peggio;
//   - il RITMO, che decide quanti possessi si giocano (vedi partita.js);
//   - la ROTAZIONE, che decide quanti minuti giocano titolari e riserve.
//
// LA COSA IMPORTANTE: il coach agisce sulle CARTE, una per una. I reparti di
// squadra vengono dopo, calcolati sulla rosa già allenata. Così "il coach
// migliora i tuoi giocatori" è una frase vera che si può mostrare col dito:
// `effetti` elenca chi guadagna cosa, e la schermata di scelta lo stampa prima
// che tu confermi.

import { REPARTI } from "./reparti.js";
import { ROLES } from "./roster.js";
import { votoRosa } from "./rating.js";
import { SLOTS, MINUTI } from "./rosa.js";

// Quanto vale un plus. Il mirato è quasi il doppio del diffuso, ma tocca due o
// tre ruoli su cinque: a squadra intera i due valgono quasi uguale, e la
// differenza sta nel fatto che il mirato PREMIA CHI HA DRAFTATO GIUSTO. Con tre
// lunghi in rosa, un coach che alza la difesa dei lunghi vale il doppio.
export const VALORE_MIRATO = 8;
export const VALORE_DIFFUSO = 4;

// Il malus è diffuso e pesa più di un plus diffuso: una scelta tattica deve
// costare, altrimenti tutti i coach sono un regalo e sceglierne uno non è una
// decisione.
export const VALORE_MALUS = 5;

// I reparti sono percentili: sopra 99 non si va, sotto 0 nemmeno.
const clamp = (v) => Math.min(99, Math.max(0, v));

function checkReparto(r, dove) {
  if (!REPARTI.includes(r)) {
    throw new Error(`applyCoach: reparto '${r}' inesistente in ${dove} (validi: ${REPARTI.join(", ")})`);
  }
}

function checkRuoli(ruoli, dove) {
  if (ruoli === undefined || ruoli === null) return;
  if (!Array.isArray(ruoli) || ruoli.length === 0) {
    throw new Error(`applyCoach: ruoli di ${dove} devono essere una lista non vuota`);
  }
  for (const r of ruoli) {
    if (!ROLES.includes(r)) throw new Error(`applyCoach: ruolo '${r}' inesistente in ${dove}`);
  }
}

// Le tre righe della scheda coach, controllate una volta sola qui.
function checkCoach(coach) {
  if (!coach || typeof coach !== "object") throw new Error("applyCoach: manca il coach");
  const plus = coach.plus ?? [];
  if (!Array.isArray(plus) || plus.length > 2) {
    throw new Error("applyCoach: un coach ha al massimo due plus (regola: 2 plus e 1 malus)");
  }
  plus.forEach((p, i) => {
    checkReparto(p?.reparto, `plus ${i + 1}`);
    checkRuoli(p?.ruoli, `plus ${i + 1}`);
  });
  if (coach.malus) {
    checkReparto(coach.malus.reparto, "malus");
    checkRuoli(coach.malus.ruoli, "malus");
  }
  const ritmo = coach.ritmo ?? 0;
  if (typeof ritmo !== "number" || !Number.isFinite(ritmo) || ritmo < -1 || ritmo > 1) {
    throw new Error(`applyCoach: ritmo '${coach.ritmo}' fuori dall'intervallo -1..+1`);
  }
  const rotazione = coach.rotazione ?? "normale";
  if (!MINUTI[rotazione]) {
    throw new Error(`applyCoach: rotazione '${rotazione}' inesistente (valide: ${Object.keys(MINUTI).join(", ")})`);
  }
  return { plus, ritmo, rotazione };
}

// Quanto questo intervento sposta il reparto di un giocatore di questo ruolo.
// Zero se il giocatore non è tra i bersagli.
function delta({ ruoli }, ruolo, mirato, diffuso) {
  if (!ruoli) return diffuso;
  return ruoli.includes(ruolo) ? mirato : 0;
}

/**
 * Applica il coach a una rosa da 10.
 *
 * @param {object} rosa dalle funzioni di rosa.js (dieci caselle piene)
 * @param {object} coach { plus: [{reparto, ruoli?}], malus: {reparto, ruoli?},
 *                         ritmo?, rotazione?, champ_bonus? }
 * @returns {{rosa, voto: {ovr, reparti}, ritmo, rotazione, effetti}}
 *          `rosa` è una copia con le carte già allenate (i reparti spostati),
 *          `effetti` elenca per ogni giocatore cosa ha guadagnato o perso.
 */
export function applyCoach(rosa, coach) {
  const { plus, ritmo, rotazione } = checkCoach(coach);
  const malus = coach.malus ?? null;
  // Gli anelli: qualche punto su tutti i reparti di tutti. Piccolo di proposito -
  // gli undici titoli di Jackson come +11 spaccherebbero la scala 0-99.
  const anelli = coach.champ_bonus ?? 0;

  const effetti = [];
  const nuova = {};
  for (const ruolo of ROLES) nuova[ruolo] = { ...rosa[ruolo] };

  for (const { ruolo, tipo } of SLOTS) {
    const carta = rosa[ruolo][tipo];
    if (!carta) throw new Error("applyCoach: rosa incompleta, servono dieci giocatori");

    const reparti = { ...carta.reparti };
    // Quanto chiede il coach su ogni reparto, prima del tetto: un giocatore può
    // prendere un plus e un malus sullo stesso reparto, e vince la somma.
    const richiesta = {};
    for (const rep of REPARTI) richiesta[rep] = anelli;
    for (const p of plus) {
      richiesta[p.reparto] += delta(p, ruolo, VALORE_MIRATO, VALORE_DIFFUSO);
    }
    if (malus) {
      richiesta[malus.reparto] -= delta(malus, ruolo, VALORE_MALUS, VALORE_MALUS);
    }

    for (const rep of REPARTI) {
      if (richiesta[rep] === 0) continue;
      const prima = reparti[rep];
      if (typeof prima !== "number" || !Number.isFinite(prima)) {
        throw new Error(`applyCoach: la carta '${carta.name ?? "?"}' non ha il reparto '${rep}'`);
      }
      reparti[rep] = clamp(prima + richiesta[rep]);
      // Il delta che finisce nell'elenco è quello VERO, non quello chiesto: da 97
      // un plus da otto punti ne dà due, e la schermata deve dire due.
      const vero = reparti[rep] - prima;
      if (vero !== 0) {
        effetti.push({ player_id: carta.player_id, ruolo, tipo, reparto: rep, delta: vero });
      }
    }
    nuova[ruolo][tipo] = { ...carta, reparti };
  }

  return { rosa: nuova, voto: votoRosa(nuova, rotazione), ritmo, rotazione, effetti };
}
