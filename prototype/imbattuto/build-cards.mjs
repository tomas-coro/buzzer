// Genera cards.js: carte per-stagione di buzzer (nome/team/stagione/OVR + box score reale).
// La carta porta le STATS REALI (stats_real) e l'overall 2K reale; niente più attributi
// derivati (il motore vota la squadra sulla media degli overall). La posizione primaria +
// secondaria viene dalle % minuti/ruolo di Basketball-Reference (posMap); fallback a nba-sim
// o inferenza da box score. Esegui: node prototype/imbattuto/build-cards.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { inferPosition } from "./derive.mjs";
import { assegnaReparti } from "../../game/reparti.js";

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

// --- volumi di tiro e rimbalzi divisi (Basketball-Reference, totali di stagione).
// Generato da tools/build-shooting.py. Senza questi, "tiro da tre" sarebbe solo una
// percentuale senza volume e un centro con tre triple riuscite sembrerebbe un
// tiratore. Chi non è nella mappa tiene i reparti a proxy (vedi game/reparti.js).
const volMapRaw = JSON.parse(readFileSync(resolve(root, "data/shooting-br.json"), "utf8"));

const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);
// Lettere che NFKD non scompone (turco, polacco, danese): senza queste, Ömer Aşık
// non trova mai "omer asik".
const LETTERE = { "ı": "i", "ğ": "g", "ş": "s", "ł": "l", "ø": "o", "đ": "d", "ð": "d", "þ": "t" };
// Giocatori che le due fonti chiamano in modo diverso. Basketball-Reference usa il
// nome attuale anche per le stagioni vecchie: Enes Kanter oggi è Enes Freedom.
const ALIAS = { "enes kanter": "enes freedom", "nicolas claxton": "nic claxton" };

// Normalizzazione "storica", gemella di quella in tools/build-positions.py: la usa
// positions-pbp.json, quindi non si tocca senza rigenerare quel file.
function normalizeName(name) {
  const ascii = name.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const clean = ascii.toLowerCase().replace(/\./g, " ").replace(/-/g, " ").replace(/'/g, "");
  return clean.split(/\s+/).filter((t) => t && !SUFFIXES.has(t)).join(" ");
}

// Normalizzazione più tollerante, usata solo per agganciare i volumi di tiro. Le due
// fonti scrivono gli stessi giocatori in modi diversi, e ogni mancato aggancio è una
// carta che perde i dati veri: qui vale la pena essere elastici.
function chiaveVolumi(name) {
  const ascii = name.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const clean = ascii.toLowerCase().replace(/[ığşłøðđþ]/g, (c) => LETTERE[c] ?? c)
    .replace(/\./g, " ").replace(/-/g, " ").replace(/'/g, "");
  // Il suffisso si toglie solo se sta in fondo: "JR Smith" ha le iniziali davanti, e
  // la vecchia normalizzazione lo riduceva a "smith" scambiando J.R. per "junior".
  const tok = clean.split(/\s+/).filter((t, i) => t && !(i > 0 && SUFFIXES.has(t)));
  // Iniziali puntate: le due fonti scrivono "CJ Miles" e "C.J. Miles". Attaccando le
  // iniziali singole, le due grafie diventano la stessa chiave.
  const uniti = [];
  for (const t of tok) {
    if (t.length === 1 && uniti.length && uniti[uniti.length - 1].length <= 2
        && uniti[uniti.length - 1].length === 1) {
      uniti[uniti.length - 1] += t;
    } else uniti.push(t);
  }
  const finale = uniti.join(" ");
  return ALIAS[finale] ?? finale;
}

// Le chiavi del file dei volumi arrivano dalla normalizzazione dello scraper: le
// rimappo con quella tollerante, così i due lati dell'aggancio parlano la stessa lingua.
const volMap = {};
for (const [k, v] of Object.entries(volMapRaw)) {
  const [nome, season] = k.split("|");
  volMap[`${chiaveVolumi(nome)}|${season}`] = v;
}

// Validazione: overall + box score devono esserci, niente carta monca (no fallback silenzioso).
// plus_minus è nell'elenco perché serve al reparto Difesa (vedi game/reparti.js):
// senza, la stima difensiva resterebbe appesa a stoppate e palle rubate soltanto.
const STAT_KEYS = ["pts", "reb", "ast", "stl", "blk", "tov", "fg_pct", "tp_pct", "ft_pct", "min", "gp", "plus_minus"];

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
  // Volumi veri, se il giocatore-stagione è nella mappa BR. `min` e `gp` qui sono
  // quelli della fonte dei volumi (minuti totali, non media): servono a portare i
  // totali sui 36 minuti senza mescolare due fonti diverse.
  const vol = volMap[`${chiaveVolumi(c.name)}|${c.season}`];
  const stats_vol = vol
    ? { fg3a: vol.fg3a, fg3: vol.fg3, fg2a: vol.fg2a, fg2: vol.fg2,
        fta: vol.fta, ft: vol.ft, orb: vol.orb, drb: vol.drb,
        min: vol.mp, gp: vol.games }
    : null;

  const card = {
    player_id: c.player_id, name: c.name, season: c.season,
    team: c.team, team_abbr: c.team_abbr, ovr: c.ovr,
    pos, stats_real: c.stats_real, estimated,
  };
  if (stats_vol) card.stats_vol = stats_vol;
  return card;
}

// I cinque reparti sono percentili DENTRO la stagione, quindi si calcolano su tutte
// le carte insieme (non squadra per squadra) e prima del raggruppamento.
const all = assegnaReparti(buz.cards.map(toCard));

const byKey = {};
for (const card of all) {
  (byKey[`${card.team_abbr}|${card.season}`] ||= []).push(card);
}

const out =
  "// GENERATO da prototype/imbattuto/build-cards.mjs - non modificare a mano\n" +
  `export const CARDS_BY_TEAM_SEASON = ${JSON.stringify(byKey)};\n` +
  `export const ALL_CARDS = ${JSON.stringify(all)};\n`;
writeFileSync(resolve(here, "cards.js"), out);
const nEst = all.filter((c) => c.estimated).length;
const nStim = all.filter((c) => c.reparti_stimati).length;
console.log(`cards.js scritto: ${all.length} carte, ${Object.keys(byKey).length} team-stagione, ${nEst} posizioni dedotte`);
console.log(`reparti: ${all.length - nStim} da volumi reali, ${nStim} a stima (giocatore non trovato in shooting-br.json)`);
