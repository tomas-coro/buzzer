import { DIFFICULTIES, TETTI } from "../../../game/difficulty.js";
import { formattaSalario } from "../../../game/salary.js";

const META = {
  facile:    { nome: "Facile",    tag: "Riscaldamento", vedi: "Tutto" },
  normale:   { nome: "Normale",   tag: "La corsa",      vedi: "OVR + stats" },
  difficile: { nome: "Difficile", tag: "Ferro",         vedi: "Solo stats" },
  incubo:    { nome: "Incubo",    tag: "Nessuna rete",  vedi: "Al buio" },
};

const NOME_DEFAULT = "Dinamo Sofà";

export function render(ctx) {
  const root = document.createElement("div");
  root.className = "cabhome ph--cab diffscreen diff-v2";
  const playoff = ctx.formato === "playoff";
  let selected = "normale";

  const cards = Object.entries(DIFFICULTIES).map(([key, d]) => {
    const m = META[key];
    const aiuti = `${d.aids.respin} re-spin · ${d.aids.squadra} squadra · ${d.aids.stagione} stagione`;
    return `
      <button class="diff-card${key === selected ? " is-selected" : ""}" data-diff="${key}" type="button" aria-pressed="${key === selected}">
        <span class="diff-card-top">
          <span><span class="dc-name">${m.nome}</span><span class="dc-tag">${m.tag}</span></span>
          <span class="diff-check" aria-hidden="true">✓</span>
        </span>
        <span class="diff-card-stats">
          <span><small>Scouting</small><b>${m.vedi}</b></span>
          <span><small>Budget</small><b>${formattaSalario(TETTI[key])}</b></span>
        </span>
        <span class="dc-aid">${aiuti}</span>
      </button>`;
  }).join("");

  root.innerHTML = `
    <div class="scr diff-scr diff-scr-v2">
      <header class="diff-nav">
        <button class="diff-back" id="back" type="button" aria-label="Torna alla Home">‹ Home</button>
        <span class="diff-step">NUOVA PARTITA</span>
      </header>

      <section class="diff-head diff-head-v2">
        <div class="bz-wm diff-wm">${playoff ? "SERIE <b>PLAYOFF</b>" : "L'IM<b>BATT</b>UTO"}</div>
        <p class="diff-sub">${playoff
          ? "<b>4 serie al meglio delle 7.</b> Scegli squadra e livello, poi parti."
          : "<b>16 vittorie di fila.</b> Scegli squadra e livello, poi parte il draft."}</p>
      </section>

      <section class="team-panel" aria-labelledby="team-label">
        <div class="team-panel-copy">
          <span class="team-eyebrow">LA TUA SQUADRA</span>
          <label id="team-label" for="nomesq">Nome squadra</label>
          <span>Comparirà nella cronaca e nei risultati.</span>
        </div>
        <div class="team-input-wrap">
          <input id="nomesq" class="dn-in team-input" type="text" maxlength="24" autocomplete="off" value="${NOME_DEFAULT}">
          <span class="team-edit" aria-hidden="true">✎</span>
        </div>
      </section>

      <section class="difficulty-panel" aria-labelledby="diff-title">
        <div class="difficulty-title-row">
          <div><span class="team-eyebrow">LIVELLO</span><h2 id="diff-title">Quanto vuoi rischiare?</h2></div>
          <span class="difficulty-hint">Tocca per selezionare</span>
        </div>
        <div class="diff-grid">${cards}</div>
      </section>

      <div class="diff-bottom">
        <div class="diff-selection" id="diff-selection"><span>Selezionato</span><b>Normale</b></div>
        <button class="diff-start" id="start" type="button">${playoff ? "Inizia i playoff" : "Inizia il draft"}<span>›</span></button>
      </div>
    </div>
  `;

  root.querySelector("#back").onclick = () => ctx.go("home");
  const input = root.querySelector("#nomesq");
  const nome = () => (input.value.trim() || NOME_DEFAULT);
  input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); input.blur(); } };

  const syncSelection = () => {
    root.querySelectorAll(".diff-card").forEach((card) => {
      const on = card.dataset.diff === selected;
      card.classList.toggle("is-selected", on);
      card.setAttribute("aria-pressed", String(on));
    });
    root.querySelector("#diff-selection b").textContent = META[selected].nome;
  };

  root.querySelectorAll(".diff-card").forEach((card) => {
    card.onclick = () => { selected = card.dataset.diff; syncSelection(); };
  });

  root.querySelector("#start").onclick = () => ctx.dispatch({
    type: "newRun", formato: ctx.formato, difficolta: selected, squadra: nome(),
  });

  return root;
}
