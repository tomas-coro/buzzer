// Script diagnostico (non tocca il gioco): misura quanto un OVR "fatto in casa"
// (formula a mano sui box stats, normalizzata per epoca) si allontana dall'OVR
// vero 2K sulle carte che già ce l'hanno, bucket per decade.
//
// Uso: node data/ovr_stimato_calibrazione.mjs
//
// LIMITE NOTO: la normalizzazione per epoca usa come "media di lega" la media dei
// SOLI giocatori presenti nel nostro dataset per quella stagione. Per le stagioni
// moderne (2014-15..2019-20) sono tutte e 30 le squadre: media di lega vera. Per
// le stagioni leggenda sono solo le squadre curate 2K (spesso le più forti
// dell'anno): la media è alzata verso l'alto, quindi lo scarto misurato lì è un
// limite superiore ottimistico sull'errore reale, non il numero definitivo.

import { readFileSync } from "node:fs";
import { LEGEND_CARDS } from "./legends.js";

function loadModernCards() {
  const txt = readFileSync(new URL("./nba-data.js", import.meta.url), "utf8");
  const m = txt.match(/const NBA_DATA = (\{.*\});\s*$/s);
  return JSON.parse(m[1]).cards;
}

const STAT_KEYS = ["pts", "reb", "ast", "stl", "blk", "tov", "fg_pct", "tp_pct", "ft_pct", "min"];

function seasonStartYear(season) {
  return parseInt(season.slice(0, 4), 10);
}

function decadeOf(season) {
  const y = seasonStartYear(season);
  return `${Math.floor(y / 10) * 10}s`;
}

function cohortStats(cards) {
  const bySeason = new Map();
  for (const c of cards) {
    if (!bySeason.has(c.season)) bySeason.set(c.season, []);
    bySeason.get(c.season).push(c);
  }
  const out = new Map();
  for (const [season, list] of bySeason) {
    const stat = {};
    for (const k of STAT_KEYS) {
      const vals = list.map((c) => c.stats_real[k]);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
      const std = Math.max(Math.sqrt(variance), 0.5); // floor per stagioni con pochi giocatori
      stat[k] = { mean, std };
    }
    out.set(season, stat);
  }
  return out;
}

function z(value, season, key, cohort) {
  const s = cohort.get(season)[key];
  return (value - s.mean) / s.std;
}

