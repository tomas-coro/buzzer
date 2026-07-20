import { test } from "node:test";
import assert from "node:assert/strict";
import { recordRun, leaderboard, lifetimeStats } from "./meta.js";

// finto localStorage: solo getItem/setItem su una Map
function fakeStore() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
}

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
