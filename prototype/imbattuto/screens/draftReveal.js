import { SLOTS, TITOLARE, PANCA, cartaIn, ruoloDi } from "../../../game/rosa.js";
import { teamColors, initials } from "../team-colors.js";
import { appHeader } from "./_chrome.js";

// Reveal finale dell'auto-draft (playtest 31/08): quando "Completa rosa" ha
// appena finito, la rosa è già piena (app.js ha già fatto girare tutto il
// loop) - prima si tagliava dritti a Coach, un salto secco senza mostrare la
// squadra che si è appena presa. Qui le dieci caselle si accendono a
// scaletta (stagger CSS via --d), poi la schermata si dispatcha da sola
// avanti (autoDraftAdvance) - nessun bottone da premere, è solo un momento
// da vedere passare.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const VOLTI_PATH = "../../assets/volti";

function faceHTML(card) {
  const { c1, c2 } = teamColors(card.team_abbr);
  const foto = `<img class="ph" src="${VOLTI_PATH}/${encodeURIComponent(card.player_id)}.webp"
      alt="" loading="lazy" decoding="async"
      onload="this.parentNode.classList.add('hasph')" onerror="this.remove()">`;
  return `<span class="face" style="--tc1:${c1};--tc2:${c2}"><span class="mono">${esc(initials(card.name))}</span>${foto}</span>`;
}

// ctx: { state, dispatch }
export function render(ctx) {
  const { state } = ctx;
  const el = document.createElement("section");
  el.className = "screen draft-reveal";

  const titolariSlots = SLOTS.filter((s) => s.tipo === TITOLARE);
  const pancaSlots = SLOTS.filter((s) => s.tipo === PANCA);
  const cellHTML = (slot, i) => {
    const c = cartaIn(state.rosa, slot);
    const ruolo = slot.tipo === TITOLARE ? slot.ruolo : ruoloDi(c, slot);
    return `<div class="rv-card" style="--d:${i * 70}ms">
      ${faceHTML(c)}
      <span class="rv-ru">${esc(ruolo)}</span>
      <span class="rv-nm">${esc(c.name)}</span>
      <span class="rv-ov">${c.ovr}</span>
    </div>`;
  };

  el.innerHTML = `
    ${appHeader(state)}
    <div class="rv-wrap">
      <p class="rv-lab">Rosa completa</p>
      <div class="rv-grid">
        ${[...titolariSlots, ...pancaSlots].map(cellHTML).join("")}
      </div>
    </div>`;

  // Chi ha chiesto meno movimento non aspetta la scaletta: avanza quasi subito.
  const senzaMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const attesa = senzaMovimento ? 200 : SLOTS.length * 70 + 500;
  setTimeout(() => ctx.dispatch({ type: "autoDraftAdvance" }), attesa);

  return el;
}
