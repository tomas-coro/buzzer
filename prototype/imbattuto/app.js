import {
  newRun, draftPick, useAid, chooseCoach, startRun, resolveRound, resolveSeriesGame, sceltaAutoDraft,
} from "../../game/run.js";
import { caselleLibere, chiaveSlot, listaRosa, minutiRosa, spostaTitolare } from "../../game/rosa.js";
import { DIFFICULTIES } from "../../game/difficulty.js";
import { CARDS_BY_TEAM_SEASON } from "./cards.js";
import { opponentPool, spinRoster, chiaveCarta } from "./pool.js";
import { clearCurrentRun, loadCurrentRun, recordRun, saveCurrentRun } from "./meta.js";
import { render as home } from "./screens/home.js";
import { render as difficolta } from "./screens/difficolta.js";
import { render as draft } from "./screens/draft.js";
import { render as coach } from "./screens/coach.js";
import { render as run } from "./screens/run.js";
import { render as playoffBracket } from "./screens/playoff-bracket.js";
import { render as esito } from "./screens/esito.js";
import { render as leaderboard } from "./screens/leaderboard.js";
import { render as profilo } from "./screens/profilo.js";

const app = document.getElementById("app");
let installPrompt = null;
let swRegistration = null;
let updateWorker = null;
let updateChecking = false;
let publishedUpdateAvailable = false;

// Intro Home: una sola volta per sessione reale dell'app.
// Anche se history/PWA ricrea il documento, un ritorno interno alla Home
// non deve rilanciare la splash.
let showHomeIntro = sessionStorage.getItem("buzzer:home-intro-seen") !== "1";

function updateState() {
  return {
    available: Boolean(
      updateWorker
      || swRegistration?.waiting
      || publishedUpdateAvailable
    ),
    checking: updateChecking,
  };
}

function syncUpdateControls() {
  const button = document.getElementById("check-update");
  if (!button) return;

  const status = updateState();

  button.classList.toggle(
    "has-update",
    status.available
  );

  button.classList.toggle(
    "checking",
    status.checking
  );

  button.setAttribute(
    "aria-label",
    status.available
      ? "Aggiornamento disponibile"
      : "Controlla aggiornamenti"
  );

  button.textContent =
    status.available
      ? "Aggiorna"
      : status.checking
        ? "Controllo…"
        : "Verifica";

  const copy = document.getElementById(
    "update-status-copy"
  );

  if (copy) {
    copy.textContent =
      status.available
        ? "Una nuova versione di Buzzer è disponibile."
        : status.checking
          ? "Controllo aggiornamenti…"
          : "Buzzer è aggiornato.";
  }
}

const installed = () => matchMedia("(display-mode: standalone)").matches
  || navigator.standalone === true || globalThis.Capacitor?.isNativePlatform?.() === true;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
});

async function installApp() {
  if (installPrompt) {
    await installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    return;
  }
  let dlg = document.getElementById("install-guide");
  if (!dlg) {
    dlg = document.createElement("dialog");
    dlg.id = "install-guide";
    dlg.className = "install-guide";
    document.body.appendChild(dlg);
  }
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  dlg.innerHTML = `<button class="ig-close" type="button" aria-label="Chiudi">×</button>
    <h2>Installa Buzzer</h2>
    <ol>${ios
      ? "<li>Apri questa pagina in Safari.</li><li>Tocca <b>Condividi</b> □↑.</li><li>Scegli <b>Aggiungi alla schermata Home</b>, poi Aggiungi.</li>"
      : "<li>Apri il menu del browser ⋮.</li><li>Scegli <b>Installa app</b> o <b>Aggiungi a schermata Home</b>.</li><li>Conferma: Buzzer si aprirà senza barra del browser.</li>"}</ol>`;
  dlg.querySelector("button").onclick = () => dlg.close();
  dlg.onclick = (event) => { if (event.target === dlg) dlg.close(); };
  dlg.showModal();
}

