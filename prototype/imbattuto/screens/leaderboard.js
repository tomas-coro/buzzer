import { leaderboard, lifetimeStats } from "../meta.js";

const DIFF_LABEL = { facile: "Facile", normale: "Normale", difficile: "Difficile", incubo: "Incubo" };
const DIFFS = Object.keys(DIFF_LABEL);
const FORMATO_LABEL = { imbattuto: "Corsa", playoff: "Playoff" };
const FORMATI = Object.keys(FORMATO_LABEL);

// "imbattuto" vince l'esito omonimo; "playoff" vince con "campione" (vedi
// resolveSeriesGame in game/run.js) - due nomi diversi per lo stesso concetto
// di "corsa portata a termine".
function vinta(r) {
  return r.esito === "imbattuto" || r.esito === "campione";
}
function etichettaEsito(r) {
  if (r.esito === "campione") return "Campione";
  return vinta(r) ? "Imbattuto" : "Sconfitta";
}

function dataRelativa(ts) {
  const giorni = Math.floor((Date.now() - ts) / 86400000);
  if (giorni <= 0) return "oggi";
  if (giorni === 1) return "ieri";
  if (giorni < 14) return `${giorni} giorni fa`;
  return `${Math.round(giorni / 7)} settimane fa`;
}

function fasciaRank(i) {
  if (i === 0) return "oro";
  if (i <= 2) return "argento";
  return "bronzo";
}

function renderRows(runs) {
  if (!runs.length) return `<li class="lb-vuoto">Ancora nessun run in questo bucket.</li>`;
  return runs.map((r, i) => `
    <li style="--i:${i}">
      <div class="a-row">
        <span class="a-rank ${fasciaRank(i)}">${i + 1}</span>
        <span class="a-mid">
          <span class="a-esito ${vinta(r) ? "win" : "lose"}">${etichettaEsito(r)}</span>
          <span class="a-data">${dataRelativa(r.ts)}</span>
        </span>
        <span class="a-vitt">${r.vittorie}<small>vittorie</small></span>
      </div>
    </li>`).join("");
}

// ctx: { state, dispatch, go } - usa window.localStorage nel browser
export function render(ctx) {
  const store = window.localStorage;
  // Il tab formato parte dal formato della run appena finita (se c'è), ma resta
  // cambiabile: si vuole confrontare "Corsa" e "Playoff" senza dover tornare in
  // home e rigiocare per cambiare bucket.
  let formato = ctx.state?.formato ?? "imbattuto";
  let difficolta = ctx.state?.difficolta ?? "normale";

  const el = document.createElement("section");
  el.className = "screen leaderboard";
  el.innerHTML = `
    <div id="formatotabs">${FORMATI.map((f) => `<button data-formato="${f}">${FORMATO_LABEL[f]}</button>`).join("")}</div>
    <div id="difftabs">${DIFFS.map((d) => `<button data-diff="${d}">${DIFF_LABEL[d]}</button>`).join("")}</div>
    <h1 class="display">Leaderboard</h1>
    <p class="bucket" id="bucket-sub"></p>
    <ol class="classifica" id="rows"></ol>
    <div class="lifetime" id="lifetime"></div>
    <div class="row-actions">
      <button class="chip" id="profilo">Profilo</button>
      <button class="chip" id="home">Home</button>
    </div>
  `;

  const st = lifetimeStats(store);
  el.querySelector("#lifetime").innerHTML = `
    <span><b>${st.runs}</b> run</span>
    <span><b>${st.imbattuti}</b> imbattuti</span>
    <span><b>${st.campioni}</b> campione/i</span>
    <span><b>${st.migliorStreak}</b> miglior streak</span>
  `;

  function paint() {
    el.querySelectorAll("#formatotabs button").forEach((b) => b.classList.toggle("on", b.dataset.formato === formato));
    el.querySelectorAll("#difftabs button").forEach((b) => b.classList.toggle("on", b.dataset.diff === difficolta));
    el.querySelector("#bucket-sub").textContent = `${FORMATO_LABEL[formato]} · ${DIFF_LABEL[difficolta]}`;
    el.querySelector("#rows").innerHTML = renderRows(leaderboard(store, formato, difficolta));
  }

  el.querySelectorAll("#formatotabs button").forEach((b) => {
    b.addEventListener("click", () => {
      formato = b.dataset.formato;
      paint();
    });
  });
  el.querySelectorAll("#difftabs button").forEach((b) => {
    b.addEventListener("click", () => {
      difficolta = b.dataset.diff;
      paint();
    });
  });
  el.querySelector("#home").onclick = () => ctx.dispatch({ type: "reset" });
  el.querySelector("#profilo").onclick = () => ctx.go("profilo");

  paint();
  return el;
}
