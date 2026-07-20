// Fallback SOLO per il prototipo: deriva attributi/posizione plausibili dai box
// stats quando la carta non ha un match reale in nba-sim. Marcata estimated:true altrove.

function clamp(x) {
  return Math.max(25, Math.min(99, Math.round(x)));
}

// Normalizza uno stat su una scala 0..1 rispetto a un tetto plausibile per-partita.
function norm(v, cap) {
  return Math.max(0, Math.min(1, v / cap));
}

// Attributo = ancora sull'OVR + spinta/penalità dallo stat rilevante.
export function deriveAttributes(card) {
  const o = card.ovr;
  const s = card.stats_real;
  const anchor = o - 6; // base leggermente sotto l'OVR, poi gli stat spingono
  const att = [
    anchor + 45 * (norm(s.tp_pct, 45) - 0.5),        // Tiro 3
    anchor + 30 * (norm(s.fg_pct, 55) - 0.45),       // Tiro medio
    anchor + 24 * (norm(s.pts, 28) - 0.4) + 8 * (norm(s.fg_pct, 60) - 0.5), // Finalizzazione
    anchor + 40 * (norm(s.ft_pct, 92) - 0.55),       // Tiro libero
    anchor + 28 * (norm(s.ast, 9) - 0.35),           // Palleggio
    anchor + 34 * (norm(s.ast, 9) - 0.3) - 20 * (norm(s.tov, 4) - 0.4), // Playmaking
    anchor + 18 * (norm(s.pts, 28) - 0.4),           // Senza palla
  ].map(clamp);
  const def = [
    anchor + 30 * (norm(s.stl, 2.2) - 0.4),          // Dif. perimetro
    anchor + 30 * (norm(s.blk, 2.2) - 0.35),         // Dif. interna
    anchor + 34 * (norm(s.stl, 2.2) - 0.4),          // Palle rubate
    anchor + 40 * (norm(s.blk, 2.5) - 0.3),          // Stoppate
    anchor + 40 * (norm(s.reb, 13) - 0.35),          // Rimbalzi
  ].map(clamp);
  return { att, def };
}

// Euristica di ruolo dai box stats per-partita.
export function inferPosition(stats) {
  const ast = stats.ast ?? 0;
  const reb = stats.reb ?? 0;
  const blk = stats.blk ?? 0;
  let primary;
  if (reb >= 9 || blk >= 1.3) primary = "C";
  else if (reb >= 6.5) primary = "PF";
  else if (ast >= 5) primary = "PG";
  else if (ast >= 3) primary = "SG";
  else primary = "SF";
  return { primary, secondary: null };
}
