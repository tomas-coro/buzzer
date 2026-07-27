// Voto squadra = media degli overall 2K reali delle carte (motore A).
// Niente più attributi derivati: il numero che vedi sulla carta è quello che conta.
// Il coach applica un moltiplicatore sul voto (vedi coach.js). Le soglie avversario
// vivono in difficulty.js. DEFAULT_K resta come punto d'aggancio per future manopole.
export const DEFAULT_K = {};

// Validazione carta: overall presente e finito. Niente NaN silenzioso.
function checkCard(c) {
  if (typeof c.ovr !== "number" || !Number.isFinite(c.ovr)) {
    throw new Error("Carta senza overall 'ovr' valido");
  }
}

export function teamRating(cards, _k = DEFAULT_K) {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("teamRating: servono almeno una carta");
  }
  cards.forEach(checkCard);
  const ovr = cards.reduce((s, c) => s + c.ovr, 0) / cards.length;
  return { ovr: Math.round(ovr) };
}
