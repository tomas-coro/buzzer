const KEY = "imbattuto:runs";

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
