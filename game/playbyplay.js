// Il punto a punto: la partita azione per azione, con i nomi e l'orologio.
//
// PERCHÉ ESISTE
// `partita.js` dice 111-107. `boxscore.js` dice che Doncic ne ha fatti 34. Nessuno
// dei due dice COME. Qui nascono le righe che si leggono guardando la partita:
// "9:34 Jokic sbaglia da tre · 9:31 rimbalzo difensivo di Davis · 9:20 Davis segna
// su assist di James, 22-20".
//
// LA REGOLA CHE COMANDA TUTTO: IL BOX SCORE È IL PADRONE
// Questo modulo non inventa nemmeno un punto. Prende le righe che `boxscore.js` ha
// già prodotto (Curry: 9 punti, 2 rimbalzi, 3 assist nel primo quarto) e le
// SROTOLA in azioni. La somma delle azioni di un giocatore in un quarto è
// esattamente la sua riga di quel quarto, sempre. Motivo: il punteggio di
// `partita.js` è tarato e le soglie 16-0 di ogni difficoltà escono da lì. Un
// punto a punto che generasse i punti rimetterebbe in gioco tutta la taratura.
//
// LE CINQUE REGOLE DEL MODELLO
//
// 1. OGNI AZIONE HA UNA CAUSA. L'assist sta sul canestro, il rimbalzo segue un
//    errore, la stoppata cade su un tiro tentato, il fallo precede i liberi.
//    Senza questo il log è una lista di statistiche a caso, non una partita.
//
// 2. OGNI TIRO SBAGLIATO PRODUCE UN RIMBALZO. È il vincolo che chiude i conti:
//    i rimbalzi del quarto li ha già decisi il box score, quindi sono LORO a
//    dire quanti errori si tirano. Da lì escono i tentativi, e quindi le
//    percentuali di tiro che il box score da solo non poteva avere.
//
// 3. IL MIX DI TIRO VIENE DAI DATI VERI. `stats_vol` ha i tentativi da tre, da
//    due e i liberi di quella stagione: Curry fa i suoi 9 punti con tre triple,
//    Gobert con quattro canestri e un libero. È una TENDENZA, non un destino:
//    la pesca è casuale, quindi Curry può chiudere una partita senza triple, e
//    un centro che nella realtà ne ha tirate due in tutta la stagione ne segna
//    una una volta ogni tanto - come è giusto che sia.
//
// 4. LE RISERVE ENTRANO IN BLOCCO, NEL TRATTO CENTRALE DEL QUARTO. Ogni quarto
//    si divide in tre segmenti: titolari, panchina, titolari. Serve perché le
//    azioni devono cadere quando il loro protagonista è davvero in campo, e
//    perché così i minuti di `minutiRosa` tornano esatti senza aggiustamenti.
//
// 5. IL LOG HA DUE LIVELLI. Una partita produce ~350 azioni: illeggibili nei
//    venti secondi di un quarto a velocità Normale. `notevole` marca le ~45 che
//    raccontano la partita (canestri che cambiano la testa, parziali, triple,
//    schiacciate, stoppate, cambi, finali in equilibrio); il resto resta lì per
//    chi vuole scorrere il tabellino dopo.
//
// Il modulo è puro e deterministico: stesso rng, stesse azioni.

import { ripartisci, STAT_BOX } from "./boxscore.js";

// ---------------------------------------------------------------------------
// Manopole del banco. Tutti i numeri tarabili stanno qui.
// ---------------------------------------------------------------------------

// Durata dei periodi, in secondi. Un supplementare è 5 minuti.
export const SEC_QUARTO = 12 * 60;
export const SEC_SUPPL = 5 * 60;

// Quanti falli commette una squadra in una partita a ritmo neutro. NBA: ~19,5.
// Serve un totale perché i falli NON sono nel box score: nascono qui.
export const FALLI_SQUADRA = 19.5;

// Quanto il reparto difesa alza i falli: chi pressa tanto ne fa di più.
export const K_DIF_FALLI = 0.25;

// Quota dei rimbalzi che sono offensivi. Serve a decidere se un rimbalzo lo
// prende chi ha sbagliato (secondo tiro) o chi difendeva. NBA: ~23%.
export const QUOTA_REB_OFF = 0.23;

// Mix di tiro di ripiego, per le poche carte senza `stats_vol` (stagioni
// stimate). Sono le quote di PUNTI, non di tentativi: NBA moderna ~30% da tre,
// ~55% da due, ~15% dalla lunetta. Dichiarato, non nascosto: la carta che lo usa
// esce con `stimato: true`.
export const MIX_RIPIEGO = { q3: 0.30, q2: 0.55, qtl: 0.15 };
export const PCT_RIPIEGO = { pct3: 0.355, pct2: 0.525, pctTl: 0.775 };

// Quanto oscilla la voglia di tirare da tre in una singola serata. Con 0.35, un
// tiratore da 60% dei punti dall'arco può scendere al 40% o salire all'80%:
// serate storte e serate di grazia, senza che un centro diventi Curry.
export const SIGMA_MIX = 0.35;

// Percentuale minima e massima di realizzazione ammessa quando si ricavano i
// tentativi dai canestri. Serve a non produrre righe assurde (12/12 o 1/19)
// quando il box score dà pochi punti e tanti rimbalzi.
export const PCT_MIN = 0.22;
export const PCT_MAX = 0.72;

// Un parziale da qui in su è "notevole" anche se non cambia la testa.
export const PARZIALE_NOTEVOLE = 8;

// Ultimi secondi di un periodo in cui, se la partita è in equilibrio, tutto
// diventa notevole.
export const SEC_FINALE = 120;
export const SCARTO_FINALE = 5;

// ---------------------------------------------------------------------------
// Utilità
// ---------------------------------------------------------------------------

