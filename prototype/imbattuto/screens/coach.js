import { ROLES } from "../../../game/roster.js";
import { votoRosa } from "../../../game/rating.js";
import { applyCoach } from "../../../game/coach.js";
import { titolari, tassaSuiReparti } from "../../../game/run.js";
import { malusApron } from "../../../game/salary.js";
import { ETICHETTE } from "../../../game/reparti.js";
import { toDisplayOvr } from "../display.js";
import { teamColors, initials } from "../team-colors.js";
import { pickCoaches } from "../coaches.js";
import { appHeader, wireAppHeader, seclab, esc } from "./_chrome.js";

// Panchina: si sceglie l'allenatore prima di entrare nel run.
//
// Due cose che prima non c'erano:
//   1. allenatori NBA veri, pescati tre a run (uno offensivo, uno equilibrato,
//      uno difensivo) da prototype/imbattuto/coaches.js;
//   2. l'ANTEPRIMA dell'effetto: tocchi un coach e vedi il voto squadra passare
//      da 85 a 89 prima di confermare. Prima si sceglieva al buio.
//
// Per questo la scelta ora è in due tempi: il tocco seleziona (stato locale, il
// motore non lo sa), il bottone "Manda in campo" fa partire chooseCoach. Serve
// perché app.js ri-renderizza tutto a ogni dispatch: senza il secondo tempo
// l'anteprima non farebbe in tempo a esistere.

// Frecce a gesso, una per profilo: l'attacco sale, l'equilibrio spinge nei due
// sensi, la difesa è un muro. Vengono dalla direzione "lavagna tattica": prendo
// il gesso, non il fondo ardesia, così la palette Cabina 90s resta intatta.
const FRECCE = {
  off: `<svg class="ct-arrow" viewBox="0 0 34 24" aria-hidden="true"><path d="M3 20 L14 6 L22 14 L31 5"/><path d="M25 4 L31 4 L31 10"/></svg>`,
  bil: `<svg class="ct-arrow" viewBox="0 0 34 24" aria-hidden="true"><line x1="4" y1="12" x2="30" y2="12"/><path d="M25 7 L30 12 L25 17"/><path d="M9 7 L4 12 L9 17"/></svg>`,
  dif: `<svg class="ct-arrow" viewBox="0 0 34 24" aria-hidden="true"><line x1="5" y1="5" x2="5" y2="19"/><line x1="12" y1="5" x2="12" y2="19"/><path d="M20 12 L30 12"/><path d="M25 7 L20 12 L25 17"/></svg>`,
};

const PLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;

// Schema di campo a gesso, in filigrana dietro le tre righe: dà alla schermata
// il carattere di una lavagnetta da timeout senza cambiare i colori del gioco.
const LAVAGNA = `
  <div class="ct-chalk" aria-hidden="true">
    <svg viewBox="0 0 340 260" preserveAspectRatio="none">
      <circle cx="170" cy="128" r="54"/>
      <line x1="10" y1="14" x2="330" y2="14"/>
      <path d="M10 14 A 160 132 0 0 0 330 14"/>
      <line x1="128" y1="14" x2="128" y2="98"/>
      <line x1="212" y1="14" x2="212" y2="98"/>
      <line x1="128" y1="98" x2="212" y2="98"/>
    </svg>
  </div>`;

// Chip plus/malus: reparto + segno, bordo pieno se MIRATO (tocca solo certi
// ruoli, vale il doppio) contro bordo debole se DIFFUSO (tocca tutta la rosa).
// Scelto al mockup 82 sulla variante A: le lettere A-F non esistono più, il
// coach non alza un voto astratto, sposta reparti precisi.
const chip = (rep, cls, segno) => `
  <span class="rchip ${cls} ${rep.ruoli ? "mirato" : ""}" title="${esc(ETICHETTE[rep.reparto])}${rep.ruoli ? " · " + rep.ruoli.join(" ") : ""}">
    <span class="cod">${segno} ${rep.reparto.toUpperCase()}</span>
    <span class="sub">${rep.ruoli ? rep.ruoli.join(" ") : "tutti"}</span>
  </span>`;
const chipsCoach = (c) => `<div class="chips">${chip(c.plus[0], "plus", "▲")}${chip(c.plus[1], "plus", "▲")}${chip(c.malus, "malus", "▼")}</div>`;

// Badge anelli. Il singolare conta: Mazzulla ha un anello solo e "1 anelli" a
// schermo fa sembrare il gioco scritto male.
const ringsHTML = (n) => `<em class="ct-rings" title="${n} ${n === 1 ? "titolo NBA vinto" : "titoli NBA vinti"} da capo allenatore">${n}&nbsp;${n === 1 ? "anello" : "anelli"}</em>`;

// Volto vero del giocatore (tools/build-volti.py, path relativo a index.html),
// stesso asset del draft: se il file manca l'<img> si toglie da sola e restano
// le iniziali sul gradiente colore squadra - nessun buco (vedi draft.js).
const VOLTI_PATH = "../../assets/volti";
function facciaHTML(card) {
  const { c1, c2 } = teamColors(card.team_abbr);
  const foto = `<img class="ph" src="${VOLTI_PATH}/${encodeURIComponent(card.player_id)}.webp"
      alt="" loading="lazy" decoding="async"
      onload="this.parentNode.classList.add('hasph')" onerror="this.remove()">`;
  return `<span class="ct-face" style="--tc1:${c1};--tc2:${c2}"><span class="ini">${esc(initials(card.name))}</span>${foto}</span>`;
}

