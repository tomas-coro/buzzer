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
//   4. QUESTA TABELLA È STORIA, NON LO STATO DI OGGI. Da G10 le soglie non si
//      tarano più da sole: si tarano INSIEME al tetto di spesa, perché le due
//      leve tirano la stessa corda. I numeri veri stanno più in basso, nel
//      blocco del tetto, e il cercatore giusto è tools/taratura-congiunta.mjs -
//      taratura-soglie.mjs tiene il tetto fermo e quindi oggi mente.
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
// pool. RISOLTO IN G10 COL TETTO DI SPESA (vedi sotto): oggi Incubo sta allo
// 0,46% misurato su 5000 corse. Il paragrafo resta perché spiega perché le
// soglie da sole non ci arrivavano: col tetto degli avversari già sulla squadra
// più forte di sempre, alzare ancora oppMin non spostava più niente (misurato
// prima di G7: 63-67 → 1,05%, 65-67 → 1,15%, 67-67 → 1,07%; dopo G7 il pavimento
// si era alzato al 3,1%).
//
// PER QUESTO DIFFICILE E INCUBO AVEVANO LA STESSA BANDA (63-69). Era uno stato
// di passaggio ed è finito: la leva diversa è arrivata e non è il pool più
// debole ipotizzato qui, è il tetto di spesa. Oggi i due livelli si distinguono
// su entrambe le leve (260M/46-67 contro 240M/53-69).
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
// la banda avversari (53-69 contro 46-67), per il tetto di spesa più stretto e
// perché il draft è al buio, senza voti né box score. Prima aveva zero aiuti, ed era l'unica differenza che non si
// vedeva mai - a quel punto non giocavi diversamente, avevi solo meno strumenti.
//
// TETTO DI FACILE ABBASSATO A 58. Tolti gli infiniti, Facile era crollato al 17%
// di 16-0 e stava addosso a Normale. `oppMin` non poteva salvarlo (il pool parte
// da 38: perfino 30-67 si ferma al 24%), quindi si muove il tetto, cioè quanto
// forte è l'avversario del round 16. È la stessa correzione che eraball ha dovuto
// fare sulla sua finale ("Finals opponent difficulty reduced").
// IL TETTO DI SPESA, cioè la seconda leva della difficoltà (2026-08-18, G8-G10).
// Non rende l'avversario più forte, rende TE più povero: è nato per Incubo, dove
// le soglie avversarie erano esaurite contro il pavimento del pool, ed è poi
// diventato una leva di tutti e quattro i livelli. La curva dei salari sta in
// game/salary.js.
//
// LA SCALA STORICA ERA SBAGLIATA, E LA MISURA L'HA SMENTITA. I primi quattro
// numeri (170/150/125/100) venivano dai monte ingaggi delle 175 rose vere del
// dataset, che costano da 48,7 a 246,1 milioni. Sembravano plausibili e invece
// portavano il 16-0 allo ZERO PER CENTO in tutti e quattro i livelli: la squadra
// che si drafta non è una rosa vera, è il fiore di venti rose diverse, e costa
// in media 300 milioni. Il monte ingaggi storico dice se un numero è plausibile,
// non se è giusto: l'unico giudice resta la percentuale di 16-0.
//
// LA SECONDA SCALA (400/380/350/260) ERA SOLO DECORAZIONE, E ANCHE QUESTA L'HA
// DETTA LA MISURA. Tolto il tetto del tutto, il 16-0 si muoveva dello 0,0% a
// Facile, dello 0,3% a Normale, dello 0,5% a Difficile: sopra i 320 milioni il
// tetto non tocca un draft che ne spende 300. Era un meccanismo del solo Incubo
// travestito da regola del gioco, e la barra del budget non si sarebbe mai
// riempita nei primi tre livelli.
//
// I NUMERI DI OGGI ESCONO DA `node tools/taratura-congiunta.mjs`, che tara le due
// leve INSIEME perché tirano la stessa corda. La separazione non è "prima una poi
// l'altra", è per ruolo:
//
//   il TETTO decide COME si sente la difficoltà - quanto spesso, draftando
//   d'istinto, finisci a pagare la tassa dell'apron. È una cosa che il giocatore
//   VEDE mentre gioca, quindi si sceglie a tavolino e si misura per conferma.
//   le SOGLIE decidono QUANTE corse finiscono 16-0. È un numero che il giocatore
//   non vede mai, quindi non si sceglie: si insegue col banco.
//
// IL MORSO VOLUTO è la decisione di Tomas del 2026-08-18: "a Facile va bene
// potersi fare lo squadrone, ma già a Normale non dev'essere così scontato".
// Tradotto: quante corse su cento finiscono sopra il tetto, cioè a pagare.
//
//   livello    tetto   soglie   16-0 misurato   bersaglio   sforano   corse
//   facile      320M    41-61       30.5%          30%        33%       800
//   normale     280M    43-63       14.6%          15%        57%      2000
//   difficile   260M    46-67        3.2%         3.25%       71%      3000
//   incubo      240M    53-69        0.5%          0.5%       86%      5000
//
// INCUBO NON È PIÙ INCAGLIATO. Stava al 3,1% da due sessioni e non per una
// taratura sbagliata: col tetto degli avversari già sulla squadra più forte di
// sempre, alzare `oppMin` non spostava più niente. Il tetto di spesa scioglie il
// nodo dall'altra parte del tavolo, e il livello arriva allo 0,46% misurato su
// 5000 corse.
//
// DIFFICILE E INCUBO SONO FINALMENTE DUE LIVELLI DIVERSI. Prima avevano soglie
// identiche (63-69) e si distinguevano solo per il draft al buio - uno stato di
// passaggio, scritto qui come tale. Adesso differiscono su entrambe le leve:
// 260M contro 240M, 46-67 contro 53-69.
//
// LA BANDA È LARGA UNA VENTINA DI PUNTI A OGNI LIVELLO, e non è un dettaglio:
// 63-69 erano sei punti, cioè sedici partite quasi identiche contro il meglio
// del pool. Una banda stretta non è più difficile, è più PIATTA - sparisce la
// sensazione di scalare i playoff. Le vittorie medie dicono la scala meglio
// della percentuale: 9,5 a Normale, 6,9 a Difficile, 3,5 a Incubo.
//
// PERCHÉ NORMALE È SALITO DA 12% A 15%. Non è un ammorbidimento: la difficoltà
// che prima stava tutta negli avversari adesso è divisa in due, e la metà nuova
// - il tetto - si paga durante il draft, dove si vede. Il 16-0 sale, ma sfori il
// tetto in sei corse su dieci contro le tre di Facile.
export const TETTI = {
  facile: 320_000_000,
  normale: 280_000_000,
  difficile: 260_000_000,
  incubo: 240_000_000,
};

export const DIFFICULTIES = {
  facile:    { aids: { squadra: 2, stagione: 2, respin: 1 }, N: 16, oppMin: 41, oppMax: 61 },
  normale:   { aids: { squadra: 1, stagione: 1, respin: 1 }, N: 16, oppMin: 43, oppMax: 63 },
  difficile: { aids: { squadra: 1, stagione: 1, respin: 0 }, N: 16, oppMin: 46, oppMax: 67 },
  incubo:    { aids: { squadra: 1, stagione: 1, respin: 0 }, N: 16, oppMin: 53, oppMax: 69 },
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
