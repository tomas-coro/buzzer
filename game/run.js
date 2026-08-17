import { emptyQuintet, assign, isComplete, ROLES } from "./roster.js";
import { teamRating, DEFAULT_K } from "./rating.js";
import { applyCoach } from "./coach.js";
import { pickOpponent } from "./opponents.js";
import { DIFFICULTIES } from "./difficulty.js";
import { simulaPartita, rngSeed } from "./partita.js";

export function newRun({ formato, difficolta, k = DEFAULT_K, seme = semeCasuale() }) {
  const d = DIFFICULTIES[difficolta];
  if (!d) throw new Error(`Difficoltà inesistente: ${difficolta}`);
  if (!Number.isInteger(seme)) throw new Error("newRun: il seme deve essere un intero");
  return {
    formato, difficolta, k, seme,
    quintetto: emptyQuintet(),
    coach: null,
    aids: { ...d.aids },
    round: 0,
    vittorie: 0,
    avversario: null,
    voto: null,
    stato: "draft",
    esito: null,
    storia: [],
  };
}

export function draftPick(state, role, card) {
  if (state.stato !== "draft") throw new Error("draftPick: non in fase draft");
  const quintetto = assign(state.quintetto, role, card);
  const stato = isComplete(quintetto) ? "coach" : "draft";
  return { ...state, quintetto, stato };
}

const AID_TYPES = ["squadra", "stagione", "respin"];

export function useAid(state, type) {
  if (!AID_TYPES.includes(type)) throw new Error(`Tipo aiuto inesistente: ${type}`);
  const d = DIFFICULTIES[state.difficolta];
  if (d.freeSwitch && (type === "squadra" || type === "stagione")) {
    return state; // switch illimitati in Facile
  }
  if (state.aids[type] <= 0) throw new Error(`Aiuto '${type}' esaurito`);
  return { ...state, aids: { ...state.aids, [type]: state.aids[type] - 1 } };
}

export function chooseCoach(state, coach) {
  if (!isComplete(state.quintetto)) throw new Error("chooseCoach: quintetto incompleto");
  if (state.stato !== "coach") throw new Error("chooseCoach: non in fase coach");
  return { ...state, coach, stato: "coach" };
}

export function startRun(state, pool) {
  if (state.stato !== "coach") throw new Error("startRun: non in fase coach");
  if (!state.coach) throw new Error("startRun: manca il coach");
  const cards = ROLES.map((r) => state.quintetto[r]);
  const voto = applyCoach(teamRating(cards, state.k), state.coach);
  const d = DIFFICULTIES[state.difficolta];
  const round = 1;
  const avversario = pickOpponent(pool, round, d);
  return { ...state, voto, round, avversario, pool, stato: "run" };
}

// Seme di partenza di una corsa. Non è un fallback che nasconde un errore: è la
// pallina della roulette, e chi vuole una corsa riproducibile (test, replay,
// "sfida del giorno" uguale per tutti) lo passa a newRun.
function semeCasuale() {
  return Math.floor(Math.random() * 2 ** 31);
}

// La partita del round: funzione PURA dello stato, non tocca niente.
//
// Il seme del round nasce da `seme + round`, e questo è il punto: la UI può
// chiamarla per mostrare il tabellone che si riempie DURANTE l'animazione, e
// resolveRound rigiocherà esattamente la stessa partita quando applica il
// risultato. Senza il seme derivato servirebbe passarsi il risultato tra
// schermate, oppure - peggio - si simulerebbe due volte con due esiti diversi.
export function partitaRound(state) {
  if (state.stato !== "run") throw new Error("partitaRound: run non attivo");
  return simulaPartita({
    casa: {
      nome: "La tua squadra",
      reparti: state.voto.reparti,
      ritmo: state.voto.ritmo ?? 0,
    },
    ospite: {
      nome: state.avversario.team,
      reparti: state.avversario.voto.reparti,
      // Ritmo neutro: il coach avversario reale è rimandato (serve uno scraper
      // per sapere chi allenava quella squadra in quella stagione).
      ritmo: 0,
    },
    rng: rngSeed(state.seme + state.round),
  });
}

// Esito del round corrente, senza toccare lo stato. Serve alla UI, che deve
// mostrare il verdetto DURANTE l'animazione del buzzer, cioè prima di applicare
// resolveRound. Sta qui e non nella schermata perché la regola di chi vince deve
// restare una sola: se un domani cambia (pareggi, tie-break), cambia in un posto.
export function esitoRound(state) {
  if (state.stato !== "run") throw new Error("esitoRound: run non attivo");
  return partitaRound(state).vincitore === "casa";
}

export function resolveRound(state) {
  if (state.stato !== "run") throw new Error("resolveRound: run non attivo");
  const d = DIFFICULTIES[state.difficolta];
  const partita = partitaRound(state);
  const vinto = partita.vincitore === "casa";
  const storia = [...state.storia, {
    round: state.round, avversario: state.avversario.team, vinto,
    tuo: state.voto.ovr, loro: state.avversario.voto.ovr,
    // Il punteggio vero e la cronaca: servono alla schermata esito e al
    // tabellone di fine corsa, che prima potevano mostrare solo due voti.
    punti: partita.punti, quarti: partita.quarti, cronaca: partita.cronaca,
  }];
  if (!vinto) {
    return { ...state, storia, stato: "finito", esito: "sconfitta" };
  }
  const vittorie = state.vittorie + 1;
  if (vittorie >= d.N) {
    return { ...state, storia, vittorie, stato: "finito", esito: "imbattuto" };
  }
  const round = state.round + 1;
  const avversario = pickOpponent(state.pool, round, d);
  return { ...state, storia, vittorie, round, avversario };
}
