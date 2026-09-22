import { rngSeed } from "./partita.js";

export const TEAM_CONFERENCE = {
  ATL: "east",
  BKN: "east",
  BOS: "east",
  CHA: "east",
  CHI: "east",
  CLE: "east",
  DET: "east",
  IND: "east",
  MIA: "east",
  MIL: "east",
  NYK: "east",
  ORL: "east",
  PHI: "east",
  TOR: "east",
  WAS: "east",

  DAL: "west",
  DEN: "west",
  GSW: "west",
  HOU: "west",
  LAC: "west",
  LAL: "west",
  MEM: "west",
  MIN: "west",
  NOP: "west",
  OKC: "west",
  PHX: "west",
  POR: "west",
  SAC: "west",
  SAS: "west",
  UTA: "west",
};

const USER = "__USER__";

const PAIRS = [
  [1, 8],
  [4, 5],
  [3, 6],
  [2, 7],
];

const PAIR_OF = {
  1: 8, 8: 1,
  2: 7, 7: 2,
  3: 6, 6: 3,
  4: 5, 5: 4,
};

const clone = (v) => JSON.parse(JSON.stringify(v));

function hashString(value) {
  let h = 2166136261;

  for (const ch of String(value)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }

  return h >>> 0;
}

function conferenceOf(team) {
  return TEAM_CONFERENCE[team] ?? null;
}

function shuffled(lista, rng) {
  const out = lista.slice();

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }

  return out;
}

function uniqueTeams(pool, conference, excluded = new Set()) {
  const seen = new Set();
  const out = [];

  for (const opponent of pool) {
    if (conferenceOf(opponent.team) !== conference) continue;
    if (excluded.has(opponent.team)) continue;
    if (seen.has(opponent.team)) continue;

    seen.add(opponent.team);
    out.push(opponent);
  }

  return out;
}

function teamParticipant(opponent, seed) {
  return {
    kind: "team",
    team: opponent.team,
    season: opponent.season,
    seed,
  };
}

function userParticipant(name, seed) {
  return {
    kind: "user",
    id: USER,
    name,
    seed,
  };
}

function makeMatch(id, round, conference, a = null, b = null) {
  return {
    id,
    round,
    conference,
    a,
    b,
    scoreA: 0,
    scoreB: 0,
    winner: null,
  };
}

function buildConference(conference, participants) {
  const bySeed = new Map(participants.map((p) => [p.seed, p]));

  const r1 = PAIRS.map(([a, b], i) =>
    makeMatch(
      `${conference}-r1-${i}`,
      1,
      conference,
      bySeed.get(a),
      bySeed.get(b),
    ));

  const r2 = [
    makeMatch(`${conference}-r2-0`, 2, conference),
    makeMatch(`${conference}-r2-1`, 2, conference),
  ];

  const r3 = [
    makeMatch(`${conference}-r3-0`, 3, conference),
  ];

  return [r1, r2, r3];
}

function participantKey(p) {
  if (!p) return null;
  if (p.kind === "user") return USER;
  return `${p.team}|${p.season}`;
}

function sameParticipant(a, b) {
  return participantKey(a) === participantKey(b);
}

function hasUser(match) {
  return match?.a?.kind === "user" || match?.b?.kind === "user";
}

function winnerParticipant(match) {
  if (!match?.winner) return null;
  return match.winner === "a" ? match.a : match.b;
}

function putIfEmpty(match, side, participant) {
  if (!participant) return;
  if (!match[side]) match[side] = clone(participant);
}

function propagateMutable(bracket) {
  for (const conference of ["east", "west"]) {
    const [r1, r2, r3] = bracket.conferences[conference];

    putIfEmpty(r2[0], "a", winnerParticipant(r1[0]));
    putIfEmpty(r2[0], "b", winnerParticipant(r1[1]));

    putIfEmpty(r2[1], "a", winnerParticipant(r1[2]));
    putIfEmpty(r2[1], "b", winnerParticipant(r1[3]));

    putIfEmpty(r3[0], "a", winnerParticipant(r2[0]));
    putIfEmpty(r3[0], "b", winnerParticipant(r2[1]));
  }

  putIfEmpty(
    bracket.finals,
    "a",
    winnerParticipant(bracket.conferences.east[2][0]),
  );

  putIfEmpty(
    bracket.finals,
    "b",
    winnerParticipant(bracket.conferences.west[2][0]),
  );

  return bracket;
}

function allMatches(bracket) {
  return [
    ...bracket.conferences.east.flat(),
    ...bracket.conferences.west.flat(),
    bracket.finals,
  ];
}

function ratingOf(pool, bracket, participant) {
  if (!participant) return 50;

  if (participant.kind === "user") {
    return bracket.userOvr ?? 50;
  }

  const opponent = pool.find(
    (o) =>
      o.team === participant.team
      && o.season === participant.season
  );

  return opponent?.voto?.ovr ?? 50;
}

function applySeriesGame(match, side) {
  if (match.winner) return;

  if (side === "a") match.scoreA++;
  else match.scoreB++;

  if (match.scoreA >= 4) match.winner = "a";
  if (match.scoreB >= 4) match.winner = "b";
}

