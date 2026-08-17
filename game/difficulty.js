// Configurazione dei 4 livelli. Numeri = default tarabili nel banco.
// N è SEMPRE 16: il target è vincere i playoff (16-0) in ogni difficoltà. La difficoltà
// non cambia le vittorie richieste, solo la quantità di aiuti, la banda degli avversari e
// il reveal delle carte (gestito nella UI del draft). Vedi memoria target-16-0-sempre.
export const DIFFICULTIES = {
  facile:    { aids: { squadra: 3, stagione: 3, respin: 2 }, freeSwitch: true,  N: 16, oppMin: 70, oppMax: 82 },
  normale:   { aids: { squadra: 2, stagione: 2, respin: 1 }, freeSwitch: false, N: 16, oppMin: 76, oppMax: 88 },
  difficile: { aids: { squadra: 1, stagione: 1, respin: 0 }, freeSwitch: false, N: 16, oppMin: 82, oppMax: 93 },
  incubo:    { aids: { squadra: 0, stagione: 0, respin: 0 }, freeSwitch: false, N: 16, oppMin: 88, oppMax: 99 },
};
