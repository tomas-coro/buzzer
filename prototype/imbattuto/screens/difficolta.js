import { DIFFICULTIES } from "../../../game/difficulty.js";

// Scelta difficolta di L'IMBATTUTO. Passo-ponte (non tra i mockup finiti):
// tenuto minimale nel linguaggio della home Cabina 90s, chip verticali.
// "vedi" = quanto scopri della carta a quel livello (il vero differenziatore, ora che
// le vittorie sono sempre 16). Coerente col reveal del draft: facile tutto, normale
// overall+stat firma, difficile solo le stats, incubo al buio.
const META = {
  facile:    { nome: "Facile",    tag: "Riscaldamento", vedi: "Tutto" },
  normale:   { nome: "Normale",   tag: "La corsa",      vedi: "OVR + stats" },
  difficile: { nome: "Difficile", tag: "Ferro",         vedi: "Solo stats" },
  incubo:    { nome: "Incubo",    tag: "Nessuna rete",  vedi: "Al buio" },
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
          <span class="dc-see-lab">Vedi</span>
          <span class="dc-see">${m.vedi}</span>
        </span>
      </button>`;
  }).join("");

  root.innerHTML = `
    <div class="scr diff-scr">
      <button class="diff-back" id="back" type="button">‹ Home</button>
      <div class="diff-head">
        <div class="bz-wm diff-wm">L'IM<b>BATT</b>UTO</div>
        <p class="diff-sub"><b>16 vittorie di fila</b> in ogni livello. Nessuna sconfitta ammessa.</p>
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
