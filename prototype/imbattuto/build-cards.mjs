// Genera cards.js: carte per-stagione di buzzer (nome/team/stagione/OVR + box score reale).
// La carta porta le STATS REALI (stats_real) e l'overall 2K reale; niente più attributi
// derivati (il motore vota la squadra sulla media degli overall). La posizione primaria +
// secondaria viene dalle % minuti/ruolo di Basketball-Reference (posMap); fallback a nba-sim
// o inferenza da box score. Esegui: node prototype/imbattuto/build-cards.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { inferPosition } from "./derive.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");

// --- buzzer: NBA_DATA (per-stagione) ---
const buzSrc = readFileSync(resolve(root, "data/nba-data.js"), "utf8");
const buz = JSON.parse(buzSrc.slice(buzSrc.indexOf("{"), buzSrc.lastIndexOf("}") + 1));

// --- nba-sim: PLAYERS (solo posizione primaria, per nome; fallback se manca in posMap) ---
const simSrc = readFileSync(resolve(root, "mockups/59-players-data.js"), "utf8");
const simArr = JSON.parse(simSrc.match(/const PLAYERS=(\[[\s\S]*?\]);/)[1]);
const sim = new Map(simArr.map((p) => [p.n, p]));

// --- posizioni REALI primario+secondario (da Basketball-Reference play-by-play, % minuti/ruolo).
// Generato da tools/build-positions.py. Chiave = "nome-normalizzato|stagione". È la fonte
// autorevole del doppio ruolo: ha priorità su match.p/inferPosition (che danno solo il primario).
const posMap = JSON.parse(readFileSync(resolve(root, "data/positions-pbp.json"), "utf8"));
const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);
function normalizeName(name) {
  const ascii = name.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const clean = ascii.toLowerCase().replace(/\./g, " ").replace(/-/g, " ").replace(/'/g, "");
  return clean.split(/\s+/).filter((t) => t && !SUFFIXES.has(t)).join(" ");
}

// Validazione: overall + box score devono esserci, niente carta monca (no fallback silenzioso).
const STAT_KEYS = ["pts", "reb", "ast", "stl", "blk", "tov", "fg_pct", "tp_pct", "ft_pct", "min", "gp"];

function toCard(c) {
  if (typeof c.ovr !== "number" || !Number.isFinite(c.ovr)) {
    throw new Error(`Carta '${c.name}' (${c.season}) senza overall valido`);
  }
  if (!c.stats_real || STAT_KEYS.some((k) => c.stats_real[k] == null)) {
    throw new Error(`Carta '${c.name}' (${c.season}) con box score incompleto`);
  }
  // Posizione: priorità alle % minuti/ruolo reali (posMap), poi match nba-sim, poi inferenza.
  // estimated = true solo quando la posizione è dedotta dal box score (nessuna fonte reale).
  const match = sim.get(c.name);
  let pos, estimated;
  if (match) {
    pos = { primary: match.p, secondary: null };
    estimated = false;
  } else {
    pos = inferPosition(c.stats_real);
    estimated = true;
  }
  const real = posMap[`${normalizeName(c.name)}|${c.season}`];
  if (real) {
    pos = { primary: real.primary, secondary: real.secondary };
    estimated = false;
  }
  return {
    player_id: c.player_id, name: c.name, season: c.season,
    team: c.team, team_abbr: c.team_abbr, ovr: c.ovr,
    pos, stats_real: c.stats_real, estimated,
  };
}

const byKey = {};
for (const c of buz.cards) {
  const card = toCard(c);
  const key = `${card.team_abbr}|${card.season}`;
  (byKey[key] ||= []).push(card);
}
const all = Object.values(byKey).flat();

const out =
  "// GENERATO da prototype/imbattuto/build-cards.mjs - non modificare a mano\n" +
  `export const CARDS_BY_TEAM_SEASON = ${JSON.stringify(byKey)};\n` +
  `export const ALL_CARDS = ${JSON.stringify(all)};\n`;
writeFileSync(resolve(here, "cards.js"), out);
const nEst = all.filter((c) => c.estimated).length;
console.log(`cards.js scritto: ${all.length} carte, ${Object.keys(byKey).length} team-stagione, ${nEst} estimated`);
