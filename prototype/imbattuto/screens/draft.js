import { ROLES, canPlay } from "../../../game/roster.js";
import { slotLibero, listaRosa, TITOLARE, RISERVA } from "../../../game/rosa.js";
import { teamColors, initials } from "../team-colors.js";

// ctx: { state, draftView, dispatch, go }
//
// DRAFT A PIAZZAMENTO LIBERO (mockup 72, direzione "mirino + snap").
//
// ROSA DA 10, NON PIÙ QUINTETTO. Il campo ha due file: cinque titolari sopra,
// cinque riserve sotto. Miri il RUOLO con un tocco solo, come prima: la prima
// carta di quel ruolo va titolare, la seconda riserva, e a deciderlo è il motore
// (`slotLibero`), non la schermata. Per questo si accende una casella sola per
// ruolo - quella davvero libera - e non tutte e due.
// Ogni spin pesca una squadra-stagione e ne mostra la ROSA INTERA da dieci
// (`costruisciRosa`, lo stesso motore delle rose avversarie): cinque titolari e
// cinque riserve, in due colonne affiancate - così il sesto uomo si vede insieme
// al quintetto e non finisce sotto il taglio della lista. Tocchi un
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
// Sta sotto il nome, non a destra: in due colonne la riga è larga la metà e le
// cifre di fianco al nome lo strozzavano fino ai puntini.
function rowStatsHTML(card, rv) {
  if (rv.stats === "none") return `<span class="r-blind">scout chiuso</span>`;
  const s = card.stats_real;
  const { sig } = archetype(s);
  const trio = [
    { k: "pts", l: "PT", v: fmt1(s.pts) },
    { k: "reb", l: "RB", v: fmt1(s.reb) },
    { k: "ast", l: "AS", v: fmt1(s.ast) },
  ];
  return `<span class="r-mini">${trio.map((b) =>
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

  const inRosa = listaRosa(state.rosa);
  const nFilled = inRosa.length;
  const [team, season] = draftView.key.split("|");

  // Dove va la prossima carta di questo ruolo, e in quali ruoli una carta può
  // ancora entrare. Stanno qui in alto e non più accanto ai listener perché ora
  // servono già al DISEGNO: una carta senza ruoli liberi nasce spenta.
  const liberoIn = (r) => slotLibero(state.rosa, r);
  const eligibleRoles = (card) => ROLES.filter((r) => liberoIn(r) && canPlay(card, r));

  // ---- Header ----
  const diffName = state.difficolta.charAt(0).toUpperCase() + state.difficolta.slice(1);
  const header = `
    <div class="apphd">
      <div class="wm">BU<b>ZZ</b>ER</div>
      <div class="mode-pill"><span class="mp-ico">${FLAME}</span><span class="mp-txt">${diffName}</span></div>
    </div>`;

  // ---- Court: 10 caselle, titolari sopra e panchina sotto ----
  const fila = (tipo) => ROLES.map((r) => {
    const c = state.rosa[r][tipo];
    if (c) {
      return `<button class="dslot full ${tipo}" data-role="${r}" data-tipo="${tipo}" data-filled="1" type="button" aria-label="Scheda ${esc(c.name)}">
        <span class="ds-face">${faceHTML(c, { ovr: rv.ovr ? c.ovr : null, role: r })}</span></button>`;
    }
    return `<span class="dslot ${tipo}" data-role="${r}" data-tipo="${tipo}">
      <span class="ds-role">${r}</span>
      <span class="reticle"></span>
      <span class="ds-stamp">${r}</span></span>`;
  }).join("");
  const court = `
    <div class="dcrow-lab">Titolari <small>32 minuti</small></div>
    ${fila(TITOLARE)}
    <div class="dcrow-lab">Panchina <small>16 minuti</small></div>
    ${fila(RISERVA)}`;

  // ---- Scaletta livelli (stato) ----
  const ladder = LADDER.map((L) =>
    `<span class="rung ${L.key === state.difficolta ? "on" : ""}">${L.t}<small>${L.s}</small></span>`
  ).join("");

  // ---- Aiuti ----
  const a = state.aids;
  const aidChip = (tipo, label) => {
    const off = a[tipo] <= 0;
    return `<button class="aid" data-aid="${tipo}" ${off ? "disabled" : ""} type="button">${label} <b>${a[tipo]}</b></button>`;
  };
  const aids = `<div class="aidz">
    ${aidChip("respin", "re-spin")}
    ${aidChip("squadra", "↺ squadra")}
    ${aidChip("stagione", "↺ stagione")}
  </div>`;

  // ---- Righe candidato ----
  // CARTA NON PIAZZABILE = SPENTA AL DISEGNO (G6, 2026-08-18). Se tutti i ruoli
  // di una carta sono già coperti non si seleziona più: prima si poteva cliccare
  // e la risposta ("i suoi ruoli sono già coperti") arrivava DOPO il tocco. Ora
  // si vede prima, con il chip "ruolo pieno" e la riga desaturata.
  if (!draftView.slots) throw new Error("draft: lo spin non ha portato le caselle di provenienza (slots)");
  const piazzabile = draftView.cards.map((c) => eligibleRoles(c).length > 0);

  // Nessun badge "6° uomo" sui candidati: il 6° uomo è una CASELLA DELLA TUA
  // ROSA, non una proprietà della carta pescata. Chi mandi dentro per primo lo
  // decidi tu piazzando (deciso al grill del 2026-08-18); scriverlo sulla carta
  // dell'altra squadra confondeva le due cose.

  const riga = (c, i) => {
    const two = c.pos.secondary;
    const posBadge = `<span class="r-pos ${two ? "two" : ""}">${esc(c.pos.primary)}${two ? " · " + esc(two) : ""}</span>`;
    const off = !piazzabile[i];
    // Sulla carta spenta l'archetipo lascia il posto a "ruolo pieno": l'etichetta
    // serve a scegliere, e qui non c'è niente da scegliere. Toglierla tiene la
    // riga su una riga sola - con tutti e due i chip andava a capo e le due
    // colonne si disallineavano.
    const arch = (rv.stats === "none" || off) ? "" : `<span class="r-arch">${esc(archetype(c.stats_real).label)}</span>`;
    const cover = off ? `<span class="r-cover">ruolo pieno</span>` : "";
    return `<div class="crd${off ? " off" : ""}" data-i="${i}" ${off ? 'aria-disabled="true"' : ""} style="--tc1:${teamColors(c.team_abbr).c1};--tc2:${teamColors(c.team_abbr).c2}">
      <div class="r-top">
        <span class="r-port">${faceHTML(c, { hidden: rv.stats === "none" })}</span>
        <span class="r-ovr ${rv.ovr ? fascia(c.ovr) : ""}">${rv.ovr ? `<b>${c.ovr}</b><small>OVR</small>` : `<b class="q">?</b>`}</span>
        <span class="r-id">
          <span class="nm">${esc(lastName(c.name))}</span>
          <span class="sub">${posBadge}${arch}<span class="r-team">${esc(c.team_abbr)} · ${esc(c.season)}</span>${cover}</span>
          ${rowStatsHTML(c, rv)}
        </span>
        <button class="r-info" data-info="${i}" type="button" aria-label="Scheda ${esc(c.name)}">i</button>
      </div>
    </div>`;
  };

  // Le dieci in due colonne: quintetto a sinistra, panchina a destra. Il gruppo
  // dice da quale casella della SUA squadra viene il candidato - non dove
  // andrebbe nella tua, che lo decide il piazzamento.
  const gruppo = (tipo, lab) => {
    const voci = draftView.cards.map((c, i) => ({ c, i })).filter(({ i }) => draftView.slots[i].tipo === tipo);
    if (voci.length === 0) return "";
    return `<div class="rgrp"><div class="grp-lab">${esc(lab)}</div>
      <div class="rlist morph">${voci.map(({ c, i }) => riga(c, i)).join("")}</div></div>`;
  };
  const rows = gruppo(TITOLARE, "Quintetto") + gruppo(RISERVA, "Panchina");

  el.innerHTML = `
    ${header}
    <div class="court-block">
      <div class="seclab"><span>La tua rosa · ${nFilled}/10</span><span class="ladder">${ladder}</span></div>
      <div class="dcourt">${court}</div>
    </div>
    <p class="prompt" id="prompt">${piazzabile.some(Boolean)
      ? "Tocca un candidato: si accendono gli slot dove può giocare"
      : "<b>Nessuno di questi entra nella tua rosa</b> - usa un aiuto per ripescare"}</p>
    <div class="cand-block">
      <div class="seclab"><span>Rosa · ${esc(team)} · ${esc(season)}</span>${aids}</div>
      <div class="rcols" id="rlist">${rows}</div>
    </div>
    <p class="src">Caselle libere: <b>${10 - nFilled}</b> · piazza dove vuoi</p>
  `;

  // La classe .morph resta su ogni colonna: ogni re-render crea nuovi .rlist, così
  // il glitch-in riparte da solo a ogni spin/aiuto (animazione CSS one-shot), e i
  // ritardi a scaletta (nth-child fino a 5) coprono esatti i cinque di una colonna.

  let sel = null;   // indice candidato selezionato
  let busy = false; // animazione in corso

  const setPrompt = (h) => { const p = el.querySelector("#prompt"); if (p) p.innerHTML = h; };

  // Come si legge la casella che si accenderà: "PG da titolare", "C in panchina".
  const dove = (r) => (liberoIn(r) === TITOLARE ? `<b>${r}</b> da titolare` : `<b>${r}</b> in panchina`);

  function selectCand(i) {
    if (busy || !piazzabile[i]) return;
    sel = i;
    const card = draftView.cards[i];
    const elig = eligibleRoles(card);
    el.querySelectorAll(".crd").forEach((row) => row.classList.toggle("sel", +row.dataset.i === i));
    el.querySelectorAll(".dslot").forEach((slot) => {
      const r = slot.dataset.role;
      const isFilled = slot.dataset.filled === "1";
      // Si accende SOLO la casella dove la carta andrebbe davvero: se il ruolo
      // ha il titolare libero, la riserva resta spenta anche se è vuota.
      const acceso = elig.includes(r) && slot.dataset.tipo === liberoIn(r);
      slot.classList.toggle("elig", acceso);
      slot.classList.toggle("dim", !isFilled && !acceso);
    });
    const name = lastName(card.name);
    // Il caso "zero ruoli liberi" non arriva più qui: quelle righe sono spente.
    if (elig.length === 1) setPrompt(`<b>${esc(name)}</b> può giocare ${dove(elig[0])} - tocca la casella`);
    else setPrompt(`<b>${esc(name)}</b> può giocare ${elig.map(dove).join(" o ")} - scegli la casella`);
  }

  function placeIn(role) {
    if (busy || sel == null) return;
    const card = draftView.cards[sel];
    if (!canPlay(card, role) || !liberoIn(role)) return;
    busy = true;
    const row = el.querySelector(`.crd[data-i="${sel}"]`);
    const slot = el.querySelector(`.dslot[data-role="${role}"][data-tipo="${liberoIn(role)}"]`);
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
  el.querySelectorAll(".crd:not(.off)").forEach((row) => {
    row.onclick = () => selectCand(+row.dataset.i);
  });
  el.querySelectorAll(".r-info").forEach((b) => {
    b.onclick = (e) => { e.stopPropagation(); openSheet(draftView.cards[+b.dataset.info]); };
  });
  el.querySelectorAll(".dslot").forEach((slot) => {
    slot.onclick = () => {
      if (slot.dataset.filled === "1") { openSheet(state.rosa[slot.dataset.role][slot.dataset.tipo]); return; }
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
