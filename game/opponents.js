import { votoRosa, DEFAULT_K } from "./rating.js";
import { costruisciRosa, listaRosa, cartaIn, TITOLARE } from "./rosa.js";
import { ROLES } from "./roster.js";

// Gli avversari: una rosa da 10 per ogni squadra-stagione del dataset.
//
// PERCHÉ 10 E NON PIÙ LA TOP-5. Da quando la tua squadra ha una panchina e i
// reparti pesano i minuti, un avversario di cinque uomini avrebbe i reparti
// calcolati in un altro modo: sembrerebbe più forte di quello che è, perché la
// sua media non pagherebbe nessuna riserva. La partita mentirebbe su chi hai di
// fronte.

// Sotto le dieci carte la rosa non si costruisce: 175 delle 180 squadre-stagione
// del dataset ce le hanno, le altre cinque restano fuori dal pool. Meglio cinque
// avversari in meno che cinque avversari con la panchina inventata.
export const MIN_CARTE_ROSA = 10;

/**
 * Da { "TEAM|SEASON": Card[] } → lista di avversari pronti.
 *
 * Ogni voce porta:
 *   rosa    le dieci caselle (5 titolari per ruolo + 5 posti di panchina)
 *   lista   le dieci carte nell'ordine degli slot: il box score legge da qui
 *   quintet i cinque titolari, per le schermate che mostrano solo chi parte
 *   voto    ovr + reparti PESATI PER MINUTI, cioè quello che scende in campo
 */
export function buildHistoricalRose(cardsByTeamSeason, _k = DEFAULT_K) {
  const out = [];
  for (const [key, cards] of Object.entries(cardsByTeamSeason)) {
    if (!Array.isArray(cards) || cards.length < MIN_CARTE_ROSA) continue;
    const rosa = costruisciRosa(cards);
    const [team, season] = key.split("|");
    out.push({
      team, season, rosa,
      lista: listaRosa(rosa),
      quintet: ROLES.map((r) => cartaIn(rosa, { tipo: TITOLARE, ruolo: r })),
      voto: votoRosa(rosa),
    });
  }
  return out;
}

// Soglia OVR del round: cresce linearmente da oppMin (round 1) a oppMax (round N).
function roundThreshold(round, d) {
  const span = Math.max(d.N - 1, 1);
  return d.oppMin + (d.oppMax - d.oppMin) * ((round - 1) / span);
}

// La chiave di un avversario è squadra + stagione: i Lakers 1986-87 e i Lakers
// 2019-20 sono due avversari diversi, e vanno contati come tali.
export const chiaveAvversario = (o) => `${o.team}|${o.season}`;

// Quante squadre entrano nell'urna del round. Otto perché con meno la banda
// stretta di Incubo (quattordici squadre in tutto) tornava a proporre sempre
// gli stessi sei nomi, e con molte di più il round non somiglierebbe più alla
// sua soglia: la difficoltà della corsa la decide la soglia, non il caso.
export const CANDIDATI = 8;

/**
 * L'avversario del round: uno a caso fra gli otto col voto più vicino alla
 * soglia.
 *
 * PERCHÉ NON PIÙ IL PIÙ VICINO E BASTA. Prendendo sempre il più vicino, i
 * sedici avversari di un livello erano gli stessi in ogni corsa, per sempre; e
 * in Incubo, dove la banda contiene poche squadre, la stessa squadra tornava
 * anche tre volte nella stessa corsa. La pescata nell'urna tiene la difficoltà
 * (le otto valgono quanto la soglia) e restituisce il tabellone diverso.
 *
 * @param {Array} pool avversari da buildHistoricalRose
 * @param {number} round 1..N
 * @param {object} d la difficoltà (oppMin, oppMax, N)
 * @param {() => number} rng generatore in [0,1). Di default deterministico: chi
 *        vuole una corsa riproducibile passa un rng col seme della corsa.
 * @param {Set<string>} esclusi chiavi già affrontate in questa corsa: non si
 *        rigioca due volte contro la stessa squadra-stagione.
 */
export function pickOpponent(pool, round, d, rng = () => 0, esclusi = new Set()) {
  if (!pool.length) throw new Error("pickOpponent: pool avversari vuoto");
  const target = roundThreshold(round, d);
  // Se le esclusioni svuotano il pool si torna a pescare da tutti: meglio un
  // avversario ripetuto che una corsa che si pianta al dodicesimo round.
  const liberi = pool.filter((o) => !esclusi.has(chiaveAvversario(o)));
  const urna = (liberi.length ? liberi : pool)
    .slice()
    // Il pareggio si rompe sulla chiave e non a caso: a parità di distanza
    // l'ordine dell'urna deve essere sempre lo stesso, o la stessa corsa
    // rigiocata con lo stesso seme darebbe avversari diversi.
    .sort((a, b) =>
      Math.abs(a.voto.ovr - target) - Math.abs(b.voto.ovr - target)
      || chiaveAvversario(a).localeCompare(chiaveAvversario(b)))
    .slice(0, CANDIDATI);
  return urna[Math.min(urna.length - 1, Math.floor(rng() * urna.length))];
}
