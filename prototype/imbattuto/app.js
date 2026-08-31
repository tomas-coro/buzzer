import {
  newRun, draftPick, useAid, chooseCoach, startRun, resolveRound, sceltaAutoDraft,
} from "../../game/run.js";
import { caselleLibere, listaRosa, minutiRosa } from "../../game/rosa.js";
import { DIFFICULTIES } from "../../game/difficulty.js";
import { CARDS_BY_TEAM_SEASON } from "./cards.js";
import { opponentPool, spinRoster, chiaveCarta } from "./pool.js";
import { recordRun } from "./meta.js";
import { render as home } from "./screens/home.js";
import { render as difficolta } from "./screens/difficolta.js";
import { render as draft } from "./screens/draft.js";
import { render as draftReveal } from "./screens/draftReveal.js";
import { render as coach } from "./screens/coach.js";
import { render as run } from "./screens/run.js";
import { render as esito } from "./screens/esito.js";
import { render as leaderboard } from "./screens/leaderboard.js";
import { render as profilo } from "./screens/profilo.js";

const app = document.getElementById("app");

// Stato del prototipo: lo State del motore (o null) + la fase UI corrente.
let state = null;          // State del motore
let ui = "home";           // "home" | "leaderboard" | (altrimenti deriva da state.stato)
let draftView = null;      // { key, cards, slots } della rosa da dieci pescata, da cui piazzi liberamente
const cards = CARDS_BY_TEAM_SEASON;
const pool = opponentPool(cards); // pool avversari, calcolato una volta

// Registry di render: chiave = fase UI o state.stato.
const screens = { home, difficolta, draft, draftReveal, coach, run, finito: esito, leaderboard, profilo };

function ctx() {
  const N = state ? DIFFICULTIES[state.difficolta].N : null;
  return { state, cards, pool, draftView, N, dispatch, go };
}

function go(nextUi) { ui = nextUi; render(); }

// Le caselle ancora vuote della rosa (5 titolari per ruolo + 5 posti di
// panchina numerati): servono a `spinRoster` per scartare le rose che non
// darebbero comunque niente (vedi pool.js).
function freeSlots() {
  return caselleLibere(state.rosa);
}
// Le carte già in squadra: escluse dalle rose pescate, così lo stesso
// giocatore-stagione non può finire due volte in rosa.
function giaPresi() {
  return new Set(listaRosa(state.rosa).map(chiaveCarta));
}
// Pesca una rosa che copra almeno uno slot libero. filtro = vincoli aiuto.
function spinRosterView(filtro = {}) {
  // `slots` dice da quale casella della SUA squadra viene ogni candidato
  // (quintetto o panchina): serve solo a raggruppare la lista, non al motore.
  const { key, cards: shown, slots } = spinRoster(cards, freeSlots(), { ...filtro, escludi: giaPresi() });
  return { key, cards: shown, slots };
}

