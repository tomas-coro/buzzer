// Configurazione dei 4 livelli. Numeri = default tarabili nel banco.
// N è SEMPRE 16: il target è vincere i playoff (16-0) in ogni difficoltà. La difficoltà
// non cambia le vittorie richieste, solo la quantità di aiuti, la banda degli avversari e
// il reveal delle carte (gestito nella UI del draft). Vedi memoria target-16-0-sempre.
// oppMin/oppMax sono il voto dell'avversario al primo e al sedicesimo round (la
// soglia sale linearmente in mezzo, vedi opponents.js). Sono sulla scala NATIVA
// del voto, cioè percentili: i 180 quintetti storici stanno tra 40 e 74, con la
// mediana a 56. Le vecchie soglie 70-99 erano sulla scala 2K e, dopo il passaggio
// del voto ai reparti, cadevano tutte sopra il massimo del pool: ogni round
// pescava lo stesso quintetto, il più forte di sempre.
//
// I valori sotto NON sono a occhio: escono da `node tools/banco-corse.mjs`, che
// simula corse intere e misura quante finiscono 16-0. Bersagli concordati e
// misurati (800-1000 corse per livello):
//
//   livello     soglie    16-0 misurato   bersaglio   vittorie medie
//   facile       44-66        40.5%          40%           12.2
//   normale      45-72        10.3%          12%            9.3
//   difficile    45-74         2.9%           3%            7.1
//   incubo       54-74         0.5%         0.5%            4.4
//
// Notare due cose. Primo: in Facile il tetto è 66, quindi le squadre leggendarie
// (70+) non si incontrano proprio - è quello che significa "facile". Secondo:
// buona parte del salto tra un livello e l'altro non viene da qui ma dagli AIUTI,
// che cambiano quanto forte è la squadra che riesci a draftare (voto medio: 81 in
// Facile, 68 in Incubo).
export const DIFFICULTIES = {
  facile:    { aids: { squadra: 3, stagione: 3, respin: 2 }, freeSwitch: true,  N: 16, oppMin: 44, oppMax: 66 },
  normale:   { aids: { squadra: 2, stagione: 2, respin: 1 }, freeSwitch: false, N: 16, oppMin: 45, oppMax: 72 },
  difficile: { aids: { squadra: 1, stagione: 1, respin: 0 }, freeSwitch: false, N: 16, oppMin: 45, oppMax: 74 },
  incubo:    { aids: { squadra: 0, stagione: 0, respin: 0 }, freeSwitch: false, N: 16, oppMin: 54, oppMax: 74 },
};
