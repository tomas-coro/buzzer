import { ROLES } from "../../../game/roster.js";
import { votoRosa } from "../../../game/rating.js";
import { applyCoach } from "../../../game/coach.js";
import { titolari, tassaSuiReparti } from "../../../game/run.js";
import { malusApron } from "../../../game/salary.js";
import { REPARTI, ETICHETTE } from "../../../game/reparti.js";
import { toDisplayOvr } from "../display.js";
import { teamColors, initials } from "../team-colors.js";
import { pickCoaches } from "../coaches.js";
import { appHeader, wireAppHeader, seclab, esc } from "./_chrome.js";

const FRECCE = {
  off: `<svg class="ct-arrow" viewBox="0 0 34 24" aria-hidden="true"><path d="M3 20 L14 6 L22 14 L31 5"/><path d="M25 4 L31 4 L31 10"/></svg>`,
  bil: `<svg class="ct-arrow" viewBox="0 0 34 24" aria-hidden="true"><line x1="4" y1="12" x2="30" y2="12"/><path d="M25 7 L30 12 L25 17"/><path d="M9 7 L4 12 L9 17"/></svg>`,
  dif: `<svg class="ct-arrow" viewBox="0 0 34 24" aria-hidden="true"><line x1="5" y1="5" x2="5" y2="19"/><line x1="12" y1="5" x2="12" y2="19"/><path d="M20 12 L30 12"/><path d="M25 7 L20 12 L25 17"/></svg>`,
};

const PLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;

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

const chip = (rep, cls, segno) => `
  <span class="rchip ${cls} ${rep.ruoli ? "mirato" : ""}"
        title="${esc(ETICHETTE[rep.reparto])}${rep.ruoli ? " · " + rep.ruoli.join(" ") : ""}">
    <span class="cod">${segno} ${rep.reparto.toUpperCase()}</span>
    <span class="sub">${rep.ruoli ? rep.ruoli.join(" ") : "tutti"}</span>
  </span>`;

const chipsCoach = (c) => `
  <div class="chips">
    ${chip(c.plus[0], "plus", "▲")}
    ${chip(c.plus[1], "plus", "▲")}
    ${chip(c.malus, "malus", "▼")}
  </div>`;

const ringsHTML = (n) => `
  <em class="ct-rings"
      title="${n} ${n === 1 ? "titolo NBA vinto" : "titoli NBA vinti"} da capo allenatore">
    ${n}&nbsp;${n === 1 ? "anello" : "anelli"}
  </em>`;

const VOLTI_PATH = "../../assets/volti";

function facciaHTML(card) {
  const { c1, c2 } = teamColors(card.team_abbr);

  const foto = `
    <img class="ph"
         src="${VOLTI_PATH}/${encodeURIComponent(card.player_id)}.webp"
         alt=""
         loading="lazy"
         decoding="async"
         onload="this.parentNode.classList.add('hasph')"
         onerror="this.remove()">`;

  return `
    <span class="ct-face" style="--tc1:${c1};--tc2:${c2}">
      <span class="ini">${esc(initials(card.name))}</span>
      ${foto}
    </span>`;
}

const fascia = (o) => (o >= 88 ? "oro" : o >= 82 ? "arg" : "brz");

function splitPlayerName(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: "", last: parts[0] ?? "" };

  const suffixes = new Set(["I", "II", "III", "IV", "V", "Jr", "Sr", "Jr.", "Sr."]);

  let surnameIndex = parts.length - 1;

  while (surnameIndex > 0 && suffixes.has(parts[surnameIndex])) {
    surnameIndex--;
  }

  return {
    first: parts.slice(0, surnameIndex).join(" "),
    last: parts.slice(surnameIndex).join(" "),
  };
}

const REP_LABEL = {
  t3: "T3",
  fin: "FIN",
  dif: "DIF",
  reb: "REB",
  reg: "REG",
};

function fasciaReparto(v) {
  if (v < 70) return 1;
  if (v < 85) return 2;
  return 3;
}

function repartoEsatto(rep, prima, dopo, difficolta, minimo, massimo) {
  const classi = ["ct-rep"];

  if (difficolta === "facile") {
    if (prima === massimo) classi.push("best");
    if (prima === minimo) classi.push("weak");
  }

  const cambiato = dopo !== null && dopo !== prima;
  const primaDisplay = Math.round(prima);
  const dopoDisplay = dopo !== null ? Math.round(dopo) : null;
  const valore = cambiato
    ? `${primaDisplay}›${dopoDisplay}`
    : String(primaDisplay);
  const direzione = cambiato
    ? dopo > prima ? "up" : "down"
    : "";

  return `
    <span class="${classi.join(" ")}">
      <small>${REP_LABEL[rep]}</small>
      <strong class="${direzione}">${valore}</strong>
    </span>`;
}

function repartoFasce(rep, prima, dopo) {
  const mostrato = dopo ?? prima;
  const primaN = fasciaReparto(prima);
  const dopoN = fasciaReparto(mostrato);

  const segmenti = Array.from({ length: 3 }, (_, i) => {
    let cls = "";

    if (i < dopoN) cls = "on";

    if (dopo !== null && dopoN > primaN && i >= primaN && i < dopoN) {
      cls = "up";
    }

    if (dopo !== null && dopoN < primaN && i >= dopoN && i < primaN) {
      cls = "down";
    }

    return `<i class="${cls}"></i>`;
  }).join("");

  return `
    <span class="ct-rep">
      <small>${REP_LABEL[rep]}</small>
      <span class="ct-segs">${segmenti}</span>
    </span>`;
}