// Stato del prototipo: lo State del motore (o null) + la fase UI corrente.
const saved = loadCurrentRun(window.localStorage);
let state = saved?.state ?? null;          // State del motore
let ui = saved ? saved.ui : "home";        // null = deriva da state.stato
let draftView = saved?.draftView ?? null;  // { key, cards, slots } della rosa da dieci pescata, da cui piazzi liberamente
const cards = CARDS_BY_TEAM_SEASON;
const pool = opponentPool(cards); // pool avversari, calcolato una volta

// Registry di render: chiave = fase UI o state.stato.
const screens = {
  home, difficolta, "difficolta-playoff": difficolta,
  draft, coach, run,
  "playoff-bracket": playoffBracket,
  finito: esito, leaderboard, profilo,
};

function ctx() {
  const N = state ? DIFFICULTIES[state.difficolta].N : null;
  const formato = state?.formato ?? (ui === "difficolta-playoff" ? "playoff" : "imbattuto");
  return {
    state, cards, pool, draftView, N, formato,
    dispatch, go,
    installApp,
    installed: installed(),
    checkForUpdates,
    updateState,
    showHomeIntro,
  };
}

function go(nextUi, fromHistory = false) {
  ui = nextUi;
  if (!fromHistory) history.pushState({ ui }, "");
  render();
}

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
  const wasActive = Boolean(state);
  switch (action.type) {
    case "newRun":
      navigator.storage?.persist?.().catch(() => {});
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
        // Rosa piena: manuale e automatico condividono la stessa schermata
        // finale "Rosa completa". Il motore è già in stato coach, ma la UI
        // resta sul draft finché l'utente non preme "Vai al coach".
        draftView = null;
        ui = "draft";
      }
      break;
    }
    case "moveStarter": {
      if (state.stato !== "draft") {
        throw new Error("moveStarter: non in fase draft");
      }
      state = {
        ...state,
        rosa: spostaTitolare(state.rosa, action.fromRole, action.toRole),
      };
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
      // Conferma della schermata finale condivisa manuale/automatico:
      // da qui la UI torna a derivare da state.stato, che è già "coach".
      ui = null;
      break;
    case "stopAutoDraft":
      // L'utente ha premuto "Ferma" a metà autobuild: i pick già piazzati
      // restano, si torna al draft manuale con un nuovo spin normale (niente
      // auto, quindi niente pick automatico sul prossimo giro).
      draftView = { ...spinRosterView(), ticker: true };
      break;
    case "autoDraftSkip": {
      // L'utente ha premuto "Salta": stesso criterio di scelta di autoDraft/
      // spinAutoStep (sceltaAutoDraft), ma applicato in un colpo solo alle
      // caselle rimaste, senza passare dal reveal pick-by-pick (grill-me
      // 11/09/2026, richiesta di velocizzare il draft assistito).
      let giri = 0;
      while (state.stato === "draft") {
        const view = spinRosterView();
        const scelta = sceltaAutoDraft(state, view.cards, action.malusMax ?? 0);
        if (!scelta) {
          if (++giri > 500) throw new Error("autoDraftSkip: non trovo una rosa completabile dopo 500 spin");
          continue;
        }
        giri = 0;
        state = draftPick(state, scelta.slot, scelta.carta);
      }
      // "Salta" completa istantaneamente la rosa, ma deve terminare
      // nello stesso riepilogo 10/10 del draft manuale/autoplay.
      draftView = null;
      ui = "draft";
      break;
    }
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
      state = startRun(state, pool);

      // Nel Playoff il tabellone è parte dell'ingresso nel torneo:
      // prima di Gara 1 il giocatore vede seed, conference e percorso.
      if (state.formato === "playoff") {
        ui = "playoff-bracket";
      }

      break;
    case "resolveRound": {
      const eraPlayoff = state.formato === "playoff";

      state = eraPlayoff
        ? resolveSeriesGame(state)
        : resolveRound(state);

      // Dopo OGNI gara playoff il giocatore vede
      // l'avanzamento del tabellone prima di continuare.
      if (eraPlayoff && state.stato === "run") {
        ui = "playoff-bracket";
      }

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
    }

    case "continuePlayoff":
      if (!state || state.formato !== "playoff") {
        throw new Error("continuePlayoff: playoff non attivo");
      }
      ui = null;
      break;

    case "showPlayoffBracket":
      if (!state || state.formato !== "playoff") {
        throw new Error("showPlayoffBracket: playoff non attivo");
      }
      ui = "playoff-bracket";
      break;

    case "reset":
      state = null; ui = "home"; draftView = null;
      break;
    case "exitDraftToHome": {
      state = null;
      ui = "home";
      draftView = null;
      break;
    }

    case "exitToHome": {
      state = null;
      draftView = null;
      ui = "home";
      break;
    }

    case "exitToDifficolta": {
      // Nel Draft la X annulla la costruzione e torna direttamente alla Home.
      // Coach/Run mantengono invece il ritorno alla difficoltà dello stesso formato.
      const statoPrimaUscita = state?.stato;
      const formato = state?.formato;

      state = null;
      draftView = null;

      if (statoPrimaUscita === "draft") {
        ui = "home";
      } else {
        ui = formato === "playoff"
          ? "difficolta-playoff"
          : "difficolta";
      }

      break;
    }
    default:
      throw new Error(`azione sconosciuta: ${action.type}`);
  }
  if (state && state.stato !== "finito") saveCurrentRun(window.localStorage, { state, ui, draftView });
  else clearCurrentRun(window.localStorage);
  if (!wasActive && state) history.pushState({ ui: "active" }, "");
  else if (
    action.type === "reset"
    || action.type === "exitToDifficolta"
    || action.type === "exitToHome"
    || action.type === "exitDraftToHome"
  ) history.replaceState({ ui }, "");
  else if (state) history.replaceState({ ui: "active" }, "");
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
  app.dataset.ui = name;
  app.replaceChildren(screen(ctx()));

  // Consumiamo l'intro dopo il primo render della Home.
  // Da questo momento ogni ritorno interno mostra subito la Home.
  if (name === "home") {
    showHomeIntro = false;
    try { sessionStorage.setItem("buzzer:home-intro-seen", "1"); } catch {}
  }
}