function gauss(rng) {
  let u = rng();
  if (u <= 0) u = Number.EPSILON;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

// Pesca un indice con probabilità proporzionale ai pesi. Pesi tutti a zero =
// pesca uniforme: non è un fallback silenzioso, è l'unica risposta sensata
// quando nessuna opzione è preferita.
function pesca(pesi, rng) {
  const somma = pesi.reduce((a, b) => a + b, 0);
  if (somma <= 0) return Math.floor(rng() * pesi.length) % pesi.length;
  let x = rng() * somma;
  for (let i = 0; i < pesi.length; i++) {
    x -= pesi[i];
    if (x < 0) return i;
  }
  return pesi.length - 1;
}

function morsa(x, min, max) {
  return Math.min(max, Math.max(min, x));
}

// ---------------------------------------------------------------------------
// Profilo di tiro: da dove nascono i punti di un giocatore
// ---------------------------------------------------------------------------

/**
 * Come questo giocatore fa i suoi punti, dai volumi veri della sua stagione.
 *
 * `q3/q2/qtl` sono quote di PUNTI (quanta parte del suo bottino arriva da lì),
 * `pct3/pct2/pctTl` le percentuali di realizzazione. Le quote decidono cosa
 * tira, le percentuali quanti tentativi gli servono per arrivarci.
 */
export function profiloTiro(carta) {
  const v = carta.stats_vol;
  if (v && (v.fg3a > 0 || v.fg2a > 0 || v.fta > 0)) {
    const p3 = 3 * (v.fg3 ?? 0);
    const p2 = 2 * (v.fg2 ?? 0);
    const ptl = v.ft ?? 0;
    const tot = p3 + p2 + ptl;
    if (tot > 0) {
      return {
        q3: p3 / tot, q2: p2 / tot, qtl: ptl / tot,
        pct3: v.fg3a > 0 ? morsa(v.fg3 / v.fg3a, PCT_MIN, PCT_MAX) : PCT_RIPIEGO.pct3,
        pct2: v.fg2a > 0 ? morsa(v.fg2 / v.fg2a, PCT_MIN, PCT_MAX) : PCT_RIPIEGO.pct2,
        pctTl: v.fta > 0 ? morsa(v.ft / v.fta, 0.45, 0.95) : PCT_RIPIEGO.pctTl,
        stimato: false,
      };
    }
  }
  // Nessun volume: le percentuali vere ci sono comunque in `stats_real`, il mix
  // no. Si usa quello di lega, e la carta lo dichiara.
  const s = carta.stats_real ?? {};
  const pct = (v, def) => (typeof v === "number" && v > 0 ? morsa(v / 100, PCT_MIN, PCT_MAX) : def);
  return {
    ...MIX_RIPIEGO,
    pct3: pct(s.tp_pct, PCT_RIPIEGO.pct3),
    pct2: pct(s.fg_pct, PCT_RIPIEGO.pct2),
    pctTl: typeof s.ft_pct === "number" && s.ft_pct > 0
      ? morsa(s.ft_pct / 100, 0.45, 0.95) : PCT_RIPIEGO.pctTl,
    stimato: true,
  };
}

// Il profilo della serata: le quote vere spostate dal rumore. È qui che Curry
// chiude una partita senza triple e un lungo ne infila una.
function mixSerata(profilo, rng) {
  const scossa = (q) => Math.max(0, q * (1 + SIGMA_MIX * gauss(rng)));
  const q3 = scossa(profilo.q3);
  const q2 = scossa(profilo.q2);
  const qtl = scossa(profilo.qtl);
  const s = q3 + q2 + qtl;
  if (s <= 0) return { ...MIX_RIPIEGO };
  return { q3: q3 / s, q2: q2 / s, qtl: qtl / s };
}

// ---------------------------------------------------------------------------
// Decomposizione dei punti in canestri
// ---------------------------------------------------------------------------

/**
 * Da "9 punti" a "una tripla, due canestri da due, due liberi".
 *
 * Si costruisce un canestro alla volta pescando il tipo con le quote della
 * serata, e togliendo dal residuo. Così la somma torna SEMPRE esatta senza
 * aggiustamenti finali, e un giocatore che non tira da tre non ne segna mai.
 * I liberi escono in coppia quando c'è spazio: un viaggio in lunetta è due tiri,
 * non due falli diversi.
 *
 * @returns {{t3: number, t2: number, tl: number, viaggi: number}} `viaggi` sono
 *          le andate in lunetta, cioè i falli subiti che contano.
 */
export function decomponi(punti, mix, rng) {
  const out = { t3: 0, t2: 0, tl: 0, viaggi: 0 };
  if (punti <= 0) return out;
  let resto = punti;
  // Una guardia contro il ciclo infinito: ogni giro toglie almeno un punto,
  // quindi `punti` iterazioni bastano sempre. Se non bastassero è un difetto,
  // non un caso limite: meglio un errore che una schermata bloccata.
  let giri = 0;
  while (resto > 0) {
    if (++giri > punti + 4) throw new Error("decomponi: la scomposizione non converge");
    // Il peso è la quota di PUNTI diviso i punti che quella scelta porta. Senza
    // il divisore i liberi vincono sempre - valgono poco, quindi servono tante
    // scelte per coprire il bottino - e la partita finisce con 78/105 dalla
    // lunetta. Un viaggio in lunetta vale 2, come un canestro da due.
    const opzioni = [];
    if (resto >= 3) opzioni.push({ tipo: "t3", peso: mix.q3 / 3, valore: 3 });
    if (resto >= 2) opzioni.push({ tipo: "t2", peso: mix.q2 / 2, valore: 2 });
    opzioni.push({ tipo: "tl", peso: mix.qtl / 2, valore: 1 });
    // Resto di un punto solo: invece di appiccicare un libero orfano - che è
    // quello che gonfiava la lunetta a 84 tentativi a partita - si allunga un
    // canestro da due in una tripla. Un punto è un punto, e il tabellino resta
    // quello di una partita vera.
    if (resto === 1 && out.t2 > 0) {
      out.t2 -= 1;
      out.t3 += 1;
      resto = 0;
      break;
    }
    const scelta = opzioni[pesca(opzioni.map((o) => o.peso), rng)];
    if (scelta.tipo === "tl") {
      // Due liberi se ci stanno, altrimenti uno solo: è il 1/2 o il libero
      // aggiuntivo dopo un canestro subito fallo.
      const n = resto >= 2 ? 2 : 1;
      out.tl += n;
      out.viaggi += 1;
      resto -= n;
    } else {
      out[scelta.tipo] += 1;
      resto -= scelta.valore;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Rotazione: chi è in campo, e quando
// ---------------------------------------------------------------------------

/**
 * I tre segmenti di un periodo: titolari, panchina, titolari.
 *
 * La panchina entra in blocco nel tratto centrale. Non è la rotazione di una
 * squadra NBA vera (dove i cambi sono sfalsati), è la scelta che tiene i conti
 * puliti: ogni segmento ha cinque uomini in campo, i minuti tornano esatti, e
 * ogni giocatore tocca tutti i periodi - quindi le righe del box score, che
 * sono per periodo, hanno sempre qualcuno in campo a cui appartenere.
 *
 * @param {number} durata secondi del periodo.
 * @param {number} quotaRiserve frazione del periodo giocata dalle riserve
 *        (16 minuti su 48 = 1/3).
 */
export function segmentiPeriodo(durata, quotaRiserve) {
  const q = morsa(quotaRiserve, 0, 1);
  const centrale = Math.round(durata * q);
  const lato = (durata - centrale) / 2;
  return [
    { panchina: false, durata: Math.round(lato) },
    { panchina: true, durata: centrale },
    { panchina: false, durata: durata - centrale - Math.round(lato) },
  ].filter((s) => s.durata > 0);
}

// ---------------------------------------------------------------------------
// Frasi: il verbo lo sceglie chi tira
// ---------------------------------------------------------------------------

// Che tipo di giocatore è, per il racconto. Non è una statistica del motore, è
// solo la voce del cronista: un centro non "penetra dal palleggio".
export function profiloRacconto(carta) {
  const r = carta.reparti ?? {};
  const lungo = carta.ruolo === "C" || carta.ruolo === "PF";
  if (lungo && (r.reb ?? 50) >= 60) return "lungo";
  if ((r.t3 ?? 50) >= 65) return "tiratore";
  if ((r.reg ?? 50) >= 65) return "regista";
  if ((r.fin ?? 50) >= 65) return "finalizzatore";
  return lungo ? "lungo" : "generico";
}

const FRASI = {
  t3: {
    tiratore: ["tripla dal palleggio", "bomba dall'arco", "tripla in transizione", "tripla dall'angolo"],
    regista: ["tripla in uscita dal blocco", "tripla dall'arco", "tripla sul cambio difensivo"],
    lungo: ["tripla dall'arco", "tripla dal gomito"],
    finalizzatore: ["tripla in ritmo", "tripla dall'ala", "tripla dall'arco"],
    generico: ["tripla dall'arco", "tripla dall'ala", "tripla frontale"],
  },
  t2: {
    lungo: ["schiacciata", "appoggio al ferro", "gancio dal post basso", "tap-in"],
    tiratore: ["sospensione dalla media", "penetrazione e appoggio", "tiro in arresto"],
    regista: ["penetrazione e appoggio", "floater in area", "arresto e tiro"],
    finalizzatore: ["schiacciata in contropiede", "penetrazione e canestro", "arresto e tiro"],
    generico: ["canestro dalla media", "penetrazione e appoggio", "sospensione"],
  },
};

// Le schiacciate meritano il livello essenziale, i floater no: serve saperlo
// senza rifare l'analisi del testo.
const SPETTACOLO = /schiacciat|tap-in/i;

function frasiTiro(tipo, profilo) {
  return FRASI[tipo][profilo] ?? FRASI[tipo].generico;
}

// Solo il cognome: "Tripla di Curry" si legge, "Tripla di Stephen Curry" in una
// riga di log stretta va a capo.
export function cognome(nome) {
  const parti = String(nome).trim().split(/\s+/);
  if (parti.length <= 1) return parti[0] ?? "";
  const ultimo = parti[parti.length - 1];
  // I suffissi non sono cognomi: "Jaren Jackson Jr." è Jackson, non Jr.
  if (/^(jr\.?|sr\.?|ii+|iv|v)$/i.test(ultimo) && parti.length >= 3) {
    return `${parti[parti.length - 2]} ${ultimo}`;
  }
  return ultimo;
}

// ---------------------------------------------------------------------------
// Generazione delle azioni di un segmento, per una squadra
// ---------------------------------------------------------------------------

// Le statistiche di un giocatore in un segmento: la sua riga di periodo tagliata
// in proporzione ai minuti che gioca dentro quel segmento.
function fetta(valore, pesi, indice) {
  return ripartisci(valore, pesi)[indice];
}

/**
 * I canestri di UN giocatore in tutta la partita, dal suo bottino totale.
 *
 * @returns {Array} i canestri, mescolati: ognuno sa il suo valore e - per i
 *          liberi - quanti ne ha tentati. Li sparpaglia sui periodi
 *          `sparpaglia`, che spiega perché il conto si fa qui e non lì.
 */
function canestriPartita(punti, mix, profilo, rng) {
  const d = decomponi(punti, mix, rng);
  const out = [];
  for (let k = 0; k < d.t3; k++) out.push({ tipo: "t3", punti: 3, fgm: 1, tpm: 1 });
  for (let k = 0; k < d.t2; k++) out.push({ tipo: "t2", punti: 2, fgm: 1, tpm: 0 });
  if (d.viaggi > 0) {
    // I liberi si raggruppano in viaggi: tre liberi in due viaggi sono un 2/2 e
    // un 1/2, non tre righe da un tiro. `d.tl >= d.viaggi` sempre (ogni viaggio
    // vale almeno un punto), quindi nessun viaggio esce a zero canestri.
    const perViaggio = ripartisci(d.tl, Array.from({ length: d.viaggi }, () => 1));
    for (const fatti of perViaggio) {
      // Un viaggio da un tiro solo è il canestro subìto fallo: raro. Negli altri
      // sono due tiri, e chi ne ha fatto uno ha sbagliato l'altro.
      const tentati = fatti >= 2 ? fatti : rng() < profilo.pctTl * 0.35 ? 1 : 2;
      out.push({ tipo: "tl", punti: fatti, fatti, tentati, ftm: fatti, fta: tentati });
    }
    // I liberi SBAGLIATI. Senza questo passaggio ogni viaggio sarebbe un 2/2 e
    // la squadra chiuderebbe 41/42 dalla lunetta: un tabellino che non esiste.
    // I tentativi veri escono dalla sua percentuale; gli errori si appoggiano ai
    // viaggi che ci sono (un 2/2 diventa 2/3) e, se non bastano, nascono viaggi
    // a vuoto - il classico 0/2 che fa infuriare la panchina.
    const viaggi = out.filter((c) => c.tipo === "tl");
    const target = Math.round(d.tl / profilo.pctTl);
    let mancanti = target - viaggi.reduce((a, c) => a + c.tentati, 0);
    // Prima i viaggi da un canestro solo, che diventano il classico 1/2. Un 2/3
    // esiste (fallo su tiro da tre) ma è raro, e riempirne il tabellino si
    // vedeva a occhio nel log.
    for (const c of viaggi) {
      if (mancanti <= 0) break;
      if (c.tentati !== 1) continue;
      c.tentati = 2;
      c.fta = 2;
      mancanti -= 1;
    }
    // Poi i viaggi a vuoto: il classico 0/2 che fa infuriare la panchina.
    while (mancanti >= 2) {
      out.push({ tipo: "tl", punti: 0, fatti: 0, tentati: 2, ftm: 0, fta: 2 });
      mancanti -= 2;
    }
    // Resta un errore spaiato: quello sì diventa un 2/3.
    if (mancanti === 1) {
      const c = viaggi.find((x) => x.fatti >= 2);
      if (c) { c.tentati += 1; c.fta += 1; }
    }
  }
  mescola(out, rng);
  return out;
}

/**
 * Sparpaglia i canestri di una squadra sui periodi, rispettando al punto il
 * punteggio che il motore ha già deciso per ognuno.
 *
 * PERCHÉ NON SI SCOMPONE PERIODO PER PERIODO. Una riserva fa tre punti in tutta
 * la partita: divisi per quattro periodi diventano tre residui da un punto, e un
 * punto si può fare solo dalla lunetta. Al banco quelle briciole producevano 57
 * tiri liberi di squadra contro i 23 della NBA. Scomponendo il bottino INTERO
 * del giocatore, quei tre punti diventano un canestro da due più un libero, e i
 * periodi si dividono canestri già formati.
 *
 * @param {Array<Array>} liste i canestri di ogni giocatore, per tutta la partita.
 * @param {Array<number>} puntiPeriodo il punteggio di squadra periodo per periodo.
 * @returns {Array<Array<Array>>} `[periodo][giocatore]` i suoi canestri lì.
 */
export function sparpaglia(liste, puntiPeriodo, rng) {
  const coda = [];
  liste.forEach((l, i) => l.forEach((c) => coda.push({ ...c, i })));
  mescola(coda, rng);

  const out = puntiPeriodo.map(() => liste.map(() => []));
  for (let q = 0; q < puntiPeriodo.length; q++) {
    let resto = puntiPeriodo[q];
    // Ogni giro o piazza un canestro o ne spezza uno, quindi il numero di giri
    // non può superare i canestri in coda più gli spezzoni che ne nascono.
    let giri = 0;
    const tetto = coda.length * 2 + 8;
    while (resto > 0) {
      if (coda.length === 0 || ++giri > tetto) {
        throw new Error(
          `sparpaglia: nel periodo ${q + 1} restano ${resto} punti senza canestri`);
      }
      // I viaggi a vuoto non valgono punti: restano fuori da qui e si spargono
      // alla fine, o riempirebbero tutti il primo periodo.
      let k = coda.findIndex((c) => c.punti > 0 && c.punti <= resto);
      if (k < 0) {
        // Nel periodo ci stanno uno o due punti e in coda sono rimasti solo
        // canestri più grossi: si spezza il più piccolo, e l'avanzo torna in
        // coda come tiro libero - l'unica cosa che può valere un punto solo.
        // Il più piccolo FRA QUELLI CHE VALGONO PUNTI: spezzare un viaggio a
        // vuoto produrrebbe un pezzo da punti negativi.
        k = -1;
        for (let j = 0; j < coda.length; j++) {
          if (coda[j].punti > 0 && (k < 0 || coda[j].punti < coda[k].punti)) k = j;
        }
        if (k < 0) break;
        coda.push(...spezza(coda[k], resto));
        coda.splice(k, 1);
        continue;
      }
      const c = coda.splice(k, 1)[0];
      out[q][c.i].push(c);
      resto -= c.punti;
    }
  }
  // I viaggi a vuoto (0/2 dalla lunetta) non consumano punti, quindi il ciclo
  // sopra può lasciarli in coda: si spargono sui periodi in proporzione al
  // punteggio, dove si è giocato di più.
  if (coda.some((c) => c.punti > 0)) {
    throw new Error(`sparpaglia: ${coda.length} canestri non piazzati in nessun periodo`);
  }
  const quanti = ripartisci(coda.length, puntiPeriodo.map((p) => Math.max(p, 1)));
  let k = 0;
  for (let q = 0; q < puntiPeriodo.length; q++) {
    for (let n = 0; n < quanti[q]; n++, k++) out[q][coda[k].i].push(coda[k]);
  }
  return out;
}

// Da un canestro troppo grosso a due pezzi che sommano uguale: il primo vale
// `spazio`, il secondo l'avanzo. Entrambi diventano viaggi in lunetta, perché
// un canestro da campo non può valere un punto e spezzarlo in due canestri
// falserebbe le percentuali di tiro molto più di un fallo in più.
function spezza(c, spazio) {
  const pezzo = (punti) => ({
    i: c.i, tipo: "tl", punti, fatti: punti, tentati: punti, ftm: punti, fta: punti,
  });
  return [pezzo(spazio), pezzo(c.punti - spazio)];
}

/**
 * Costruisce le azioni grezze (senza tempo e senza testo) di una squadra in un
 * segmento. Ogni azione porta già il suo protagonista e la sua causa.
 *
 * `canestriPer[i]` sono i canestri già scomposti che toccano a questo segmento.
 */
function azioniSquadra({ inCampo, stat, canestriPer, mixPer, profili, errori, rng }) {
  const n = inCampo.length;
  const tiri = inCampo.map(() => ({ fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 }));

  // 1. I canestri arrivano già scomposti: qui si contano e si etichettano.
  const canestri = [];
  for (let i = 0; i < n; i++) {
    for (const c of canestriPer[i]) {
      tiri[i].fgm += c.fgm ?? 0;
      tiri[i].tpm += c.tpm ?? 0;
      tiri[i].ftm += c.ftm ?? 0;
      tiri[i].fta += c.fta ?? 0;
      canestri.push({ ...c, i });
    }
  }

  // 2. Gli assist si appoggiano ai canestri da campo, mai ai liberi e mai a se
  //    stessi. Se ce ne sono più dei canestri disponibili, quelli che avanzano
  //    non si inventano una riga: restano nel box score e basta.
  const daCampo = canestri.filter((c) => c.tipo !== "tl");
  const conAssist = new Set();
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < stat[i].ast; k++) {
      const liberi = daCampo.filter((c) => c.i !== i && !conAssist.has(c));
      if (liberi.length === 0) break;
      const scelto = liberi[Math.floor(rng() * liberi.length) % liberi.length];
      scelto.assist = i;
      conAssist.add(scelto);
    }
  }

  // 3. Gli errori: quanti ne tira ognuno lo dice il conto dei rimbalzi (regola
  //    2 in testa al file), la ripartizione fra i cinque la fanno le loro
  //    percentuali vere - chi tira male sbaglia di più.
  //
  //    Gli errori da fuori NON si contano sul mix teorico ma sui canestri che
  //    il giocatore ha DAVVERO segnato qui: se ha infilato tre triple, gliene
  //    servono altrettanti errori da tre per chiudere alla sua percentuale
  //    vera. Al banco il conto teorico dava un 46,5% da tre di lega - le triple
  //    segnate c'erano, i tentativi sbagliati no.
  const erroriAttesi = inCampo.map((_, i) => {
    const p = profili[i];
    const t3 = tiri[i].tpm * (1 - p.pct3) / p.pct3;
    const t2 = (tiri[i].fgm - tiri[i].tpm) * (1 - p.pct2) / p.pct2;
    return { t3, t2 };
  });
  const attesi = erroriAttesi.map(({ t3, t2 }) =>
    // Chi non ha segnato niente in questo segmento ha comunque tirato: il
    // pavimento gli lascia una possibilità di comparire fra gli errori.
    Math.max(t3 + t2, 0.35));
  const perGiocatore = ripartisci(errori, attesi);
  const sbagliati = [];
  for (let i = 0; i < n; i++) {
    const { t3, t2 } = erroriAttesi[i];
    // Senza canestri da cui dedurre nulla si ripiega sul mix della serata.
    const quotaTre = t3 + t2 > 0 ? t3 / (t3 + t2) : mixPer[i].q3;
    for (let k = 0; k < perGiocatore[i]; k++) {
      const daTre = rng() < quotaTre;
      if (daTre) { tiri[i].tpa += 1; tiri[i].fga += 1; }
      else { tiri[i].fga += 1; }
      sbagliati.push({ i, tipo: daTre ? "t3" : "t2" });
    }
  }
  for (let i = 0; i < n; i++) {
    tiri[i].fga += tiri[i].fgm;
    tiri[i].tpa += tiri[i].tpm;
  }

  // 4. Le palle perse chiudono un possesso senza tiro.
  const perse = [];
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < stat[i].tov; k++) perse.push({ i });
  }

  return { canestri, sbagliati, perse, tiri };
}

