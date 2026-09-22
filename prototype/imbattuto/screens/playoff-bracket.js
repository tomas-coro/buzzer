import {
  currentUserMatch,
} from "../../../game/playoff-bracket.js";

import {
  teamName,
} from "../../../game/team-names.js";

import {
  appHeader,
  wireAppHeader,
  esc,
} from "./_chrome.js";

const ROUND_NAMES = [
  "Round 1",
  "Semifinali",
  "Finale Conf.",
];

const TEAM_BRAND = {
  ATL: ["#E03A3E", "#C1D32F"],
  BOS: ["#007A33", "#BA9653"],
  BKN: ["#111111", "#FFFFFF"],
  CHA: ["#1D1160", "#00788C"],
  CHI: ["#CE1141", "#111111"],
  CLE: ["#6F263D", "#FFB81C"],
  DAL: ["#00538C", "#B8C4CA"],
  DEN: ["#0E2240", "#FEC524"],
  DET: ["#C8102E", "#1D42BA"],
  GSW: ["#1D428A", "#FFC72C"],
  HOU: ["#CE1141", "#111111"],
  IND: ["#002D62", "#FDBB30"],
  LAC: ["#C8102E", "#1D428A"],
  LAL: ["#552583", "#FDB927"],
  MEM: ["#5D76A9", "#12173F"],
  MIA: ["#98002E", "#F9A01B"],
  MIL: ["#00471B", "#EEE1C6"],
  MIN: ["#0C2340", "#236192"],
  NOP: ["#0C2340", "#C8102E"],
  NYK: ["#006BB6", "#F58426"],
  OKC: ["#007AC1", "#EF3B24"],
  ORL: ["#0077C0", "#C4CED4"],
  PHI: ["#006BB6", "#ED174C"],
  PHX: ["#1D1160", "#E56020"],
  POR: ["#E03A3E", "#111111"],
  SAC: ["#5A2D81", "#63727A"],
  SAS: ["#111111", "#C4CED4"],
  TOR: ["#CE1141", "#111111"],
  UTA: ["#002B5C", "#F9A01B"],
  WAS: ["#002B5C", "#E31837"],
};

function teamBrand(team) {
  const [primary, secondary] =
    TEAM_BRAND[team] ?? ["#243A78", "#6577CE"];

  return { primary, secondary };
}

function participantName(participant) {
  if (!participant) return "—";

  return participant.kind === "user"
    ? participant.name
    : teamName(participant.team);
}

function participantSeason(participant) {
  if (!participant || participant.kind === "user") {
    return "";
  }

  return participant.season ?? "";
}

function rowHTML(
  participant,
  score,
  match,
  side,
  currentMatch,
) {
  if (!participant) {
    return `
      <div class="pb-team empty">
        <span class="pb-seed">–</span>
        <span class="pb-mark ghost">·</span>
        <span class="pb-name"><b>—</b></span>
        <strong>–</strong>
      </div>`;
  }

  const winner =
    match.winner === side;

  const eliminated =
    match.winner
    && match.winner !== side;

  const user =
    participant.kind === "user";

  const current =
    currentMatch?.id === match.id;

  const classes = [
    "pb-team",
    user ? "user" : "",
    winner ? "winner" : "",
    eliminated ? "eliminated" : "",
    current ? "current" : "",
  ].filter(Boolean).join(" ");

  const season = participantSeason(participant);

  // Finché non esistono loghi reali nel repository,
  // il badge usa sigla + colori reali della franchigia.
  const mark = user
    ? "TU"
    : participant.team ?? "";

  const brand = teamBrand(participant.team);

  return `
    <div
      class="${classes}"
      ${participant.team ? `data-team="${esc(participant.team)}"` : ""}
      style="
        --team-primary:${brand.primary};
        --team-secondary:${brand.secondary};
      "
    >
      <span class="pb-seed">${participant.seed}</span>

      <span class="pb-mark${user ? " mine" : ""}">
        ${esc(mark)}
      </span>

      <span class="pb-name">
        <b>${esc(participantName(participant))}</b>
        ${season
          ? `<small>${esc(season)}</small>`
          : user
            ? `<small>LA TUA SQUADRA</small>`
            : ""}
      </span>

      <strong>${score}</strong>
    </div>`;
}

function matchHTML(match, currentMatch) {
  return `
    <div class="pb-match${currentMatch?.id === match.id ? " active" : ""}">
      ${rowHTML(
        match.a,
        match.scoreA,
        match,
        "a",
        currentMatch,
      )}

      ${rowHTML(
        match.b,
        match.scoreB,
        match,
        "b",
        currentMatch,
      )}
    </div>`;
}

function roundHTML(
  matches,
  name,
  currentMatch,
) {
  return `
    <div class="pb-round">
      <div class="pb-round-title">${name}</div>

      <div class="pb-round-matches">
        ${matches
          .map((match) =>
            matchHTML(match, currentMatch))
          .join("")}
      </div>
    </div>`;
}

