import { canPlay } from "../../game/roster.js";
import { buildHistoricalQuintets } from "../../game/opponents.js";

export function topFive(cards) {
  return [...cards].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
}

// Una rosa "serve" se almeno uno dei suoi top-5 può coprire uno slot ancora libero.
function rosterFits(cards, freeRoles) {
  return topFive(cards).some((c) => freeRoles.some((r) => canPlay(c, r)));
}

// Pesca una team-stagione la cui top-5 copre almeno uno slot libero.
// Piazzamento libero: non filtro per un ruolo singolo, mostro l'intera top-5.
// filtro { sameTeam, sameSeason, excludeKey } serve agli aiuti squadra/stagione.
// La chiave del dataset è "TEAM|SEASON".
export function spinRoster(cardsByKey, freeRoles, filtro = {}, rng = Math.random) {
  const { sameTeam = null, sameSeason = null, excludeKey = null } = filtro;
  const validKeys = Object.keys(cardsByKey)
    .filter((k) => cardsByKey[k].length >= 5)
    .filter((k) => rosterFits(cardsByKey[k], freeRoles));

  // Applico i vincoli dell'aiuto. Se svuotano tutto, allargo a tutte le rose
  // valide invece di lasciare l'aiuto senza effetto (fallback esplicito, non silenzioso).
  let pool = validKeys.filter((k) => {
    const [team, season] = k.split("|");
    if (excludeKey && k === excludeKey) return false;
    if (sameTeam && team !== sameTeam) return false;
    if (sameSeason && season !== sameSeason) return false;
    return true;
  });
  let fallback = false;
  if (pool.length === 0) {
    pool = validKeys.filter((k) => k !== excludeKey);
    fallback = true;
  }
  if (pool.length === 0) pool = validKeys; // ultima spiaggia: anche la stessa
  if (pool.length === 0) throw new Error("spinRoster: nessuna rosa copre gli slot liberi");

  const key = pool[Math.floor(rng() * pool.length)];
  return { key, cards: topFive(cardsByKey[key]), fallback };
}

export function opponentPool(cardsByKey, k) {
  return buildHistoricalQuintets(cardsByKey, k);
}
