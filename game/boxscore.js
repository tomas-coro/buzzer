// Le righe dei singoli giocatori: PT · RIMB · AST · RUB · PP · STP, quarto per
// quarto.
//
// PERCHÉ ESISTE
// `partita.js` produce solo il punteggio di squadra (possessi × efficienza).
// Buono per decidere chi passa il turno, muto su chi ha deciso la partita. Qui
// nascono le righe dei cinque in campo, così a fine partita si vede che Durant
// ne ha fatti 34 e a fine corsa si vedono le sue medie.
//
// IL VINCOLO CHE COMANDA TUTTO
// Il punteggio di `partita.js` è TARATO (media 104, margine medio 11,4, e le
// soglie 16-0 di ogni difficoltà escono da lì). Quindi i punti dei singoli NON
// possono generare il punteggio: devono ATTERRARE su quello già calcolato. La
// somma delle cinque righe di un quarto è esattamente il punteggio di quel
// quarto, sempre. Non è una torta tagliata dopo: le quote nascono dai dati veri
// del giocatore, la varianza usa lo stesso rng della partita, e il ritmo del
// coach sposta i volumi di tutti.
//
// COME NASCE UNA RIGA
// 1. Ogni giocatore ha una QUOTA per ogni statistica, presa dalla sua riga vera
//    normalizzata al minuto (`stats_real`). Chi nella realtà segna 28 punti in
//    36 minuti pesa più di chi ne segna 8 in 20.
// 2. Ogni statistica di squadra ha un TOTALE realistico legato alla partita:
//    i punti li dà il motore, gli assist seguono i punti, rimbalzi/recuperi/
//    stoppate/palle perse seguono i possessi e i reparti.
// 3. Il totale si spalma sui cinque per quota × serata (rumore), e si arrotonda
//    col metodo del resto più grande, così la somma torna al totale esatto.

// ---------------------------------------------------------------------------
// Manopole del banco. Tutti i numeri tarabili stanno qui.
// ---------------------------------------------------------------------------

// Possessi di riferimento: gli stessi di partita.js, replicati qui per non
// creare una dipendenza circolare fra i due moduli.
const POSSESSI_RIF = 99;

// Rimbalzi totali di una squadra NBA in una partita a ritmo neutro. I possessi
// extra guadagnati a rimbalzo sono già dentro `possessi`, quindi chi domina i
// tabelloni prende più rimbalzi senza bisogno di un secondo correttivo.
export const REB_SQUADRA = 44;

// Assist per punto segnato. NBA moderna: ~26 assist su ~114 punti.
export const AST_PER_PUNTO = 0.23;

// Recuperi, stoppate e palle perse di una squadra a ritmo neutro.
export const RUB_SQUADRA = 7.6;
export const STP_SQUADRA = 4.9;
export const PP_SQUADRA = 13.5;

// Quanto il reparto difesa muove recuperi e stoppate. Con 0.6, una difesa da
// percentile 90 ruba e stoppa ~24% più della mediana.
export const K_DIF_PALLE = 0.6;

// Quanto il reparto regia riduce le palle perse. Con 0.5, una regia da
// percentile 90 perde ~20% di palloni in meno della mediana.
export const K_REG_PALLE = 0.5;

// Varianza della singola serata, per giocatore e per quarto. Con 0.38 capita
// che la seconda opzione superi la prima in un quarto, ma non che il quinto
// uomo faccia 20 punti in dodici minuti.
export const SIGMA_QUOTA = 0.38;

// Pavimento della quota: nessuno può sparire del tutto da un quarto.
const QUOTA_MIN = 0.02;

export const STAT_BOX = ["pts", "reb", "ast", "stl", "tov", "blk"];

// ---------------------------------------------------------------------------
// Utilità
// ---------------------------------------------------------------------------