function scoutingHTML(difficolta, prima, dopo = null) {
  if (difficolta === "incubo") return "";

  const valori = REPARTI.map((rep) => prima[rep]);
  const minimo = Math.min(...valori);
  const massimo = Math.max(...valori);

  const reparti = REPARTI.map((rep) => {
    if (difficolta === "difficile") {
      return repartoFasce(
        rep,
        prima[rep],
        dopo ? dopo[rep] : null,
      );
    }

    return repartoEsatto(
      rep,
      prima[rep],
      dopo ? dopo[rep] : null,
      difficolta,
      minimo,
      massimo,
    );
  }).join("");

  return `
    <div class="ct-scout">
      <div class="ct-scout-title">
        <span>Reparti squadra</span>
        <span>${dopo ? "Anteprima coach" : "Prima del coach"}</span>
      </div>

      <div class="ct-reps">${reparti}</div>
    </div>`;
}

export function render(ctx) {
  const { state } = ctx;

  const el = document.createElement("section");
  el.className = "screen coach";

  const cards = titolari(state);

  const punitiApron = malusApron(state.speso, state.tetto);

  const base = tassaSuiReparti(
    votoRosa(state.rosa, "normale"),
    punitiApron,
  );

  const baseDisp = toDisplayOvr(base.ovr);
  const baseReparti = base.reparti;

  const terna = ternaPerRun(cards);

  const riga = (c) => {
    const lordo = applyCoach(state.rosa, c).voto;
    const dopo = toDisplayOvr(
      tassaSuiReparti(lordo, punitiApron).ovr,
    );

    return `
      <button class="ct-row"
              type="button"
              data-id="${c.id}"
              data-dopo="${dopo}"
              aria-pressed="false">
        ${FRECCE[c.profilo]}

        <span class="ct-n">
          ${esc(c.name)}
          ${c.anelli ? ringsHTML(c.anelli) : ""}
        </span>

        <span class="ct-tac">${esc(c.tattica)}</span>

        ${chipsCoach(c)}
      </button>`;
  };

  const quintetto = cards.map((card, i) => {
    const nome = splitPlayerName(card.name);
    const ruolo = ROLES[i];
    const roleClass = ruolo.toLowerCase();

    return `
      <span class="ct-court-player ${roleClass}"
            title="${esc(card.name)} · ${ruolo} · ${card.ovr} OVR">

        <span class="ct-court-face">
          ${facciaHTML(card)}
        </span>

        <span class="ct-court-role">${ruolo}</span>

        <span class="ct-court-name">
          ${esc(nome.last || card.name)}
        </span>

        <span class="ct-court-ovr ${fascia(card.ovr)}">
          ${card.ovr}
        </span>
      </span>`;
  }).join("");

  el.innerHTML = `
    ${appHeader(state)}

    <div class="ct-five-wrap">
      <div class="ct-five-lab">
        <span class="t">Quintetto titolare</span>
        <span class="v">Rosa completa · 10/10</span>
      </div>

      <div class="ct-half-court">
        <span class="ct-court-lines" aria-hidden="true"></span>
        ${quintetto}
      </div>
    </div>

    <div class="ct-board">
      ${LAVAGNA}

      ${seclab("Panchina", "Ultimo passo: poi si gioca")}

      ${state.difficolta === "incubo"
        ? ""
        : `
          <div class="ct-scout-wrap" id="ctScout">
            ${scoutingHTML(
              state.difficolta,
              baseReparti,
            )}
          </div>`}

      <div class="ct-list">
        ${terna.map(riga).join("")}
      </div>
    </div>

    <div class="ct-prev">
      <span class="lab">Il tuo voto squadra</span>

      <span class="nums">
        <span class="from">${baseDisp}</span>
        <span class="arr">&rsaquo;</span>
        <span class="to" id="ctTo">&ndash;</span>
      </span>
    </div>

    <button class="cta" id="vai" disabled>
      ${PLAY}
      <span>Manda in campo</span>
    </button>`;

  wireAppHeader(el, ctx);

  const to = el.querySelector("#ctTo");
  const vai = el.querySelector("#vai");
  const righe = [...el.querySelectorAll(".ct-row")];

  let scelto = null;

  righe.forEach((b) => {
    b.onclick = () => {
      scelto = terna.find((c) => c.id === b.dataset.id);

      righe.forEach((x) => {
        x.setAttribute(
          "aria-pressed",
          String(x === b),
        );
      });

      const allenata = applyCoach(
        state.rosa,
        scelto,
      );

      const votoDopo = tassaSuiReparti(
        allenata.voto,
        punitiApron,
      );

      const dopo = toDisplayOvr(
        votoDopo.ovr,
      );

      const scout = el.querySelector("#ctScout");

      if (scout) {
        scout.innerHTML = scoutingHTML(
          state.difficolta,
          baseReparti,
          votoDopo.reparti,
        );
      }

      to.textContent = dopo;

      to.className =
        "to " +
        (
          dopo > baseDisp
            ? "up"
            : dopo < baseDisp
              ? "down"
              : ""
        );

      to.classList.remove("bump");
      void to.offsetWidth;
      to.classList.add("bump");

      vai.disabled = false;
    };
  });

  vai.onclick = () => {
    if (!scelto) return;

    ctx.dispatch({
      type: "chooseCoach",
      coach: scelto,
    });
  };

  return el;
}

let ternaCache = {
  chiave: null,
  terna: null,
};

function ternaPerRun(cards) {
  const chiave = cards
    .map((c) => c.player_id)
    .join("|");

  if (ternaCache.chiave !== chiave) {
    ternaCache = {
      chiave,
      terna: pickCoaches(),
    };
  }

  return ternaCache.terna;
}
