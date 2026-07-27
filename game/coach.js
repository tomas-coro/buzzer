// Curva voti coach A..F → moltiplicatore. Default tarabili.
export const GRADE_MULT = { A: 1.06, B: 1.03, C: 1.0, D: 0.97, E: 0.94, F: 0.91 };

function mult(grade) {
  const m = GRADE_MULT[grade];
  if (m === undefined) throw new Error(`Voto coach non valido: ${grade}`);
  return m;
}

// Applica l'effetto del coach a un voto squadra (un solo numero, motore A).
// I due voti coach (off/def) si fondono nella media dei loro moltiplicatori:
// un coach A/A resta migliore di un C/C. champ_bonus si somma dopo.
export function applyCoach(rating, coach) {
  const m = (mult(coach.off_grade) + mult(coach.def_grade)) / 2;
  const bonus = coach.champ_bonus ?? 0;
  const ovr = rating.ovr * m + bonus;
  return { ovr: Math.round(ovr) };
}
