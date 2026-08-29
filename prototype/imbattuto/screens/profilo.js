// PROFILO - port fedele del mockup 85-profilo-cabina90. Elenco dei giocatori
// draftati (una riga per PERSONA, aggregati da meta.profiloGiocatori()) con
// selettore ordine e uno sheet di dettaglio che riusa il markup .c1 della
// scheda densa del draft (mockup 67), esteso con totali di carriera + record.

import { profiloGiocatori } from "../meta.js";
import { teamColors, initials } from "../team-colors.js";
import { esc } from "./_chrome.js";

const VOLTI_PATH = "../../assets/volti";

// I totali/medie/record arrivano da game/boxscore.js con le chiavi inglesi di
// STAT_BOX (pts/reb/ast/stl/tov/blk): qui si mappano sulle etichette italiane
// già usate in run.js (PT RIMB AST RUB PP STP), stesso ordine.
const ORDERS = [
  { key: "presenze", label: "Presenze", get: (g) => g.presenze, unit: "presenze" },
  { key: "pt", label: "Punti", get: (g) => g.totali.pts, unit: "punti tot" },
  { key: "ast", label: "Assist", get: (g) => g.totali.ast, unit: "assist tot" },
  { key: "rimb", label: "Rimbalzi", get: (g) => g.totali.reb, unit: "rimbalzi tot" },
];

function fasciaRank(i) {
  if (i === 0) return "oro";
  if (i <= 2) return "argento";
  return "bronzo";
}
function n1(v) { return v.toFixed(1); }

// Segnaposto volto: stesso pattern di draft.js (iniziali + gradiente colori
// squadra sotto, foto ritagliata sopra se il file esiste). `ultimo` manca solo
// per righe orfane (non dovrebbe capitare: profiloGiocatori() già le scarta).
function faceHTML(g) {
  const { c1, c2 } = teamColors(g.ultimo?.team_abbr);
  const foto = g.player_id
    ? `<img class="ph" src="${VOLTI_PATH}/${encodeURIComponent(g.player_id)}.webp"
        alt="" loading="lazy" decoding="async"
        onload="this.parentNode.classList.add('hasph')" onerror="this.remove()">`
    : "";
  return `<span class="face" style="--tc1:${c1};--tc2:${c2}"><span class="mono">${esc(initials(g.nome))}</span>${foto}</span>`;
}

function renderRows(list, order) {
  if (!list.length) return `<li class="pr-vuoto">Ancora nessun giocatore draftato.</li>`;
  return list.map((g, i) => `
    <li style="--i:${i}">
      <button class="p-row" data-i="${i}" type="button">
        <span class="p-avt ${fasciaRank(i)}">${faceHTML(g)}</span>
        <span class="p-mid">
          <span class="p-nome">${esc(g.nome)}</span>
          <span class="p-ult">${g.ultimo ? `ultimo: ${esc(g.ultimo.team_abbr)} · ${esc(g.ultimo.season)}` : ""}</span>
        </span>
        <span class="p-pres">${order.get(g)}<small>${order.unit}</small></span>
        <span class="p-chev">›</span>
      </button>
    </li>`).join("");
}

