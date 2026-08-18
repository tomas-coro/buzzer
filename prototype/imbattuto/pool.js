import { canPlay } from "../../game/roster.js";
import { buildHistoricalRose } from "../../game/opponents.js";

export function topFive(cards) {
  return [...cards].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
}

// L'identità di una carta: giocatore + stagione. LeBron 2013 e LeBron 2018 sono
// due carte diverse; lo stesso LeBron 2013 pescato due volte è la stessa carta,
// e in rosa non ci può stare due volte (deciso al grill del 2026-08-18).
export const chiaveCarta = (c) => `${c.player_id}|${c.season}`;

// Una rosa "serve" se almeno uno dei suoi top-5 può coprire uno slot ancora libero.
function rosterFits(cards, freeRoles) {
  return topFive(cards).some((c) => freeRoles.some((r) => canPlay(c, r)));
}

// Pesca una team-stagione la cui top-5 copre almeno uno slot libero.
// Piazzamento libero: non filtro per un ruolo singolo, mostro l'intera top-5.
// filtro { sameTeam, sameSeason, excludeKey } serve agli aiuti squadra/stagione;
// filtro.escludi è l'insieme delle carte GIÀ IN ROSA (chiaveCarta): spariscono
// dalle rose pescate, così lo stesso giocatore-stagione non finisce due volte in
// squadra. Con la rosa da 10 capitava spesso: dieci pick sullo stesso pool.
// La chiave del dataset è "TEAM|SEASON".
export function spinRoster(cardsByKey, freeRoles, filtro = {}, rng = Math.random) {
  const { sameTeam = null, sameSeason = null, excludeKey = null, escludi = null } = filtro;
  const fuori = escludi instanceof Set ? escludi : new Set(escludi ?? []);

  // Le carte ancora prendibili di ogni rosa, calcolate una volta sola: servono
  // sia per scegliere le chiavi valide sia per la top-5 che poi si mostra.
  const libere = new Map();
  for (const k of Object.keys(cardsByKey)) {
    const disp = fuori.size === 0
      ? cardsByKey[k]
      : cardsByKey[k].filter((c) => !fuori.has(chiaveCarta(c)));
    if (disp.length >= 5 && rosterFits(disp, freeRoles)) libere.set(k, disp);
  }
  const validKeys = [...libere.keys()];

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
  return { key, cards: topFive(libere.get(key)), fallback };
}

// Gli avversari: una rosa da 10 per squadra-stagione, non più una top-5. Le
// squadre con meno di dieci carte restano fuori dal pool (vedi opponents.js).
export function opponentPool(cardsByKey, k) {
  return buildHistoricalRose(cardsByKey, k);
}
