import { chiavePersona, medieCarriera } from "../../game/boxscore.js";

const KEY = "imbattuto:runs";
const BACKUP_KEY = "imbattuto:runs:backup";
const CURRENT_KEY = "imbattuto:current";
const MAX_RUNS = 100;

export function saveCurrentRun(store, current) {
  try { store.setItem(CURRENT_KEY, JSON.stringify(current)); } catch { /* storage non disponibile */ }
}

export function loadCurrentRun(store) {
  try {
    const current = JSON.parse(store.getItem(CURRENT_KEY));
    const stato = current?.state?.stato;
    const valid = ["draft", "coach", "run"].includes(stato)
      && (stato !== "draft" || Array.isArray(current.draftView?.cards));
    return valid ? current : null;
  } catch { return null; }
}

export function clearCurrentRun(store) {
  try { store.removeItem(CURRENT_KEY); } catch { /* storage non disponibile */ }
}

function readAll(store) {
  for (const key of [KEY, BACKUP_KEY]) {
    try {
      const runs = JSON.parse(store.getItem(key));
      if (Array.isArray(runs)) return runs;
    } catch { /* prova la copia di sicurezza */ }
  }
  return [];
}
function writeAll(store, runs) {
  try {
    const old = store.getItem(KEY);
    if (old) try { store.setItem(BACKUP_KEY, old); } catch { /* backup best effort */ }
    store.setItem(KEY, JSON.stringify(runs.slice(-MAX_RUNS)));
    return true;
  } catch { return false; }
}

export function recordRun(store, run) {
  return writeAll(store, [...readAll(store), { ...run, ts: Date.now() }]);
}

export function leaderboard(store, formato, difficolta) {
  return readAll(store)
    .filter((r) => r.formato === formato && r.difficolta === difficolta)
    .sort((a, b) => b.vittorie - a.vittorie);
}

export function lifetimeStats(store) {
  const runs = readAll(store);
  return {
    runs: runs.length,
    imbattuti: runs.filter((r) => r.esito === "imbattuto").length,
    // "campione" è l'esito vittorioso del formato playoff (vedi resolveSeriesGame
    // in game/run.js): conteggio separato da "imbattuti" perché sono corse di
    // formato diverso, non la stessa cosa con un nome diverso.
    campioni: runs.filter((r) => r.esito === "campione").length,
    migliorStreak: runs.reduce((m, r) => Math.max(m, r.vittorie), 0),
  };
}

// I giocatori più usati, con carriera e record, aggregati su tutte le run
// salvate. Ogni run porta `roster` (nome -> player_id/team_abbr/season, la
// rosa allenata di quella corsa) e `perRound` (una riga box per round, stesso
// nome scritto da `boxScore` in game/boxscore.js). Le run vecchie, salvate
// prima che questi due campi esistessero, non hanno né l'uno né l'altro: si
// escludono, non c'è dato da cui derivarle.
export function profiloGiocatori(store) {
  const runs = readAll(store).filter((r) => r.roster && r.perRound);

  const righe = [];
  const ultimo = new Map(); // chiavePersona -> { ts, player_id, team_abbr, season }
  for (const r of runs) {
    for (const round of r.perRound) {
      for (const riga of round) {
        righe.push(riga);
        const info = r.roster[riga.nome];
        if (!info) continue;
        const k = chiavePersona(riga.nome);
        const visto = ultimo.get(k);
        if (!visto || visto.ts < r.ts) ultimo.set(k, { ts: r.ts, ...info });
      }
    }
  }

  return medieCarriera(righe).map((v) => {
    const u = ultimo.get(v.chiave);
    return {
      nome: v.nome,
      presenze: v.gp,
      medie: v.medie,
      totali: v.somma,
      record: v.max,
      player_id: u?.player_id ?? null,
      ultimo: u ? { team_abbr: u.team_abbr, season: u.season } : null,
    };
  });
}
