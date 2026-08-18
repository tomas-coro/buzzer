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
// (600 corse per livello, rimisurati il 2026-08-18 con la scala aiuti nuova):
//
//   livello     aiuti    soglie   16-0 misurato   bersaglio   vittorie medie
//   facile      2/2/1     41-58       34.7%          40%           11.1
//   normale     1/1/1     42-67       10.3%          12%            8.8
//   difficile   1/1/0     54-67        3.5%           3%            5.2
//   incubo      1/1/0     61-67        1.2%         0.5%            2.8
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
//
// NIENTE AIUTI ILLIMITATI, NEMMENO IN FACILE (deciso il 2026-08-18, G6). Fino a
// oggi Facile aveva `freeSwitch: true`, che scavalcava i numeri qui sotto e
// rendeva "↺ squadra" e "↺ stagione" infiniti. Infinito vuol dire nessuna
// scelta: si ripesca finché non esce la carta che serve, e il draft smette di
// essere un draft.
//
// LA SCALA È STRETTA DI PROPOSITO. Riferimenti guardati quel giorno: eraball.com
// dà UN solo re-spin per tutto il draft ("Re-spin (1 left)"), e chi non lo spende
// se lo porta al draft del coach; 7a0 non gradua gli aiuti per niente, la sua
// difficoltà sta nel costruire alla cieca. Con 5 aiuti su 10 pick, Facile resta
// più generoso di entrambi.
//
// INCUBO HA GLI STESSI AIUTI DI DIFFICILE, e non è una svista: si distingue per
// la banda avversari (61-67 contro 54-67) e perché il draft è al buio, senza voti
// né box score. Prima aveva zero aiuti, ed era l'unica differenza che non si
// vedeva mai - a quel punto non giocavi diversamente, avevi solo meno strumenti.
//
// TETTO DI FACILE ABBASSATO A 58. Tolti gli infiniti, Facile era crollato al 17%
// di 16-0 e stava addosso a Normale. `oppMin` non poteva salvarlo (il pool parte
// da 38: perfino 30-67 si ferma al 24%), quindi si muove il tetto, cioè quanto
// forte è l'avversario del round 16. È la stessa correzione che eraball ha dovuto
// fare sulla sua finale ("Finals opponent difficulty reduced").
export const DIFFICULTIES = {
  facile:    { aids: { squadra: 2, stagione: 2, respin: 1 }, N: 16, oppMin: 41, oppMax: 58 },
  normale:   { aids: { squadra: 1, stagione: 1, respin: 1 }, N: 16, oppMin: 42, oppMax: 67 },
  difficile: { aids: { squadra: 1, stagione: 1, respin: 0 }, N: 16, oppMin: 54, oppMax: 67 },
  incubo:    { aids: { squadra: 1, stagione: 1, respin: 0 }, N: 16, oppMin: 61, oppMax: 67 },
};
