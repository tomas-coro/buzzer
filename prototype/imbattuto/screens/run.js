import { toDisplayOvr } from "../display.js";

// ctx: { state, N, dispatch }
export function render(ctx) {
  const { state, N } = ctx;
  const el = document.createElement("section");
  el.className = "screen run";

  // Meter del calore: N tacche, accese = vittorie
  const tacche = Array.from({ length: N }, (_, i) =>
    `<span class="tacca ${i < state.vittorie ? "on" : ""}"></span>`).join("");

  const avv = state.avversario;
  el.innerHTML = `
    <div class="meter" title="Vittorie di fila per l'imbattuto">
      <span class="meter-label display">SU ${N}</span>
      <div class="tacche">${tacche}</div>
    </div>
    <div class="tabellone">
      <div class="lato tuo">
        <span class="lato-nome display">Tu</span>
        <span class="lato-ovr">${toDisplayOvr(state.voto.ovr)}</span>
      </div>
      <span class="vs display">VS</span>
      <div class="lato loro">
        <span class="lato-nome display">${avv.team} ${avv.season}</span>
        <span class="lato-ovr">${toDisplayOvr(avv.voto.ovr)}</span>
      </div>
    </div>
    <p class="round-info">Round ${state.round}</p>
    <button class="cta" id="gioca">Gioca il round</button>
  `;
  el.querySelector("#gioca").onclick = () => ctx.dispatch({ type: "resolveRound" });
  return el;
}
