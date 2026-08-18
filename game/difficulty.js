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
//   facile      2/2/1     41-62       33.3%          33%           11.6
//   normale     1/1/1     46-69       12.6%          12%            8.8
//   difficile   1/1/0     63-69        3.2%           3%            3.5
//   incubo      1/1/0     63-69        3.1%         0.5%            3.4
//
//   3. RITARATE IL 2026-08-18 DOPO G7 (panchina libera). Due cose si sono mosse
//      insieme: con la panchina libera ogni pick è utile, quindi la squadra che
//      draftí è più forte a ogni livello; e le rose storiche, che adesso mettono
//      in panchina i cinque migliori rimasti invece del secondo di ogni ruolo,
//      sono più forti anche loro. Il tetto del pool è salito da 67 a 69.
//      Il bersaglio di FACILE è sceso da 40% a 33%: deciso da Tomas guardando la
//      misura, non calato dall'alto.
//
// INCUBO NON ARRIVA ALLO 0,5% E NON È UN ERRORE DI TARATURA: è il pavimento del
// pool. Col tetto già sulla squadra più forte di sempre, alzare ancora oppMin
// non sposta più niente (misurato prima di G7: 63-67 → 1,05%, 65-67 → 1,15%,
// 67-67 → 1,07%; dopo G7 il pavimento si è alzato al 3,1%).
//
// PER QUESTO OGGI DIFFICILE E INCUBO HANNO LA STESSA BANDA (63-69), ed è uno
// stato di passaggio, non un assetto finito: Tomas vuole Incubo attorno allo
// 0,5%, e lì le soglie non ci arrivano. Serve una leva diversa (candidata: in
// Incubo lo spin pesca da un pool di squadre più deboli). Finché non c'è, i due
// livelli si distinguono solo per il draft al buio.
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
// IL TETTO DI SPESA, cioè la leva che mancava a Incubo (2026-08-18, G8). Le
// soglie avversarie sono esaurite - vedi sopra: Incubo si ferma al 3,1% e il
// pavimento è il pool, non la taratura. Il tetto lavora dall'ALTRA parte del
// tavolo: non rende l'avversario più forte, rende TE più povero. La curva dei
// salari sta in game/salary.js.
//
// LA SCALA STORICA ERA SBAGLIATA, E LA MISURA L'HA SMENTITA. I primi quattro
// numeri (170/150/125/100) venivano dai monte ingaggi delle 175 rose vere del
// dataset, che costano da 48,7 a 246,1 milioni. Sembravano plausibili e invece
// portavano il 16-0 allo ZERO PER CENTO in tutti e quattro i livelli: la squadra
// che si drafta non è una rosa vera, è il fiore di venti rose diverse, e costa
// in media 300 milioni. Il monte ingaggi storico dice se un numero è plausibile,
// non se è giusto: l'unico giudice resta la percentuale di 16-0.
//
// MISURATI IL 2026-08-18 con `node tools/taratura-tetti.mjs`, poi confermati a
// 1000 corse per punto:
//
//   livello     tetto   16-0 misurato   bersaglio   quante corse sforano
//   facile      400M        34.6%          33%              0%
//   normale     380M        12.7%          12%              1%
//   difficile   350M         3.0%           3%              5%
//   incubo      260M         0.5%         0.5%             79%
//
// IL TETTO SERVE SOLO A INCUBO, ed è esattamente il buco che doveva tappare. Là
// morde su quattro corse su cinque e porta il livello dal 3,1% allo 0,5%, cosa
// che le soglie avversarie non sapevano più fare (vedi sopra: il pool ha un
// pavimento). Negli altri tre livelli i bersagli erano già centrati dalle
// soglie, quindi un tetto che morde li spingerebbe SOTTO bersaglio: sopra i 380
// la curva è piatta e il tetto è, di fatto, solo una regola che impari.
//
// FACILE PAGA 1,6 PUNTI DI SCARTO (34,6% contro 33%) e va bene così: per
// centrare il 33 esatto servirebbe un tetto da 340, cioè più stretto di quello
// di Normale, e una scala che si allarga mentre la difficoltà sale è una scala
// che nessuno capisce. La monotonia vale più di un punto e mezzo.
export const TETTI = {
  facile: 400_000_000,
  normale: 380_000_000,
  difficile: 350_000_000,
  incubo: 260_000_000,
};

export const DIFFICULTIES = {
  facile:    { aids: { squadra: 2, stagione: 2, respin: 1 }, N: 16, oppMin: 41, oppMax: 62 },
  normale:   { aids: { squadra: 1, stagione: 1, respin: 1 }, N: 16, oppMin: 46, oppMax: 69 },
  difficile: { aids: { squadra: 1, stagione: 1, respin: 0 }, N: 16, oppMin: 63, oppMax: 69 },
  incubo:    { aids: { squadra: 1, stagione: 1, respin: 0 }, N: 16, oppMin: 63, oppMax: 69 },
};

// ---------------------------------------------------------------------------
// LA SCALA DEL REVEAL: quanta informazione porta la carta, livello per livello.
// ---------------------------------------------------------------------------
//
// PRIMA ERA TUTTO O NIENTE. Fino a oggi l'informazione si toglieva una volta
// sola, in Incubo (`alBuio`): nei primi tre livelli vedevi ogni cosa, nel quarto
// niente. Un gradino solo, e alto. Deciso con Tomas il 2026-08-18: si scende.
//
// OGNI GRADINO TOGLIE UNO STRATO, E NOME E PREZZO RESTANO SEMPRE.
//   facile e normale  tutto. Fra i due cambiano gli aiuti e il tetto, non
//                     l'informazione: scelta di Tomas, il salto di Normale deve
//                     sentirsi nel portafogli, non negli occhi.
//   difficile         via il voto e via l'annata. Leggi "Curry, 30.1 punti" e
//                     l'anno lo deduci dalle stat e dai nove compagni dello spin,
//                     che è poi il modo in cui lo saprebbe un tifoso vero.
//   incubo            resta il nome e il cartellino. Il prezzo non è il voto
//                     travestito: il rumore sul contratto lo sporca (salary.js).
//
// IL BANCO NON PUÒ MISURARE QUESTA SCALA, e va detto perché è una trappola: il
// giocatore simulato legge il voto dai dati, quindi nascondergli il voto non
// cambia una riga del suo draft. Il reveal pesa solo su un umano. Si tara
// giocando; il tetto e le soglie, quelli, si tarano al banco.
export const REVEAL = {
  facile:    { voto: true,  stat: true,  annata: true,  squadra: true,  ruolo: true },
  normale:   { voto: true,  stat: true,  annata: true,  squadra: true,  ruolo: true },
  difficile: { voto: false, stat: true,  annata: false, squadra: true,  ruolo: true },
  incubo:    { voto: false, stat: false, annata: false, squadra: false, ruolo: false },
};

/** Questo livello fa vedere questo campo della carta? */
export function mostra(difficolta, campo) {
  const r = REVEAL[difficolta];
  if (!r) throw new Error(`Difficoltà inesistente: ${difficolta}`);
  if (!(campo in r)) throw new Error(`Campo inesistente nel reveal: ${campo}`);
  return r[campo];
}
