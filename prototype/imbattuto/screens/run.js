import { ROLES } from "../../../game/roster.js";
import { esitoRound } from "../../../game/run.js";
import { toDisplayOvr } from "../display.js";
import { teamColors, initials } from "../team-colors.js";
import { appHeader, esc } from "./_chrome.js";

// Il run è un tabellone da palazzetto: cornice, viti agli angoli, shot clock al
// centro e la lampada della sirena che si accende sul buzzer. L'oggetto È la
// schermata, non un riquadro appoggiato su una pagina.
//
// Perché una piccola messinscena e non un click che risolve e basta: il round si
// ripete 16 volte, e senza un attimo di attesa la partita non ha tensione. Il
// tempo totale è ~1,3s, tarato per non stancare alla decima ripetizione.
//
// Il vincolo tecnico che decide la struttura: app.js ri-renderizza tutta la
// schermata a ogni dispatch. Se dispatchassi al click, la nuova schermata
// nascerebbe a metà animazione e il buzzer non si vedrebbe. Quindi:
//   click → shot clock (locale) → buzzer + verdetto (locale) → POI dispatch.
// L'esito lo chiedo al motore con esitoRound(), che non muta niente.

const PLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;

const TEMPI = {
  battito: 220,      // durata di un battito di shot clock
  battiti: 3,        // 3 battiti: 660 ms di attesa prima del verdetto
  verdettoVinta: 700,   // quanto resta il cartello quando si vince (~1,36 s in tutto)
  verdettoPersa: 1400,  // sulla sconfitta resta di più: è l'ultima cosa che vedi
};

const fascia = (o) => (o >= 88 ? "oro" : o >= 82 ? "arg" : "brz");

function facciaHTML(card) {
  const { c1, c2 } = teamColors(card.team_abbr);
  return `<span class="rn-face" style="--tc1:${c1};--tc2:${c2}"><span class="ini">${esc(initials(card.name))}</span></span>`;
}

// ctx: { state, N, dispatch }
export function render(ctx) {
  const { state, N } = ctx;
  const el = document.createElement("section");
  el.className = "screen run";

  const vinte = state.vittorie;
  const avv = state.avversario;
  const tuo = toDisplayOvr(state.voto.ovr);
  const loro = toDisplayOvr(avv.voto.ovr);
  const vinto = esitoRound(state);

  // Tacche: una per vittoria richiesta. Accese le vinte, in evidenza la prossima.
  const tacche = Array.from({ length: N }, (_, i) =>
    `<span class="${i < vinte ? "on" : i === vinte ? "next" : ""}"></span>`).join("");

  // Ultime quattro squadre battute: il tabellone di un palazzetto tiene memoria.
  const ultime = state.storia.filter((r) => r.vinto).slice(-4);
  const log = ultime.length
    ? ultime.map((r, i, a) => `<span class="${i === a.length - 1 ? "last" : ""}">${esc(r.avversario)}</span>`).join("")
    : `<span class="vuoto">nessuna, si comincia adesso</span>`;

  // Le due formazioni in campo. La mia per ruolo (il draft riempie gli slot),
  // la loro nell'ordine in cui il motore la costruisce (top-5 per overall).
  const striscia = (carte, etichette) => carte.map((c, i) => `
    <span class="rn-p">
      ${facciaHTML(c)}
      <span class="role">${etichette[i]}</span>
      <span class="ovr ${fascia(c.ovr)}">${c.ovr}</span>
    </span>`).join("");

  const mieCarte = ROLES.map((r) => state.quintetto[r]);
  // La loro è la top-5 per overall, non un quintetto per ruolo: può avere due ali
  // grandi e nessun playmaker. La ordino per ruolo canonico così la striscia si
  // legge come una formazione, senza fingere ruoli che il motore non assegna.
  const loroCarte = [...avv.quintet].sort(
    (a, b) => ROLES.indexOf(a.pos.primary) - ROLES.indexOf(b.pos.primary));

  el.innerHTML = `
    ${appHeader(state)}
    <div class="rn-streak">
      <div class="row">
        <span class="lab">Vittorie di fila</span>
        <span class="num"><b>${String(vinte).padStart(2, "0")}</b><i> / ${N}</i></span>
      </div>
      <div class="rn-ticks">${tacche}</div>
    </div>

    <div class="rn-board">
      <div class="rn-siren" aria-hidden="true"></div>
      <div class="rn-verdict ${vinto ? "win" : "lose"}" id="rnVerdict" role="status">
        ${vinto ? "Passi il turno" : "Eliminato"}
      </div>
      <div class="rn-strip">
        <span class="rn-round">Round <b>${state.round}</b></span>
        <span class="rn-per">${esc(state.difficolta)}</span>
      </div>
      <div class="rn-sides">
        <span class="rn-side me">
          <span class="who">Il tuo quintetto</span>
          <span class="score">${tuo}</span>
          <span class="cap">${esc(state.coach?.name ?? "senza coach")}</span>
        </span>
        <span class="rn-clock">
          <span class="disc"><b id="rnClock">24</b></span>
          <i>Shot clock</i>
        </span>
        <span class="rn-side">
          <span class="who">${esc(avv.team)} ${esc(avv.season)}</span>
          <span class="score">${loro}</span>
          <span class="cap">avversario</span>
        </span>
      </div>
      <div class="rn-in">
        <div class="rn-five-lab"><span class="t">La tua formazione</span><span class="v">${esc(state.coach?.tattica ?? "")}</span></div>
        <div class="rn-five">${striscia(mieCarte, ROLES)}</div>
        <div class="rn-five-lab loro"><span class="t">Chi hai di fronte</span><span class="v">${esc(avv.team)} ${esc(avv.season)}</span></div>
        <div class="rn-five">${striscia(loroCarte, loroCarte.map((c) => c.pos.primary))}</div>
      </div>
      <div class="rn-log">
        <span class="t">Già battute</span>
        <span class="chips">${log}</span>
      </div>
    </div>

    <button class="cta" id="gioca">${PLAY}<span>Gioca il round</span></button>`;

  // ---- messinscena del round --------------------------------------------
  const board = el.querySelector(".rn-board");
  const clock = el.querySelector("#rnClock");
  const bottone = el.querySelector("#gioca");
  // Chi ha chiesto meno movimento salta l'attesa: il round si risolve subito.
  const senzaMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  bottone.onclick = () => {
    if (board.classList.contains("playing") || board.classList.contains("buzz")) return;
    bottone.disabled = true;

    if (senzaMovimento) { ctx.dispatch({ type: "resolveRound" }); return; }

    board.classList.add("playing");
    let n = TEMPI.battiti;
    clock.textContent = String(n).padStart(2, "0");

    const battito = setInterval(() => {
      n -= 1;
      clock.textContent = String(Math.max(n, 0)).padStart(2, "0");
      if (n > 0) return;

      clearInterval(battito);
      board.classList.remove("playing");
      board.classList.add("buzz");   // sirena + verdetto stampato + tacca accesa

      const tacche = el.querySelectorAll(".rn-ticks span");
      if (vinto && tacche[vinte]) {
        tacche[vinte].classList.remove("next");
        tacche[vinte].classList.add("on", "just");
      }

      // Il dispatch arriva alla fine: da qui in poi la schermata è sostituita.
      setTimeout(() => ctx.dispatch({ type: "resolveRound" }),
        vinto ? TEMPI.verdettoVinta : TEMPI.verdettoPersa);
    }, TEMPI.battito);
  };

  return el;
}
