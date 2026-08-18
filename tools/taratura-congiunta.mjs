// Il calibratore CONGIUNTO: tetto di spesa e soglie avversarie insieme.
//
// PERCHÉ NON BASTAVANO I DUE CERCATORI SEPARATI. taratura-tetti.mjs cercava il
// tetto tenendo ferme le soglie, taratura-soglie.mjs cercava le soglie tenendo
// fermo il tetto. Le due leve però tirano la stessa corda: ogni volta che una si
// muove, l'altra è da rifare. Lanciarli a turno significa inseguirsi.
//
// LA SEPARAZIONE GIUSTA NON È "PRIMA UNA POI L'ALTRA", È PER RUOLO.
//   Il TETTO decide COME si sente la difficoltà: quanto spesso, draftando
//   d'istinto, finisci a pagare la tassa dell'apron. È una proprietà che il
//   giocatore VEDE mentre gioca, quindi si sceglie a tavolino (il "morso" qui
//   sotto) e si misura per conferma. Non dipende dalle soglie: il draft finisce
//   prima che la prima partita cominci.
//   Le SOGLIE decidono QUANTE corse finiscono 16-0. È un numero che il giocatore
//   non vede mai, quindi non si sceglie: si misura e si insegue il bersaglio.
//
// Da qui i due passi: 1) fisso il tetto sul morso voluto, 2) cerco le soglie che
// centrano il bersaglio CON quel tetto.
//
// IL MORSO È LA DECISIONE DI DESIGN, ed è quella presa con Tomas il 2026-08-18:
// "a Facile va bene potersi fare lo squadrone, ma già a Normale non dev'essere
// scontato". Tradotto in numeri: la quota di corse che sforano il tetto
// draftando a stelle, cioè prendendo sempre il più forte firmabile.
//
// Uso:
//   node tools/taratura-congiunta.mjs                 (ricerca 200, conferma 800)
//   node tools/taratura-congiunta.mjs 300 1500

import { misura, BERSAGLI } from "./banco-corse.mjs";
import { CARDS_BY_TEAM_SEASON } from "../prototype/imbattuto/cards.js";
import { opponentPool } from "../prototype/imbattuto/pool.js";
import { DIFFICULTIES, TETTI } from "../game/difficulty.js";

const CORSE_RICERCA = Number(process.argv[2] ?? 200);
const CORSE_CONFERMA = Number(process.argv[3] ?? 800);
const M = 1_000_000;

const voti = opponentPool(CARDS_BY_TEAM_SEASON).map((o) => o.voto.ovr).sort((a, b) => a - b);
const TETTO_POOL = voti[voti.length - 1];
const PAVIMENTO_POOL = voti[0];

// Il morso voluto, livello per livello: percentuale di corse che finiscono
// sopra il tetto draftando a stelle. Facile lascia passare lo squadrone tre
// volte su dieci; Incubo quasi mai gratis.
const MORSO = { facile: 30, normale: 55, difficile: 70, incubo: 85 };

// La scala di tetti provata. Sotto i 200 milioni il draft vive di minimi e il
// gioco smette di avere scelte; sopra i 380 il tetto non tocca più niente,
// perché il draft a stelle costa circa 300.
const SCALA_TETTI = [380, 360, 340, 320, 300, 280, 260, 240, 220, 200];

// La larghezza della banda avversari, cioè di quanto sale il voto dell'avversario
// fra il round 1 e il round 16. Venti punti sono la rampa che Facile aveva già
// (41-62) e che gli altri livelli avevano perso: Difficile e Incubo erano finiti
// a 63-69, sei punti, cioè sedici partite tutte uguali contro il meglio del pool.
// Una banda stretta non è più difficile, è solo più piatta.
const BANDA = 20;

const tolleranza = (bersaglio) => Math.max(0.25, bersaglio * 0.2);
// Un bersaglio raro ha bisogno di più corse: allo 0,5%, 400 corse sono DUE
// successi, cioè rumore. Il fattore alza il campione dove serve, fino a 10×.
const fattore = (bersaglio) => Math.min(10, Math.max(1, 12 / bersaglio));