// Fascia colore dell'OVR carta, la stessa del draft: oro / argento / bronzo.
const fascia = (o) => (o >= 88 ? "oro" : o >= 82 ? "arg" : "brz");

// ctx: { state, dispatch }
export function render(ctx) {
  const { state } = ctx;
  const el = document.createElement("section");
  el.className = "screen coach";

  const cards = titolari(state);
  // Il tetto morde qui, non solo a fine draft: la tassa del secondo apron si
  // applica una volta sola in startRun, ma la scheda deve mostrare lo stesso
  // numero che uscirà dopo, non il voto lordo di prima della tassa.
  const punitiApron = malusApron(state.speso, state.tetto);
  const base = tassaSuiReparti(votoRosa(state.rosa, "normale"), punitiApron); // voto squadra senza coach
  const baseDisp = toDisplayOvr(base.ovr);

  // Tre coach pescati una volta sola per questo render. app.js ri-renderizza a
  // ogni dispatch, ma da qui non si dispatcha finché non si conferma: la terna
  // resta stabile per tutta la schermata.
  const terna = ternaPerRun(cards);

  // Quante franchigie diverse ha messo insieme il draft: dice qualcosa di vero
  // sul quintetto invece di ripetere "5 giocatori".
  const franchigie = new Set(cards.map((c) => c.team_abbr));
  const provenienza = franchigie.size === 1
    ? `${esc([...franchigie][0])} · una sola squadra`
    : `${franchigie.size} franchigie diverse`;

  const riga = (c) => {
    const lordo = applyCoach(state.rosa, c).voto;
    const dopo = toDisplayOvr(tassaSuiReparti(lordo, punitiApron).ovr);
    return `
      <button class="ct-row" type="button" data-id="${c.id}" data-dopo="${dopo}" aria-pressed="false">
        ${FRECCE[c.profilo]}
        <span class="ct-n">${esc(c.name)}${c.anelli ? ringsHTML(c.anelli) : ""}</span>
        <span class="ct-tac">${esc(c.tattica)}</span>
        ${chipsCoach(c)}
      </button>`;
  };

  const quintetto = cards.map((card, i) => `
    <span class="ct-p">
      ${facciaHTML(card)}
      <span class="role">${ROLES[i]}</span>
      <span class="ovr ${fascia(card.ovr)}">${card.ovr}</span>
    </span>`).join("");

  el.innerHTML = `
    ${appHeader(state)}
    <div class="ct-board">
      ${LAVAGNA}
      ${seclab("Panchina", "Ultimo passo: poi si gioca")}
      <div class="ct-list">${terna.map(riga).join("")}</div>
      <p class="ct-note">Il coach moltiplica il voto della squadra: <b>A</b> lo alza,
        <b>D</b> lo abbassa. Gli anelli valgono punti in più, a parte.</p>
    </div>
    <div class="ct-prev">
      <span class="lab">Il tuo voto squadra</span>
      <span class="nums">
        <span class="from">${baseDisp}</span>
        <span class="arr">&rsaquo;</span>
        <span class="to" id="ctTo">&ndash;</span>
      </span>
    </div>
    <div class="ct-five-wrap">
      <div class="ct-five-lab">
        <span class="t">La squadra che allenerà</span>
        <span class="v">${provenienza}</span>
      </div>
      <div class="ct-five">${quintetto}</div>
    </div>
    <button class="cta" id="vai" disabled>${PLAY}<span>Manda in campo</span></button>`;

  wireAppHeader(el, ctx);

  // ---- selezione (stato locale) + anteprima ------------------------------
  const to = el.querySelector("#ctTo");
  const vai = el.querySelector("#vai");
  const righe = [...el.querySelectorAll(".ct-row")];
  let scelto = null;

  righe.forEach((b) => {
    b.onclick = () => {
      scelto = terna.find((c) => c.id === b.dataset.id);
      righe.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const dopo = Number(b.dataset.dopo);
      to.textContent = dopo;
      to.className = "to " + (dopo > baseDisp ? "up" : dopo < baseDisp ? "down" : "");
      // riavvia l'animazione anche se si ritocca lo stesso valore
      to.classList.remove("bump"); void to.offsetWidth; to.classList.add("bump");
      vai.disabled = false;
    };
  });

  vai.onclick = () => {
    if (!scelto) return;   // il bottone è disabilitato, ma non fidiamoci del solo DOM
    ctx.dispatch({ type: "chooseCoach", coach: scelto });
  };

  return el;
}

// La terna deve restare stabile per tutta la schermata: se app.js ri-renderizza
// il coach (per qualsiasi motivo) i tre nomi non possono cambiare sotto le dita.
// La chiave è il quintetto: cambia solo quando cambia la run, quindi una partita
// nuova ripesca allenatori nuovi senza che serva un id di run nel motore.
let ternaCache = { chiave: null, terna: null };

function ternaPerRun(cards) {
  const chiave = cards.map((c) => c.player_id).join("|");
  if (ternaCache.chiave !== chiave) ternaCache = { chiave, terna: pickCoaches() };
  return ternaCache.terna;
}
