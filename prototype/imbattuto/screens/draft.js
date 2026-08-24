import {
  SLOTS, TITOLARE, PANCA, cartaIn, caselleDove, etichettaSlot, minutiSlot, ruoloDi, listaRosa,
} from "../../../game/rosa.js";
import { teamColors, initials } from "../team-colors.js";
import { salarioCarta, limiteDuro, malusApron, firmabile, formattaSalario } from "../../../game/salary.js";

// ctx: { state, draftView, dispatch, go }
//
// DRAFT A PIAZZAMENTO LIBERO (mockup 72, poi mockup 80 "cap-board").
//
// ROSA DA 10: cinque titolari legati al ruolo (PG SG SF PF C), cinque posti di
// panchina NUMERATI (6°-10°) che accettano chiunque - non un'altra "riserva"
// per ruolo (vedi game/rosa.js). Tocchi un candidato: si accendono SOLO le
// caselle dove può andare (`caselleDove`: titolare se il ruolo è libero e la
// carta lo sa giocare, panchina sempre). Tocchi la casella: la carta ci vola
// dentro (mirino+snap) e viene piazzata (nessun bottone "Metti"). Dove la
// metti in panchina è una scelta di minuti - 6° gioca quasi da titolare, 10°
// molto meno - non un'etichetta a caso.
// Ogni spin pesca una squadra-stagione e ne mostra la ROSA INTERA da dieci
// (`costruisciRosa`, lo stesso motore delle rose avversarie), in due colonne
// affiancate: quintetto e panchina, così il sesto uomo si vede insieme al
// quintetto e non finisce sotto il taglio della lista. Dopo il piazzamento si
// pesca una nuova rosa. Gli aiuti re-spinnano la rosa (glitch-in) con portata
// diversa (vedi app.js). Pelle Cabina 90s, foto vera del giocatore in carta.

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

