// I cinque reparti di una carta, ricavati dal box score reale.
//
// Perché esistono: il motore vecchio decideva la partita confrontando due medie
// di overall, quindi un coach "che migliora la difesa" non aveva niente su cui
// agire. Con i reparti la squadra ha dei lati - e un coach può alzarne uno e
// abbassarne un altro, come su NBA 2K.
//
// DUE RAMI, E LA DIFFERENZA CONTA. Il box score del dataset 2K ha solo 12 campi
// (pts reb ast stl blk tov fg% 3p% ft% min gp +/-): niente tentativi, niente
// rimbalzi divisi. Con quelli soli, un centro che ha infilato tre triple in tutta la
// stagione sembra un tiratore migliore di Klay Thompson. Per questo i volumi veri
// arrivano da Basketball-Reference (data/shooting-br.json, generato da
// tools/build-shooting.py): tentativi da tre, tiri da due, rimbalzi offensivi e
// difensivi separati. Oggi le 2412 carte li hanno tutte.
//
// Il ramo a proxy resta per le carte che un domani non trovassero riscontro nella
// mappa: in quel caso la carta esce con `reparti_stimati: true` e la scheda lo deve
// dire ("stima da box score"), invece di far passare una stima per un dato.
// Resta stimata comunque la DIFESA: il box score non la misura davvero, si legge
// solo da stoppate, palle rubate, rimbalzi difensivi e plus/minus.
//
// I valori finali 0-99 sono PERCENTILI DENTRO LA STAGIONE: 25 punti nel 1985 e 25
// punti nel 2019 non valgono uguale, e il percentile toglie il problema dell'era
// senza inventare correttivi. Il calcolo vive qui ma gira a build-time
// (prototype/imbattuto/build-cards.mjs): il motore riceve carte già pronte e non
// deve conoscere le 2412 carte per valutarne una.

export const REPARTI = ["t3", "fin", "dif", "reb", "reg"];

export const ETICHETTE = {
  t3: "Tiro da tre",
  fin: "Finalizzazione",
  dif: "Difesa",
  reb: "Rimbalzi",
  reg: "Regia",
};

// Reparto che resta una stima anche coi volumi veri: il box score non misura la
// difesa individuale. La scheda lo deve dichiarare.
export const STIMATI = new Set(["dif"]);

const STAT_KEYS = ["pts", "reb", "ast", "stl", "blk", "tov",
  "fg_pct", "tp_pct", "ft_pct", "min", "gp", "plus_minus"];

// Riferimenti "da fuoriclasse" per ciascun ingrediente: servono solo a portare
// numeri di scale diverse (percentuali e medie a partita) su un asse comune ~0-1
// prima di pesarli. La scala vera arriva dopo, col percentile.
const RIF = {
  pts36: 30, fg: 60, tp: 40, ft: 90,
  reb36: 14, ast36: 10, stl36: 2.2, blk36: 2.8, tov36: 4,
};

export function per36(valore, minuti) {
  if (!Number.isFinite(minuti) || minuti <= 0) {
    throw new Error("per36: minuti non validi (servono minuti > 0)");
  }
  return (valore * 36) / minuti;
}

// Tetto a 1.4 e non a 1: un fuoriclasse deve poter sfondare il riferimento, se no
// i migliori si appiattiscono tutti sullo stesso valore.
function clamp01(x) {
  return x < 0 ? 0 : x > 1.4 ? 1.4 : x;
}