// ---------------------------------------------------------------------------
// Orchestratore
// ---------------------------------------------------------------------------

/**
 * Il punto a punto di una partita intera.
 *
 * @param {object} o
 * @param {object} o.partita l'oggetto che torna `simulaPartita`.
 * @param {object} o.box l'oggetto che torna `boxScorePartita`.
 * @param {{giocatori: Array, nome: string, reparti: object}} o.casa
 * @param {{giocatori: Array, nome: string, reparti: object}} o.ospite
 *        `giocatori` sono le dieci righe di `minutiRosa`, nello stesso ordine
 *        con cui il box score le ha prodotte: primi cinque titolari.
 * @param {() => number} o.rng
 * @returns {{azioni: Array, tiri: {casa: Array, ospite: Array},
 *            falli: {casa: Array, ospite: Array}}}
 */
export function playByPlay({ partita, box, casa, ospite, rng }) {
  check({ partita, box, casa, ospite, rng });

  const lati = ["casa", "ospite"];
  const squadre = { casa, ospite };
  const nPeriodi = partita.quarti.length;

  const tiri = {
    casa: casa.giocatori.map(() => ({ fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 })),
    ospite: ospite.giocatori.map(() => ({ fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 })),
  };
  const falli = {
    casa: casa.giocatori.map(() => 0),
    ospite: ospite.giocatori.map(() => 0),
  };

  // Il mix della serata si pesca UNA volta per partita, non per quarto: un
  // giocatore ha una serata, non quattro serate diverse.
  const profili = {};
  const mixPartita = {};
  for (const lato of lati) {
    profili[lato] = squadre[lato].giocatori.map(profiloTiro);
    mixPartita[lato] = profili[lato].map((p) => mixSerata(p, rng));
  }

  // Quanto della partita giocano le riserve: la quota che decide i segmenti.
  const quota = {};
  for (const lato of lati) {
    const g = squadre[lato].giocatori;
    const tot = g.reduce((a, x) => a + (x.minuti ?? 0), 0);
    const panca = g.slice(5).reduce((a, x) => a + (x.minuti ?? 0), 0);
    // Senza minuti (i test del modulo, una top-5 qualsiasi) non c'è panchina:
    // giocano i primi cinque tutta la partita. Dichiarato, non silenzioso.
    quota[lato] = tot > 0 ? panca / tot : 0;
  }

  // I canestri di tutta la partita, scomposti una volta per giocatore e poi
  // sparpagliati sui periodi. Sta qui e non dentro il ciclo dei periodi perché
  // la scomposizione ha bisogno del bottino intero: vedi `sparpaglia`.
  const perPeriodo = {};
  for (const lato of lati) {
    const liste = box[lato].righe.map((r, i) =>
      canestriPartita(r.tot.pts, mixPartita[lato][i], profili[lato][i], rng));
    perPeriodo[lato] = sparpaglia(liste, partita.quarti.map((x) => x[lato]), rng);
  }

  const azioni = [];
  let cumCasa = 0;
  let cumOspite = 0;

  for (let q = 0; q < nPeriodi; q++) {
    const periodo = partita.quarti[q];
    const durata = periodo.overtime ? SEC_SUPPL : SEC_QUARTO;
    // I due lati devono cambiare negli stessi istanti, o le azioni di una
    // squadra cadrebbero in mezzo a un segmento dell'altra: si usa la quota
    // media, che con le rotazioni previste (12/16/20 minuti) sposta i confini
    // di pochi secondi.
    const segmenti = segmentiPeriodo(durata, (quota.casa + quota.ospite) / 2);

    // Le statistiche del periodo, tagliate per segmento. I titolari giocano il
    // primo e il terzo, la panchina il secondo: ognuno riceve la sua fetta in
    // proporzione a quanto di quel segmento è suo.
    const pesiTitolari = segmenti.map((s) => (s.panchina ? 0 : s.durata));
    const pesiPanchina = segmenti.map((s) => (s.panchina ? s.durata : 0));

    // I canestri di questo periodo, che i segmenti si dividono. Copia, perché
    // l'assegnazione ai segmenti consuma la lista.
    const daPiazzare = {};
    for (const lato of lati) daPiazzare[lato] = perPeriodo[lato][q].map((l) => [...l]);

    let tempo = durata;
    for (let s = 0; s < segmenti.length; s++) {
      const seg = segmenti[s];
      const indici = seg.panchina ? [5, 6, 7, 8, 9] : [0, 1, 2, 3, 4];
      const pesi = seg.panchina ? pesiPanchina : pesiTitolari;
      const posizione = pesi.slice(0, s + 1).filter((p) => p > 0).length - 1;

      // Riga di cambio: una sola per squadra, perché la panchina entra in blocco.
      if (s > 0) {
        for (const lato of lati) {
          const g = squadre[lato].giocatori;
          if (g.length <= 5) continue;
          const dentro = seg.panchina ? g.slice(5) : g.slice(0, 5);
          const riga = grezza({
            q, lato, tipo: "sostituzione", secondi: tempo,
            dentro: dentro.map((x) => cognome(x.nome ?? x.name)),
          });
          // Il cambio porta il punteggio del momento: le azioni normali lo
          // ricevono più sotto, questa nasce fuori da quel ciclo e senza questa
          // riga resterebbe a 0-0 in mezzo al tabellone.
          riga.casa = cumCasa;
          riga.ospite = cumOspite;
          azioni.push(riga);
        }
      }

      // Chi è in campo e con che riga: la fetta del suo periodo che tocca a
      // questo segmento.
      const quote = pesi.filter((p) => p > 0);
      const inCampoPer = {};
      const statPer = {};
      for (const lato of lati) {
        const g = squadre[lato].giocatori;
        inCampoPer[lato] = indici.filter((i) => i < g.length);
        statPer[lato] = inCampoPer[lato].map((i) => {
          const riga = box[lato].righe[i].per[q];
          const out = {};
          for (const st of STAT_BOX) out[st] = fetta(riga[st], quote, posizione);
          return out;
        });
      }

      // I canestri che toccano a questo segmento: la fetta della lista del
      // periodo, in proporzione a quanto di quel periodo il giocatore passa
      // qui. È l'ultimo segmento in cui è in campo? Allora prende tutto quello
      // che resta, così nessun canestro va perso e il punteggio torna.
      const canestriPer = {};
      const ultimoSeg = posizione === quote.length - 1;
      for (const lato of lati) {
        canestriPer[lato] = inCampoPer[lato].map((i) => {
          const lista = daPiazzare[lato][i];
          const quanti = ultimoSeg
            ? lista.length
            : ripartisci(lista.length, quote)[posizione];
          return lista.splice(0, quanti);
        });
      }

      // Quanti errori si tirano in questo segmento: uno per ogni rimbalzo che i
      // dieci in campo hanno davvero preso. È il vincolo che chiude i conti fra
      // box score e punto a punto, e va calcolato QUI e non sul periodo intero,
      // altrimenti il segmento della panchina riceverebbe errori che i suoi
      // rimbalzi non possono raccogliere.
      const rimbalziSeg = lati.reduce(
        (a, lato) => a + statPer[lato].reduce((b, s) => b + s.reb, 0), 0);
      // Si dividono fra le due squadre in proporzione ai punti del segmento: chi
      // segna di più ha giocato più possessi, quindi ha anche tirato di più.
      const puntiSeg = lati.map((lato) => Math.max(
        canestriPer[lato].reduce((b, l) => b + l.reduce((x, c) => x + c.punti, 0), 0), 1));
      const erroriSeg = ripartisci(rimbalziSeg, puntiSeg);

      // Le azioni delle due squadre in questo segmento.
      const materiale = {};
      for (let l = 0; l < lati.length; l++) {
        const lato = lati[l];
        const inCampo = inCampoPer[lato];
        const stat = statPer[lato];
        materiale[lato] = azioniSquadra({
          inCampo,
          stat,
          canestriPer: canestriPer[lato],
          mixPer: inCampo.map((i) => mixPartita[lato][i]),
          profili: inCampo.map((i) => profili[lato][i]),
          errori: erroriSeg[l],
          rng,
        });
        // I tentativi generati qui si sommano alla riga di partita.
        materiale[lato].tiri.forEach((t, k) => {
          const i = inCampo[k];
          for (const campo of ["fgm", "fga", "tpm", "tpa", "ftm", "fta"]) {
            tiri[lato][i][campo] += t[campo];
          }
        });
        materiale[lato].inCampo = inCampo;
        materiale[lato].stat = stat;
      }

      // 5. Intreccio: i possessi si alternano, e ogni possesso porta la sua
      //    coda di conseguenze (rimbalzo, assist, stoppata, recupero).
      const eventi = intreccia({ materiale, squadre, rng });

      // 6. L'orologio: le azioni si spalmano sul segmento. Il rumore serve
      //    perché due possessi non durano mai lo stesso tempo, ma l'ordine non
      //    cambia mai: un rimbalzo non può precedere il tiro che l'ha causato.
      const passi = eventi.length;
      for (let k = 0; k < passi; k++) {
        const frazione = (k + 0.5) / passi;
        const scossa = (rng() - 0.5) * (seg.durata / Math.max(passi, 1)) * 0.6;
        eventi[k].secondi = Math.round(morsa(tempo - frazione * seg.durata - scossa,
          tempo - seg.durata, tempo));
      }
      // Il rumore può invertire due istanti vicini: si riordina, così l'orologio
      // scorre sempre all'indietro.
      for (let k = 1; k < passi; k++) {
        if (eventi[k].secondi > eventi[k - 1].secondi) eventi[k].secondi = eventi[k - 1].secondi;
      }

      for (const e of eventi) {
        e.q = q;
        if (e.punti > 0) {
          if (e.lato === "casa") cumCasa += e.punti; else cumOspite += e.punti;
        }
        e.casa = cumCasa;
        e.ospite = cumOspite;
        azioni.push(e);
      }
      tempo -= seg.durata;
    }

    // Rete di sicurezza: se il punteggio progressivo non arriva a quello del
    // motore, è un difetto di ripartizione, non un caso limite. Meglio un errore
    // leggibile che un tabellone che mente.
    if (cumCasa !== periodo.cumCasa || cumOspite !== periodo.cumOspite) {
      throw new Error(
        `playByPlay: periodo ${q + 1}, punteggio srotolato ${cumCasa}-${cumOspite} ` +
        `invece di ${periodo.cumCasa}-${periodo.cumOspite}`);
    }
  }

  // 7. I falli. Non sono nel box score, quindi nascono qui: il totale è quello
  //    NBA scalato sul ritmo, e non può mai essere minore dei viaggi in lunetta
  //    che l'avversario ha davvero fatto - quei falli li abbiamo già visti.
  for (const lato of lati) {
    const altro = lato === "casa" ? "ospite" : "casa";
    const viaggi = azioni.filter((a) => a.lato === altro && a.tipo === "liberi").length;
    const g = squadre[lato].giocatori;
    const ritmo = partita.possessi[lato] / 99;
    const dif = squadre[lato].reparti?.dif ?? 50;
    const totale = Math.max(
      Math.round(FALLI_SQUADRA * ritmo * (1 + K_DIF_FALLI * (dif - 50) / 100)),
      viaggi);
    // Chi sta in campo di più ne fa di più; chi difende con le mani anche.
    const pesi = g.map((x) => (x.minuti ?? 1) * (1 + K_DIF_FALLI * (((x.reparti?.dif ?? 50) - 50) / 100)));
    const per = ripartisci(totale, pesi);
    for (let i = 0; i < g.length; i++) falli[lato][i] = per[i];
  }
  // I falli che hanno mandato qualcuno in lunetta prendono un nome: la riga
  // "fallo di X su Y" precede i liberi. Gli altri restano solo in colonna, o il
  // log si riempirebbe di venti righe che non raccontano niente.
  nominaFalli(azioni, squadre, falli, rng);

  // 8. Testo e livello. Vanno per ultimi perché servono il punteggio progressivo
  //    e l'azione precedente, che prima non esistevano.
  rifinisci(azioni, squadre, partita);

  return { azioni, tiri, falli };
}

