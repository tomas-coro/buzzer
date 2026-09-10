import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clearCurrentRun, loadCurrentRun, recordRun, saveCurrentRun,
  leaderboard, lifetimeStats, profiloGiocatori,
} from "./meta.js";

// finto localStorage: solo getItem/setItem su una Map
function fakeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
}

test("la run corrente sopravvive al reload e può essere cancellata", () => {
  const s = fakeStore();
  const current = { state: { stato: "draft", vittorie: 0 }, ui: null, draftView: { key: "BOS|2024-25" } };
  saveCurrentRun(s, current);
  assert.deepEqual(loadCurrentRun(s), current);
  clearCurrentRun(s);
  assert.equal(loadCurrentRun(s), null);
});

test("una run salvata corrotta viene ignorata", () => {
  const s = fakeStore();
  s.setItem("imbattuto:current", "non-json");
  assert.equal(loadCurrentRun(s), null);
});

test("recordRun + leaderboard: ordina per vittorie desc nel bucket", () => {
  const s = fakeStore();
  recordRun(s, { formato: "playoff", difficolta: "normale", vittorie: 3, esito: "sconfitta" });
  recordRun(s, { formato: "playoff", difficolta: "normale", vittorie: 6, esito: "imbattuto" });
  recordRun(s, { formato: "playoff", difficolta: "facile", vittorie: 4, esito: "imbattuto" });
  const lb = leaderboard(s, "playoff", "normale");
  assert.deepEqual(lb.map((r) => r.vittorie), [6, 3]); // solo il bucket normale, ordinato
});

test("lifetimeStats aggrega run/imbattuti/miglior streak", () => {
  const s = fakeStore();
  recordRun(s, { formato: "playoff", difficolta: "normale", vittorie: 3, esito: "sconfitta" });
  recordRun(s, { formato: "playoff", difficolta: "normale", vittorie: 6, esito: "imbattuto" });
  const st = lifetimeStats(s);
  assert.equal(st.runs, 2);
  assert.equal(st.imbattuti, 1);
  assert.equal(st.migliorStreak, 6);
});

test("leaderboard di un bucket vuoto è []", () => {
  assert.deepEqual(leaderboard(fakeStore(), "sfida", "incubo"), []);
});

test("profiloGiocatori aggrega presenze, medie e record per persona su più run", async () => {
  const s = fakeStore();
  recordRun(s, {
    formato: "imbattuto", difficolta: "normale", vittorie: 2, esito: "sconfitta",
    roster: { "Stephen Curry": { player_id: "stephen-curry", team_abbr: "GSW", season: "2015-16" } },
    perRound: [
      [{ nome: "Stephen Curry", tot: { pts: 30, reb: 5, ast: 6, stl: 2, tov: 3, blk: 0 } }],
      [{ nome: "Stephen Curry", tot: { pts: 20, reb: 4, ast: 8, stl: 1, tov: 2, blk: 0 } }],
    ],
  });
  // ts diversi per capire chi è "l'ultimo": recordRun timbra Date.now(), qui aspettiamo un tick.
  await new Promise((r) => setTimeout(r, 2));
  recordRun(s, {
    formato: "imbattuto", difficolta: "normale", vittorie: 1, esito: "sconfitta",
    roster: { "Stephen Curry": { player_id: "stephen-curry", team_abbr: "GSW", season: "2018-19" } },
    perRound: [
      [{ nome: "Stephen Curry", tot: { pts: 40, reb: 6, ast: 5, stl: 0, tov: 1, blk: 1 } }],
    ],
  });

  const profilo = profiloGiocatori(s);

  assert.equal(profilo.length, 1);
  const g = profilo[0];
  assert.equal(g.nome, "Stephen Curry");
  assert.equal(g.presenze, 3);
  assert.equal(g.medie.pts, 30); // (30+20+40)/3
  assert.equal(g.record.pts, 40);
  assert.equal(g.player_id, "stephen-curry");
  assert.deepEqual(g.ultimo, { team_abbr: "GSW", season: "2018-19" }); // dalla run più recente
});

test("profiloGiocatori ignora le run vecchie senza roster/perRound", () => {
  const s = fakeStore();
  recordRun(s, { formato: "imbattuto", difficolta: "normale", vittorie: 3, esito: "sconfitta" });
  assert.deepEqual(profiloGiocatori(s), []);
});
