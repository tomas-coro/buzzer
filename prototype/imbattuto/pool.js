import { canPlay } from "../../game/roster.js";
import { buildHistoricalQuintets } from "../../game/opponents.js";

export function topFive(cards) {
  return [...cards].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
}

export function candidatesForRole(cardsByKey, key, role) {
  const cards = topFive(cardsByKey[key]);
  const assignable = cards.map((c) => canPlay(c, role));
  return { key, cards, assignable };
}

// Pesca una team-stagione (con ≥5 carte) i cui top-5 contengono almeno un compatibile.
export function spin(cardsByKey, role, rng = Math.random) {
  const keys = Object.keys(cardsByKey).filter((k) => cardsByKey[k].length >= 5);
  const valide = keys.filter((k) => candidatesForRole(cardsByKey, k, role).assignable.some(Boolean));
  if (valide.length === 0) throw new Error(`spin: nessuna team-stagione con un compatibile per ${role}`);
  const key = valide[Math.floor(rng() * valide.length)];
  return candidatesForRole(cardsByKey, key, role);
}

export function opponentPool(cardsByKey, k) {
  return buildHistoricalQuintets(cardsByKey, k);
}