// Azione grezza: la forma comune a tutte, prima di tempo e testo.
function grezza(o) {
  return {
    q: o.q ?? 0, lato: o.lato, tipo: o.tipo, secondi: o.secondi ?? 0,
    chi: o.chi ?? null, chi2: o.chi2 ?? null, punti: o.punti ?? 0,
    // Indice del protagonista nella sua rosa. Serve perché due carte possono
    // avere lo stesso cognome (LeBron 2013 e LeBron 2018 in due slot diversi):
    // cercare per nome pescherebbe il profilo dell'altro.
    chiIdx: o.chiIdx ?? null,
    dentro: o.dentro ?? null, dettaglio: o.dettaglio ?? null,
    casa: 0, ospite: 0, notevole: false, testo: "",
  };
}

// ---------------------------------------------------------------------------
// Intreccio: dal materiale grezzo alla sequenza di possessi
// ---------------------------------------------------------------------------

// Un possesso e le sue conseguenze. L'ordine è quello vero: prima il tiro, poi
// il rimbalzo; prima il fallo, poi i liberi; prima il recupero, poi la perdita.
function intreccia({ materiale, box, indici, squadre, rng }) {
  const lati = ["casa", "ospite"];

  // I possessi di ogni lato: canestri, errori e palle perse mescolati. L'ordine
  // interno è casuale, i totali no.
  const code = {};
  for (const lato of lati) {
    const m = materiale[lato];
    const lista = [
      ...m.canestri.map((c) => ({ genere: "canestro", ...c })),
      ...m.sbagliati.map((c) => ({ genere: "errore", ...c })),
      ...m.perse.map((c) => ({ genere: "persa", ...c })),
    ];
    mescola(lista, rng);
    code[lato] = lista;
  }

  // I rimbalzi e le altre statistiche difensive disponibili in questo segmento,
  // per lato: un serbatoio da cui le conseguenze pescano il nome.
  const serbatoio = {};
  for (const lato of lati) {
    const m = materiale[lato];
    serbatoio[lato] = {
      reb: elenco(m.inCampo, m.stat, "reb"),
      stl: elenco(m.inCampo, m.stat, "stl"),
      blk: elenco(m.inCampo, m.stat, "blk"),
    };
    mescola(serbatoio[lato].reb, rng);
    mescola(serbatoio[lato].stl, rng);
    mescola(serbatoio[lato].blk, rng);
  }

  const eventi = [];
  // Chi comincia lo decide il salto a due; poi si alterna, e chi ha più
  // possessi infila i suoi in mezzo quando l'altro ha finito.
  let turno = rng() < 0.5 ? "casa" : "ospite";
  while (code.casa.length > 0 || code.ospite.length > 0) {
    if (code[turno].length === 0) turno = turno === "casa" ? "ospite" : "casa";
    const lato = turno;
    const altro = lato === "casa" ? "ospite" : "casa";
    const p = code[lato].shift();
    const nome = (i) => cognome(squadre[lato].giocatori[i].nome ?? squadre[lato].giocatori[i].name);
    const nomeAltro = (i) => cognome(squadre[altro].giocatori[i].nome ?? squadre[altro].giocatori[i].name);
    const idx = materiale[lato].inCampo[p.i];

    if (p.genere === "canestro") {
      if (p.tipo === "tl") {
        eventi.push(grezza({
          lato, tipo: "liberi", chi: nome(idx), chiIdx: idx, punti: p.punti,
          dettaglio: { fatti: p.fatti, tentati: p.tentati },
        }));
      } else {
        const ass = p.assist !== undefined ? nome(materiale[lato].inCampo[p.assist]) : null;
        eventi.push(grezza({
          lato, tipo: "canestro", chi: nome(idx), chiIdx: idx, chi2: ass,
          punti: p.punti, dettaglio: p.tipo,
        }));
      }
    } else if (p.genere === "persa") {
      // Una palla persa su due nasce da un recupero avversario, se ne restano.
      const ladro = serbatoio[altro].stl.shift();
      eventi.push(grezza({
        lato, tipo: ladro !== undefined ? "recupero" : "palla-persa",
        chi: nome(idx), chiIdx: idx,
        chi2: ladro !== undefined ? nomeAltro(materiale[altro].inCampo[ladro]) : null,
      }));
    } else {
      // Errore: può essere stoppato, e comunque produce un rimbalzo.
      const stoppatore = p.tipo === "t2" ? serbatoio[altro].blk.shift() : undefined;
      eventi.push(grezza({
        lato, tipo: stoppatore !== undefined ? "stoppata" : "errore",
        chi: nome(idx), chiIdx: idx,
        chi2: stoppatore !== undefined ? nomeAltro(materiale[altro].inCampo[stoppatore]) : null,
        dettaglio: p.tipo,
      }));
      // Il rimbalzo: offensivo o difensivo secondo la quota NBA, ma solo se il
      // serbatoio giusto ha ancora nomi. Il conto totale torna comunque perché
      // gli errori sono esattamente quanti i rimbalzi.
      const offensivo = rng() < QUOTA_REB_OFF && serbatoio[lato].reb.length > 0;
      const chiLato = offensivo ? lato : altro;
      let r = serbatoio[chiLato].reb.shift();
      let latoR = chiLato;
      if (r === undefined) {
        const ripiego = chiLato === lato ? altro : lato;
        r = serbatoio[ripiego].reb.shift();
        latoR = ripiego;
      }
      if (r !== undefined) {
        const g = squadre[latoR].giocatori[materiale[latoR].inCampo[r]];
        eventi.push(grezza({
          lato: latoR, tipo: "rimbalzo", chi: cognome(g.nome ?? g.name),
          chiIdx: materiale[latoR].inCampo[r],
          dettaglio: latoR === lato ? "offensivo" : "difensivo",
        }));
      }
    }
    turno = turno === "casa" ? "ospite" : "casa";
  }

  // I rimbalzi avanzati (più rimbalzi che errori in questo segmento, per via
  // dell'arrotondamento) si attaccano in coda: sono i rimbalzi su tiro libero
  // sbagliato, che il modello non traccia riga per riga.
  for (const lato of lati) {
    for (const r of serbatoio[lato].reb) {
      const i = materiale[lato].inCampo[r];
      const g = squadre[lato].giocatori[i];
      eventi.push(grezza({
        lato, tipo: "rimbalzo", chi: cognome(g.nome ?? g.name), chiIdx: i,
        dettaglio: "difensivo",
      }));
    }
  }
  return eventi;
}

