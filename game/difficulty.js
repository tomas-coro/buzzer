// Configurazione dei 4 livelli. Numeri = default tarabili nel banco.
// N è SEMPRE 16: il target è vincere i playoff (16-0) in ogni difficoltà. La difficoltà
// non cambia le vittorie richieste, solo la quantità di aiuti, la banda degli avversari e
// il reveal delle carte (gestito nella UI del draft). Vedi memoria target-16-0-sempre.
// oppMin/oppMax sono il voto dell'avversario al primo e al sedicesimo round (la
// soglia sale linearmente in mezzo, vedi opponents.js). Sono sulla scala NATIVA
// del voto, cioè percentili.
//
// LA SCALA SI È SPOSTATA DUE VOLTE, ED È IL MOTIVO PER CUI QUESTI NUMERI VANNO
// RIMISURATI E MAI RITOCCATI A OCCHIO.
//   1. Col voto sui reparti, le vecchie soglie 70-99 (scala 2K) finivano sopra
//      il massimo del pool: ogni round pescava la stessa squadra.
//   2. Con le rose da DIECI pesate per minuti, ogni squadra storica vale meno di
//      quanto valeva la sua top-5: il pool è passato da 40-74 a 38-67, mediana
//      51, e le soglie tarate sul pool vecchio erano di nuovo fuori scala.
//
// I valori sotto escono da `node tools/taratura-soglie.mjs`, che cerca le soglie
// misurando quante corse finiscono 16-0. Bersagli concordati e misurati
// (800 corse per livello, ×10 dove il bersaglio è raro):
//
//   livello     soglie    16-0 misurato   bersaglio   vittorie medie
//   facile       41-67        39.8%          40%           12.2
//   normale      42-67        12.9%          12%            9.2
//   difficile    54-67         3.2%           3%            5.0
//   incubo       61-67         1.0%         0.5%            2.5
//
// INCUBO NON ARRIVA ALLO 0,5% E NON È UN ERRORE DI TARATURA: è il pavimento del
// pool. Col tetto già sulla squadra più forte di sempre, alzare ancora oppMin
// non sposta più niente (misurato: 63-67 → 1,05%, 65-67 → 1,15%, 67-67 → 1,07%).
// L'una corsa su cento che passa è quella con un draft eccezionale, e quella
// coda le soglie non la tagliano.
//
// Il salto vero tra un livello e l'altro non viene da qui ma dagli AIUTI, che
// cambiano quanto forte è la squadra che riesci a draftare: voto medio 79 in
// Facile, 67 in Incubo.
export const DIFFICULTIES = {
  facile:    { aids: { squadra: 3, stagione: 3, respin: 2 }, freeSwitch: true,  N: 16, oppMin: 41, oppMax: 67 },
  normale:   { aids: { squadra: 2, stagione: 2, respin: 1 }, freeSwitch: false, N: 16, oppMin: 42, oppMax: 67 },
  difficile: { aids: { squadra: 1, stagione: 1, respin: 0 }, freeSwitch: false, N: 16, oppMin: 54, oppMax: 67 },
  incubo:    { aids: { squadra: 0, stagione: 0, respin: 0 }, freeSwitch: false, N: 16, oppMin: 61, oppMax: 67 },
};