history.replaceState({ ui: state ? "guard" : ui }, "");
if (state) history.pushState({ ui: "active" }, "");


function closeOverlayBeforeBack() {
  const settingsClose = document.querySelector(
    '#settings-dialog:not([hidden]) #close-settings'
  );

  if (settingsClose) {
    settingsClose.click();
    return true;
  }

  const loginClose = document.querySelector(
    '#settings-dialog:not([hidden]) [data-account="close"]'
  );

  if (loginClose) {
    loginClose.click();
    return true;
  }

  const dialog = document.querySelector("dialog[open]");

  if (dialog) {
    dialog.close();
    return true;
  }

  return false;
}

// BUZZER EDGE SWIPE BACK
// Mobile/PWA: swipe dal bordo sinistro verso destra.
// Usa la stessa history già gestita da go()/popstate, quindi durante
// draft/coach/run resta attivo anche il guard di uscita esistente.
let backSwipe = null;

window.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse") return;
  if (event.clientX > 28) return;
  const target = event.target;
  if (target?.closest?.("input, textarea, select, [contenteditable='true']")) return;

  backSwipe = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
  };
}, { passive: true });

window.addEventListener("pointerup", (event) => {
  if (!backSwipe || backSwipe.id !== event.pointerId) return;

  const dx = event.clientX - backSwipe.x;
  const dy = Math.abs(event.clientY - backSwipe.y);

  backSwipe = null;

  if (dx < 72) return;
  if (dy > 55) return;
  if (dx <= dy * 1.35) return;

  if (closeOverlayBeforeBack()) return;
  history.back();
}, { passive: true });

window.addEventListener("pointercancel", () => {
  backSwipe = null;
}, { passive: true });


// BUZZER TRACKPAD BACK FALLBACK
// In PWA / app window il gesto indietro del browser non sempre arriva come
// popstate. Questo fallback intercetta uno swipe orizzontale deciso da
// trackpad e richiama history.back() senza toccare la logica di gioco.
let trackpadBackGesture = {
  sumX: 0,
  sumY: 0,
  lastTs: 0,
  locked: false,
};

