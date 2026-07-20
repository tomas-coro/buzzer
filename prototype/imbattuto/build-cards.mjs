// Genera cards.js: unisce le carte per-stagione di buzzer (nome/team/stagione/OVR/stats)
// con gli attributi+posizione reali di nba-sim dove il nome combacia; altrimenti deriva
// (estimated:true). Esegui: node prototype/imbattuto/build-cards.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { deriveAttributes, inferPosition } from "./derive.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");

// --- buzzer: NBA_DATA (per-stagione) ---
const buzSrc = readFileSync(resolve(root, "data/nba-data.js"), "utf8");
const buz = JSON.parse(buzSrc.slice(buzSrc.indexOf("{"), buzSrc.lastIndexOf("}") + 1));

// --- nba-sim: PLAYERS (attributi+pos, per nome) ---
const simSrc = readFileSync(resolve(root, "mockups/59-players-data.js"), "utf8");
const simArr = JSON.parse(simSrc.match(/const PLAYERS=(\[[\s\S]*?\]);/)[1]);
const sim = new Map(simArr.map((p) => [p.n, p]));

function toCard(c) {
  const match = sim.get(c.name);
  let pos, att, def, estimated;
  if (match) {
    pos = { primary: match.p, secondary: null };
    att = match.a;
    def = match.d;
    estimated = false;
  } else {
    pos = inferPosition(c.stats_real);
    ({ att, def } = deriveAttributes(c));
    estimated = true;
  }
  return {
    player_id: c.player_id, name: c.name, season: c.season,
    team: c.team, team_abbr: c.team_abbr, ovr: c.ovr,
    pos, att, def, estimated,
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
  "// GENERATO da prototype/imbattuto/build-cards.mjs — non modificare a mano\n" +
  `export const CARDS_BY_TEAM_SEASON = ${JSON.stringify(byKey)};\n` +
  `export const ALL_CARDS = ${JSON.stringify(all)};\n`;
writeFileSync(resolve(here, "cards.js"), out);
const nEst = all.filter((c) => c.estimated).length;
console.log(`cards.js scritto: ${all.length} carte, ${Object.keys(byKey).length} team-stagione, ${nEst} estimated`);
