import { teamRating, DEFAULT_K } from "./rating.js";

// Da { "TEAM|SEASON": Card[] } → lista di avversari (top-5 OVR) valutati.
export function buildHistoricalQuintets(cardsByTeamSeason, k = DEFAULT_K) {
  const out = [];
  for (const [key, cards] of Object.entries(cardsByTeamSeason)) {
    if (!Array.isArray(cards) || cards.length < 5) continue; // niente quintetto finto
    const quintet = [...cards].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
    const [team, season] = key.split("|");
    out.push({ team, season, quintet, voto: teamRating(quintet, k) });
  }
  return out;
}

// Soglia OVR del round: cresce linearmente da oppMin (round 1) a oppMax (round N).
function roundThreshold(round, d) {
  const span = Math.max(d.N - 1, 1);
  return d.oppMin + (d.oppMax - d.oppMin) * ((round - 1) / span);
}

// Avversario col voto.ovr più vicino alla soglia del round (deterministico).
export function pickOpponent(pool, round, d) {
  if (!pool.length) throw new Error("pickOpponent: pool avversari vuoto");
  const target = roundThreshold(round, d);
  let best = pool[0];
  let bestDist = Math.abs(best.voto.ovr - target);
  for (const o of pool) {
    const dist = Math.abs(o.voto.ovr - target);
    if (dist < bestDist) { best = o; bestDist = dist; }
  }
  return best;
}