const pctS = (x) => `${x.toFixed(1)}%`.padStart(6);

// ---------------------------------------------------------------------------
// PASSO 1 - il tetto, dal morso.
// ---------------------------------------------------------------------------
function cercaTetto(livello) {
  const voluto = MORSO[livello];
  console.log(`\n${livello.toUpperCase()}  morso voluto ${voluto}% di corse sopra il tetto`);
  console.log("  tetto    sforano   16-0(con soglie di oggi)   speso");
  let migliore = null;
  for (const t of SCALA_TETTI) {
    const r = misura(livello, CORSE_RICERCA, null, { tetto: t * M, strategia: "stelle" });
    console.log(`  ${String(t).padStart(4)}M   ${pctS(r.sforate)}   ${pctS(r.pct).padStart(22)}`
      + `   ${(r.speso / M).toFixed(0).padStart(4)}M`);
    // `r` porta dentro anche una chiave `tetto` (in dollari): va messa PRIMA,
    // altrimenti lo spread cancella il tetto in milioni e il conto sotto lo
    // moltiplica una seconda volta.
    if (!migliore || Math.abs(r.sforate - voluto) < Math.abs(migliore.sforate - voluto)) {
      migliore = { ...r, tettoM: t };
    }
  }
  console.log(`  -> tetto scelto: ${migliore.tettoM}M (morso ${migliore.sforate.toFixed(0)}%)`);
  return migliore.tettoM * M;
}