function bracketLinesHTML(conference, currentMatch) {
  const active = currentMatch?.conference === conference
    ? currentMatch.id
    : "";

  const cls = (round, index) =>
    active === `${conference}-${round}-${index}`
      ? "pb-tree-line active"
      : "pb-tree-line";

  return `
    <svg
      class="pb-tree pb-tree-${conference}"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <!-- ROUND 1 -> SEMIFINALI -->
      <path
        class="${cls("r1", 0)}"
        d="M 30.8 12.5 H 33 V 25 H 34.7"
      />
      <path
        class="${cls("r1", 1)}"
        d="M 30.8 37.5 H 33 V 25 H 34.7"
      />

      <path
        class="${cls("r1", 2)}"
        d="M 30.8 62.5 H 33 V 75 H 34.7"
      />
      <path
        class="${cls("r1", 3)}"
        d="M 30.8 87.5 H 33 V 75 H 34.7"
      />

      <!-- SEMIFINALI -> FINALE CONFERENCE -->
      <path
        class="${cls("r2", 0)}"
        d="M 65.3 25 H 67.3 V 50 H 69.2"
      />
      <path
        class="${cls("r2", 1)}"
        d="M 65.3 75 H 67.3 V 50 H 69.2"
      />
    </svg>
  `;
}

function conferenceHTML(
  bracket,
  conference,
  currentMatch,
) {
  const rounds =
    bracket.conferences[conference];

  const ordered =
    conference === "east"
      ? [
          [rounds[0], ROUND_NAMES[0]],
          [rounds[1], ROUND_NAMES[1]],
          [rounds[2], ROUND_NAMES[2]],
        ]
      : [
          [rounds[2], ROUND_NAMES[2]],
          [rounds[1], ROUND_NAMES[1]],
          [rounds[0], ROUND_NAMES[0]],
        ];

  return `
    <section
      class="pb-conference pb-${conference}"
      data-pane="${conference}"
    >
      <div class="pb-conf-title">
        ${conference.toUpperCase()}
      </div>

      <div class="pb-conf-grid">
        ${bracketLinesHTML(
          conference,
          currentMatch,
        )}

        ${ordered
          .map(([matches, name]) =>
            roundHTML(
              matches,
              name,
              currentMatch,
            ))
          .join("")}
      </div>
    </section>`;
}

function finalsHTML(bracket, currentMatch) {
  return `
    <section
      class="pb-finals"
      data-pane="finals"
    >
      <div class="pb-finals-kicker">
        NBA
      </div>

      <h2>FINALS</h2>

      ${matchHTML(
        bracket.finals,
        currentMatch,
      )}
    </section>`;
}

export function render(ctx) {
  const { state } = ctx;

  const el = document.createElement("section");
  el.className = "screen playoff-bracket";

  const bracket = state.playoffBracket;

  if (!bracket) {
    el.innerHTML = `
      ${appHeader(state)}

      <div class="pb-empty">
        <h1>Playoff</h1>
        <p>Tabellone non disponibile per questa run.</p>
        <button
          class="sh-cta"
          id="pb-continue"
          type="button"
        >
          Continua
        </button>
      </div>`;

    wireAppHeader(el, ctx);

    el.querySelector("#pb-continue").onclick =
      () => ctx.dispatch({
        type: "continuePlayoff",
      });

    return el;
  }

  const currentMatch =
    currentUserMatch(bracket);

  const currentConference =
    currentMatch?.conference === "finals"
      ? "finals"
      : bracket.userConference;

  el.dataset.view = currentConference;

  el.innerHTML = `
    ${appHeader(state)}

    <div class="pb-shell">
      <header class="pb-head">
        <div>
          <span class="pb-kicker">
            PLAYOFF
          </span>

          <h1>Tabellone</h1>
        </div>

        <div class="pb-current">
          <span>Round ${state.round}</span>
          <b>
            ${state.serieRecord.noi}-${state.serieRecord.loro}
          </b>
        </div>
      </header>

      <div
        class="pb-tabs"
        role="tablist"
        aria-label="Conference"
      >
        <button
          type="button"
          data-view="east"
        >
          East
        </button>

        <button
          type="button"
          data-view="finals"
        >
          Finals
        </button>

        <button
          type="button"
          data-view="west"
        >
          West
        </button>
      </div>

      <div class="pb-board">
        ${conferenceHTML(
          bracket,
          "east",
          currentMatch,
        )}

        ${finalsHTML(
          bracket,
          currentMatch,
        )}

        ${conferenceHTML(
          bracket,
          "west",
          currentMatch,
        )}
      </div>

      <button
        class="sh-cta pb-continue"
        id="pb-continue"
        type="button"
      >
        Continua i playoff
      </button>
    </div>
  `;

  wireAppHeader(el, ctx);

  const setView = (view) => {
    el.dataset.view = view;

    el
      .querySelectorAll(".pb-tabs button")
      .forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.view === view),
        );
      });
  };

  el
    .querySelectorAll(".pb-tabs button")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => setView(button.dataset.view),
      );
    });

  setView(currentConference);

  el.querySelector("#pb-continue").onclick =
    () => ctx.dispatch({
      type: "continuePlayoff",
    });

  return el;
}
