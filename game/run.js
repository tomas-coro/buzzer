import { emptyQuintet, assign, isComplete, ROLES } from "./roster.js";
import { teamRating, DEFAULT_K } from "./rating.js";
import { applyCoach } from "./coach.js";
import { pickOpponent } from "./opponents.js";
import { DIFFICULTIES } from "./difficulty.js";

export function newRun({ formato, difficolta, k = DEFAULT_K }) {
  const d = DIFFICULTIES[difficolta];
  if (!d) throw new Error(`Difficoltà inesistente: ${difficolta}`);
  return {
    formato, difficolta, k,
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
  const voto = applyCoach(teamRating(cards, state.k), state.coach, state.k);
  const d = DIFFICULTIES[state.difficolta];
  const round = 1;
  const avversario = pickOpponent(pool, round, d);
  return { ...state, voto, round, avversario, pool, stato: "run" };
}

export function resolveRound(state) {
  if (state.stato !== "run") throw new Error("resolveRound: run non attivo");
  const d = DIFFICULTIES[state.difficolta];
  const vinto = state.voto.ovr >= state.avversario.voto.ovr;
  const storia = [...state.storia, {
    round: state.round, avversario: state.avversario.team, vinto,
    tuo: state.voto.ovr, loro: state.avversario.voto.ovr,
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
