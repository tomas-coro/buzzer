import { toDisplayOvr } from "../display.js";
import { appHeader } from "./_chrome.js";

// ctx: { state, dispatch, go }
export function render(ctx) {
  const { state } = ctx;
  const vinto = state.esito === "imbattuto";
  const el = document.createElement("section");
  el.className = `screen esito ${vinto ? "win" : "lose"}`;
  const righe = state.storia.map((h) =>
    `<li>Round ${h.round}: ${h.vinto ? "✓" : "✗"} ${toDisplayOvr(h.tuo)} vs ${toDisplayOvr(h.loro)} (${h.avversario})</li>`).join("");
  el.innerHTML = `
    ${appHeader(state)}
    <h1 class="display">${vinto ? "IMBATTUTO" : "SCONFITTA"}</h1>
    <p class="riepilogo">${state.vittorie} vittorie di fila</p>
    <ul class="storia">${righe}</ul>
    <div class="azioni">
      <button class="cta" id="leaderboard">Leaderboard</button>
      <button class="chip" id="ancora">Nuovo run</button>
    </div>
  `;
  el.querySelector("#ancora").onclick = () => ctx.dispatch({ type: "reset" });
  el.querySelector("#leaderboard").onclick = () => ctx.go("leaderboard");
  return el;
}