function sheetHTML(g) {
  const m = g.medie, t = g.totali, r = g.record;
  const strip = `<div class="c1-strip">
    <div class="cell"><b>${n1(m.pts)}</b><small>PT</small></div>
    <div class="cell"><b>${n1(m.reb)}</b><small>RIMB</small></div>
    <div class="cell"><b>${n1(m.ast)}</b><small>AST</small></div>
  </div>`;
  const sub = `<div class="c1-sub c1-sub-3">
    <div class="cell"><b>${n1(m.stl)}</b><small>RUB</small></div>
    <div class="cell"><b>${n1(m.tov)}</b><small>PP</small></div>
    <div class="cell"><b>${n1(m.blk)}</b><small>STP</small></div>
  </div>`;
  const tot = `<div class="c1-tot">
    <span class="lbl">Totali di carriera</span>
    <div class="grid">
      <div class="cell"><b>${t.pts}</b><small>PT</small></div>
      <div class="cell"><b>${t.reb}</b><small>RIMB</small></div>
      <div class="cell"><b>${t.ast}</b><small>AST</small></div>
      <div class="cell"><b>${t.stl}</b><small>RUB</small></div>
      <div class="cell"><b>${t.tov}</b><small>PP</small></div>
      <div class="cell"><b>${t.blk}</b><small>STP</small></div>
    </div>
  </div>`;
  const record = `<div class="c1-record">
    <span class="lbl">Record singola partita</span>
    <div class="grid">
      <div class="cell"><b>${r.pts}</b><small>PT</small></div>
      <div class="cell"><b>${r.reb}</b><small>RIMB</small></div>
      <div class="cell"><b>${r.ast}</b><small>AST</small></div>
      <div class="cell"><b>${r.stl}</b><small>RUB</small></div>
      <div class="cell"><b>${r.tov}</b><small>PP</small></div>
      <div class="cell"><b>${r.blk}</b><small>STP</small></div>
    </div>
  </div>`;
  return `
    <div class="c1-head">
      ${faceHTML(g)}
      <span class="c1-id">
        <span class="nm">${esc(g.nome)}</span>
        <span class="sub">nelle tue corse</span>
      </span>
      <span class="c1-ovr"><b>${g.presenze}</b><small>presenze</small></span>
    </div>
    <div class="c1-medielbl"><span class="lbl">Medie di carriera</span></div>
    ${strip}
    ${sub}
    ${tot}
    ${record}`;
}

// ctx: { state, dispatch, go } - usa window.localStorage nel browser
export function render(ctx) {
  const store = window.localStorage;
  const giocatori = profiloGiocatori(store);
  let orderKey = "presenze";

  const el = document.createElement("section");
  el.className = "screen profilo";
  el.innerHTML = `
    <h1 class="pr-title">Profilo</h1>
    <p class="pr-sub" id="pr-sub"></p>
    <div class="pr-order" id="order" role="group" aria-label="Ordina per">
      ${ORDERS.map((o) => `<button type="button" data-order="${o.key}" aria-pressed="${o.key === orderKey}">${o.label}</button>`).join("")}
    </div>
    <ol id="rows"></ol>
    <div class="row-actions">
      <button class="chip" id="leaderboard">Leaderboard</button>
      <button class="chip" id="home">Home</button>
    </div>
  `;

  const rows = el.querySelector("#rows");
  const sub = el.querySelector("#pr-sub");

  // Sheet dettaglio (dialog nativo): stesso pattern di draft.js, attaccato al
  // body e riusato tra un paint e l'altro invece che ricreato ogni volta.
  function openSheet(g) {
    let dlg = document.getElementById("player-sheet");
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.id = "player-sheet";
      dlg.className = "sheet";
      document.body.appendChild(dlg);
    }
    dlg.innerHTML = `
      <button class="sheet-x" id="sheet-x" type="button" aria-label="Chiudi">×</button>
      ${sheetHTML(g)}`;
    dlg.querySelector("#sheet-x").onclick = () => dlg.close();
    dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };
    dlg.showModal();
  }

  function paint() {
    const order = ORDERS.find((o) => o.key === orderKey);
    const list = [...giocatori].sort((a, b) => order.get(b) - order.get(a));
    sub.textContent = list.length ? `${list.length} giocatori draftati · ordinati per ${order.label.toLowerCase()}` : "";
    el.querySelectorAll("#order button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.order === orderKey)));
    rows.innerHTML = renderRows(list, order);
    rows.querySelectorAll(".p-row").forEach((btn) => {
      btn.addEventListener("click", () => openSheet(list[+btn.dataset.i]));
    });
  }

  el.querySelectorAll("#order button").forEach((b) => {
    b.addEventListener("click", () => {
      orderKey = b.dataset.order;
      paint();
    });
  });
  el.querySelector("#home").onclick = () => ctx.dispatch({ type: "reset" });
  el.querySelector("#leaderboard").onclick = () => ctx.go("leaderboard");

  paint();
  return el;
}