// Versione secca 0-1, per i fattori che non devono sfondare (pesi, propensioni).
function clampUnit(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

// Quanto ci si può fidare dei numeri di un giocatore: 4 minuti a partita per 6
// partite producono medie per 36' da fuoriclasse che non significano niente. I
// minuti totali stagionali dicono quanto il campione è solido; sotto, il valore
// viene tirato verso la mediana della stagione invece di essere preso per buono.
//
// K = 800 minuti, circa 25 partite da titolare: sopra, il peso è già ~0.75.
const K_AFFIDABILITA = 800;

export function affidabilita(stats) {
  const minutiTotali = stats.min * stats.gp;
  return minutiTotali / (minutiTotali + K_AFFIDABILITA);
}

// La correzione vale per i reparti fatti di medie a partita, dove giocare poco gonfia
// il dato. NON vale per il tiro da tre: lì il numero che comanda sono i tentativi, e
// nove tentativi in 82 partite non sono un campione piccolo, sono una risposta chiara.
// Senza questa eccezione Enes Kanter usciva a 64 di tiro da tre.
const CORREGGIBILI = ["fin", "dif", "reb", "reg"];

function checkStats(s) {
  if (!s) throw new Error("rawReparti: manca il box score");
  for (const k of STAT_KEYS) {
    if (typeof s[k] !== "number" || !Number.isFinite(s[k])) {
      throw new Error(`rawReparti: campo '${k}' mancante o non numerico`);
    }
  }
}

const VOL_KEYS = ["fg3a", "fg2a", "fg2", "orb", "drb", "min", "gp"];

function checkVol(v) {
  for (const k of VOL_KEYS) {
    if (typeof v[k] !== "number" || !Number.isFinite(v[k])) {
      throw new Error(`rawReparti: volume '${k}' mancante o non numerico`);
    }
  }
}

// Punteggi grezzi, non confrontabili tra reparti diversi: contano solo come
// ordinamento dentro lo stesso reparto (ci pensa il percentile a renderli letti).
//
// `vol` sono i volumi veri presi da Basketball-Reference (tentativi da tre, tiri
// da due, rimbalzi offensivi e difensivi separati): quando ci sono, i reparti
// smettono di essere stime. Quando mancano si usa il ramo a proxy, e la carta
// resta marcata come stimata - mai far finta che una stima sia un dato.
export function rawReparti(s, vol = null) {
  checkStats(s);
  if (vol) return rawConVolumi(s, vol);
  const pts = clamp01(per36(s.pts, s.min) / RIF.pts36);
  const reb = clamp01(per36(s.reb, s.min) / RIF.reb36);
  const ast = clamp01(per36(s.ast, s.min) / RIF.ast36);
  const stl = clamp01(per36(s.stl, s.min) / RIF.stl36);
  const blk = clamp01(per36(s.blk, s.min) / RIF.blk36);
  const tov = clamp01(per36(s.tov, s.min) / RIF.tov36);
  const fg = clamp01(s.fg_pct / RIF.fg);
  const tp = clamp01(s.tp_pct / RIF.tp);
  const ft = clamp01(s.ft_pct / RIF.ft);
  // plus/minus da -10 a +10 → 0..1: è un correttivo, non il piatto principale.
  const pm = clamp01((s.plus_minus + 10) / 20);

  // Quanto uno tira DA FUORI non è nei dati (mancano i tentativi), ma si legge in
  // controluce nella percentuale dal campo: chi vive al ferro sta al 55-70%, chi
  // vive dall'arco sta sotto il 50%. Serve a non incoronare tiratore il centro che
  // ha infilato tre triple in tutta la stagione: la sua percentuale resta, ma pesa
  // per quello che è. Va da 0.4 (mai fuori) a 1.0 (tira da fuori davvero).
  const propensioneEsterna = 0.4 + 0.6 * clampUnit((RIF.fg - s.fg_pct) / 20);

  return {
    // Chi non tira mai da tre ha tp_pct 0 e finisce in fondo: è il risultato giusto.
    t3: 0.60 * (tp * propensioneEsterna) + 0.20 * ft + 0.20 * pts,
    fin: 0.55 * fg + 0.45 * pts,
    dif: 0.35 * blk + 0.25 * stl + 0.20 * reb + 0.20 * pm,
    reb: 0.85 * reb + 0.15 * blk,
    reg: 0.75 * ast + 0.25 * (1 - tov),
  };
}

// Riferimenti per i volumi veri, sempre per 36 minuti: 7 tentativi da tre è il
// volume di un tiratore dichiarato, 6 rimbalzi difensivi e 3.5 offensivi sono da
// lungo titolare.
const RIF_VOL = { fg3a36: 7, drb36: 6, orb36: 3.5, fg2pct: 58 };
const PRIOR_TIRI3 = 50;
const MEDIA_LEGA_3P = 0.35;

// Ramo coi dati veri. Qui "tiro da tre" è finalmente qualità PER volume, e non una
// percentuale sospesa nel vuoto: chi tira otto triple a partita al 38% conta più di
// chi ne ha prese sei in tutta la stagione al 50%.
function rawConVolumi(s, vol) {
  checkVol(vol);
  const pts = clamp01(per36(s.pts, s.min) / RIF.pts36);
  const ast = clamp01(per36(s.ast, s.min) / RIF.ast36);
  const stl = clamp01(per36(s.stl, s.min) / RIF.stl36);
  const blk = clamp01(per36(s.blk, s.min) / RIF.blk36);
  const tov = clamp01(per36(s.tov, s.min) / RIF.tov36);
  const ft = clamp01(s.ft_pct / RIF.ft);
  const pm = clamp01((s.plus_minus + 10) / 20);

  // I volumi arrivano come totali di stagione: li porto sui 36 minuti coi minuti
  // totali della stessa fonte, così tentativi e minuti parlano della stessa stagione.
  const per36vol = (tot) => (tot * 36) / vol.min;
  const tentativi3 = clampUnit(per36vol(vol.fg3a) / RIF_VOL.fg3a36);
  const drb = clamp01(per36vol(vol.drb) / RIF_VOL.drb36);
  const orb = clamp01(per36vol(vol.orb) / RIF_VOL.orb36);
  // Percentuale da DUE: misura la finalizzazione senza che le triple sporchino il
  // dato (un tiratore da tre ha fg% bassa pur segnando bene sotto canestro).
  const fg2pct = vol.fg2a > 0 ? (100 * vol.fg2) / vol.fg2a : 0;
  const fin2 = clamp01(fg2pct / RIF_VOL.fg2pct);
  // Percentuale da tre stabilizzata: chi ha preso cinque triple e ne ha segnate tre
  // non è al 60%, è un giocatore di cui non sappiamo niente. Con 50 tentativi di
  // "prior" alla media lega (35%), il dato conta man mano che i tentativi arrivano.
  const tpStab = vol.fg3a > 0
    ? (vol.fg3 + PRIOR_TIRI3 * MEDIA_LEGA_3P) / (vol.fg3a + PRIOR_TIRI3)
    : 0;
  const tp = clamp01((tpStab * 100) / RIF.tp);

  return {
    // Tutto il reparto passa dal volume, non solo una parte: un giocatore che tira
    // nove triple in tutta la stagione deve uscire a zero, non a metà classifica.
    // La qualità pesa dentro il volume (chi tira tanto e male vale meno di chi tira
    // tanto e bene), ma non può creare un tiratore dal nulla.
    t3: tentativi3 * (0.15 + 0.85 * tp),
    fin: 0.55 * fin2 + 0.45 * pts,
    // I rimbalzi DIFENSIVI sono il segnale difensivo, quelli offensivi no.
    dif: 0.35 * blk + 0.25 * stl + 0.20 * drb + 0.20 * pm,
    reb: 0.55 * drb + 0.30 * orb + 0.15 * blk,
    reg: 0.75 * ast + 0.25 * (1 - tov),
  };
}

// Popolazione di riferimento: chi gioca abbastanza da avere numeri stabili. Serve
// a impedire che un giocatore da 4 minuti con percentuali gonfiate per 36' diventi
// il vertice della scala e schiacci i titolari.
const SOGLIE = { minMinuti: 15, minPartite: 20 };

function percentile(valore, ordinati) {
  let minori = 0;
  let uguali = 0;
  for (const v of ordinati) {
    if (v < valore) minori++;
    else if (v === valore) uguali++;
  }
  // Rank medio: chi è primo non prende 100 e chi è ultimo non prende 0, così un
  // campione isolato in una stagione povera non diventa automaticamente 99.
  const frazione = (minori + uguali / 2) / ordinati.length;
  return Math.round(frazione * 99);
}

// Aggiunge `reparti: {t3, fin, dif, reb, reg}` (0-99) a ogni carta. Non muta gli
// oggetti in ingresso: restituisce copie.
export function assegnaReparti(cards, soglie = SOGLIE) {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("assegnaReparti: nessuna carta");
  }
  const { minMinuti, minPartite } = { ...SOGLIE, ...soglie };

  const raw = cards.map((c) => {
    if (!c.stats_real) {
      throw new Error(`assegnaReparti: la carta '${c.name}' non ha stats_real`);
    }
    try {
      return rawReparti(c.stats_real, c.stats_vol ?? null);
    } catch (e) {
      throw new Error(`assegnaReparti: carta '${c.name}' (${c.season}) - ${e.message}`);
    }
  });

  // Una scala per stagione e per reparto.
  const scale = new Map();
  const stagioni = new Set(cards.map((c) => c.season));
  for (const season of stagioni) {
    const idx = cards.map((c, i) => (c.season === season ? i : -1)).filter((i) => i >= 0);
    let rif = idx.filter((i) => {
      const s = cards[i].stats_real;
      return s.min >= minMinuti && s.gp >= minPartite;
    });
    if (rif.length === 0) {
      // Fallback dichiarato, non silenzioso: senza titolari nella stagione la
      // scala si costruisce su tutti, altrimenti non esisterebbe nessun ordine.
      console.warn(`[reparti] stagione ${season}: nessuna carta sopra soglia ` +
        `(${minMinuti} min, ${minPartite} partite), scala costruita su tutte le carte`);
      rif = idx;
    }
    // Prima la mediana della stagione (sui titolari), poi la correzione per
    // affidabilità: senza, un giocatore da 240 minuti totali finisce in cima alla
    // classifica di un reparto solo perché le sue medie per 36' sono gonfiate.
    const mediane = {};
    for (const r of REPARTI) {
      const v = rif.map((i) => raw[i][r]).sort((a, b) => a - b);
      mediane[r] = v[Math.floor(v.length / 2)];
    }
    for (const i of idx) {
      const w = affidabilita(cards[i].stats_real);
      for (const r of CORREGGIBILI) raw[i][r] = w * raw[i][r] + (1 - w) * mediane[r];
    }
    const perReparto = {};
    for (const r of REPARTI) perReparto[r] = rif.map((i) => raw[i][r]).sort((a, b) => a - b);
    scale.set(season, perReparto);
  }

  return cards.map((c, i) => {
    const perReparto = scale.get(c.season);
    const reparti = {};
    for (const r of REPARTI) reparti[r] = percentile(raw[i][r], perReparto[r]);
    // Chi non ha i volumi veri porta i reparti calcolati a proxy: la scheda deve
    // poterlo dire ("stima da box score") invece di mostrarli come dati certi.
    return { ...c, reparti, reparti_stimati: !c.stats_vol };
  });
}

// Reparti di una squadra: media semplice dei suoi giocatori, reparto per reparto.
// I minuti di rotazione entreranno qui il giorno in cui la panchina conterà.
export function mediaReparti(cards) {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("mediaReparti: squadra vuota");
  }
  const out = {};
  for (const r of REPARTI) {
    let somma = 0;
    for (const c of cards) {
      const v = c.reparti?.[r];
      if (typeof v !== "number" || !Number.isFinite(v)) {
        throw new Error(`mediaReparti: carta senza reparto '${r}'`);
      }
      somma += v;
    }
    out[r] = Math.round(somma / cards.length);
  }
  return out;
}
