// Effetto del coach sulla squadra.
//
// Stato: PONTE verso la tappa D. I voti A-F esistono ancora (i 12 coach attuali
// li hanno), ma non moltiplicano più un voto unico: agiscono sui REPARTI, che è
// l'unica cosa che la partita sappia leggere. Il voto d'attacco muove tiro,
// finalizzazione e regia; quello di difesa muove difesa e rimbalzi.
//
// Perché il ponte e non subito i plus/malus: se il coach continuasse a
// moltiplicare un numero solo, il suo effetto sparirebbe nel nulla appena
// run.js chiama la simulazione, che i voti sintetici non li guarda. Meglio un
// coach che sposta poco ma sposta davvero.
//
// Nella tappa D questi due voti diventano "2 plus e 1 malus su reparti scelti"
// più la manopola ritmo, e GRADE_MULT sparisce.

import { votoDaReparti } from "./rating.js";

// Curva voti coach A..F → moltiplicatore. Default tarabili.
export const GRADE_MULT = { A: 1.06, B: 1.03, C: 1.0, D: 0.97, E: 0.94, F: 0.91 };

// Quali reparti muove ciascun voto.
export const LATO_OFF = ["t3", "fin", "reg"];
export const LATO_DIF = ["dif", "reb"];

function mult(grade) {
  const m = GRADE_MULT[grade];
  if (m === undefined) throw new Error(`Voto coach non valido: ${grade}`);
  return m;
}

// I reparti sono percentili: sopra 99 non si va, sotto 0 nemmeno.
function clamp(v) {
  return Math.min(99, Math.max(0, v));
}

/**
 * Applica il coach a un voto squadra.
 *
 * @param {{ovr: number, reparti: object}} rating da teamRating
 * @param {{off_grade: string, def_grade: string, champ_bonus?: number, ritmo?: number}} coach
 * @returns {{ovr: number, reparti: object, ritmo: number}}
 */
export function applyCoach(rating, coach) {
  if (!rating?.reparti) throw new Error("applyCoach: il rating non porta i reparti");
  const mOff = mult(coach.off_grade);
  const mDif = mult(coach.def_grade);
  // Gli anelli valgono qualche punto su tutti i reparti, non un bonus appiccicato
  // al solo voto: se stesse solo sul voto, la partita non lo vedrebbe mai.
  const bonus = coach.champ_bonus ?? 0;

  const reparti = { ...rating.reparti };
  for (const r of LATO_OFF) reparti[r] = clamp(reparti[r] * mOff + bonus);
  for (const r of LATO_DIF) reparti[r] = clamp(reparti[r] * mDif + bonus);

  // Ritmo: manopola del coach, da -1 (rallenta) a +1 (corre). I 12 coach attuali
  // non ce l'hanno ancora, quindi partono neutri.
  const ritmo = coach.ritmo ?? 0;
  if (typeof ritmo !== "number" || ritmo < -1 || ritmo > 1) {
    throw new Error(`applyCoach: ritmo '${coach.ritmo}' fuori dall'intervallo -1..+1`);
  }

  return { ovr: votoDaReparti(reparti), reparti, ritmo };
}
