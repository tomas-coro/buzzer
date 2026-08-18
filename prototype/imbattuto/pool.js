import { canPlay } from "../../game/roster.js";
import { buildHistoricalRose } from "../../game/opponents.js";
import { costruisciRosa, SLOTS } from "../../game/rosa.js";

// L'identità di una carta: giocatore + stagione. LeBron 2013 e LeBron 2018 sono
// due carte diverse; lo stesso LeBron 2013 pescato due volte è la stessa carta,
// e in rosa non ci può stare due volte (deciso al grill del 2026-08-18).
export const chiaveCarta = (c) => `${c.player_id}|${c.season}`;

// Quante carte servono perché una squadra-stagione possa essere pescata: dieci,
// cioè una rosa intera. Il dataset di oggi (2014-15 → 2019-20, 180 chiavi) ne
// perde 5: le squadre-stagione che non arrivano a dieci carte.
const MIN_CARTE = 10;

// Dalla rosa (mappa ruolo → {titolare, riserva}) alle due liste parallele che
// la schermata disegna: le carte in ordine di casella (quintetto PG→C, poi
// panchina PG→C) e, allo stesso indice, la casella da cui vengono.
// Le carte restano carte pulite: la casella sta a parte, così quando l'utente
// piazza un candidato non si porta dietro il ruolo che aveva nella SUA squadra.
function vistaRosa(rosa) {
  return {
    cards: SLOTS.map(({ ruolo, tipo }) => rosa[ruolo][tipo]),
    slots: SLOTS.map(({ ruolo, tipo }) => ({ ruolo, tipo })),
  };
}

// Una rosa "serve" se almeno una delle sue dieci carte può coprire uno slot ancora libero.
function rosaFits(cards, freeRoles) {
  return cards.some((c) => freeRoles.some((r) => canPlay(c, r)));
}

// Pesca una team-stagione e ne mostra la ROSA INTERA da dieci (G6, 2026-08-18):
// prima era la top-5, ma la squadra da costruire è da dieci e vedere solo i
// cinque migliori tagliava fuori proprio le riserve che devi pescare.
// La rosa la costruisce `costruisciRosa`, lo stesso motore che monta le rose
// avversarie: quello che vedi allo spin è una squadra vera, non una classifica.
// Piazzamento libero: non filtro per un ruolo singolo, mostro tutti e dieci.
// filtro { sameTeam, sameSeason, excludeKey } serve agli aiuti squadra/stagione;
// filtro.escludi è l'insieme delle carte GIÀ IN ROSA (chiaveCarta): spariscono
// dalle rose pescate, così lo stesso giocatore-stagione non finisce due volte in
// squadra. Con la rosa da 10 capitava spesso: dieci pick sullo stesso pool.
// La chiave del dataset è "TEAM|SEASON".
export function spinRoster(cardsByKey, freeRoles, filtro = {}, rng = Math.random) {
  const { sameTeam = null, sameSeason = null, excludeKey = null, escludi = null } = filtro;
  const fuori = escludi instanceof Set ? escludi : new Set(escludi ?? []);

  // La rosa da dieci di ogni squadra, calcolata una volta sola: serve sia per
  // scegliere le chiavi valide sia per la lista che poi si mostra.
  const rose = new Map();
  for (const k of Object.keys(cardsByKey)) {
    const disp = fuori.size === 0
      ? cardsByKey[k]
      : cardsByKey[k].filter((c) => !fuori.has(chiaveCarta(c)));
    if (disp.length < MIN_CARTE) continue;
    const vista = vistaRosa(costruisciRosa(disp));
    if (rosaFits(vista.cards, freeRoles)) rose.set(k, vista);
  }
  const validKeys = [...rose.keys()];

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
  const { cards, slots } = rose.get(key);
  return { key, cards, slots, fallback };
}

// Gli avversari: una rosa da 10 per squadra-stagione, non più una top-5. Le
// squadre con meno di dieci carte restano fuori dal pool (vedi opponents.js).
export function opponentPool(cardsByKey, k) {
  return buildHistoricalRose(cardsByKey, k);
}
