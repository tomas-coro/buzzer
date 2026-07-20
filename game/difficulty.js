// Configurazione dei 4 livelli. Numeri = default tarabili nel banco.
export const DIFFICULTIES = {
  facile:    { aids: { squadra: 3, stagione: 3, respin: 2 }, freeSwitch: true,  N: 4,  oppMin: 70, oppMax: 82 },
  normale:   { aids: { squadra: 2, stagione: 2, respin: 1 }, freeSwitch: false, N: 6,  oppMin: 76, oppMax: 88 },
  difficile: { aids: { squadra: 1, stagione: 1, respin: 0 }, freeSwitch: false, N: 8,  oppMin: 82, oppMax: 93 },
  incubo:    { aids: { squadra: 0, stagione: 0, respin: 0 }, freeSwitch: false, N: 10, oppMin: 88, oppMax: 99 },
};