function resetTrackpadBackGesture() {
  trackpadBackGesture.sumX = 0;
  trackpadBackGesture.sumY = 0;
  trackpadBackGesture.lastTs = 0;
  trackpadBackGesture.locked = false;
}

function canHorizontallyScroll(el) {
  let node = el;
  while (node && node !== document.body) {
    if (node instanceof HTMLElement) {
      const cs = getComputedStyle(node);
      const scrollable =
        node.scrollWidth > node.clientWidth + 4 &&
        /(auto|scroll)/.test(cs.overflowX);
      if (scrollable) return true;
    }
    node = node.parentElement;
  }
  return false;
}

window.addEventListener("wheel", (event) => {
  if (event.ctrlKey) return;
  if (event.deltaMode !== 0) return;
  const target = event.target;
  if (target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
  if (canHorizontallyScroll(target)) return;

  const now = Date.now();
  if (trackpadBackGesture.lastTs && now - trackpadBackGesture.lastTs > 260) {
    resetTrackpadBackGesture();
  }

  trackpadBackGesture.lastTs = now;
  trackpadBackGesture.sumX += event.deltaX;
  trackpadBackGesture.sumY += event.deltaY;

  const ax = Math.abs(trackpadBackGesture.sumX);
  const ay = Math.abs(trackpadBackGesture.sumY);

  if (ax < 70) return;
  if (ax < ay * 1.8) return;
  if (trackpadBackGesture.locked) return;

  trackpadBackGesture.locked = true;
  event.preventDefault();

  if (!closeOverlayBeforeBack()) {
    history.back();
  }

  setTimeout(() => {
    resetTrackpadBackGesture();
  }, 250);
}, { passive: false });

window.addEventListener("blur", resetTrackpadBackGesture);
window.addEventListener("pagehide", resetTrackpadBackGesture);

window.addEventListener("popstate", (event) => {
  if (state) {
    history.pushState({ ui: "active" }, "");
    if (state.stato === "finito") dispatch({ type: "reset" });
    else if (document.querySelector("#app-exit")) document.querySelector("#app-exit").click();
    else dispatch({ type: "exitToHome" });
    return;
  }
  if (screens[event.state?.ui]) go(event.state.ui, true);
});

render();

function toastUpdate(message, kind = "ok") {
  let toast = document.getElementById("update-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "update-toast";
    toast.className = "update-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.dataset.kind = kind;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function offerUpdate(worker) {
  updateWorker = worker;
  publishedUpdateAvailable = true;
  let button = document.getElementById("app-update");
  if (!button) {
    button = document.createElement("button");
    button.id = "app-update";
    button.className = "app-update";
    document.body.appendChild(button);
  }
  button.textContent = "Nuova versione pronta · Aggiorna";
  button.onclick = () => (updateWorker || swRegistration?.waiting)?.postMessage("SKIP_WAITING");
  syncUpdateControls();
}

function waitForWorker(worker) {
  if (!worker || ["installed", "activated", "redundant"].includes(worker.state)) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      if (["installed", "activated", "redundant"].includes(worker.state)) {
        worker.removeEventListener("statechange", done);
        resolve();
      }
    };
    worker.addEventListener("statechange", done);
    setTimeout(() => { worker.removeEventListener("statechange", done); resolve(); }, 5000);
  });
}


async function activeOfflineVersion() {
  const controller = navigator.serviceWorker?.controller;
  if (!controller) return null;
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(null), 1200);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      resolve(event.data?.version ?? null);
    };
    try { controller.postMessage({ type: "GET_VERSION" }, [channel.port2]); }
    catch { clearTimeout(timer); resolve(null); }
  });
}

