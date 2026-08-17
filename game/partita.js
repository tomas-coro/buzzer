// La partita vera: quattro quarti, un punteggio tipo 112-108, due squadre che si
// affrontano davvero.
//
// Perché esiste: il motore vecchio decideva il round con `media OVR tua >= media
// OVR loro`. Un solo confronto, nessuna storia da guardare, e un coach "che
// migliora la difesa" non aveva niente su cui agire. Qui i punti nascono da un
// lato contro l'altro: il tuo attacco contro la loro difesa, e viceversa.
//
// TRE REGOLE CHE REGGONO IL MODELLO
//
// 1. I punti sono POSSESSI × EFFICIENZA. Il ritmo (manopola del coach) decide
//    quanti possessi si giocano, i reparti decidono quanto rendono. Così una
//    partita da 90 punti e una da 125 possono esistere entrambe senza cambiare
//    la forza delle squadre: cambia solo quanto si corre.
//
// 2. I RIMBALZI NON FANNO SEGNARE MEGLIO, FANNO SEGNARE DI PIÙ. Chi domina a
//    rimbalzo prende secondi tiri, cioè possessi in più - non punti per possesso
//    in più. È come funziona davvero, e ha un effetto bello sul gioco: una
//    squadra di lunghi che tira male può vincere lo stesso, tirando dodici volte
//    in più degli altri.
//
// 3. LA VARIANZA È LEGATA ALL'EQUILIBRIO. Nel 4° quarto di una partita punto a
//    punto succede di tutto; se sei sopra di venti, il 4° quarto è una
//    formalità. Niente peso fisso sull'ultimo quarto (che premierebbe la
//    rimonta anche in una partita già scritta), ma un moltiplicatore che si
//    accende solo quando la partita è aperta.
//
// Il modulo è puro e deterministico: gli si passa `rng` e a parità di seme la
// partita è identica. Serve ai test, e servirà al replay.

import { REPARTI } from "./reparti.js";

// ---------------------------------------------------------------------------
// Manopole del banco. Tutti i numeri tarabili stanno qui, non sparsi nel codice.
// ---------------------------------------------------------------------------

// Possessi per squadra in una partita a ritmo neutro. La NBA moderna sta sui 99-100.
export const POSSESSI_BASE = 99;

// Quanto la manopola ritmo sposta i possessi. ritmo va da -1 (palla in mano,
// tutto a rilento) a +1 (corsa continua): due coach che corrono arrivano a 109
// possessi, due che rallentano scendono a 89.
export const RITMO_SPAN = 10;

// Punti per possesso di una squadra mediana contro una difesa mediana.
export const PPP_BASE = 1.06;

// Quanto pesa lo scarto attacco-difesa sull'efficienza. Con 0.45, venti punti di
// vantaggio d'attacco valgono ~+0.07 punti per possesso, cioè sette punti a
// partita: tanto, ma non abbastanza da rendere inutile tutto il resto.
export const K_EFFICIENZA = 0.45;

// Quanto lo scarto a rimbalzo si trasforma in possessi. Con 0.12, quindici punti
// di reparto rimbalzi valgono ~3,5 possessi extra: circa quattro punti.
export const K_RIMBALZI = 0.12;

// Punto oltre il quale uno scarto smette di contare in proporzione (vedi
// `satura`). Tarati al banco sulle carte vere: senza, una squadra di riserve
// contro un quintetto di stelle produceva partite da 54 punti e margini da 72,
// che nella NBA non esistono.
export const SAT_EFFICIENZA = 22;
export const SAT_RIMBALZI = 30;

// Deviazione standard dei punti di UNA squadra in UN quarto. È la serata storta e
// la serata di grazia: tarata perché una squadra sei punti più debole vinca circa
// una volta su quattro, come nella NBA vera.
export const SIGMA_QUARTO = 3.6;

// Moltiplicatori di varianza nel 4° quarto, per scarto d'ingresso. Partita aperta
// = tutto può succedere; partita scappata = non succede niente.
export const BRIVIDO = [
  { scarto: 5, mult: 1.5 },
  { scarto: 10, mult: 1.2 },
];

const QUARTI = 4;
// Un supplementare è 5 minuti su 12 di un quarto: possessi in proporzione.
const FRAZIONE_OT = 5 / 12;
// Oltre questo numero di supplementari la partita si chiude comunque: senza un
// tetto, un pareggio ostinato girerebbe all'infinito.
const MAX_OT = 6;

// ---------------------------------------------------------------------------
// Generatore casuale iniettabile
// ---------------------------------------------------------------------------