// Foto vera del giocatore (tools/build-volti.py, path relativo a index.html).
// `hidden` resta solo un tono di sfondo diverso (Incubo): il nome è già scritto
// sulla riga a ogni livello, quindi la faccia non rivela niente in più - la
// foto c'è SEMPRE, se manca il file l'<img> si toglie da sola e restano le
// iniziali (deciso il 18/08, portato dal mockup 80).
const VOLTI_PATH = "../../assets/volti";
function faceHTML(card, { hidden = false, ovr = null, role = null } = {}) {
  const { c1, c2 } = teamColors(card.team_abbr);
  const badge = (ovr != null || role != null)
    ? `<span class="fbadge">${role ? `<span class="r">${esc(role)}</span>` : ""}${ovr != null ? `<span class="o">${ovr}</span>` : ""}</span>`
    : "";
  const foto = `<img class="ph" src="${VOLTI_PATH}/${encodeURIComponent(card.player_id)}.webp"
      alt="" loading="lazy" decoding="async"
      onload="this.parentNode.classList.add('hasph')" onerror="this.remove()">`;
  return `<span class="face${hidden ? " blind" : ""}" style="--tc1:${c1};--tc2:${c2}"><span class="mono">${esc(initials(card.name))}</span>${foto}${badge}</span>`;
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
  const rotazione = state.rotazione ?? "normale";
  const [team, season] = draftView.key.split("|");

  // Le caselle dove QUESTA carta può andare - stanno qui in alto e non più
  // accanto ai listener perché ora servono già al DISEGNO: una carta senza
  // caselle libere nasce spenta.
  const eligibleSlots = (card) => caselleDove(state.rosa, card);
  const keySlot = (s) => (s.tipo === TITOLARE ? `T-${s.ruolo}` : `P-${s.posto}`);
  const slotByKey = new Map(SLOTS.map((s) => [keySlot(s), s]));

  // ---- Header ----
  const diffName = state.difficolta.charAt(0).toUpperCase() + state.difficolta.slice(1);
  const header = `
    <div class="apphd">
      <div class="wm">BU<b>ZZ</b>ER</div>
      <div class="mode-pill"><span class="mp-ico">${FLAME}</span><span class="mp-txt">${diffName}</span></div>
    </div>`;

  // ---- Il tetto di spesa (porting mockup 80) ----
  // Il tetto non è un muro: si firma fino al secondo apron (limiteDuro), e
  // quello che sta sopra il tetto si paga in campo (malusApron, applicato una
  // volta sola in startRun - qui è solo lettura). `residuo` e `vuote` sono gli
  // stessi due numeri che draftPick userà per accettare o rifiutare la firma:
  // calcolarli qui serve a spegnere la carta PRIMA del click, non dopo.
  const apron = limiteDuro(state.tetto);
  const residuo = apron - state.speso;
  const oltreTetto = state.speso > state.tetto;
  const vuoteOra = 10 - nFilled;
  const capBoard = `
    <div class="cap-hd">
      <span class="cap-t">Il budget · livello <b>${state.difficolta}</b></span>
      <button class="glo-b" id="glo-open" type="button" aria-label="Cosa vogliono dire questi numeri">?</button>
    </div>
    <div class="cap-board">
      <div class="cap-cell"><div class="cl">Tetto</div><div class="cv">${formattaSalario(state.tetto)}</div>
        <div class="cs">apron ${formattaSalario(apron)}</div></div>
      <div class="cap-cell"><div class="cl">Speso</div><div class="cv">${formattaSalario(state.speso)}</div>
        <div class="cs">${nFilled} contratt${nFilled === 1 ? "o" : "i"} su 10</div></div>
      <div class="cap-cell res${oltreTetto ? " tax" : residuo < apron * 0.15 ? " tight" : ""}">
        <div class="cl">${oltreTetto ? "Oltre" : "Resta"}</div>
        <div class="cv">${formattaSalario(Math.abs(state.speso - state.tetto))}</div>
        <div class="cs">${oltreTetto
          ? `-${malusApron(state.speso, state.tetto).toFixed(1)} ai reparti`
          : vuoteOra === 0 ? "rosa completa" : `${formattaSalario((state.tetto - state.speso) / vuoteOra)} a casella`}</div>
      </div>
    </div>`;

  // ---- Auto-draft: completa da sola le caselle rimaste ----
  // `malusAuto` è quanti punti di reparto Tomas accetta di pagare pur di
  // prendere carte più forti (vedi sceltaAutoDraft in game/run.js): 0 resta
  // sempre sotto il tetto pulito, ogni gradino sale nell'apron. Non tocca
  // dispatch finché non si preme "Completa rosa", quindi cambiare gradino non
  // ridisegna la schermata (vedi selectCand più sotto per lo stesso motivo).
  const MALUS_GRADINI = [0, 1, 2, 3];
  let malusAuto = 0;
  const autoDraftBar = `
    <div class="autod-bar">
      <span class="autod-lab">Auto-draft</span>
      <div class="sh-seg" id="autod-malus" role="group" aria-label="Malus reparti accettato">
        ${MALUS_GRADINI.map((m) =>
          `<button type="button" data-malus="${m}" aria-pressed="${m === 0}">${m === 0 ? "Pulito" : `-${m}`}</button>`
        ).join("")}
      </div>
      <button class="autod-go" id="autod-go" type="button">Completa rosa</button>
    </div>`;

  // ---- Glossario: sei parole che tornano in tutto il draft ----
  const glossario = `
    <dialog class="glo" id="glo" aria-labelledby="glo-h">
      <div class="glo-in">
        <button class="glo-x" id="glo-close" type="button" aria-label="Chiudi">&times;</button>
        <h2 id="glo-h">Come si legge il budget</h2>
        <p class="glo-sub">Sei parole che tornano in tutto il draft. Sono le regole vere della NBA,
           ridotte all'osso.</p>
        <dl>
          <dt>Speso <span class="qt">Monte ingaggi</span></dt>
          <dd>La somma degli stipendi dei giocatori che hai già preso. A fine draft sono dieci
              contratti: cinque titolari e cinque riserve.</dd>
          <dt>Tetto <span class="qt">il tuo budget</span></dt>
          <dd>Quanto puoi spendere <b>senza pagare pegno</b>. Non è un muro: puoi superarlo, ma da lì
              in poi ogni firma costa qualcosa in campo.</dd>
          <dt>Apron <span class="qt">tetto +25%</span></dt>
          <dd>Il muro <b>vero</b>, quello che non si passa nemmeno pagando. Le carte che ti
              porterebbero oltre restano spente: non le puoi firmare.</dd>
          <dt>Tassa <span class="qt">-1 ogni 5M</span></dt>
          <dd>Il prezzo dello sforo, e non si paga in soldi ma <b>in campo</b>: ogni 5 milioni sopra
              il tetto tolgono un punto a tutti e cinque i reparti della tua squadra.</dd>
          <dt>A casella <span class="qt">quanto vale il resto</span></dt>
          <dd>Quello che ti resta diviso le caselle ancora da riempire: il numero che smaschera il
              budget, perché <b>40 milioni sembrano tanti, ma su quattro caselle sono dieci a
              testa</b>.</dd>
          <dt>Contratto minimo <span class="qt">${formattaSalario(2_000_000)}</span></dt>
          <dd>Il contratto più basso che esista. Per ogni casella ancora vuota il gioco ne tiene uno
              da parte, così non puoi restare senza soldi e con la rosa incompleta.</dd>
        </dl>
      </div>
    </dialog>`;

  // ---- Court: 10 caselle, titolari sopra e panchina numerata sotto ----
  const titolariSlots = SLOTS.filter((s) => s.tipo === TITOLARE);
  const pancaSlots = SLOTS.filter((s) => s.tipo === PANCA);
  const cellHTML = (slot) => {
    const c = cartaIn(state.rosa, slot);
    const isT = slot.tipo === TITOLARE;
    const cls = isT ? "titolare" : "riserva";
    const label = isT ? slot.ruolo : `${slot.posto}°`;
    const key = keySlot(slot);
    if (c) {
      return `<button class="dslot full ${cls}" data-slot="${key}" data-filled="1" type="button" aria-label="Scheda ${esc(c.name)}">
        <span class="ds-face">${faceHTML(c, { ovr: rv.ovr ? c.ovr : null, role: isT ? slot.ruolo : ruoloDi(c, slot) })}</span></button>`;
    }
    return `<span class="dslot ${cls}" data-slot="${key}">
      <span class="${isT ? "ds-role" : "ds-num"}">${label}</span>
      <span class="reticle"></span></span>`;
  };
  const court = `
    <div class="dcrow-lab">Titolari <small>${minutiSlot(titolariSlots[0], rotazione)} minuti</small></div>
    ${titolariSlots.map(cellHTML).join("")}
    <div class="dcrow-lab">Panchina <small>${pancaSlots.map((s) => minutiSlot(s, rotazione)).join("' · ")}'</small></div>
    ${pancaSlots.map(cellHTML).join("")}`;

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
  // CARTA NON PIAZZABILE = SPENTA AL DISEGNO (G6, 2026-08-18). Se una carta non
  // ha più nessuna casella libera dove andare non si seleziona più: prima si
  // poteva cliccare e la risposta arrivava DOPO il tocco. Ora si vede prima,
  // con il chip "nessuna casella" e la riga desaturata.
  //
  // STESSA COSA VALE PER IL TETTO (G10, porting mockup 80). Una carta che sfora
  // l'apron non è "vietata dopo": draftPick la rifiuterebbe con un'eccezione, e
  // prima di questa modifica la UI non lo sapeva - si poteva selezionare e
  // provare a piazzarla, con un crash. `firmabile` è la STESSA funzione che
  // draftPick userà per decidere, quindi qui non si può mai spegnere una carta
  // che poi il motore accetterebbe, né accendere una che rifiuterebbe.
  if (!draftView.slots) throw new Error("draft: lo spin non ha portato le caselle di provenienza (slots)");
  const costi = draftView.cards.map((c) => salarioCarta(c));
  const haCasella = draftView.cards.map((c) => eligibleSlots(c).length > 0);
  const sottoTetto = costi.map((costo) => firmabile(costo, residuo, vuoteOra));
  const piazzabile = draftView.cards.map((_, i) => haCasella[i] && sottoTetto[i]);

  // Nessun badge "6° uomo" sui candidati: il 6° uomo è una CASELLA DELLA TUA
  // ROSA, non una proprietà della carta pescata. Chi mandi dentro per primo lo
  // decidi tu piazzando (deciso al grill del 2026-08-18); scriverlo sulla carta
  // dell'altra squadra confondeva le due cose.

  const riga = (c, i) => {
    const two = c.pos.secondary;
    const posBadge = `<span class="r-pos ${two ? "two" : ""}">${esc(c.pos.primary)}${two ? " · " + esc(two) : ""}</span>`;
    const off = !piazzabile[i];
    // Sulla carta spenta l'archetipo lascia il posto al motivo: l'etichetta
    // serve a scegliere, e qui non c'è niente da scegliere. Toglierla tiene la
    // riga su una riga sola - con tutti e due i chip andava a capo e le due
    // colonne si disallineavano.
    const arch = (rv.stats === "none" || off) ? "" : `<span class="r-arch">${esc(archetype(c.stats_real).label)}</span>`;
    // Due motivi diversi per una carta spenta: il ruolo è già coperto, oppure
    // la firma sforerebbe l'apron. Non sono la stessa cosa e il messaggio lo dice.
    const cover = !haCasella[i] ? `<span class="r-cover">nessuna casella</span>`
      : !sottoTetto[i] ? `<span class="r-cover sforo">sfora l'apron</span>` : "";
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
  const rows = gruppo(TITOLARE, "Quintetto") + gruppo(PANCA, "Panchina");

  el.innerHTML = `
    ${header}
    <div class="court-block">
      <div class="seclab"><span>La tua rosa · ${nFilled}/10</span><span class="ladder">${ladder}</span></div>
      ${capBoard}
      <div class="dcourt">${court}</div>
      ${autoDraftBar}
    </div>
    <p class="prompt" id="prompt">${piazzabile.some(Boolean)
      ? "Tocca un candidato: si accendono gli slot dove può giocare"
      : "<b>Nessuno di questi entra nella tua rosa</b> - usa un aiuto per ripescare"}</p>
    <div class="cap-tick" id="cap-tick" hidden></div>
    <div class="cand-block">
      <div class="seclab"><span>Rosa · ${esc(team)} · ${esc(season)}</span>${aids}</div>
      <div class="rcols" id="rlist">${rows}</div>
    </div>
    <p class="src">Caselle libere: <b>${10 - nFilled}</b> · piazza dove vuoi</p>
    ${glossario}
  `;

  // La classe .morph resta su ogni colonna: ogni re-render crea nuovi .rlist, così
  // il glitch-in riparte da solo a ogni spin/aiuto (animazione CSS one-shot), e i
  // ritardi a scaletta (nth-child fino a 5) coprono esatti i cinque di una colonna.

  let sel = null;   // indice candidato selezionato
  let busy = false; // animazione in corso

  const setPrompt = (h) => { const p = el.querySelector("#prompt"); if (p) p.innerHTML = h; };

  // Come si legge la casella che si accenderà: "PG titolare", "6° uomo".
  const dove = (slot) => `<b>${esc(etichettaSlot(slot))}</b>`;

  function selectCand(i) {
    if (busy || !piazzabile[i]) return;
    sel = i;
    const card = draftView.cards[i];
    const elig = eligibleSlots(card);
    const eligKeys = new Set(elig.map(keySlot));
    el.querySelectorAll(".crd").forEach((row) => row.classList.toggle("sel", +row.dataset.i === i));
    el.querySelectorAll(".dslot").forEach((slot) => {
      const isFilled = slot.dataset.filled === "1";
      const acceso = eligKeys.has(slot.dataset.slot);
      slot.classList.toggle("elig", acceso);
      slot.classList.toggle("dim", !isFilled && !acceso);
    });
    const name = lastName(card.name);
    // Il caso "zero caselle libere" non arriva più qui: quelle righe sono spente.
    if (elig.length === 1) setPrompt(`<b>${esc(name)}</b> può giocare ${dove(elig[0])} - tocca la casella`);
    else setPrompt(`<b>${esc(name)}</b> può giocare in ${elig.length} caselle - scegli dove`);

    // Quanto costa - PRIMA del click sullo slot, non dopo. Le carte spente
    // (ruolo pieno / sfora l'apron) non arrivano qui: `piazzabile[i]` le ha già
    // escluse in cima a `selectCand`.
    const tick = el.querySelector("#cap-tick");
    if (tick) {
      const costo = costi[i];
      const nuovoSpeso = state.speso + costo;
      const paga = nuovoSpeso > state.tetto;
      tick.hidden = false;
      tick.className = `cap-tick${paga ? " tax" : ""}`;
      tick.innerHTML = paga
        ? `<span class="ct-nm">${esc(name)}</span><span class="ct-val">- ${formattaSalario(costo)} · costa -${malusApron(nuovoSpeso, state.tetto).toFixed(1)} ai reparti</span>`
        : `<span class="ct-nm">${esc(name)}</span><span class="ct-val">- ${formattaSalario(costo)} · resta ${formattaSalario(state.tetto - nuovoSpeso)}</span>`;
    }
  }

  function placeIn(key) {
    if (busy || sel == null) return;
    const slotObj = slotByKey.get(key);
    const card = draftView.cards[sel];
    if (!slotObj || !eligibleSlots(card).some((s) => keySlot(s) === key)) return;
    busy = true;
    const row = el.querySelector(`.crd[data-i="${sel}"]`);
    const slotEl = el.querySelector(`.dslot[data-slot="${key}"]`);
    el.querySelectorAll(".dslot").forEach((s) => s.classList.remove("elig", "dim"));
    el.querySelectorAll(".crd").forEach((r) => r.classList.remove("sel"));

    const commit = () => ctx.dispatch({ type: "assign", slot: slotObj, card });

    if (reduceMotion() || !row || !slotEl) { commit(); return; }
    flyMirino(card, row, slotEl, commit);
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
      const key = slot.dataset.slot;
      if (slot.dataset.filled === "1") { openSheet(cartaIn(state.rosa, slotByKey.get(key))); return; }
      if (slot.classList.contains("elig")) placeIn(key);
    };
  });
  el.querySelectorAll(".aid:not([disabled])").forEach((b) => {
    b.onclick = () => ctx.dispatch({ type: "aid", aid: b.dataset.aid });
  });

  // ---- Auto-draft ----
  el.querySelectorAll("#autod-malus button").forEach((b) => {
    b.onclick = () => {
      malusAuto = +b.dataset.malus;
      el.querySelectorAll("#autod-malus button").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)));
    };
  });
  el.querySelector("#autod-go").onclick = () => {
    if (busy) return;
    ctx.dispatch({ type: "autoDraft", malusMax: malusAuto });
  };

  // ---- Glossario: si apre col "?" del tabellone ----
  const glo = el.querySelector("#glo");
  el.querySelector("#glo-open").onclick = () => glo.showModal();
  el.querySelector("#glo-close").onclick = () => glo.close();
  glo.addEventListener("close", () => el.querySelector("#glo-open").focus());
  glo.onclick = (e) => { if (e.target === glo) glo.close(); };

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
