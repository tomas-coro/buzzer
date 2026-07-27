import { ROLES, canPlay } from "../../../game/roster.js";
import { teamColors, initials } from "../team-colors.js";

// ctx: { state, draftView, dispatch, go }
//
// DRAFT A PIAZZAMENTO LIBERO (mockup 72, direzione "mirino + snap").
// Ogni spin pesca una squadra-stagione e ne mostra la top-5 come rosa. Tocchi un
// candidato: si accendono SOLO gli slot dove può giocare (ruolo primario/secondario)
// e ancora liberi. Tocchi lo slot: la carta ci vola dentro (mirino+snap) e viene
// piazzata (nessun bottone "Metti"). Dopo il piazzamento si pesca una nuova rosa.
// Gli aiuti re-spinnano la rosa (glitch-in) con portata diversa (vedi app.js).
// Pelle Cabina 90s, segnaposto iniziali+colore squadra (le carte non hanno foto).

// --- Reveal legato alla difficoltà: quanto mostro del candidato ---
// La carta mostra STATS REALI (box score) + overall 2K. Più sali di livello, meno ti fidi
// del numero riassuntivo: a difficile leggi solo il box, a incubo scommetti sul nome.
const REVEAL = {
  facile:    { ovr: true,  stats: "full" }, // OVR + box score completo (nello sheet)
  normale:   { ovr: true,  stats: "sig"  }, // OVR + stat-firma (PT/RB/AS)
  difficile: { ovr: false, stats: "sig"  }, // stat-firma, OVR nascosto
  incubo:    { ovr: false, stats: "none" }, // al buio
};
const LADDER = [
  { key: "facile",    t: "FACILE",    s: "tutto"    },
  { key: "normale",   t: "NORMALE",   s: "PT·RB·AS" },
  { key: "difficile", t: "DIFFICILE", s: "no voto"  },
  { key: "incubo",    t: "INCUBO",    s: "al buio"  },
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Fascia cromatica dell'overall (stile tabellone): oro / argento / bronzo.
const fascia = (o) => (o >= 88 ? "oro" : o >= 82 ? "arg" : "brz");

// Archetipo + stat-firma dal box score reale. La firma è la stat dominante (normalizzata
// sui tetti tipici) e si accende in riga; l'etichetta è coerente con quella stessa firma.
function archetype(s) {
  const norm = [
    { k: "pts", v: s.pts / 30 },
    { k: "reb", v: s.reb / 14 },
    { k: "ast", v: s.ast / 10 },
  ].sort((a, b) => b.v - a.v);
  const sig = norm[0].k;
  let label;
  if (sig === "ast") {
    label = s.ast >= 7 ? "Regista" : "Playmaker";
  } else if (sig === "reb") {
    label = s.blk >= 1.7 ? "Stoppatore" : s.reb >= 10 ? "Rimbalzista" : "Lungo";
  } else {
    label = s.pts >= 25 ? "Bomber" : (s.tp_pct >= 39 && s.pts >= 13) ? "Tiratore" : "Realizzatore";
  }
  return { label, sig };
}

const fmt1 = (v) => v.toFixed(1);
const fmtPct = (v) => `${v.toFixed(1)}%`;

function lastName(name) {
  const drop = new Set(["I", "II", "III", "IV", "V", "Jr", "Sr", "Jr.", "Sr."]);
  const parts = String(name).split(/\s+/).filter((w) => !drop.has(w));
  return parts[parts.length - 1] || name;
}

const FLAME = `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="f1" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/><path class="f2" d="M11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>`;

// Segnaposto faccia: gradiente colore squadra + iniziali (o "?" se al buio).
function faceHTML(card, { hidden = false, ovr = null, role = null } = {}) {
  const { c1, c2 } = teamColors(card.team_abbr);
  const mono = hidden ? "?" : esc(initials(card.name));
  const badge = (ovr != null || role != null)
    ? `<span class="fbadge">${role ? `<span class="r">${esc(role)}</span>` : ""}${ovr != null ? `<span class="o">${ovr}</span>` : ""}</span>`
    : "";
  return `<span class="face${hidden ? " blind" : ""}" style="--tc1:${c1};--tc2:${c2}"><span class="mono">${mono}</span>${badge}</span>`;
}

// Stat-firma (PT/RB/AS) nella riga candidato: la stat che definisce l'archetipo è accesa.
function rowStatsHTML(card, rv) {
  if (rv.stats === "none") return `<span class="r-blind">scout chiuso</span>`;
  const s = card.stats_real;
  const { sig } = archetype(s);
  const trio = [
    { k: "pts", l: "PT", v: fmt1(s.pts) },
    { k: "reb", l: "RB", v: fmt1(s.reb) },
    { k: "ast", l: "AS", v: fmt1(s.ast) },
  ];
  return `<span class="r-box">${trio.map((b) =>
    `<span class="bx${b.k === sig ? " sig" : ""}"><b>${b.v}</b><i>${b.l}</i></span>`
  ).join("")}</span>`;
}

// Box score completo per lo sheet, raggruppato. A "sig" mostra solo la firma; a "none" chiuso.
function sheetStatsHTML(card, rv) {
  if (rv.stats === "none") {
    return `<p class="blindnote">A questa difficoltà lo scouting è chiuso: niente numeri. Fidati dell'occhio.</p>`;
  }
  const s = card.stats_real;
  const cell = (l, v) => `<span class="bcell"><b>${v}</b><i>${l}</i></span>`;
  if (rv.stats === "sig") {
    return `<div class="bscore">
      ${cell("PTS", fmt1(s.pts))}${cell("REB", fmt1(s.reb))}${cell("AST", fmt1(s.ast))}
    </div><p class="blindnote">Box score completo scoperto solo in Facile.</p>`;
  }
  return `<div class="bscore">
    ${cell("PTS", fmt1(s.pts))}${cell("REB", fmt1(s.reb))}${cell("AST", fmt1(s.ast))}
    ${cell("STL", fmt1(s.stl))}${cell("BLK", fmt1(s.blk))}${cell("TOV", fmt1(s.tov))}
    ${cell("FG%", fmtPct(s.fg_pct))}${cell("3P%", fmtPct(s.tp_pct))}${cell("FT%", fmtPct(s.ft_pct))}
    ${cell("MIN", fmt1(s.min))}${cell("GP", String(s.gp))}${cell("+/-", (s.plus_minus > 0 ? "+" : "") + fmt1(s.plus_minus))}
  </div>`;
}

export function render(ctx) {
  const { state, draftView } = ctx;
  const rv = REVEAL[state.difficolta] ?? REVEAL.normale;
  const el = document.createElement("section");
  el.className = "screen draft draft-free";

  const nFilled = ROLES.filter((r) => state.quintetto[r]).length;
  const [team, season] = draftView.key.split("|");

  // ---- Header ----
  const diffName = state.difficolta.charAt(0).toUpperCase() + state.difficolta.slice(1);
  const header = `
    <div class="apphd">
      <div class="wm">BU<b>ZZ</b>ER</div>
      <div class="mode-pill"><span class="mp-ico">${FLAME}</span><span class="mp-txt">${diffName}</span></div>
    </div>`;

  // ---- Court: 5 slot ----
  const court = ROLES.map((r) => {
    const c = state.quintetto[r];
    if (c) {
      return `<button class="dslot full" data-role="${r}" data-filled="1" type="button" aria-label="Scheda ${esc(c.name)}">
        <span class="ds-face">${faceHTML(c, { ovr: rv.ovr ? c.ovr : null, role: r })}</span></button>`;
    }
    return `<span class="dslot" data-role="${r}">
      <span class="ds-role">${r}</span>
      <span class="reticle"></span>
      <span class="ds-stamp">${r}</span></span>`;
  }).join("");

  // ---- Scaletta livelli (stato) ----
  const ladder = LADDER.map((L) =>
    `<span class="rung ${L.key === state.difficolta ? "on" : ""}">${L.t}<small>${L.s}</small></span>`
  ).join("");

  // ---- Aiuti ----
  const a = state.aids;
  const free = state.difficolta === "facile"; // switch illimitati in facile
  const aidChip = (tipo, label, infinite) => {
    const n = infinite ? "∞" : a[tipo];
    const off = infinite ? false : a[tipo] <= 0;
    return `<button class="aid" data-aid="${tipo}" ${off ? "disabled" : ""} type="button">${label} <b>${n}</b></button>`;
  };
  const aids = `<div class="aidz">
    ${aidChip("respin", "re-spin", false)}
    ${aidChip("squadra", "↺ squadra", free)}
    ${aidChip("stagione", "↺ stagione", free)}
  </div>`;

  // ---- Righe candidato ----
  const rows = draftView.cards.map((c, i) => {
    const two = c.pos.secondary;
    const posBadge = `<span class="r-pos ${two ? "two" : ""}">${esc(c.pos.primary)}${two ? " · " + esc(two) : ""}</span>`;
    const arch = rv.stats === "none" ? "" : `<span class="r-arch">${esc(archetype(c.stats_real).label)}</span>`;
    return `<div class="crd" data-i="${i}" style="--tc1:${teamColors(c.team_abbr).c1};--tc2:${teamColors(c.team_abbr).c2}">
      <div class="r-top">
        <span class="r-port">${faceHTML(c, { hidden: rv.stats === "none" })}</span>
        <span class="r-ovr ${rv.ovr ? fascia(c.ovr) : ""}">${rv.ovr ? `<b>${c.ovr}</b><small>OVR</small>` : `<b class="q">?</b>`}</span>
        <span class="r-id">
          <span class="nm">${esc(lastName(c.name))}</span>
          <span class="sub">${posBadge}${arch}<span class="r-team">${esc(c.team_abbr)} · ${esc(c.season)}</span></span>
        </span>
        ${rowStatsHTML(c, rv)}
        <button class="r-info" data-info="${i}" type="button" aria-label="Scheda ${esc(c.name)}">i</button>
      </div>
    </div>`;
  }).join("");

  el.innerHTML = `
    ${header}
    <div class="court-block">
      <div class="seclab"><span>Il tuo quintetto · ${nFilled}/5</span><span class="ladder">${ladder}</span></div>
      <div class="dcourt">${court}</div>
    </div>
    <p class="prompt" id="prompt">Tocca un candidato: si accendono gli slot dove può giocare</p>
    <div class="cand-block">
      <div class="seclab"><span>Rosa · ${esc(team)} · ${esc(season)}</span>${aids}</div>
      <div class="rlist morph" id="rlist">${rows}</div>
    </div>
    <p class="src">Slot liberi: <b>${5 - nFilled}</b> · piazza dove vuoi</p>
  `;

  // La classe .morph resta: ogni re-render crea un nuovo #rlist, così il glitch-in
  // riparte da solo a ogni spin/aiuto (animazione CSS one-shot).

  let sel = null;   // indice candidato selezionato
  let busy = false; // animazione in corso

  const setPrompt = (h) => { const p = el.querySelector("#prompt"); if (p) p.innerHTML = h; };

  // Ruoli liberi in cui il candidato può giocare.
  function eligibleRoles(card) {
    return ROLES.filter((r) => !state.quintetto[r] && canPlay(card, r));
  }

  function selectCand(i) {
    if (busy) return;
    sel = i;
    const card = draftView.cards[i];
    const elig = eligibleRoles(card);
    el.querySelectorAll(".crd").forEach((row) => row.classList.toggle("sel", +row.dataset.i === i));
    el.querySelectorAll(".dslot").forEach((slot) => {
      const r = slot.dataset.role;
      const isFilled = slot.dataset.filled === "1";
      slot.classList.toggle("elig", elig.includes(r));
      slot.classList.toggle("dim", !isFilled && !elig.includes(r));
    });
    const name = lastName(card.name);
    if (elig.length === 0) setPrompt(`<b>${esc(name)}</b>: i suoi ruoli sono già coperti - scegline un altro`);
    else if (elig.length === 1) setPrompt(`<b>${esc(name)}</b> può fare <b>${elig[0]}</b> - tocca lo slot`);
    else setPrompt(`<b>${esc(name)}</b> può fare <b>${elig.join(" o ")}</b> - scegli lo slot`);
  }

  function placeIn(role) {
    if (busy || sel == null) return;
    const card = draftView.cards[sel];
    if (!canPlay(card, role) || state.quintetto[role]) return;
    busy = true;
    const row = el.querySelector(`.crd[data-i="${sel}"]`);
    const slot = el.querySelector(`.dslot[data-role="${role}"]`);
    el.querySelectorAll(".dslot").forEach((s) => s.classList.remove("elig", "dim"));
    el.querySelectorAll(".crd").forEach((r) => r.classList.remove("sel"));

    const commit = () => ctx.dispatch({ type: "assign", role, card });

    if (reduceMotion() || !row || !slot) { commit(); return; }
    flyMirino(card, row, slot, commit);
  }

  // Volo "mirino + snap": passi netti verso lo slot, poi flash e piazzamento.
  function flyMirino(card, row, slot, done) {
    const { c1, c2 } = teamColors(card.team_abbr);
    const from = row.getBoundingClientRect();
    const to = slot.getBoundingClientRect();
    const fly = document.createElement("div");
    fly.className = "flyer";
    fly.style.background = `linear-gradient(158deg, ${c1}, ${c2})`;
    fly.innerHTML = `<span class="ini">${esc(initials(card.name))}</span>`;
    document.body.appendChild(fly);
    fly.animate([
      { left: from.left + "px", top: from.top + "px", width: from.width + "px", height: "44px", offset: 0 },
      { left: (to.left - 6) + "px", top: (to.top - 6) + "px", width: (to.width + 12) + "px", height: (to.height + 12) + "px", offset: .55, easing: "steps(4,end)" },
      { left: to.left + "px", top: to.top + "px", width: to.width + "px", height: to.height + "px", offset: 1, easing: "cubic-bezier(.2,1.5,.4,1)" },
    ], { duration: 360, fill: "forwards" }).onfinish = () => {
      slot.animate([
        { boxShadow: "0 0 0 3px #fff, 0 0 40px 4px var(--yellow)" },
        { boxShadow: "0 0 0 0 transparent" },
      ], { duration: 260 }).onfinish = () => { fly.remove(); done(); };
    };
  }

  // ---- Listener ----
  el.querySelectorAll(".crd").forEach((row) => {
    row.onclick = () => selectCand(+row.dataset.i);
  });
  el.querySelectorAll(".r-info").forEach((b) => {
    b.onclick = (e) => { e.stopPropagation(); openSheet(draftView.cards[+b.dataset.info]); };
  });
  el.querySelectorAll(".dslot").forEach((slot) => {
    slot.onclick = () => {
      if (slot.dataset.filled === "1") { openSheet(state.quintetto[slot.dataset.role]); return; }
      if (slot.classList.contains("elig")) placeIn(slot.dataset.role);
    };
  });
  el.querySelectorAll(".aid:not([disabled])").forEach((b) => {
    b.onclick = () => ctx.dispatch({ type: "aid", aid: b.dataset.aid });
  });

  // ---- Sheet dettaglio (dialog nativo) ----
  function openSheet(card) {
    if (!card) return;
    let dlg = document.getElementById("player-sheet");
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.id = "player-sheet";
      dlg.className = "sheet";
      document.body.appendChild(dlg);
    }
    const two = card.pos.secondary;
    const arch = rv.stats === "none" ? "" : ` · ${esc(archetype(card.stats_real).label)}`;
    dlg.innerHTML = `
      <div class="sheet-hd">
        ${faceHTML(card, { hidden: rv.stats === "none", ovr: rv.ovr ? card.ovr : null })}
        <div>
          <span class="nm">${esc(card.name)}</span>
          <span class="pos">${esc(card.pos.primary)}${two ? " · " + esc(two) : ""}${arch} · ${esc(card.team)} · ${esc(card.season)}</span>
        </div>
        <button class="sheet-x" id="sheet-x" type="button" aria-label="Chiudi">×</button>
      </div>
      ${sheetStatsHTML(card, rv)}`;
    dlg.querySelector("#sheet-x").onclick = () => dlg.close();
    dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };
    dlg.showModal();
  }

  return el;
}