async function publishedOfflineVersion() {
  const url = new URL("./offline-assets.js", location.href);
  url.searchParams.set("update-check", String(Date.now()));
  const response = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
  if (!response.ok) throw new Error(`offline-assets ${response.status}`);
  const text = await response.text();
  return text.match(/OFFLINE_VERSION\s*=\s*["']([^"']+)/)?.[1] ?? null;
}

async function checkForUpdates({ silent = false } = {}) {
  if (!("serviceWorker" in navigator)) {
    if (!silent) toastUpdate("Aggiornamenti non disponibili in questo browser", "error");
    return false;
  }

  if (!swRegistration) {
    try { swRegistration = await navigator.serviceWorker.ready; }
    catch { /* handled below */ }
  }
  if (!swRegistration) {
    if (!silent) toastUpdate("Servizio aggiornamenti non ancora pronto", "error");
    return false;
  }

  if (
    swRegistration.waiting
    || updateWorker
  ) {
    const worker =
      swRegistration.waiting
      || updateWorker;

    publishedUpdateAvailable = true;

    if (silent) {
      offerUpdate(worker);
      return true;
    }

    updateWorker = worker;
    syncUpdateControls();
    toastUpdate("Installazione aggiornamento…", "update");

    try {
      worker.postMessage("SKIP_WAITING");
      return true;
    } catch (error) {
      console.warn("Installazione aggiornamento fallita", error);
      toastUpdate("Installazione non riuscita. Riprova.", "error");
      return false;
    }
  }

  updateChecking = true;
  syncUpdateControls();
  if (!silent) toastUpdate("Controllo versione online…");

  try {
    const [activeVersion, publishedVersion] = await Promise.all([
      activeOfflineVersion(),
      publishedOfflineVersion(),
    ]);

    // Forza Safari/iOS a ricontrollare sia sw.js sia importScripts senza HTTP cache.
    await swRegistration.update();
    await waitForWorker(swRegistration.installing);

    const waiting = swRegistration.waiting;
    if (waiting) {
      offerUpdate(waiting);
      if (!silent) toastUpdate("Nuova versione trovata", "update");
      return true;
    }

    if (
      publishedVersion
      && activeVersion
      && publishedVersion !== activeVersion
    ) {
      /*
       * Safari/iOS a volte vede correttamente la versione online
       * ma non porta il nuovo worker in waiting.
       *
       * Cambiando la URL dello script con la versione pubblicata,
       * forziamo un ciclo di update reale mantenendo lo stesso scope.
       */
      publishedUpdateAvailable = true;
      syncUpdateControls();

      try {
        const forcedUrl = new URL(
          "./sw.js",
          location.href
        );

        forcedUrl.searchParams.set(
          "v",
          publishedVersion
        );

        swRegistration =
          await navigator.serviceWorker.register(
            forcedUrl,
            {
              updateViaCache: "none",
              scope: "./",
            }
          );

        await waitForWorker(
          swRegistration.installing
        );

        const forcedWorker =
          swRegistration.waiting;

        if (forcedWorker) {
          updateWorker = forcedWorker;
          syncUpdateControls();

          if (!silent) {
            toastUpdate(
              "Nuova versione pronta · Aggiorna",
              "update"
            );
          }

          return true;
        }
      } catch (error) {
        console.warn(
          "Fallback aggiornamento PWA fallito",
          error
        );
      }

      if (!silent) {
        toastUpdate(
          "Nuova versione online. Premi Aggiorna.",
          "update"
        );
      }

      return true;
    }

    if (!silent) {
      const suffix = publishedVersion ? ` · ${publishedVersion}` : "";
      toastUpdate(`Buzzer è aggiornato${suffix}`);
    }
    return false;
  } catch (error) {
    console.warn("Controllo aggiornamenti fallito", error);
    if (!silent) toastUpdate(navigator.onLine ? "Controllo non riuscito. Riprova." : "Sei offline: impossibile controllare", "error");
    return false;
  } finally {
    updateChecking = false;
    syncUpdateControls();
  }
}

if ("serviceWorker" in navigator) {
  const controlledAtLoad = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).then((registration) => {
    swRegistration = registration;
    if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting);
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting);
      });
    });
    // In una PWA installata il browser può diradare i controlli automatici.
    // Al ritorno in primo piano forziamo un check silenzioso; il pulsante in
    // Home permette in più di controllare manualmente e vedere sempre l'esito.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkForUpdates({ silent: true });
    });
  }).catch((error) => console.warn("Service worker non registrato", error));
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    updateWorker = null;
    publishedUpdateAvailable = false;

    if (controlledAtLoad && !reloading) {
      reloading = true;
      location.reload();
    }
  });
}
