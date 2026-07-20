import { DEFAULT_K } from "./rating.js";

// Curva voti coach A..F → moltiplicatore sul lato del campo. Default tarabili.
export const GRADE_MULT = { A: 1.06, B: 1.03, C: 1.0, D: 0.97, E: 0.94, F: 0.91 };

function mult(grade) {
  const m = GRADE_MULT[grade];
  if (m === undefined) throw new Error(`Voto coach non valido: ${grade}`);
  return m;
}

// Applica l'effetto del coach a un voto squadra già calcolato.
export function applyCoach(rating, coach, k = DEFAULT_K) {
  const att = rating.att * mult(coach.off_grade);
  const dif = rating.dif * mult(coach.def_grade);
  const bonus = coach.champ_bonus ?? 0;
  const ovr = k.ovrMix * att + (1 - k.ovrMix) * dif + bonus;
  return { att: Math.round(att), dif: Math.round(dif), ovr: Math.round(ovr) };
}