// ---------------------------------------------------------------------------
// PASSO 2 - le soglie, dal bersaglio, con quel tetto.
// ---------------------------------------------------------------------------
//
// `oppMax` è la manopola grossa (il voto dell'avversario del round 16, la
// partita che spezza quasi tutte le corse) e la percentuale di 16-0 scende
// quando sale: si bisezione sugli interi. `oppMin` è la manopola di riserva,
// per quando la bisezione sbatte contro un estremo del pool.
function cercaSoglie(livello, tetto) {
  const bersaglio = BERSAGLI[livello];
  const tol = tolleranza(bersaglio);
  const corse = Math.round(CORSE_RICERCA * fattore(bersaglio));

  console.log(`\n${livello.toUpperCase()}  bersaglio ${bersaglio}% \u00b1${tol.toFixed(2)}`
    + `  (tetto ${(tetto / M).toFixed(0)}M, ${corse} corse per prova)`);

  const prova = (min, max) => {
    const t0 = Date.now();
    const m = misura(livello, corse, { oppMin: min, oppMax: max }, { tetto, strategia: "stelle" });
    console.log(`  ${String(min).padStart(2)}-${String(max).padStart(2)}  ${pctS(m.pct)}`
      + `  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    return m;
  };

  // LA BANDA SCORRE, NON SI DEFORMA. Prima si muoveva solo `oppMax` e `oppMin`
  // restava dov'era: col tetto di spesa addosso un livello può aver bisogno di
  // avversari più deboli DAPPERTUTTO, non solo in finale, e quella ricerca non
  // sapeva scendere. Qui la manopola è una sola - `x`, dove comincia la banda -
  // e la larghezza resta fissa, così la rampa dal round 1 al round 16 ha la
  // stessa forma a ogni livello e la difficoltà torna a essere un numero solo,
  // monotono: più alto x, meno corse finiscono 16-0.
  const banda = (x) => {
    const min = Math.max(PAVIMENTO_POOL, Math.min(TETTO_POOL - 1, x));
    return { min, max: Math.min(TETTO_POOL, min + BANDA) };
  };

  // Bisezione su x. Gli estremi sono il pool: sotto il pavimento non c'è niente
  // da pescare, sopra il tetto la banda si schiaccia sulla squadra più forte.
  let lo = PAVIMENTO_POOL, hi = TETTO_POOL - 1;
  let best = null, bestX = lo;
  while (lo <= hi) {
    const x = Math.floor((lo + hi) / 2);
    const b = banda(x);
    const m = prova(b.min, b.max);
    if (!best || Math.abs(m.pct - bersaglio) < Math.abs(best.pct - bersaglio)) { best = m; bestX = x; }
    if (Math.abs(m.pct - bersaglio) <= tol) break;
    if (m.pct > bersaglio) lo = x + 1; else hi = x - 1;
  }

  const b = banda(bestX);
  const fuori = Math.abs(best.pct - bersaglio) <= tol ? null
    : (best.pct > bersaglio
      ? "pool esaurito: nemmeno gli avversari più forti bastano"
      : "tetto troppo stretto: nemmeno gli avversari più deboli bastano");
  return { oppMin: b.min, oppMax: b.max, pct: best.pct, fuori };
}

// ---------------------------------------------------------------------------
const scelte = {};
console.log(`calibratore congiunto - pool ${PAVIMENTO_POOL}-${TETTO_POOL}`
  + `, ricerca ${CORSE_RICERCA} corse, conferma ${CORSE_CONFERMA}`);
console.log(`bersagli 16-0: ${JSON.stringify(BERSAGLI)}`);

// I tetti si possono passare da riga di comando per rifare solo il passo 2:
//   node tools/taratura-congiunta.mjs 200 800 320,280,260,240
const TETTI_DATI = process.argv[4]?.split(",").map(Number);
if (TETTI_DATI) {
  console.log("\n=== PASSO 1 saltato: tetti dati a mano ===");
  Object.keys(DIFFICULTIES).forEach((liv, i) => { scelte[liv] = { tetto: TETTI_DATI[i] * M }; });
} else {
  console.log("\n=== PASSO 1: i tetti, dal morso ===");
  for (const liv of Object.keys(DIFFICULTIES)) scelte[liv] = { tetto: cercaTetto(liv) };
}

console.log("\n=== PASSO 2: le soglie, dal bersaglio ===");
for (const liv of Object.keys(DIFFICULTIES)) {
  Object.assign(scelte[liv], cercaSoglie(liv, scelte[liv].tetto));
}

console.log("\n=== CONFERMA a " + CORSE_CONFERMA + " corse ===");
console.log("livello     tetto   soglie   16-0    bersaglio   sforano   note");
for (const liv of Object.keys(DIFFICULTIES)) {
  const s = scelte[liv];
  const corse = Math.round(CORSE_CONFERMA * fattore(BERSAGLI[liv]));
  const m = misura(liv, corse, { oppMin: s.oppMin, oppMax: s.oppMax },
    { tetto: s.tetto, strategia: "stelle" });
  console.log(liv.padEnd(10), `${(s.tetto / M).toFixed(0)}M`.padStart(6),
    `${s.oppMin}-${s.oppMax}`.padStart(8), pctS(m.pct), `${BERSAGLI[liv]}%`.padStart(10),
    pctS(m.sforate), " ", s.fuori ?? "");
}

// La scala deve restare monotona: chi sale di livello deve trovare meno soldi e
// avversari non più deboli. Se la ricerca la rompe, va detto, non nascosto.
const ordine = ["facile", "normale", "difficile", "incubo"];
const tetti = ordine.map((l) => scelte[l].tetto);
const min = ordine.map((l) => scelte[l].oppMin);
const max = ordine.map((l) => scelte[l].oppMax);
const mono = (a, cmp) => a.every((v, i) => i === 0 || cmp(a[i - 1], v));
console.log("\nmonotonia  tetti:", mono(tetti, (p, v) => p >= v) ? "ok" : "ROTTA",
  " oppMin:", mono(min, (p, v) => p <= v) ? "ok" : "ROTTA",
  " oppMax:", mono(max, (p, v) => p <= v) ? "ok" : "ROTTA");
console.log("\nda incollare in game/difficulty.js:");
console.log("TETTI =", JSON.stringify(Object.fromEntries(ordine.map((l) => [l, scelte[l].tetto])), null, 2));
for (const l of ordine) console.log(`  ${l}: oppMin ${scelte[l].oppMin}, oppMax ${scelte[l].oppMax}`);
