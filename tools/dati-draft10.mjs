// Dati VERI per il mockup 79 (lista candidati da dieci).
//
// Come per dati-tabellone.mjs: il mockup non inventa niente. Le dieci carte di
// ogni spin escono da `costruisciRosa`, cioè dallo stesso motore che costruisce
// le rose avversarie, e la rosa parziale del giocatore esce da draftPick veri.
//
// Uso: node tools/dati-draft10.mjs > mockups/79-draft10-data.js
import { CARDS_BY_TEAM_SEASON } from "../prototype/imbattuto/cards.js";
import { costruisciRosa, SLOTS, slotLibero, TITOLARE, RISERVA } from "../game/rosa.js";
import { ROLES } from "../game/roster.js";

// Tre squadre-stagione scelte a mano, non pescate a caso: un mockup deve essere
// stabile fra un'apertura e l'altra. Il dataset oggi copre 2014-15 → 2019-20.
const SPIN = ["GSW|2016-17", "MIL|2018-19", "LAL|2019-20"];

// La rosa parziale su cui si guarda il mockup: sei caselle piene, quattro libere.
// Serve a vedere le carte SPENTE (ruoli già coperti), che è metà del punto.
const PIENE = [
  ["PG", TITOLARE], ["PG", RISERVA],
  ["SG", TITOLARE],
  ["C", TITOLARE], ["C", RISERVA],
  ["SF", TITOLARE],
];

const carta = (c) => ({
  player_id: c.player_id,
  name: c.name,
  team: c.team, team_abbr: c.team_abbr, season: c.season,
  ovr: c.ovr,
  pos: { primary: c.pos.primary, secondary: c.pos.secondary ?? null },
  stats_real: c.stats_real,
});

function spin(key) {
  const rosa = costruisciRosa(CARDS_BY_TEAM_SEASON[key]);
  const [team, season] = key.split("|");
  return {
    key, team, season,
    // Le dieci in ordine di casella: quintetto PG→C, poi panchina PG→C.
    cards: SLOTS.map(({ ruolo, tipo }) => ({
      ...carta(rosa[ruolo][tipo]), ruolo, tipo,
    })),
  };
}

// La rosa del giocatore: prendo carte da una squadra che NON è fra gli spin,
// così nessun candidato risulta già preso e le carte spente lo sono per il
// ruolo coperto, non per il doppione.
function rosaParziale() {
  const mia = costruisciRosa(CARDS_BY_TEAM_SEASON["SAS|2015-16"]);
  const out = {};
  for (const r of ROLES) out[r] = { [TITOLARE]: null, [RISERVA]: null };
  for (const [ruolo, tipo] of PIENE) out[ruolo][tipo] = carta(mia[ruolo][tipo]);
  return out;
}

const dati = {
  spin: SPIN.map(spin),
  rosa: rosaParziale(),
  // Quali ruoli hanno ancora una casella libera, e quale: lo calcola il motore,
  // il mockup lo rilegge e basta.
  liberi: Object.fromEntries(ROLES.map((r) => {
    const rosa = rosaParziale();
    return [r, slotLibero(rosa, r)];
  })),
};

// Controllo che il mockup mostri davvero il caso interessante: almeno una carta
// spenta e almeno una piazzabile in ogni spin. Se salta, il mockup mentirebbe.
for (const s of dati.spin) {
  const rosa = dati.rosa;
  const piazzabili = s.cards.filter((c) =>
    ROLES.some((r) => (rosa[r][TITOLARE] === null || rosa[r][RISERVA] === null)
      && (c.pos.primary === r || c.pos.secondary === r)));
  if (piazzabili.length === 0 || piazzabili.length === s.cards.length) {
    console.error(`ATTENZIONE ${s.key}: ${piazzabili.length}/10 piazzabili, scenario poco utile`);
  }
}

process.stdout.write(
  "// GENERATO da tools/dati-draft10.mjs - non modificare a mano.\n" +
  "export const DRAFT10 = " + JSON.stringify(dati, null, 1) + ";\n");
