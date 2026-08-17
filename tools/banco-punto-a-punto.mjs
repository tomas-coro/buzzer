// Banco del punto a punto: simula tante partite vere e misura se i tabellini
// che escono somigliano a quelli della NBA.
//
// PERCHÉ ESISTE. I test dicono che i conti tornano (la somma delle azioni fa il
// punteggio, ogni errore ha il suo rimbalzo). Non dicono se il risultato è
// CREDIBILE: una squadra che chiude 41/42 dalla lunetta supera tutti i test e
// non esiste. Questo banco guarda i numeri veri, come `banco-corse.mjs` fa per
// le corse.
//
//   node tools/banco-punto-a-punto.mjs 200
//
// I bersagli sono le medie NBA moderne. Il pool è di carte storiche di ogni
// epoca, quindi qualche scostamento è giusto che ci sia: i tiratori da tre degli
// anni Ottanta non esistevano.

import { CARDS_BY_TEAM_SEASON } from "../prototype/imbattuto/cards.js";
import { buildHistoricalRose } from "../game/opponents.js";
import { minutiRosa, repartiRosa, MINUTI } from "../game/rosa.js";
import { simulaPartita, rngSeed } from "../game/partita.js";
import { boxScorePartita } from "../game/boxscore.js";
import { playByPlay, log } from "../game/playbyplay.js";
import { votoRosa } from "../game/rating.js";

// Bersagli NBA (stagione 2023-24, medie di squadra a partita).
export const BERSAGLI = {
  "FG%": 47.0,
  "3PA": 35.0,
  "3P%": 36.5,
  FTA: 22.0,
  "TL%": 78.0,
  "punti da lunetta %": 16.0,
  falli: 19.5,
  "secondi per azione": 14.5,
};

const ROTAZIONI = Object.keys(MINUTI);

function giocatori(rosa, rotazione) {
  return minutiRosa(rosa, rotazione).map(({ carta, minuti, ruolo, tipo }) =>
    ({ ...carta, minuti, ruolo, tipo }));
}

export function misura(corse = 200, seme = 1) {
  const pool = buildHistoricalRose(CARDS_BY_TEAM_SEASON);
  const rng = rngSeed(seme);
  const acc = {
    fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, falli: 0, punti: 0,
    azioni: 0, essenziali: 0, partite: 0, secondi: 0, tipi: new Map(),
  };

  for (let n = 0; n < corse; n++) {
    const a = pool[Math.floor(rng() * pool.length) % pool.length];
    const b = pool[Math.floor(rng() * pool.length) % pool.length];
    if (a.team === b.team && a.season === b.season) continue;
    const rotA = ROTAZIONI[Math.floor(rng() * ROTAZIONI.length) % ROTAZIONI.length];
    const rotB = ROTAZIONI[Math.floor(rng() * ROTAZIONI.length) % ROTAZIONI.length];

    const casa = {
      nome: a.team, giocatori: giocatori(a.rosa, rotA), reparti: repartiRosa(a.rosa, rotA),
      ritmo: 0,
    };
    const ospite = {
      nome: b.team, giocatori: giocatori(b.rosa, rotB), reparti: repartiRosa(b.rosa, rotB),
      ritmo: 0,
    };
    const partita = simulaPartita({ casa, ospite, rng: rngSeed(seme + n * 7 + 1) });
    const box = boxScorePartita({
      partita,
      casa: { giocatori: casa.giocatori, reparti: casa.reparti },
      ospite: { giocatori: ospite.giocatori, reparti: ospite.reparti },
      rng: rngSeed(seme + n * 7 + 2),
    });
    const pbp = playByPlay({ partita, box, casa, ospite, rng: rngSeed(seme + n * 7 + 3) });

    for (const lato of ["casa", "ospite"]) {
      for (const t of pbp.tiri[lato]) {
        acc.fgm += t.fgm; acc.fga += t.fga; acc.tpm += t.tpm;
        acc.tpa += t.tpa; acc.ftm += t.ftm; acc.fta += t.fta;
      }
      acc.falli += pbp.falli[lato].reduce((x, y) => x + y, 0);
      acc.punti += partita.punti[lato];
      acc.partite++;
    }
    acc.azioni += pbp.azioni.length;
    acc.essenziali += log(pbp.azioni).length;
    // Quanto dura un'azione: i secondi di gioco divisi le azioni di possesso.
    const possessi = pbp.azioni.filter(
      (x) => x.tipo === "canestro" || x.tipo === "errore" || x.tipo === "stoppata" ||
        x.tipo === "liberi" || x.tipo === "palla-persa" || x.tipo === "recupero").length;
    acc.secondi += (48 * 60 + (partita.quarti.length - 4) * 5 * 60) / Math.max(possessi, 1);
    for (const x of pbp.azioni) acc.tipi.set(x.tipo, (acc.tipi.get(x.tipo) ?? 0) + 1);
  }

  const p = acc.partite;
  const g = p / 2; // partite intere
  return {
    valori: {
      "FG%": 100 * acc.fgm / acc.fga,
      "3PA": acc.tpa / p,
      "3P%": 100 * acc.tpm / acc.tpa,
      FTA: acc.fta / p,
      "TL%": 100 * acc.ftm / acc.fta,
      "punti da lunetta %": 100 * acc.ftm / acc.punti,
      falli: acc.falli / p,
      "secondi per azione": acc.secondi / g,
    },
    extra: {
      "punti per squadra": acc.punti / p,
      "FGA per squadra": acc.fga / p,
      "azioni per partita": acc.azioni / g,
      "righe essenziali": acc.essenziali / g,
      partite: g,
    },
    tipi: acc.tipi,
  };
}

// Stampa solo se lanciato a mano: importarlo da un test non deve sporcare.
if (import.meta.url === `file://${process.argv[1]}`) {
  const corse = Number(process.argv[2] ?? 200);
  const r = misura(corse);
  console.log(`\nBanco punto a punto - ${r.extra.partite} partite\n`);
  console.log("misura".padEnd(24) + "valore".padStart(9) + "bersaglio".padStart(11) + "  scarto");
  for (const [k, v] of Object.entries(r.valori)) {
    const b = BERSAGLI[k];
    const d = ((v - b) / b) * 100;
    console.log(
      k.padEnd(24) + v.toFixed(1).padStart(9) + b.toFixed(1).padStart(11) +
      `  ${d >= 0 ? "+" : ""}${d.toFixed(0)}%`);
  }
  console.log("");
  for (const [k, v] of Object.entries(r.extra)) {
    console.log(k.padEnd(24) + v.toFixed(1).padStart(9));
  }
  console.log("\nazioni per tipo, a partita");
  const tot = r.extra.partite;
  for (const [k, v] of [...r.tipi].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(16)}${(v / tot).toFixed(1).padStart(7)}`);
  }
}
