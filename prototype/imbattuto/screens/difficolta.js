import { DIFFICULTIES } from "../../../game/difficulty.js";

// Scelta difficolta di L'IMBATTUTO. Passo-ponte (non tra i mockup finiti):
// tenuto minimale nel linguaggio della home Cabina 90s, chip verticali.
const META = {
  facile:    { nome: "Facile",    tag: "Riscaldamento" },
  normale:   { nome: "Normale",   tag: "La corsa" },
  difficile: { nome: "Difficile", tag: "Ferro" },
  incubo:    { nome: "Incubo",    tag: "Nessuna rete" },
};

// ctx: { dispatch, go }
export function render(ctx) {
  const root = document.createElement("div");
  root.className = "cabhome ph--cab diffscreen";

  const chips = Object.entries(DIFFICULTIES).map(([key, d]) => {
    const m = META[key];
    const sw = d.freeSwitch ? "∞" : null;
    const aiuti = `${d.aids.respin} re-spin · ${sw ?? d.aids.squadra} squadra · ${sw ?? d.aids.stagione} stagione`;
    return `
      <button class="diff-chip" data-diff="${key}" type="button">
        <span class="dc-l">
          <span class="dc-name">${m.nome}</span>
          <span class="dc-tag">${m.tag}</span>
          <span class="dc-aid">${aiuti}</span>
        </span>
        <span class="dc-r">
          <span class="dc-n">${d.N}</span>
          <span class="dc-n-lab">vinte<br>di fila</span>
        </span>
      </button>`;
  }).join("");

  root.innerHTML = `
    <div class="scr diff-scr">
      <button class="diff-back" id="back" type="button">‹ Home</button>
      <div class="diff-head">
        <div class="bz-wm diff-wm">L'IM<b>BATT</b>UTO</div>
        <p class="diff-sub">Scegli la corsa. Nessuna sconfitta ammessa.</p>
      </div>
      <div class="diff-list">${chips}</div>
    </div>
  `;

  root.querySelector("#back").onclick = () => ctx.go("home");
  root.querySelectorAll(".diff-chip").forEach((b) => {
    b.onclick = () => ctx.dispatch({ type: "newRun", formato: "imbattuto", difficolta: b.dataset.diff });
  });

  return root;
}
