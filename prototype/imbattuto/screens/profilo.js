// PROFILO - port fedele del mockup 85-profilo-cabina90. Elenco dei giocatori
// draftati (una riga per PERSONA, aggregati da meta.profiloGiocatori()) con
// selettore ordine e uno sheet di dettaglio che riusa il markup .c1 della
// scheda densa del draft (mockup 67), esteso con totali di carriera + record.

import { profiloGiocatori, lifetimeStats, leaderboard } from "../meta.js";
import { teamColors, initials } from "../team-colors.js";
import { esc } from "./_chrome.js";

const VOLTI_PATH = "../../assets/volti";

// I totali/medie/record arrivano da game/boxscore.js con le chiavi inglesi di
// STAT_BOX (pts/reb/ast/stl/tov/blk): qui si mappano sulle etichette italiane
// già usate in run.js (PT RIMB AST RUB PP STP), stesso ordine.
const PLAYER_METRICS = [
  { key: "pts", label: "Punti" },
  { key: "ast", label: "Assist" },
  { key: "reb", label: "Rimbalzi" },
  { key: "stl", label: "Rubate" },
];

function playerMetricValue(g, metric, mode) {
  return Number(g?.[mode]?.[metric]) || 0;
}

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

function renderRows(list, metric) {
  if (!list.length) {
    return `<li class="pr-vuoto">Ancora nessun giocatore draftato.</li>`;
  }

  return list.map((g, i) => {
    const totale = Math.round(playerMetricValue(g, metric, "totali"));
    const media = n1(playerMetricValue(g, metric, "medie"));

    return `
      <li style="--i:${i}">
        <button class="stats-player-row" data-i="${i}" type="button">
          <span class="stats-player-rank">${i + 1}</span>

          <span class="stats-player-id">
            <span class="p-avt ${fasciaRank(i)}">${faceHTML(g)}</span>

            <span class="stats-player-name">
              <b>${esc(g.nome)}</b>
              <small>${g.presenze} pres. · ${g.ultimo ? `${esc(g.ultimo.team_abbr)} · ${esc(g.ultimo.season)}` : "carriera locale"}</small>
            </span>
          </span>

          <span class="stats-player-games">
            <b>${g.presenze}</b>
            <small>pres.</small>
          </span>

          <span class="stats-player-total">${totale}</span>
          <span class="stats-player-avg">${media}</span>
        </button>
      </li>`;
  }).join("");
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

function leaderStat(giocatori, key, source) {
  return giocatori.reduce((best, g) => {
    const value = Number(g?.[source]?.[key]) || 0;
    const bestValue = Number(best?.[source]?.[key]) || 0;
    return !best || value > bestValue ? g : best;
  }, null);
}

function leaderValue(g, key, source) {
  if (!g) return "—";
  const value = Number(g?.[source]?.[key]) || 0;
  return source === "medie" ? n1(value) : String(Math.round(value));
}

function leaderRow(giocatori, label, key) {
  const totale = leaderStat(giocatori, key, "totali");
  const media = leaderStat(giocatori, key, "medie");

  return `
    <div class="cab-leader-row">
      <span class="cab-leader-category">${label}</span>

      <div class="cab-leader-cell">
        <small>TOTALE</small>
        <b>${totale ? esc(totale.nome) : "—"}</b>
        <strong>${leaderValue(totale, key, "totali")}</strong>
      </div>

      <div class="cab-leader-cell">
        <small>MEDIA</small>
        <b>${media ? esc(media.nome) : "—"}</b>
        <strong>${leaderValue(media, key, "medie")}</strong>
      </div>
    </div>
  `;
}


const RUN_DIFF_LABEL = {
  facile: "Facile",
  normale: "Normale",
  difficile: "Difficile",
  incubo: "Incubo",
};

const RUN_DIFFS = Object.keys(RUN_DIFF_LABEL);

const RUN_FORMAT_LABEL = {
  imbattuto: "L'Imbattuto",
  playoff: "Playoff",
};

const RUN_FORMATS = Object.keys(RUN_FORMAT_LABEL);

function runVinta(r) {
  return r.esito === "imbattuto" || r.esito === "campione";
}

function runEsito(r) {
  if (r.esito === "campione") return "Campione";
  return runVinta(r) ? "Imbattuto" : "Sconfitta";
}

function runData(ts) {
  const giorni = Math.floor((Date.now() - ts) / 86400000);
  if (giorni <= 0) return "oggi";
  if (giorni === 1) return "ieri";
  if (giorni < 14) return `${giorni} giorni fa`;
  return `${Math.round(giorni / 7)} settimane fa`;
}

function renderRunRows(runs) {
  if (!runs.length) {
    return `<li class="stats-run-empty">Nessuna run registrata in questa categoria.</li>`;
  }

  return runs.map((r, i) => `
    <li class="stats-run-row">
      <span class="stats-run-rank">${i + 1}</span>

      <span class="stats-run-main">
        <b class="${runVinta(r) ? "win" : "lose"}">${runEsito(r)}</b>
        <small>${runData(r.ts)}</small>
      </span>

      <span class="stats-run-wins">
        <b>${r.vittorie}</b>
        <small>W</small>
      </span>
    </li>
  `).join("");
}

export function render(ctx) {
  const store = window.localStorage;
  const giocatori = profiloGiocatori(store);
  const stats = lifetimeStats(store);

  let activeTab = "overview";
  let playerMetric = "pts";
  let playerMode = "totali";
  let formato = ctx.state?.formato ?? "imbattuto";
  let difficolta = ctx.state?.difficolta ?? "normale";

  const el = document.createElement("section");
  el.className = "screen profilo stats-v2";

  el.innerHTML = `
    <header class="stats-v2-head">
      <span class="stats-v2-kicker">CABINA P1</span>
      <h1>Statistiche cabina</h1>
      <p>Record, giocatori e run salvati su questo dispositivo.</p>
    </header>

    <nav class="stats-v2-tabs" aria-label="Sezioni statistiche">
      <button type="button" data-stats-tab="overview" class="on">Panoramica</button>
      <button type="button" data-stats-tab="players">Giocatori</button>
      <button type="button" data-stats-tab="runs">Run</button>
    </nav>

    <div class="stats-v2-panel" data-stats-panel="overview">
      <section class="stats-scoreboard">
        <div class="stats-score-main">
          <span>
            <small>VITTORIE</small>
            <b>${stats.vittorie ?? 0}</b>
          </span>

          <span class="stats-score-divider">-</span>

          <span>
            <small>SCONFITTE</small>
            <b>${stats.sconfitte ?? 0}</b>
          </span>
        </div>

        <div class="stats-winpct">
          <small>WIN RATE</small>
          <strong>${Number(stats.winPct ?? 0).toFixed(1)}%</strong>
        </div>
      </section>

      <section class="stats-overview-grid">
        <div><small>PARTITE</small><b>${stats.partite ?? 0}</b></div>
        <div><small>RUN</small><b>${stats.runs ?? 0}</b></div>
        <div><small>IMBATTUTI</small><b>${stats.imbattuti ?? 0}</b></div>
        <div><small>CAMPIONI</small><b>${stats.campioni ?? 0}</b></div>
        <div class="stats-wide"><small>MAX VITTORIE IN UNA RUN</small><b>${stats.migliorStreak ?? 0}</b></div>
      </section>

      <section class="stats-preview">
        <div class="stats-section-head">
          <span>RECORD GIOCATORI</span>
          <small>CARRIERA LOCALE</small>
        </div>

        ${leaderRow(giocatori, "PUNTI", "pts")}
        ${leaderRow(giocatori, "ASSIST", "ast")}
        ${leaderRow(giocatori, "RIMBALZI", "reb")}
        ${leaderRow(giocatori, "RUBATE", "stl")}
      </section>
    </div>

    <div class="stats-v2-panel" data-stats-panel="players" hidden>
      <div class="stats-section-head stats-players-title">
        <span>CLASSIFICA GIOCATORI</span>
        <small id="players-ranking-label">PUNTI · TOTALE</small>
      </div>

      <div class="stats-players-layout">
        <aside class="stats-player-controls">
          <span class="stats-controls-label">STATISTICA</span>

          <div class="stats-metric-buttons" role="group" aria-label="Statistica giocatori">
            ${PLAYER_METRICS.map((metric) => `
              <button
                type="button"
                data-player-metric="${metric.key}"
                class="${metric.key === playerMetric ? "on" : ""}"
              >${metric.label}</button>
            `).join("")}
          </div>

          <span class="stats-controls-label stats-mode-label">ORDINA PER</span>

          <div class="stats-mode-buttons" role="group" aria-label="Tipo classifica">
            <button type="button" data-player-mode="totali" class="on">Totale</button>
            <button type="button" data-player-mode="medie">Media</button>
          </div>
        </aside>

        <div class="stats-ranking-wrap">
          <p class="pr-sub" id="pr-sub"></p>

          <div class="stats-ranking-table">
            <div class="stats-ranking-head" aria-hidden="true">
              <span>#</span>
              <span>GIOCATORE</span>
              <span>PRES.</span>
              <span>TOTALE</span>
              <span>MEDIA</span>
            </div>

            <ol id="rows"></ol>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-v2-panel" data-stats-panel="runs" hidden>
      <div class="stats-section-head">
        <span>RUN</span>
        <small>STORICO CABINA</small>
      </div>

      <div class="stats-run-format" id="run-format">
        ${RUN_FORMATS.map((f) => `
          <button type="button" data-run-formato="${f}">
            ${RUN_FORMAT_LABEL[f]}
          </button>
        `).join("")}
      </div>

      <div class="stats-run-diff" id="run-diff">
        ${RUN_DIFFS.map((d) => `
          <button type="button" data-run-diff="${d}">
            ${RUN_DIFF_LABEL[d]}
          </button>
        `).join("")}
      </div>

      <p class="stats-run-bucket" id="run-bucket"></p>
      <ol class="stats-run-list" id="run-rows"></ol>
    </div>

    <div class="row-actions stats-v2-actions">
      <button class="chip" id="home">Home</button>
      <button class="chip" id="stats-to-top" type="button" hidden>Torna su</button>
    </div>
  `;

  const rows = el.querySelector("#rows");
  const sub = el.querySelector("#pr-sub");

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
      ${sheetHTML(g)}
    `;

    dlg.querySelector("#sheet-x").onclick = () => dlg.close();
    dlg.onclick = (e) => {
      if (e.target === dlg) dlg.close();
    };

    dlg.showModal();
  }

  function paintPlayers() {
    const metric = PLAYER_METRICS.find((item) => item.key === playerMetric)
      ?? PLAYER_METRICS[0];

    const list = [...giocatori].sort((a, b) =>
      playerMetricValue(b, playerMetric, playerMode)
      - playerMetricValue(a, playerMetric, playerMode)
    );

    const modeLabel = playerMode === "medie" ? "media" : "totale";

    sub.textContent = list.length
      ? `${list.length} giocatori · ${metric.label.toLowerCase()} per ${modeLabel}`
      : "Nessun giocatore registrato.";

    el.querySelector("#players-ranking-label").textContent =
      `${metric.label.toUpperCase()} · ${playerMode === "medie" ? "MEDIA" : "TOTALE"}`;

    el.querySelectorAll("[data-player-metric]").forEach((button) => {
      button.classList.toggle(
        "on",
        button.dataset.playerMetric === playerMetric
      );
    });

    el.querySelectorAll("[data-player-mode]").forEach((button) => {
      button.classList.toggle(
        "on",
        button.dataset.playerMode === playerMode
      );
    });

    rows.innerHTML = renderRows(list, playerMetric);

    rows.querySelectorAll(".stats-player-row").forEach((btn) => {
      btn.addEventListener("click", () => {
        openSheet(list[+btn.dataset.i]);
      });
    });
  }

  function paintRuns() {
    el.querySelectorAll("[data-run-formato]").forEach((b) => {
      b.classList.toggle("on", b.dataset.runFormato === formato);
    });

    el.querySelectorAll("[data-run-diff]").forEach((b) => {
      b.classList.toggle("on", b.dataset.runDiff === difficolta);
    });

    el.querySelector("#run-bucket").textContent =
      `${RUN_FORMAT_LABEL[formato]} · ${RUN_DIFF_LABEL[difficolta]}`;

    el.querySelector("#run-rows").innerHTML =
      renderRunRows(leaderboard(store, formato, difficolta));
  }

  function selectTab(tab) {
    activeTab = tab;

    el.querySelectorAll("[data-stats-tab]").forEach((b) => {
      b.classList.toggle("on", b.dataset.statsTab === activeTab);
    });

    el.querySelectorAll("[data-stats-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.statsPanel !== activeTab;
    });

    if (activeTab === "players") paintPlayers();
    if (activeTab === "runs") paintRuns();

    requestAnimationFrame(syncToTop);
  }

  el.querySelectorAll("[data-stats-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      selectTab(button.dataset.statsTab);
    });
  });

  el.querySelectorAll("[data-player-metric]").forEach((button) => {
    button.addEventListener("click", () => {
      playerMetric = button.dataset.playerMetric;
      paintPlayers();
    });
  });

  el.querySelectorAll("[data-player-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      playerMode = button.dataset.playerMode;
      paintPlayers();
    });
  });

  el.querySelectorAll("[data-run-formato]").forEach((button) => {
    button.addEventListener("click", () => {
      formato = button.dataset.runFormato;
      paintRuns();
    });
  });

  el.querySelectorAll("[data-run-diff]").forEach((button) => {
    button.addEventListener("click", () => {
      difficolta = button.dataset.runDiff;
      paintRuns();
    });
  });

  el.querySelector("#home").onclick = () => ctx.dispatch({ type: "reset" });

  const toTop = el.querySelector("#stats-to-top");

  function syncToTop() {
    const app = document.querySelector("#app");
    if (!app || !toTop) return;

    toTop.hidden = app.scrollHeight <= app.clientHeight + 6;
  }

  toTop?.addEventListener("click", () => {
    document.querySelector("#app")?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  window.addEventListener("resize", syncToTop, { passive: true });

  requestAnimationFrame(syncToTop);

  paintPlayers();
  paintRuns();
  selectTab("overview");

  return el;
}
