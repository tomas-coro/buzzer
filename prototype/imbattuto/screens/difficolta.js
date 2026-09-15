import { DIFFICULTIES, TETTI } from "../../../game/difficulty.js";
import { formattaSalario } from "../../../game/salary.js";

const META = {
  facile: {
    nome: "Facile",
    descrizione: "Più informazioni e più margine per costruire la rosa.",
    scouting: "Scouting ampio",
  },
  normale: {
    nome: "Normale",
    descrizione: "L'esperienza Buzzer più equilibrata.",
    scouting: "Scouting standard",
  },
  difficile: {
    nome: "Difficile",
    descrizione: "Meno margine: ogni scelta pesa di più.",
    scouting: "Scouting ridotto",
  },
  incubo: {
    nome: "Incubo",
    descrizione: "Budget minimo e nessun margine d'errore.",
    scouting: "Scouting minimo",
  },
};

const NOME_DEFAULT = "Dinamo Sofà";

export function render(ctx) {
  const root = document.createElement("div");
  root.className = "cabhome ph--cab diffscreen diff-v3";
  const playoff = ctx.formato === "playoff";
  let selected = "normale";

  const cards = Object.entries(DIFFICULTIES).map(([key, d]) => {
    const m = META[key];
    const aiutiTotali = Number(d.aids.respin || 0) + Number(d.aids.squadra || 0) + Number(d.aids.stagione || 0);
    const aiuti = aiutiTotali === 0 ? "Nessun aiuto" : `${aiutiTotali} aiuti disponibili`;
    return `
      <button class="diff-row diff-row--${key}${key === selected ? " is-selected" : ""}" data-diff="${key}" type="button" aria-pressed="${key === selected}">
        <span class="diff-row-radio" aria-hidden="true"><i></i></span>
        <span class="diff-row-main">
          <span class="diff-row-title">${m.nome}</span>
          <span class="diff-row-desc">${m.descrizione}</span>
          <span class="diff-row-meta">${m.scouting} · ${aiuti}</span>
        </span>
        <span class="diff-row-budget"><small>Budget</small><b>${formattaSalario(TETTI[key])}</b></span>
      </button>`;
  }).join("");

  root.innerHTML = `
    <div class="scr diff-scr diff-scr-v3">
      <header class="diff-nav diff-nav-v3">
        <button class="diff-back" id="back" type="button" aria-label="Torna alla Home">‹ Home</button>
        <span class="diff-step">NUOVA PARTITA</span>
      </header>

      <section class="diff-intro-v3">
        <div class="bz-wm diff-wm">${playoff ? "SERIE <b>PLAYOFF</b>" : "L'IM<b>BATT</b>UTO"}</div>
        <p>${playoff
          ? "Quattro serie al meglio delle 7. Costruisci la tua squadra, scegli il livello e prova ad arrivare fino in fondo."
          : "Costruisci la tua squadra e prova a restare imbattuto fino alla fine. Il livello cambia budget, scouting e aiuti disponibili."}</p>
      </section>

      <section class="team-box-v3" aria-labelledby="team-label">
        <div class="team-box-head">
          <label id="team-label" for="nomesq">Nome della tua squadra</label>
          <span>0/24</span>
        </div>
        <div class="team-input-wrap">
          <input id="nomesq" class="dn-in team-input" type="text" maxlength="24" autocomplete="off" value="${NOME_DEFAULT}">
          <span class="team-edit" aria-hidden="true">✎</span>
        </div>
      </section>

      <section class="difficulty-list-v3" aria-labelledby="diff-title">
        <div class="difficulty-heading-v3">
          <div>
            <span class="team-eyebrow">DIFFICOLTÀ</span>
            <h2 id="diff-title">Scegli il tuo livello</h2>
          </div>
          <span>Il budget è già incluso nel livello</span>
        </div>
        <div class="diff-rows">${cards}</div>
      </section>

      <button class="diff-start diff-start-v3" id="start" type="button">
        <span class="start-play" aria-hidden="true">▶</span>
        ${playoff ? "Inizia i playoff" : "Inizia il draft"}
      </button>
    </div>
  `;

  root.querySelector("#back").onclick = () => ctx.go("home");
  const input = root.querySelector("#nomesq");
  const counter = root.querySelector(".team-box-head span");
  const nome = () => (input.value.trim() || NOME_DEFAULT);
  const syncCounter = () => { counter.textContent = `${input.value.length}/24`; };
  input.oninput = syncCounter;
  input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); input.blur(); } };
  syncCounter();

  const syncSelection = () => {
    root.querySelectorAll(".diff-row").forEach((card) => {
      const on = card.dataset.diff === selected;
      card.classList.toggle("is-selected", on);
      card.setAttribute("aria-pressed", String(on));
    });
  };

  root.querySelectorAll(".diff-row").forEach((card) => {
    card.onclick = () => { selected = card.dataset.diff; syncSelection(); };
  });

  root.querySelector("#start").onclick = () => ctx.dispatch({
    type: "newRun", formato: ctx.formato, difficolta: selected, squadra: nome(),
  });

  return root;
}
