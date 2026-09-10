import { chiavePersona, medieCarriera } from "../../game/boxscore.js";

const KEY = "imbattuto:runs";
const CURRENT_KEY = "imbattuto:current";

export function saveCurrentRun(store, current) {
  try { store.setItem(CURRENT_KEY, JSON.stringify(current)); } catch { /* storage non disponibile */ }
}

export function loadCurrentRun(store) {
  try {
    const raw = store.getItem(CURRENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearCurrentRun(store) {
  try { store.removeItem(CURRENT_KEY); } catch { /* storage non disponibile */ }
}

function readAll(store) {
  const raw = store.getItem(KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}
function writeAll(store, runs) {
  store.setItem(KEY, JSON.stringify(runs));
}

export function recordRun(store, run) {
  const runs = readAll(store);
  runs.push({ ...run, ts: Date.now() });
  writeAll(store, runs);
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
