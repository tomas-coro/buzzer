import {
  newRun, draftPick, useAid, chooseCoach, startRun, resolveRound, sceltaAutoDraft,
} from "../../game/run.js";
import { caselleLibere, chiaveSlot, listaRosa, minutiRosa } from "../../game/rosa.js";
import { DIFFICULTIES } from "../../game/difficulty.js";
import { CARDS_BY_TEAM_SEASON } from "./cards.js";
import { opponentPool, spinRoster, chiaveCarta } from "./pool.js";
import { clearCurrentRun, loadCurrentRun, recordRun, saveCurrentRun } from "./meta.js";
import { render as home } from "./screens/home.js";
import { render as difficolta } from "./screens/difficolta.js";
import { render as draft } from "./screens/draft.js";
import { render as coach } from "./screens/coach.js";
import { render as run } from "./screens/run.js";
import { render as esito } from "./screens/esito.js";
import { render as leaderboard } from "./screens/leaderboard.js";
import { render as profilo } from "./screens/profilo.js";

const app = document.getElementById("app");

// Stato del prototipo: lo State del motore (o null) + la fase UI corrente.
const saved = loadCurrentRun(window.localStorage);
let state = saved?.state ?? null;          // State del motore
let ui = saved ? saved.ui : "home";        // null = deriva da state.stato
let draftView = saved?.draftView ?? null;  // { key, cards, slots } della rosa da dieci pescata, da cui piazzi liberamente
const cards = CARDS_BY_TEAM_SEASON;
const pool = opponentPool(cards); // pool avversari, calcolato una volta

// Registry di render: chiave = fase UI o state.stato.
const screens = { home, difficolta, draft, coach, run, finito: esito, leaderboard, profilo };

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

// Un passo di autobuild: pesca rose finché sceltaAutoDraft (game/run.js, stesso
// criterio del draft manuale) non trova un pick valido, poi lo restituisce già
// deciso - draft.js non deve conoscere le regole di gioco, esegue solo il pick
// che gli viene passato. Lo spin che l'utente VEDE ha sempre un esito garantito:
// niente ticker "a vuoto" sui tentativi scartati qui dentro (stesso limite di
// guardia di 500 giri che aveva il vecchio while sincrono).
function spinAutoStep(malusMax) {
  let giri = 0;
  while (true) {
    if (++giri > 500) {
      throw new Error("autoDraft: non trovo una rosa completabile dopo 500 spin");
    }
    const view = spinRosterView();
    const scelta = sceltaAutoDraft(state, view.cards, malusMax);
    if (!scelta) continue;
    const cardIndex = view.cards.indexOf(scelta.carta);
    return {
      ...view,
      ticker: true,
      auto: { cardIndex, slotKey: chiaveSlot(scelta.slot), costo: scelta.costo, malusMax },
    };
  }
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
      // ({ tipo: "titolare", ruolo } oppure { tipo: "panca", posto }) - o,
      // quando action.auto è valorizzato, dall'autoplay (draft.js ha già scelto
      // carta e slot secondo il pick deciso da spinAutoStep, qui si applica e basta).
      state = draftPick(state, action.slot, action.card);
      if (state.stato === "draft") {
        // Se restano slot: pesca una nuova rosa. In autoplay il prossimo passo è
        // già deciso (spinAutoStep); a mano è solo un nuovo spin con ticker
        // (mockup 86, radar lock - qui c'era già un valore prima, sulla
        // primissima pesca del turno (newRun) non c'è niente da cercare).
        draftView = action.auto ? spinAutoStep(action.auto.malusMax) : { ...spinRosterView(), ticker: true };
      } else {
        // Rosa piena. A mano si passa subito a "coach" (comportamento invariato).
        // In autoplay invece si resta sulla board piena finché l'utente non preme
        // "Vai al coach" (autoDraftAdvance sotto) - draft.js sa disegnare questo
        // stato perché nFilled arriva a 10 con draftView null.
        draftView = null;
        if (action.auto) ui = "draft";
      }
      break;
    }
    case "autoDraft":
      // Un solo passo, non tutta la rosa: draft.js gira i pick successivi da
      // solo dispatchando "assign" con auto valorizzato (vedi quel case sotto).
      // `malusMax` è quanti punti di reparto Tomas accetta di pagare pur di
      // prendere carte più forti (scelto nella UI del draft, 0 = tetto pulito).
      draftView = spinAutoStep(action.malusMax ?? 0);
      break;
    case "autoDraftAdvance":
      // Il reveal si è chiuso da solo (setTimeout in draftReveal.js): da qui
      // in poi la schermata torna a derivare da state.stato, cioè "coach".
      ui = null;
      break;
    case "stopAutoDraft":
      // L'utente ha premuto "Ferma" a metà autobuild: i pick già piazzati
      // restano, si torna al draft manuale con un nuovo spin normale (niente
      // auto, quindi niente pick automatico sul prossimo giro).
      draftView = { ...spinRosterView(), ticker: true };
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
  if (state && state.stato !== "finito") saveCurrentRun(window.localStorage, { state, ui, draftView });
  else clearCurrentRun(window.localStorage);
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

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
