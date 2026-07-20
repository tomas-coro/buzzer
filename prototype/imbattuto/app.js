import { newRun, draftPick, useAid, chooseCoach, startRun, resolveRound } from "../../game/run.js";
import { ROLES } from "../../game/roster.js";
import { DIFFICULTIES } from "../../game/difficulty.js";
import { CARDS_BY_TEAM_SEASON } from "./cards.js";
import { opponentPool, spin as spinPool } from "./pool.js";
import { recordRun } from "./meta.js";
import { render as home } from "./screens/home.js";
import { render as draft } from "./screens/draft.js";
import { render as coach } from "./screens/coach.js";
import { render as run } from "./screens/run.js";
import { render as esito } from "./screens/esito.js";
import { render as leaderboard } from "./screens/leaderboard.js";

const app = document.getElementById("app");

// Stato del prototipo: lo State del motore (o null) + la fase UI corrente.
let state = null;          // State del motore
let ui = "home";           // "home" | "leaderboard" | (altrimenti deriva da state.stato)
let draftView = null;      // { role, key, cards, assignable } dei candidati mostrati nel turno
const cards = CARDS_BY_TEAM_SEASON;
const pool = opponentPool(cards); // pool avversari, calcolato una volta

// Registry di render: chiave = fase UI o state.stato.
const screens = { home, draft, coach, run, finito: esito, leaderboard };

function ctx() {
  const N = state ? DIFFICULTIES[state.difficolta].N : null;
  return { state, cards, pool, draftView, N, dispatch, go };
}

function go(nextUi) { ui = nextUi; render(); }

// Il ruolo del turno = il primo slot vuoto in ordine ROLES.
function currentRole() {
  return ROLES.find((r) => state.quintetto[r] === null);
}
function spinFor(role) {
  const { key, cards: shown, assignable } = spinPool(cards, role);
  return { role, key, cards: shown, assignable };
}
function firstSpin() {
  return spinFor(currentRole());
}

function dispatch(action) {
  switch (action.type) {
    case "newRun":
      state = newRun({ formato: action.formato, difficolta: action.difficolta });
      ui = null;                 // d'ora in poi la schermata deriva da state.stato
      draftView = firstSpin();   // primo turno: pesca subito
      break;
    case "spin":
      draftView = spinFor(currentRole());
      break;
    case "assign": {
      state = draftPick(state, draftView.role, action.card);
      // se restano ruoli, pesca il turno successivo; altrimenti stato passa a "coach"
      draftView = state.stato === "draft" ? spinFor(currentRole()) : null;
      break;
    }
    case "aid":
      state = useAid(state, action.aid);
      if (action.aid === "respin") draftView = spinFor(currentRole());
      break;
    case "chooseCoach":
      state = chooseCoach(state, action.coach);
      state = startRun(state, pool);   // entra nel run: calcola voto + primo avversario
      break;
    case "resolveRound":
      state = resolveRound(state);
      if (state.stato === "finito") {
        recordRun(window.localStorage, {
          formato: state.formato, difficolta: state.difficolta,
          vittorie: state.vittorie, esito: state.esito,
        });
      }
      break;
    case "reset":
      state = null; ui = "home"; draftView = null;
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