function dispatch(action) {
  switch (action.type) {
    case "newRun":
      state = newRun({
        formato: action.formato,
        difficolta: action.difficolta,
        // Il nome finisce nella cronaca della partita: se manca, il motore usa
        // il suo default ("La tua squadra") invece di una stringa vuota.
        ...(action.squadra ? { squadra: action.squadra } : {}),
      });
      ui = null;                 // d'ora in poi la schermata deriva da state.stato
      // ticker: true anche qui - scanThenLock pesca a caso da ctx.cards e blocca
      // sulla chiave vera, non legge nessun valore "precedente": non c'è motivo
      // per cui la primissima pesca del turno debba saltare di scatto mentre le
      // altre cercano (playtest 31/08).
      draftView = { ...spinRosterView(), ticker: true };  // primo turno: pesca subito una rosa
      break;
    case "spin":
      draftView = spinRosterView();
      break;
    case "assign": {
      // Piazzamento libero: la carta va nella casella scelta dall'utente
      // ({ tipo: "titolare", ruolo } oppure { tipo: "panca", posto }).
      state = draftPick(state, action.slot, action.card);
      // se restano slot, pesca una nuova rosa; altrimenti lo stato passa a "coach".
      // `ticker: true` dice al draft di far "cercare" il ticker rosa (mockup 86,
      // radar lock) invece di saltare di scatto: qui c'era già un valore prima,
      // sulla primissima pesca del turno (newRun) non c'è niente da cercare.
      draftView = state.stato === "draft" ? { ...spinRosterView(), ticker: true } : null;
      break;
    }
    case "autoDraft": {
      // Riempie da sola le caselle rimaste, una scelta per spin, con lo stesso
      // criterio (firmabile / firmaDiRipiego) che userebbe un piazzamento
      // manuale: vedi sceltaAutoDraft in game/run.js. `malusMax` è quanti punti
      // di reparto Tomas accetta di pagare pur di prendere carte più forti
      // (scelto nella UI del draft, 0 = resta sotto il tetto pulito).
      let giri = 0;
      while (state.stato === "draft") {
        if (++giri > 500) {
          throw new Error("autoDraft: non trovo una rosa completabile dopo 500 spin");
        }
        const scelta = sceltaAutoDraft(state, draftView.cards, action.malusMax ?? 0);
        if (!scelta) { draftView = spinRosterView(); continue; }
        state = draftPick(state, scelta.slot, scelta.carta, scelta.costo);
        draftView = state.stato === "draft" ? spinRosterView() : null;
      }
      // La rosa è già piena (state.stato è già "coach"): invece di saltare
      // dritti lì, ci si ferma un istante sul reveal a scaletta della squadra
      // appena presa (draftReveal.js), che poi si fa avanzare da solo.
      draftView = null;
      ui = "draftReveal";
      break;
    }
    case "autoDraftAdvance":
      // Il reveal si è chiuso da solo (setTimeout in draftReveal.js): da qui
      // in poi la schermata torna a derivare da state.stato, cioè "coach".
      ui = null;
      break;
    case "aid": {
      // Portata dell'aiuto rispetto alla rosa corrente (chiave "TEAM|SEASON"):
      // respin = tutto nuovo · squadra = stesso anno altra squadra · stagione = stessa squadra altro anno.
      const [curTeam, curSeason] = draftView.key.split("|");
      const filtro = action.aid === "squadra" ? { sameSeason: curSeason, excludeKey: draftView.key }
        : action.aid === "stagione" ? { sameTeam: curTeam, excludeKey: draftView.key }
        : { excludeKey: draftView.key };
      state = useAid(state, action.aid);
      draftView = { ...spinRosterView(filtro), ticker: true }; // vedi nota "assign"
      break;
    }
    case "chooseCoach":
      state = chooseCoach(state, action.coach);
      state = startRun(state, pool);   // entra nel run: calcola voto + primo avversario
      break;
    case "resolveRound":
      state = resolveRound(state);
      if (state.stato === "finito") {
        // roster = nome -> identità (per l'avatar del Profilo), perRound = una
        // riga box per round (solo il tuo lato, solo nome+tot): la storia
        // completa porta anche cronaca/quarti/l'avversario, che il Profilo non
        // legge e che gonfierebbero il localStorage per niente.
        const roster = {};
        for (const { carta } of minutiRosa(state.rosaAllenata, state.rotazione)) {
          roster[carta.name] = { player_id: carta.player_id, team_abbr: carta.team_abbr, season: carta.season };
        }
        const perRound = state.storia.map((h) => h.box.casa.righe.map((r) => ({ nome: r.nome, tot: r.tot })));
        recordRun(window.localStorage, {
          formato: state.formato, difficolta: state.difficolta,
          vittorie: state.vittorie, esito: state.esito,
          roster, perRound,
        });
      }
      break;
    case "reset":
      state = null; ui = "home"; draftView = null;
      break;
    case "exitToDifficolta":
      // Uscita volontaria da draft/coach/run (bottone nell'appHeader, vedi
      // _chrome.js): stessa pulizia di "reset" ma si torna alla scelta
      // difficoltà invece che alla home, la run in corso va persa.
      state = null; ui = "difficolta"; draftView = null;
      break;
    default:
      throw new Error(`azione sconosciuta: ${action.type}`);
  }
  render();
}

function currentScreenName() {
  if (ui) return ui;                 // home / leaderboard
  return state.stato;                // "draft" | "coach" | "run" | "finito"
}

function render() {
  const name = currentScreenName();
  const screen = screens[name];
  if (!screen) {
    app.replaceChildren(Object.assign(document.createElement("pre"),
      { textContent: `Schermata non ancora implementata: ${name}` }));
    return;
  }
  app.replaceChildren(screen(ctx()));
}

render();
