// Modello voto squadra (asimmetrico), portato da data/team_refit.py.
// I pesi sono fissi; le costanti K sono manopole tarabili nel banco.
export const WOFF = [1.4, 1.1, 1.2, 0.7, 0.8, 0.9, 0.9];
export const WDEF = [1.3, 1.3, 1.1, 1.1, 0.7];

export const DEFAULT_K = { A: 0.6, AO: 13, BO: 0.6, DB: 75, SD: 6, mediaDefW: 52, ovrMix: 0.5 };

function wmean(values, weights) {
  let num = 0, den = 0;
  for (let i = 0; i < weights.length; i++) {
    num += values[i] * weights[i];
    den += weights[i];
  }
  return num / den;
}

export function offW(att) {
  return wmean(att, WOFF);
}

export function defW(def) {
  return wmean(def, WDEF);
}

// Validazione carta: attributi presenti e della lunghezza attesa.
// Niente fallback silenzioso: una carta monca → errore chiaro, mai NaN nascosto.
function checkCard(c) {
  if (!Array.isArray(c.att) || c.att.length !== WOFF.length) {
    throw new Error(`Carta senza attributi 'att' validi (attesi ${WOFF.length})`);
  }
  if (!Array.isArray(c.def) || c.def.length !== WDEF.length) {
    throw new Error(`Carta senza attributi 'def' validi (attesi ${WDEF.length})`);
  }
}

// Voto di un singolo giocatore (interno).
function playerAtt(c, k) {
  return c.ovr + k.A * (offW(c.att) - (k.AO + k.BO * c.ovr));
}
function playerDef(c, k) {
  return k.DB + k.SD * (defW(c.def) - k.mediaDefW);
}

export function teamRating(cards, k = DEFAULT_K) {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("teamRating: servono almeno una carta");
  }
  cards.forEach(checkCard);
  const n = cards.length;
  const att = cards.reduce((s, c) => s + playerAtt(c, k), 0) / n;
  const dif = cards.reduce((s, c) => s + playerDef(c, k), 0) / n;
  const ovr = k.ovrMix * att + (1 - k.ovrMix) * dif;
  return { att: Math.round(att), dif: Math.round(dif), ovr: Math.round(ovr) };
}