// Formula scritta a mano (stile derive.mjs): pesi scelti per riflettere cosa
// pesa davvero su un OVR 2K - volume di punteggio ed efficienza sopra tutto,
// playmaking/rimbalzi/difesa a seguire, palle perse in negativo, minuti come
// proxy della fiducia dello staff tecnico.
function composite(card, cohort) {
  const s = card.stats_real;
  const zz = (key) => z(s[key], card.season, key, cohort);
  return (
    0.95 * zz("pts") +
    0.55 * zz("fg_pct") +
    0.30 * zz("tp_pct") +
    0.20 * zz("ft_pct") +
    0.55 * zz("reb") +
    0.55 * zz("ast") +
    0.40 * zz("stl") +
    0.40 * zz("blk") -
    0.35 * zz("tov") +
    0.30 * zz("min")
  );
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function main() {
  const modern = loadModernCards();
  const legends = LEGEND_CARDS.filter((c) => !c._filler && typeof c.ovr === "number");
  const all = [...modern, ...legends];

  const cohort = cohortStats(all);

  // Calibrazione lineare a occhio: guardo dove cade il composite del dataset
  // moderno (l'unico con vera media di lega) e scelgo intercetta/pendenza in
  // modo che la distribuzione stimata assomigli a quella reale (min 62,
  // mediana 75, p95 87, max 98 - misurati sul dataset moderno).
  const modernComposites = modern.map((c) => composite(c, cohort)).sort((a, b) => a - b);
  const pct = (arr, p) => arr[Math.floor(p * arr.length)];
  const cMedian = pct(modernComposites, 0.5);
  const cP95 = pct(modernComposites, 0.95);
  const INTERCEPT = 75; // ovr mediano reale
  const SLOPE = (87 - 75) / (cP95 - cMedian || 1); // porta il p95 del composite all'87 reale

  function ovrStimato(card) {
    const raw = INTERCEPT + SLOPE * (composite(card, cohort) - cMedian);
    return clamp(Math.round(raw), 25, 99);
  }

  const rows = all.map((c) => ({
    season: c.season,
    decade: decadeOf(c.season),
    origin: modern.includes(c) ? "moderno" : "leggenda",
    real: c.ovr,
    stimato: ovrStimato(c),
  }));
  for (const r of rows) r.err = r.stimato - r.real;

  // --- Report per decade ---
  const byDecade = new Map();
  for (const r of rows) {
    if (!byDecade.has(r.decade)) byDecade.set(r.decade, []);
    byDecade.get(r.decade).push(r);
  }
  const decades = [...byDecade.keys()].sort();

  console.log("=== Scarto OVR stimato vs OVR vero, per decade ===\n");
  console.log("decade".padEnd(8), "n".padStart(5), "MAE".padStart(7), "scarto medio".padStart(14), "correlazione".padStart(14));
  for (const d of decades) {
    const list = byDecade.get(d);
    const mae = list.reduce((a, r) => a + Math.abs(r.err), 0) / list.length;
    const biasMedio = list.reduce((a, r) => a + r.err, 0) / list.length;
    const meanReal = list.reduce((a, r) => a + r.real, 0) / list.length;
    const meanStim = list.reduce((a, r) => a + r.stimato, 0) / list.length;
    let num = 0, denR = 0, denS = 0;
    for (const r of list) {
      num += (r.real - meanReal) * (r.stimato - meanStim);
      denR += (r.real - meanReal) ** 2;
      denS += (r.stimato - meanStim) ** 2;
    }
    const corr = num / (Math.sqrt(denR * denS) || 1);
    console.log(
      d.padEnd(8),
      String(list.length).padStart(5),
      mae.toFixed(2).padStart(7),
      biasMedio.toFixed(2).padStart(14),
      corr.toFixed(2).padStart(14)
    );
  }

  console.log("\n=== Stesso report, separato moderno vs leggenda (leggenda = cohort ottimistico) ===\n");
  const byOrigin = new Map();
  for (const r of rows) {
    if (!byOrigin.has(r.origin)) byOrigin.set(r.origin, []);
    byOrigin.get(r.origin).push(r);
  }
  for (const [origin, list] of byOrigin) {
    const mae = list.reduce((a, r) => a + Math.abs(r.err), 0) / list.length;
    console.log(origin.padEnd(10), "n =", list.length, " MAE =", mae.toFixed(2));
  }

  console.log("\n=== Leggende, stagione per stagione (dalla più vicina al 2014 alla più lontana) ===\n");
  const legendRows = rows.filter((r) => r.origin === "leggenda");
  const bySeasonLegend = new Map();
  for (const r of legendRows) {
    if (!bySeasonLegend.has(r.season)) bySeasonLegend.set(r.season, []);
    bySeasonLegend.get(r.season).push(r);
  }
  const seasonsSorted = [...bySeasonLegend.keys()].sort((a, b) => seasonStartYear(b) - seasonStartYear(a));
  console.log("stagione".padEnd(10), "n".padStart(4), "MAE".padStart(7), "scarto medio".padStart(14));
  for (const s of seasonsSorted) {
    const list = bySeasonLegend.get(s);
    const mae = list.reduce((a, r) => a + Math.abs(r.err), 0) / list.length;
    const bias = list.reduce((a, r) => a + r.err, 0) / list.length;
    console.log(s.padEnd(10), String(list.length).padStart(4), mae.toFixed(2).padStart(7), bias.toFixed(2).padStart(14));
  }

  console.log("\n=== Peggiori 10 scarti (per capire dove la formula si rompe) ===\n");
  const worst = [...rows].sort((a, b) => Math.abs(b.err) - Math.abs(a.err)).slice(0, 10);
  for (const r of worst) {
    console.log(`${r.season}  reale=${r.real}  stimato=${r.stimato}  scarto=${r.err > 0 ? "+" : ""}${r.err}`);
  }
}

main();