// Box-Muller, come in partita.js: la serata di un giocatore si distribuisce a
// campana, non a caso piatto.
function gauss(rng) {
  let u = rng();
  if (u <= 0) u = Number.EPSILON;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

// Ripartisce un totale intero fra dei pesi, col metodo del resto più grande.
// Serve perché arrotondando ognuno per conto suo la somma non torna quasi mai,
// e un box score la cui somma non fa il punteggio è un box score che mente.
export function ripartisci(totale, pesi) {
  const n = pesi.length;
  const out = new Array(n).fill(0);
  if (totale <= 0 || n === 0) return out;

  const somma = pesi.reduce((a, b) => a + b, 0);
  // Pesi tutti a zero: divido in parti uguali invece di dividere per zero.
  const quote = somma > 0 ? pesi.map((p) => (p / somma) * totale)
    : pesi.map(() => totale / n);

  let assegnati = 0;
  const resti = quote.map((q, i) => {
    out[i] = Math.floor(q);
    assegnati += out[i];
    return { i, resto: q - out[i] };
  });
  // A parità di resto vince l'indice più basso: così il risultato è
  // deterministico e il replay resta identico.
  resti.sort((a, b) => b.resto - a.resto || a.i - b.i);
  for (let k = 0; assegnati < totale; k++, assegnati++) {
    out[resti[k % n].i]++;
  }
  return out;
}

// Quote di una statistica dentro la squadra, dalla riga vera normalizzata al
// minuto. Chi ha giocato pochi minuti nella realtà non viene penalizzato per
// quello: quello che conta è quanto produceva al minuto.
//
// Poi la resa al minuto si moltiplica per i MINUTI CHE GIOCA QUI (`g.minuti`,
// da `minutiRosa`). È il pezzo che rende vera la panchina: un titolare da 32
// minuti produce il doppio di una riserva da 16 con la stessa resa. Senza
// `minuti` (una top-5 qualsiasi, i test del modulo) valgono tutti uguale.
export function quote(giocatori, stat) {
  const grezze = giocatori.map((g) => {
    const s = g.stats_real ?? {};
    const min = s.min > 0 ? s.min : 1;
    const v = s[stat];
    const alMinuto = typeof v === "number" && v > 0 ? v / min : 0;
    return alMinuto * (g.minuti ?? 1);
  });
  const somma = grezze.reduce((a, b) => a + b, 0);
  if (somma <= 0) return grezze.map(() => 1 / grezze.length);

  // Pavimento: nessuno a zero secco, altrimenti un giocatore può finire una
  // partita intera senza toccare palla in quella statistica.
  const conPavimento = grezze.map((v) => Math.max(v / somma, QUOTA_MIN));
  const s2 = conPavimento.reduce((a, b) => a + b, 0);
  return conPavimento.map((v) => v / s2);
}

function fattore(valore, k) {
  // I reparti sono percentili 0-99: 50 è la mediana, cioè fattore 1.
  return 1 + (k * (valore - 50)) / 100;
}

// ---------------------------------------------------------------------------
// Totali di squadra
// ---------------------------------------------------------------------------

/**
 * Quante rimbalzi/assist/recuperi/palle perse/stoppate fa questa squadra in
 * questa partita. I punti non stanno qui: li ha già decisi `partita.js`.
 */
export function totaliSquadra({ punti, possessi, reparti }) {
  const ritmo = possessi / POSSESSI_RIF;
  return {
    reb: REB_SQUADRA * ritmo,
    ast: AST_PER_PUNTO * punti,
    stl: RUB_SQUADRA * ritmo * fattore(reparti.dif, K_DIF_PALLE),
    blk: STP_SQUADRA * ritmo * fattore(reparti.dif, K_DIF_PALLE),
    tov: PP_SQUADRA * ritmo * fattore(reparti.reg, -K_REG_PALLE),
  };
}

// ---------------------------------------------------------------------------
// Box score
// ---------------------------------------------------------------------------

function vuota() {
  return { pts: 0, reb: 0, ast: 0, stl: 0, tov: 0, blk: 0 };
}

/**
 * Il box score di UNA squadra in UNA partita.
 *
 * @param {object} o
 * @param {Array<{name?: string, nome?: string, stats_real: object, minuti?: number}>} o.giocatori
 *        i dieci della rosa, nell'ordine in cui vanno mostrati. `minuti` è
 *        quanto gioca ognuno: senza, contano tutti uguale.
 * @param {Array<number>} o.puntiQuarto punti di squadra per periodo, come li ha
 *        prodotti `partita.js` (compresi gli eventuali supplementari).
 * @param {number} o.possessi possessi totali della squadra nella partita.
 * @param {object} o.reparti i cinque reparti della squadra.
 * @param {() => number} o.rng generatore in [0,1). Stesso seme, stesso box score.
 * @returns {{righe: Array, totali: object}} `righe[i].per[q]` è il quarto q del
 *          giocatore i, `righe[i].tot` la sua riga finale.
 */
export function boxScore({ giocatori, puntiQuarto, possessi, reparti, rng }) {
  check({ giocatori, puntiQuarto, possessi, reparti, rng });

  const nPeriodi = puntiQuarto.length;
  const puntiTot = puntiQuarto.reduce((a, b) => a + b, 0);
  const totali = totaliSquadra({ punti: puntiTot, possessi, reparti });

  // Quote fisse per la partita: chi è la prima opzione lo è per tutti i quarti.
  // La differenza fra un quarto e l'altro la fa il rumore, non un giocatore
  // diverso che diventa improvvisamente il terminale offensivo.
  const q = {};
  for (const s of STAT_BOX) q[s] = quote(giocatori, s);

  const righe = giocatori.map((g) => ({
    nome: g.nome ?? g.name,
    // I minuti finiscono nella riga perché la tabella li stampa in prima
    // colonna, come ogni box score vero. `null` quando chi chiama non li passa.
    minuti: g.minuti ?? null,
    per: Array.from({ length: nPeriodi }, vuota),
    tot: vuota(),
  }));

  for (const stat of STAT_BOX) {
    // Quanto di questa statistica si produce in ogni periodo. I punti li dà il
    // motore; le altre seguono i punti del periodo, perché un quarto in cui si
    // segna tanto è un quarto in cui si è giocato tanto.
    const perPeriodo = stat === "pts"
      ? puntiQuarto
      : ripartisci(Math.round(totali[stat]), puntiQuarto.map((p) => Math.max(p, 1)));

    for (let p = 0; p < nPeriodi; p++) {
      const pesi = q[stat].map((quota) =>
        Math.max(0, quota * (1 + SIGMA_QUOTA * gauss(rng)))
      );
      const valori = ripartisci(perPeriodo[p], pesi);
      for (let i = 0; i < righe.length; i++) {
        righe[i].per[p][stat] = valori[i];
        righe[i].tot[stat] += valori[i];
      }
    }
  }

  const somma = vuota();
  for (const r of righe) for (const s of STAT_BOX) somma[s] += r.tot[s];
  return { righe, totali: somma };
}

/**
 * Box score delle due squadre di una partita già simulata.
 *
 * @param {object} partita l'oggetto che torna `simulaPartita`.
 * @param {object} squadre `{casa: {giocatori, reparti}, ospite: {...}}`.
 * @param {() => number} rng
 */
export function boxScorePartita({ partita, casa, ospite, rng }) {
  const lato = (side, sq) => boxScore({
    giocatori: sq.giocatori,
    puntiQuarto: partita.quarti.map((q) => q[side]),
    possessi: partita.possessi[side],
    reparti: sq.reparti,
    rng,
  });
  return { casa: lato("casa", casa), ospite: lato("ospite", ospite) };
}

// ---------------------------------------------------------------------------
// Medie di carriera
// ---------------------------------------------------------------------------

// Chiave di una persona, non di una carta: LeBron 2012-13 e LeBron 2017-18 sono
// lo stesso LeBron. Serve alla classifica "quali giocatori usi di più", che
// deve contare la persona e non l'annata.
export function chiavePersona(nome) {
  return String(nome)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Somma tante righe di partita in medie per giocatore.
 *
 * @param {Array<{nome: string, tot: object}>} righe righe di partita, anche di
 *        partite diverse: si aggregano per persona.
 * @returns {Array} ordinate per punti medi, con `gp` = partite giocate.
 */
export function medieCarriera(righe) {
  const per = new Map();
  for (const r of righe) {
    const k = chiavePersona(r.nome);
    if (!per.has(k)) per.set(k, { chiave: k, nome: r.nome, gp: 0, somma: vuota(), max: vuota() });
    const v = per.get(k);
    v.gp++;
    for (const s of STAT_BOX) {
      const x = r.tot[s] ?? 0;
      v.somma[s] += x;
      // Il massimo in una singola partita: "34 punti nella corsa" dice una cosa
      // che la media non dice, ed è quello che uno si ricorda.
      if (x > v.max[s]) v.max[s] = x;
    }
  }
  return [...per.values()]
    .map((v) => {
      const medie = {};
      for (const s of STAT_BOX) medie[s] = v.somma[s] / v.gp;
      return { chiave: v.chiave, nome: v.nome, gp: v.gp, medie, somma: v.somma, max: v.max };
    })
    .sort((a, b) => b.medie.pts - a.medie.pts);
}

// ---------------------------------------------------------------------------
// Validazione: input sbagliato = errore leggibile, mai un box score inventato
// ---------------------------------------------------------------------------

function check({ giocatori, puntiQuarto, possessi, reparti, rng }) {
  if (!Array.isArray(giocatori) || giocatori.length === 0) {
    throw new Error("boxScore: serve almeno un giocatore");
  }
  for (const g of giocatori) {
    if (!g || typeof g.stats_real !== "object" || g.stats_real === null) {
      throw new Error(`boxScore: il giocatore '${g?.nome ?? g?.name ?? "?"}' non ha stats_real`);
    }
  }
  if (!Array.isArray(puntiQuarto) || puntiQuarto.length === 0) {
    throw new Error("boxScore: serve puntiQuarto, i punti di squadra periodo per periodo");
  }
  for (const p of puntiQuarto) {
    if (typeof p !== "number" || !Number.isFinite(p) || p < 0) {
      throw new Error(`boxScore: punti di periodo non validi ('${p}')`);
    }
  }
  if (typeof possessi !== "number" || !Number.isFinite(possessi) || possessi <= 0) {
    throw new Error(`boxScore: possessi non validi ('${possessi}')`);
  }
  if (!reparti || typeof reparti.dif !== "number" || typeof reparti.reg !== "number") {
    throw new Error("boxScore: servono i reparti (almeno dif e reg)");
  }
  if (typeof rng !== "function") {
    throw new Error("boxScore: serve un rng (funzione che torna un numero in [0,1))");
  }
}
