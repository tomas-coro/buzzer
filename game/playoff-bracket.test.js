import test from "node:test";
import assert from "node:assert/strict";

import {
  createPlayoffBracket,
  recordUserPlayoffGame,
  simulateOtherPlayoffGames,
  settleBracketUntilUserReady,
  currentUserMatch,
  currentUserOpponentRef,
} from "./playoff-bracket.js";

const EAST = [
  "ATL", "BOS", "BKN", "CHI",
  "CLE", "IND", "MIA", "MIL",
];

const WEST = [
  "DAL", "DEN", "GSW", "HOU",
  "LAL", "MEM", "MIN", "PHX",
];

function pool() {
  return [...EAST, ...WEST].map((team, i) => ({
    team,
    season: "2025-26",
    voto: {
      ovr: 45 + i,
    },
  }));
}

test("bracket playoff crea otto East e otto West con il giocatore", () => {
  const p = pool();

  const b = createPlayoffBracket({
    pool: p,
    firstOpponent: p[0],
    userName: "P1",
    userOvr: 60,
    seme: 123,
  });

  assert.ok(b);

  const eastR1 = b.conferences.east[0];

  const partecipanti = eastR1.flatMap(
    (m) => [m.a, m.b],
  );

  assert.equal(partecipanti.length, 8);

  assert.equal(
    partecipanti.filter((x) => x.kind === "user").length,
    1,
  );
});

test("una vittoria aggiorna la serie del giocatore", () => {
  const p = pool();

  let b = createPlayoffBracket({
    pool: p,
    firstOpponent: p[0],
    userName: "P1",
    userOvr: 60,
    seme: 123,
  });

  b = recordUserPlayoffGame(b, true);

  const m = currentUserMatch(b);

  assert.ok(m);
  assert.equal(
    m.a.kind === "user" ? m.scoreA : m.scoreB,
    1,
  );
});

test("le altre serie avanzano deterministicamente", () => {
  const p = pool();

  const start = createPlayoffBracket({
    pool: p,
    firstOpponent: p[0],
    userName: "P1",
    userOvr: 60,
    seme: 123,
  });

  const a = simulateOtherPlayoffGames(
    start,
    p,
    123,
    1,
  );

  const b = simulateOtherPlayoffGames(
    start,
    p,
    123,
    1,
  );

  assert.deepEqual(a, b);
});

test("chiusa la serie del giocatore il bracket trova il prossimo avversario", () => {
  const p = pool();

  let b = createPlayoffBracket({
    pool: p,
    firstOpponent: p[0],
    userName: "P1",
    userOvr: 60,
    seme: 123,
  });

  for (let i = 0; i < 4; i++) {
    b = recordUserPlayoffGame(b, true);

    b = simulateOtherPlayoffGames(
      b,
      p,
      123,
      i + 1,
    );
  }

  b = settleBracketUntilUserReady(
    b,
    p,
    123,
    10,
  );

  const next = currentUserOpponentRef(b);

  assert.ok(next);
  assert.ok(next.team);
});
