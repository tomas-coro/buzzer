import { leaderboard, lifetimeStats } from "../meta.js";

const DIFF_LABEL = { facile: "Facile", normale: "Normale", difficile: "Difficile", incubo: "Incubo" };
const DIFFS = Object.keys(DIFF_LABEL);

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
          <span class="a-esito ${r.esito === "imbattuto" ? "win" : "lose"}">${r.esito === "imbattuto" ? "Imbattuto" : "Sconfitta"}</span>
          <span class="a-data">${dataRelativa(r.ts)}</span>
        </span>
        <span class="a-vitt">${r.vittorie}<small>vittorie</small></span>
      </div>
    </li>`).join("");
}

// ctx: { state, dispatch, go } - usa window.localStorage nel browser
export function render(ctx) {
  const store = window.localStorage;
  const formato = "imbattuto"; // il motore lo salva ma il prototipo ha un solo formato
  let difficolta = ctx.state?.difficolta ?? "normale";

  const el = document.createElement("section");
  el.className = "screen leaderboard";
  el.innerHTML = `
    <div id="difftabs">${DIFFS.map((d) => `<button data-diff="${d}">${DIFF_LABEL[d]}</button>`).join("")}</div>
    <h1 class="display">Leaderboard</h1>
    <p class="bucket" id="bucket-sub"></p>
    <ol class="classifica" id="rows"></ol>
    <div class="lifetime" id="lifetime"></div>
    <button class="chip" id="home">Home</button>
  `;

  const st = lifetimeStats(store);
  el.querySelector("#lifetime").innerHTML = `
    <span><b>${st.runs}</b> run</span>
    <span><b>${st.imbattuti}</b> imbattuti</span>
    <span><b>${st.migliorStreak}</b> miglior streak</span>
  `;

  function paint() {
    el.querySelectorAll("#difftabs button").forEach((b) => b.classList.toggle("on", b.dataset.diff === difficolta));
    el.querySelector("#bucket-sub").textContent = `${formato} · ${difficolta}`;
    el.querySelector("#rows").innerHTML = renderRows(leaderboard(store, formato, difficolta));
  }

  el.querySelectorAll("#difftabs button").forEach((b) => {
    b.addEventListener("click", () => {
      difficolta = b.dataset.diff;
      paint();
    });
  });
  el.querySelector("#home").onclick = () => ctx.dispatch({ type: "reset" });

  paint();
  return el;
}