export function createPlayoffBracket({
  pool,
  firstOpponent,
  userName,
  userOvr,
  seme,
}) {
  if (!Array.isArray(pool) || !firstOpponent) return null;

  const userConference =
    conferenceOf(firstOpponent.team);

  if (!userConference) return null;

  const otherConference =
    userConference === "east" ? "west" : "east";

  const rng = rngSeed(seme + 90317);

  const samePool = shuffled(
    uniqueTeams(
      pool,
      userConference,
      new Set([firstOpponent.team]),
    ),
    rng,
  );

  const otherPool = shuffled(
    uniqueTeams(pool, otherConference),
    rng,
  );

  // User + primo avversario + altre 6 = 8.
  // Nell'altra conference servono 8 franchigie.
  if (samePool.length < 6 || otherPool.length < 8) {
    return null;
  }

  const userSeed = 1 + Math.floor(rng() * 8);
  const firstOpponentSeed = PAIR_OF[userSeed];

  const occupied = new Set([
    userSeed,
    firstOpponentSeed,
  ]);

  const remainingSeeds = Array
    .from({ length: 8 }, (_, i) => i + 1)
    .filter((seed) => !occupied.has(seed));

  const userSide = [
    userParticipant(userName, userSeed),
    teamParticipant(firstOpponent, firstOpponentSeed),
    ...samePool.slice(0, 6).map((opponent, i) =>
      teamParticipant(opponent, remainingSeeds[i])),
  ];

  const oppositeSeeds = shuffled(
    Array.from({ length: 8 }, (_, i) => i + 1),
    rng,
  );

  const oppositeSide = otherPool
    .slice(0, 8)
    .map((opponent, i) =>
      teamParticipant(opponent, oppositeSeeds[i]));

  const eastParticipants =
    userConference === "east"
      ? userSide
      : oppositeSide;

  const westParticipants =
    userConference === "west"
      ? userSide
      : oppositeSide;

  const bracket = {
    version: 1,
    userConference,
    userOvr,
    conferences: {
      east: buildConference("east", eastParticipants),
      west: buildConference("west", westParticipants),
    },
    finals: makeMatch("finals", 4, "finals"),
  };

  return propagateMutable(bracket);
}

export function recordUserPlayoffGame(bracket, won) {
  if (!bracket) return null;

  const next = clone(bracket);

  const match = allMatches(next).find(
    (m) =>
      !m.winner
      && m.a
      && m.b
      && hasUser(m),
  );

  if (!match) {
    throw new Error(
      "recordUserPlayoffGame: serie del giocatore non trovata",
    );
  }

  const userSide =
    match.a.kind === "user" ? "a" : "b";

  const winnerSide = won
    ? userSide
    : userSide === "a" ? "b" : "a";

  applySeriesGame(match, winnerSide);

  return propagateMutable(next);
}

export function simulateOtherPlayoffGames(
  bracket,
  pool,
  seme,
  tick,
) {
  if (!bracket) return null;

  const next = clone(bracket);

  // Snapshot: una singola "giornata" non deve giocare anche
  // il round appena sbloccato nello stesso tick.
  const active = allMatches(next).filter(
    (m) =>
      !m.winner
      && m.a
      && m.b
      && !hasUser(m),
  );

  for (const match of active) {
    const a = ratingOf(pool, next, match.a);
    const b = ratingOf(pool, next, match.b);

    // Differenza OVR moderata: le serie restano aperte,
    // ma una squadra più forte mantiene un vantaggio reale.
    const pA = Math.max(
      0.15,
      Math.min(0.85, 0.5 + (a - b) / 70),
    );

    const rng = rngSeed(
      seme
      + tick * 1009
      + hashString(match.id),
    );

    applySeriesGame(
      match,
      rng() < pA ? "a" : "b",
    );
  }

  return propagateMutable(next);
}

export function currentUserMatch(bracket) {
  if (!bracket) return null;

  return allMatches(bracket).find(
    (m) => !m.winner && hasUser(m),
  ) ?? null;
}

export function currentUserOpponentRef(bracket) {
  const match = currentUserMatch(bracket);

  if (!match?.a || !match?.b) return null;

  const opponent =
    match.a.kind === "user"
      ? match.b
      : match.a;

  if (opponent.kind !== "team") return null;

  return {
    team: opponent.team,
    season: opponent.season,
  };
}

export function opponentFromBracketRef(pool, ref) {
  if (!ref) return null;

  return pool.find(
    (o) =>
      o.team === ref.team
      && o.season === ref.season,
  ) ?? null;
}

export function settleBracketUntilUserReady(
  bracket,
  pool,
  seme,
  startTick = 0,
) {
  if (!bracket) return null;

  let next = bracket;

  for (let i = 0; i < 40; i++) {
    if (currentUserOpponentRef(next)) return next;

    const userMatch = currentUserMatch(next);
    if (!userMatch) return next;

    next = simulateOtherPlayoffGames(
      next,
      pool,
      seme,
      startTick + i + 1,
    );
  }

  throw new Error(
    "settleBracketUntilUserReady: tabellone non risolto",
  );
}

export function userPlayoffChampion(bracket) {
  if (!bracket?.finals?.winner) return false;

  return winnerParticipant(bracket.finals)?.kind === "user";
}