// mulberry32: piccolo, veloce, con un periodo lunghissimo per quello che serve
// qui. Esportato perché i test (e un domani il replay di una partita salvata)
// devono poter rigiocare la stessa identica simulazione partendo dal seme.
export function rngSeed(seme) {
  if (!Number.isInteger(seme)) throw new Error("rngSeed: il seme deve essere un intero");
  let a = seme >>> 0;
  return function rng() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller: da due numeri uniformi a uno normale (media 0, deviazione 1).
// Serve perché i punti di un quarto si distribuiscono a campana, non a caso
// piatto: 26 punti capita spesso, 12 quasi mai.
function gauss(rng) {
  let u = rng();
  // log(0) è -Infinity: risospingo lo zero dentro l'intervallo aperto.
  if (u <= 0) u = Number.EPSILON;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

// ---------------------------------------------------------------------------
// Sintesi dei reparti
// ---------------------------------------------------------------------------

// Quanto rende l'attacco di una squadra. La regia entra qui e non altrove: un
// playmaker non segna al posto tuo, ti mette nelle condizioni di segnare.
export function attacco(reparti) {
  return 0.40 * reparti.fin + 0.30 * reparti.t3 + 0.30 * reparti.reg;
}

// La difesa è il suo reparto e basta. I rimbalzi difensivi sono già dentro `dif`
// (vedi reparti.js): rimetterli anche qui li conterebbe due volte, e `reb` deve
// restare libero di fare il suo mestiere, cioè i possessi extra.
export function difesa(reparti) {
  return reparti.dif;
}

// Possessi attesi per squadra: la base spostata dalla MEDIA dei due ritmi. Il
// ritmo si contratta in campo - se tu corri e io rallento, si gioca a metà strada.
export function possessiAttesi(ritmoCasa, ritmoOspite) {
  return POSSESSI_BASE + RITMO_SPAN * ((ritmoCasa + ritmoOspite) / 2);
}

// Rendimento decrescente su uno scarto. Fino a `sat` il valore passa quasi
// intero (a metà di sat si perde il 4%), oltre si appiattisce: il quarantesimo
// punto di vantaggio non può valere quanto il primo.
//
// Serve perché i reparti sono percentili 0-99 e le squadre estreme esistono
// davvero nel mazzo: cinque riserve contro cinque stelle danno uno scarto di 40
// punti, e senza freno la partita finiva 54-126. La NBA quello scarto non ce
// l'ha, perché anche l'ultima squadra della lega ha comunque cinque
// professionisti in campo.
export function satura(scarto, sat) {
  return sat * Math.tanh(scarto / sat);
}

// ---------------------------------------------------------------------------
// Validazione: input sbagliato = errore leggibile, mai un punteggio inventato
// ---------------------------------------------------------------------------

function checkSquadra(s, lato) {
  if (!s || typeof s !== "object") throw new Error(`simulaPartita: manca la squadra '${lato}'`);
  if (!s.reparti || typeof s.reparti !== "object") {
    throw new Error(`simulaPartita: la squadra '${lato}' non ha i reparti`);
  }
  for (const r of REPARTI) {
    const v = s.reparti[r];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new Error(`simulaPartita: squadra '${lato}', reparto '${r}' mancante o non numerico`);
    }
  }
  const ritmo = s.ritmo ?? 0;
  if (typeof ritmo !== "number" || !Number.isFinite(ritmo) || ritmo < -1 || ritmo > 1) {
    throw new Error(`simulaPartita: squadra '${lato}', ritmo '${s.ritmo}' fuori dall'intervallo -1..+1`);
  }
}

// ---------------------------------------------------------------------------
// Simulazione
// ---------------------------------------------------------------------------

function moltiplicatoreBrivido(scarto) {
  const a = Math.abs(scarto);
  for (const b of BRIVIDO) if (a <= b.scarto) return b.mult;
  return 1;
}

// Punti di una squadra in un periodo: possessi × efficienza, più la serata.
// Il pavimento a zero non è un fallback silenzioso: è il fatto che una squadra
// non può segnare meno di zero punti in un quarto.
function puntiPeriodo(possessi, ppp, sigma, rng) {
  return Math.max(0, Math.round(possessi * ppp + gauss(rng) * sigma));
}

/**
 * Simula una partita intera.
 *
 * @param {object} o
 * @param {{nome?: string, reparti: object, ritmo?: number}} o.casa
 * @param {{nome?: string, reparti: object, ritmo?: number}} o.ospite
 * @param {() => number} o.rng generatore in [0,1). Usa `rngSeed(n)` per averlo
 *        deterministico: stesso seme, stessa partita.
 * @returns {{punti, quarti, cronaca, vincitore, possessi}}
 */
export function simulaPartita({ casa, ospite, rng }) {
  checkSquadra(casa, "casa");
  checkSquadra(ospite, "ospite");
  if (typeof rng !== "function") {
    throw new Error("simulaPartita: serve un rng (funzione che torna un numero in [0,1))");
  }

  const nomeCasa = casa.nome ?? "Casa";
  const nomeOspite = ospite.nome ?? "Ospiti";

  // 1. Quanti possessi si giocano. Il ritmo li fissa per entrambe, i rimbalzi
  //    li spostano da una parte all'altra: quello che tu prendi a rimbalzo
  //    offensivo è un tiro che l'avversario non ha.
  const base = possessiAttesi(casa.ritmo ?? 0, ospite.ritmo ?? 0);
  const gapReb = satura(casa.reparti.reb - ospite.reparti.reb, SAT_RIMBALZI);
  const extra = (K_RIMBALZI * gapReb / 100) * base;
  const possCasa = base + extra;
  const possOspite = base - extra;

  // 2. Quanto rendono. Il tuo attacco contro la LORO difesa.
  const ppp = (att, dif) =>
    PPP_BASE + K_EFFICIENZA * satura(att - dif, SAT_EFFICIENZA) / 100;
  const pppCasa = ppp(attacco(casa.reparti), difesa(ospite.reparti));
  const pppOspite = ppp(attacco(ospite.reparti), difesa(casa.reparti));

  const quarti = [];
  let cumCasa = 0;
  let cumOspite = 0;

  for (let n = 1; n <= QUARTI; n++) {
    // Il brivido si accende solo entrando nel 4°, e solo se la partita è aperta.
    const sigma = SIGMA_QUARTO * (n === QUARTI ? moltiplicatoreBrivido(cumCasa - cumOspite) : 1);
    const pc = possCasa / QUARTI;
    const po = possOspite / QUARTI;
    const c = puntiPeriodo(pc, pppCasa, sigma, rng);
    const o = puntiPeriodo(po, pppOspite, sigma, rng);
    cumCasa += c;
    cumOspite += o;
    quarti.push({
      n, casa: c, ospite: o, cumCasa, cumOspite, overtime: false,
      possessi: { casa: Math.round(pc), ospite: Math.round(po) },
    });
  }

  // 3. Supplementari. Nessun pareggio esce da qui: si gioca finché uno stacca.
  let ot = 0;
  while (cumCasa === cumOspite && ot < MAX_OT) {
    ot++;
    const pc = (possCasa / QUARTI) * FRAZIONE_OT;
    const po = (possOspite / QUARTI) * FRAZIONE_OT;
    // Meno minuti, meno spazio per la varianza: la scalo con la radice del tempo,
    // come si comporta la somma di tanti possessi indipendenti.
    const sigma = SIGMA_QUARTO * Math.sqrt(FRAZIONE_OT) * 1.5;
    const c = puntiPeriodo(pc, pppCasa, sigma, rng);
    const o = puntiPeriodo(po, pppOspite, sigma, rng);
    cumCasa += c;
    cumOspite += o;
    quarti.push({
      n: QUARTI + ot, casa: c, ospite: o, cumCasa, cumOspite, overtime: true,
      possessi: { casa: Math.round(pc), ospite: Math.round(po) },
    });
  }
  if (cumCasa === cumOspite) {
    // Sei supplementari pari: nella NBA non è mai successo. Invece di girare
    // all'infinito, un canestro allo scadere - dichiarato, non nascosto.
    if (rng() < 0.5) cumCasa += 2; else cumOspite += 2;
    const ultimo = quarti[quarti.length - 1];
    ultimo.casa += cumCasa - ultimo.cumCasa;
    ultimo.ospite += cumOspite - ultimo.cumOspite;
    ultimo.cumCasa = cumCasa;
    ultimo.cumOspite = cumOspite;
  }

  return {
    punti: { casa: cumCasa, ospite: cumOspite },
    possessi: { casa: Math.round(possCasa), ospite: Math.round(possOspite) },
    quarti,
    cronaca: cronaca(quarti, nomeCasa, nomeOspite),
    vincitore: cumCasa > cumOspite ? "casa" : "ospite",
  };
}

// ---------------------------------------------------------------------------
// Cronaca
// ---------------------------------------------------------------------------

// Etichetta del periodo. I supplementari si contano da 1: "1° supplementare".
function etichetta(q) {
  return q.overtime ? `${q.n - QUARTI}° suppl.` : `${q.n}° quarto`;
}

// Una riga per quarto, scritta dai numeri veri di quel quarto: chi ha vinto il
// parziale, di quanto, e com'è cambiata la partita. Niente frasi a caso: se
// leggi "sorpasso" è perché la testa della partita è cambiata davvero.
//
// Sta nel motore e non nella UI perché il testo dipende dai dati della
// simulazione, non da come sono disegnati. La UI riceve `testo` già pronto e
// `tipo` per decidere il colore della riga.
export function cronaca(quarti, nomeCasa, nomeOspite) {
  const ultimo = quarti.length - 1;
  return quarti.map((q, i) => {
    const prima = i === 0 ? 0 : quarti[i - 1].cumCasa - quarti[i - 1].cumOspite;
    const dopo = q.cumCasa - q.cumOspite;
    const parziale = q.casa - q.ospite;
    const punteggio = `${q.cumCasa}-${q.cumOspite}`;
    const avanti = dopo > 0 ? nomeCasa : nomeOspite;
    const dietro = dopo > 0 ? nomeOspite : nomeCasa;
    const parzialeDi = parziale > 0 ? nomeCasa : nomeOspite;
    const pQuarto = `${Math.max(q.casa, q.ospite)}-${Math.min(q.casa, q.ospite)}`;
    const finale = i === ultimo;

    // Il primo quarto è un caso a sé: il parziale COINCIDE col punteggio, quindi
    // scriverlo due volte ("piazza un 24-10 e scappa: 24-10") suona rotto.
    if (i === 0) {
      const tipo = parziale === 0 ? "parita"
        : Math.abs(parziale) >= 8 ? "allungo"
          : Math.abs(parziale) <= 3 ? "equilibrio" : "normale";
      const testo = {
        parita: `Primo quarto in perfetta parità, ${punteggio}.`,
        allungo: `${avanti} parte forte e chiude il primo quarto avanti ${punteggio}.`,
        equilibrio: `Primo quarto punto a punto, ${punteggio}.`,
        normale: `${avanti} avanti dopo il primo quarto, ${punteggio}.`,
      }[tipo];
      return { quarto: etichetta(q), tipo, testo };
    }

    // Come si chiude la riga: cambia col momento della partita, così le quattro
    // righe non sembrano la stessa frase ripetuta.
    const chiusa = finale
      ? `finisce ${punteggio}`
      : q.overtime ? `nel supplementare è ${punteggio}`
        : q.n === 2 ? `all'intervallo è ${punteggio}`
          : `dopo tre quarti è ${punteggio}`;

    let tipo;
    let azione;
    if (dopo === 0) {
      tipo = "parita";
      // Una parità a fine partita non è un pareggio: si va ai supplementari.
      azione = finale || q.n === QUARTI
        ? `Tutto da rifare, ${punteggio} e si va ai supplementari`
        : `${parzialeDi} rimette la partita in parità, ${chiusa}`;
      return { quarto: etichetta(q), tipo, testo: azione + "." };
    }
    if (prima !== 0 && Math.sign(prima) !== Math.sign(dopo)) {
      tipo = "sorpasso";
      azione = `${avanti} sorpassa con un ${pQuarto}`;
    } else if (Math.sign(parziale) !== Math.sign(dopo) && Math.abs(parziale) >= 4) {
      // Il parziale è di chi insegue. Va guardato PRIMA dell'allungo: un 33-25
      // di chi sta perdendo non è una fuga, è una rimonta - e senza questo
      // controllo la cronaca scriveva "prende il largo" sotto di un punto.
      tipo = Math.abs(dopo) <= 6 ? "rimonta" : "reazione";
      if (finale) {
        azione = `${dietro} ci prova (${pQuarto}) ma non basta`;
      } else {
        azione = tipo === "rimonta"
          ? `${dietro} rientra (${pQuarto}) e ora è partita`
          : `${dietro} vince il periodo (${pQuarto}) ma resta lontano`;
      }
    } else if (Math.abs(parziale) >= 8) {
      tipo = "allungo";
      azione = finale
        ? `${parzialeDi} chiude i conti con un ${pQuarto}`
        : `${parzialeDi} piazza un ${pQuarto} e prende il largo`;
    } else if (Math.abs(dopo) >= 15) {
      tipo = "fuga";
      azione = finale
        ? `${avanti} non è mai stata in discussione`
        : `${avanti} tiene il controllo`;
    } else if (Math.abs(dopo) <= 3) {
      tipo = "equilibrio";
      // Tre quarti in equilibrio di fila stampavano tre volte la stessa frase:
      // la cronaca deve suonare come un racconto, non come un log.
      azione = finale ? `Si decide nel finale`
        : q.n === 2 ? `Nessuna delle due prende il largo`
          : `Ancora tutto aperto`;
    } else if (Math.sign(parziale) === Math.sign(dopo)) {
      tipo = "normale";
      azione = `${avanti} controlla il periodo (${pQuarto})`;
    } else {
      // Parziale minimo di chi insegue: non è una rimonta, non cambia niente.
      tipo = "normale";
      azione = `Periodo senza scossoni (${pQuarto}), avanti ${avanti}`;
    }

    // L'ultima riga NON ripete il punteggio finale né il vincitore: il tabellone
    // li ha già scritti in grande sopra, e ripeterli faceva una riga lunga il
    // doppio delle altre che diceva quello che si vedeva già.
    const coda = finale ? "." : `, ${chiusa}.`;
    return { quarto: etichetta(q), tipo, testo: azione + coda };
  });
}
