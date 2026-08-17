// Cerca le soglie oppMin/oppMax che centrano i bersagli di 16-0.
//
// PERCHÉ SERVE UN CERCATORE E NON DUE NUMERI A OCCHIO. La probabilità di
// chiudere 16-0 non si legge dalle soglie: dipende da quanto forte riesci a
// draftare, da cosa ti dà il coach e da sedici partite con varianza. L'unico
// modo di saperlo è misurarlo, e l'unico modo di tararlo è misurarlo tante
// volte. Il banco (tools/banco-corse.mjs) fa la misura, questo file la ripete
// spostando le soglie finché il numero non cade sul bersaglio.
//
// COME CERCA
//   1. `oppMax` è la manopola grossa: è il voto dell'avversario del sedicesimo
//      round, cioè la partita che spezza quasi tutte le corse. Salendo, la
//      percentuale di 16-0 scende. Si cerca per bisezione sugli interi.
//   2. Se anche al tetto del pool la corsa resta troppo facile, si alza
//      `oppMin`: vuol dire che il livello va reso più duro fin dai primi round.
//
// Il tetto è il voto della squadra più forte del pool: oltre non c'è niente da
// pescare, e una soglia più alta del massimo farebbe pescare sedici volte la
// stessa squadra (era il bug delle vecchie soglie 70-99 sulla scala 2K).
//
// Uso:
//   node tools/taratura-soglie.mjs            (cerca a 200 corse, conferma a 800)
//   node tools/taratura-soglie.mjs 400 1500   (cerca a 400, conferma a 1500)

import { misura, BERSAGLI } from "./banco-corse.mjs";
import { CARDS_BY_TEAM_SEASON } from "../prototype/imbattuto/cards.js";
import { opponentPool } from "../prototype/imbattuto/pool.js";

const CORSE_RICERCA = Number(process.argv[2] ?? 200);
const CORSE_CONFERMA = Number(process.argv[3] ?? 800);

const voti = opponentPool(CARDS_BY_TEAM_SEASON).map((o) => o.voto.ovr).sort((a, b) => a - b);
const TETTO = voti[voti.length - 1];
const PAVIMENTO = voti[0];

// Punto di partenza della ricerca: le vecchie soglie riportate sulla scala del
// pool nuovo (le rose da 10 pesate per minuti stanno tra PAVIMENTO e TETTO,
// più in basso della vecchia top-5). Non sono la risposta, sono il primo
// tentativo: da qui in poi decide la misura.
const PARTENZA = {
  facile:    { oppMin: 41, oppMax: 60 },
  normale:   { oppMin: 42, oppMax: 65 },
  difficile: { oppMin: 42, oppMax: TETTO },
  incubo:    { oppMin: 50, oppMax: TETTO },
};

// Quanto lontano dal bersaglio si accetta di stare, in punti percentuali.
const tolleranza = (bersaglio) => Math.max(0.25, bersaglio * 0.2);

// Quante corse servono per misurare un bersaglio raro. Un livello che deve
// finire 16-0 mezza volta su cento non si misura con le stesse corse di uno che
// ci arriva quattro volte su dieci: con 400 corse, lo 0,5% sono DUE corse
// riuscite, e due corse sono rumore, non una misura. Il fattore alza il
// campione dove il bersaglio è raro, e si ferma a 10× per non fare notte.
const fattore = (bersaglio) => Math.min(10, Math.max(1, 12 / bersaglio));

function cerca(livello) {
  const bersaglio = BERSAGLI[livello];
  const tol = tolleranza(bersaglio);
  const corse = Math.round(CORSE_RICERCA * fattore(bersaglio));
  let { oppMin } = PARTENZA[livello];

  const prova = (min, max) => {
    const t = Date.now();
    const m = misura(livello, corse, { oppMin: min, oppMax: max });
    process.stderr.write(
      `  ${livello} ${min}-${max} → ${m.pct.toFixed(2)}%  (${corse} corse, ${((Date.now() - t) / 1000).toFixed(1)}s)\n`);
    return m;
  };

  // PASSO 1 - il pavimento. Col tetto del pool come soglia finale la corsa è
  // dura quanto può esserlo: se anche così finisce 16-0 troppo spesso, l'unica
  // manopola che resta è alzare il livello dei PRIMI round.
  let alTetto = prova(oppMin, TETTO);
  while (alTetto.pct > bersaglio + tol && oppMin < TETTO - 6) {
    oppMin += 1;
    alTetto = prova(oppMin, TETTO);
  }
  if (alTetto.pct > bersaglio + tol) {
    return { ...alTetto, fuori: "pool esaurito: nemmeno il tetto basta" };
  }

  // PASSO 2 - il tetto. Con il pavimento fissato, la percentuale scende al
  // salire di oppMax: bisezione sugli interi, sei passi coprono la banda.
  let basso = oppMin, alto = TETTO, migliore = alTetto;
  while (basso <= alto) {
    const mezzo = Math.floor((basso + alto) / 2);
    const m = prova(oppMin, mezzo);
    if (Math.abs(m.pct - bersaglio) < Math.abs(migliore.pct - bersaglio)) migliore = m;
    if (Math.abs(m.pct - bersaglio) <= tol) break;
    if (m.pct > bersaglio) basso = mezzo + 1; else alto = mezzo - 1;
  }
  const fuori = Math.abs(migliore.pct - bersaglio) <= tol ? null : "bersaglio non centrato";
  return { ...migliore, fuori };
}

console.error(`pool: ${voti.length} squadre, voto da ${PAVIMENTO} a ${TETTO}`);
console.error(`ricerca a ${CORSE_RICERCA} corse, conferma a ${CORSE_CONFERMA}\n`);

const trovate = {};
for (const livello of Object.keys(BERSAGLI)) {
  const r = cerca(livello);
  trovate[livello] = { oppMin: r.oppMin, oppMax: r.oppMax, fuori: r.fuori ?? null };
  console.error(`  → ${livello}: ${r.oppMin}-${r.oppMax}${r.fuori ? ` (${r.fuori})` : ""}\n`);
}

// Conferma su tante corse: la ricerca gira su poche per essere veloce, ma il
// numero che finisce nel commento di difficulty.js deve essere solido.
console.log(`taratura confermata (${CORSE_CONFERMA} corse × il fattore del bersaglio)\n`);
console.log("livello    soglie      voto tuo  vittorie medie   16-0    bersaglio");
for (const livello of Object.keys(BERSAGLI)) {
  const { oppMin, oppMax } = trovate[livello];
  const m = misura(livello, Math.round(CORSE_CONFERMA * fattore(BERSAGLI[livello])),
    { oppMin, oppMax });
  console.log(
    livello.padEnd(10),
    `${oppMin}-${oppMax}`.padEnd(11),
    m.voto.toFixed(1).padStart(6),
    m.vittorie.toFixed(1).padStart(14),
    (m.pct.toFixed(1) + "%").padStart(8),
    (BERSAGLI[livello] + "%").padStart(10),
    trovate[livello].fuori ? ` ⚠ ${trovate[livello].fuori}` : "",
  );
}