// Da "quanti ne ha fatti ognuno" a una lista di indici, uno per unità.
function elenco(inCampo, stat, chiave) {
  const out = [];
  for (let k = 0; k < inCampo.length; k++) {
    for (let n = 0; n < stat[k][chiave]; n++) out.push(k);
  }
  return out;
}

// Fisher-Yates con l'rng iniettato: mescolare col `sort` e un comparatore
// casuale dà distribuzioni storte e risultati diversi fra motori JS.
function mescola(a, rng) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
}

// ---------------------------------------------------------------------------
// Falli con un nome
// ---------------------------------------------------------------------------

function nominaFalli(azioni, squadre, falli, rng) {
  const residuo = { casa: [...falli.casa], ospite: [...falli.ospite] };
  for (const a of azioni) {
    if (a.tipo !== "liberi") continue;
    const altro = a.lato === "casa" ? "ospite" : "casa";
    const g = squadre[altro].giocatori;
    const i = pesca(residuo[altro], rng);
    if (residuo[altro][i] > 0) {
      residuo[altro][i]--;
      a.chi2 = cognome(g[i].nome ?? g[i].name);
    }
  }
}

// ---------------------------------------------------------------------------
// Testo e livello
// ---------------------------------------------------------------------------

function orologio(secondi) {
  const s = Math.max(0, Math.round(secondi));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function etichettaPeriodo(q, quarti) {
  const p = quarti[q];
  return p.overtime ? `${p.n - 4}° suppl.` : `${p.n}° quarto`;
}

function rifinisci(azioni, squadre, partita) {
  // Il parziale corrente: quanti punti di fila ha segnato una squadra. Serve al
  // livello essenziale, che deve accendersi quando la partita gira.
  let parziale = 0;
  let latoParziale = null;
  let testaPrima = 0;

  for (let k = 0; k < azioni.length; k++) {
    const a = azioni[k];
    a.tempo = orologio(a.secondi);
    a.periodo = etichettaPeriodo(a.q, partita.quarti);
    const g = a.lato === "casa" ? squadre.casa : squadre.ospite;
    const carta = a.chiIdx !== null ? g.giocatori[a.chiIdx] : null;
    const profilo = carta ? profiloRacconto(carta) : "generico";

    if (a.punti > 0) {
      if (latoParziale === a.lato) parziale += a.punti;
      else { latoParziale = a.lato; parziale = a.punti; }
    }
    const testa = Math.sign(a.casa - a.ospite);

    switch (a.tipo) {
      case "canestro": {
        const varianti = frasiTiro(a.dettaglio, profilo);
        // La variante si sceglie in modo stabile dal minuto, non con l'rng: la
        // stessa azione deve leggersi uguale se la schermata si ridisegna.
        const frase = varianti[(a.secondi + k) % varianti.length];
        a.dettaglioTesto = frase;
        a.testo = a.chi2
          ? `${maiuscola(frase)} di ${a.chi}, servito da ${a.chi2}`
          : `${maiuscola(frase)} di ${a.chi}`;
        break;
      }
      case "liberi":
        a.testo = `${a.chi} ${a.dettaglio.fatti}/${a.dettaglio.tentati} dalla lunetta` +
          (a.chi2 ? `, fallo di ${a.chi2}` : "");
        break;
      case "errore":
        a.testo = a.dettaglio === "t3"
          ? `${a.chi} sbaglia da tre`
          : `${a.chi} non trova il canestro`;
        break;
      case "stoppata":
        a.testo = `${a.chi2} stoppa ${a.chi}`;
        break;
      case "rimbalzo":
        a.testo = a.dettaglio === "offensivo"
          ? `Rimbalzo in attacco di ${a.chi}`
          : `Rimbalzo difensivo di ${a.chi}`;
        break;
      case "recupero":
        a.testo = `${a.chi2} ruba palla a ${a.chi}`;
        break;
      case "palla-persa":
        a.testo = `Palla persa di ${a.chi}`;
        break;
      case "sostituzione":
        a.testo = `Cambio: dentro ${a.dentro.join(", ")}`;
        break;
      default:
        throw new Error(`playByPlay: tipo di azione sconosciuto '${a.tipo}'`);
    }

    // Livello essenziale: la regola fissata al grill.
    const scarto = Math.abs(a.casa - a.ospite);
    const finaleCaldo = a.secondi <= SEC_FINALE && scarto <= SCARTO_FINALE;
    a.notevole = Boolean(
      (a.punti > 0 && testa !== testaPrima) ||
      (a.punti > 0 && parziale >= PARZIALE_NOTEVOLE) ||
      (a.tipo === "canestro" && a.dettaglio === "t3") ||
      (a.tipo === "canestro" && SPETTACOLO.test(a.dettaglioTesto ?? "")) ||
      a.tipo === "stoppata" ||
      a.tipo === "sostituzione" ||
      (finaleCaldo && a.punti > 0)
    );
    if (a.punti > 0) testaPrima = testa;
  }
}

function maiuscola(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Il log filtrato al livello chiesto. `essenziale` sono le righe che raccontano
 * la partita, `completo` sono tutte.
 */
export function log(azioni, livello = "essenziale") {
  if (livello === "completo") return azioni;
  if (livello !== "essenziale") throw new Error(`log: livello inesistente '${livello}'`);
  return azioni.filter((a) => a.notevole);
}

// ---------------------------------------------------------------------------
// Validazione: input sbagliato = errore leggibile, mai una partita inventata
// ---------------------------------------------------------------------------

function check({ partita, box, casa, ospite, rng }) {
  if (!partita || !Array.isArray(partita.quarti) || partita.quarti.length === 0) {
    throw new Error("playByPlay: serve la partita di simulaPartita");
  }
  if (!box || !box.casa || !box.ospite) {
    throw new Error("playByPlay: serve il box score di boxScorePartita");
  }
  for (const [lato, sq] of [["casa", casa], ["ospite", ospite]]) {
    if (!sq || !Array.isArray(sq.giocatori) || sq.giocatori.length === 0) {
      throw new Error(`playByPlay: la squadra '${lato}' non ha giocatori`);
    }
    if (box[lato].righe.length !== sq.giocatori.length) {
      throw new Error(
        `playByPlay: la squadra '${lato}' ha ${sq.giocatori.length} giocatori ` +
        `ma ${box[lato].righe.length} righe di box score`);
    }
    // Con una panchina ma senza minuti non si sa quando entra: le riserve
    // resterebbero fuori tutta la partita e i loro punti non troverebbero un
    // momento in cui atterrare. Meglio dirlo qui che sbagliare il punteggio.
    if (sq.giocatori.length > 5 && !sq.giocatori.some((g) => g.minuti > 0)) {
      throw new Error(
        `playByPlay: la squadra '${lato}' ha una panchina ma nessun minuto: ` +
        `passa le righe di minutiRosa, non le carte nude`);
    }
  }
  if (typeof rng !== "function") {
    throw new Error("playByPlay: serve un rng (funzione che torna un numero in [0,1))");
  }
}
