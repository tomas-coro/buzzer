// Il cercatore di TETTI DI SPESA: prova una scala di tetti per ogni livello e
// misura quante corse finiscono 16-0 sotto ognuno.
//
// PERCHÉ ESISTE. I quattro tetti scritti in game/difficulty.js sono nati dalla
// scala dei monte ingaggi storici (le 175 rose del dataset costano 48-246
// milioni), che dice se un numero è PLAUSIBILE, non se è giusto. L'unico giudice
// è la percentuale di 16-0, e quella si misura.
//
// LA PRIMA MISURA HA GIÀ SMENTITO LA SCALA STORICA: la squadra che il banco
// drafta prendendo il meglio di ogni spin costa in media 300 milioni, cioè più
// del superteam più caro di sempre. Normale: non è una rosa vera, è il fiore di
// venti rose diverse. Quindi i tetti veri stanno molto più in alto di 170-100.
//
// Uso:
//   node tools/taratura-tetti.mjs [corse] [da] [a] [passo]   (milioni)
//   node tools/taratura-tetti.mjs 200 150 330 20

import { misura, BERSAGLI } from "./banco-corse.mjs";

const CORSE = Number(process.argv[2] ?? 200);
const DA = Number(process.argv[3] ?? 150);
const A = Number(process.argv[4] ?? 330);
const PASSO = Number(process.argv[5] ?? 20);

const M = 1_000_000;
const scala = [];
for (let t = DA; t <= A; t += PASSO) scala.push(t);

console.log(`taratura tetti: ${CORSE} corse per punto, tetti ${DA}-${A}M passo ${PASSO}\n`);

for (const liv of ["facile", "normale", "difficile", "incubo"]) {
  const bersaglio = BERSAGLI[liv];
  console.log(`${liv.toUpperCase()}  bersaglio ${bersaglio}% di 16-0`);
  console.log("  tetto   strategia   16-0    vittorie   voto tuo   speso medio   sforano");
  const righe = [];
  for (const t of scala) {
    for (const strategia of ["stelle", "quintetto"]) {
      const r = misura(liv, CORSE, null, { tetto: t * M, strategia });
      righe.push({ t, strategia, ...r });
      console.log(
        `  ${String(t).padStart(4)}M   ${strategia.padEnd(8)}  ${r.pct.toFixed(1).padStart(5)}%`
        + `   ${r.vittorie.toFixed(1).padStart(6)}   ${r.voto.toFixed(1).padStart(6)}`
        + `   ${(r.speso / M).toFixed(0).padStart(9)}M   ${r.sforate.toFixed(0).padStart(5)}%`,
      );
    }
  }
  // Il tetto scelto: quello che avvicina di più il bersaglio, con la strategia
  // migliore fra le due. Si tara su quello che si PUÒ fare, non sulla media.
  const perTetto = scala.map((t) => {
    const due = righe.filter((r) => r.t === t);
    return due.reduce((a, b) => (b.pct > a.pct ? b : a));
  });
  const scelto = perTetto.reduce((a, b) =>
    (Math.abs(b.pct - bersaglio) < Math.abs(a.pct - bersaglio) ? b : a));
  console.log(`  -> più vicino al bersaglio: ${scelto.t}M (${scelto.pct.toFixed(1)}%, strategia ${scelto.strategia})\n`);
}
