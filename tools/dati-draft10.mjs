// Dati VERI per i mockup del draft da dieci.
//
// Come per dati-tabellone.mjs: il mockup non inventa niente. Le dieci carte di
// ogni spin escono da `costruisciRosa`, cioè dallo stesso motore che costruisce
// le rose avversarie, e la rosa parziale del giocatore ha la forma vera della
// rosa: cinque titolari legati al ruolo, cinque posti di panchina liberi.
//
// NOTA sul mockup 79. `mockups/79-draft10-data.js` è stato generato con la
// forma VECCHIA (ruolo → titolare/riserva), quella di prima di G7: il file su
// disco resta buono per quel mockup, ma rigenerarlo con questo script gli
// cambia la forma sotto i piedi. Questo script serve al mockup NUOVO del campo,
// quello con le caselle 6°-10° e i minuti scritti sopra.
//
// Uso: node tools/dati-draft10.mjs > mockups/NN-draft-data.js
import { CARDS_BY_TEAM_SEASON } from "../prototype/imbattuto/cards.js";
import {
  costruisciRosa, emptyRosa, assegnaRosa, cartaIn, caselleLibere, caselleDove,
  etichettaSlot, minutiSlot, SLOTS, TITOLARE, PANCA,
} from "../game/rosa.js";

// Tre squadre-stagione scelte a mano, non pescate a caso: un mockup deve essere
// stabile fra un'apertura e l'altra. Il dataset oggi copre 2014-15 → 2019-20.
const SPIN = ["GSW|2016-17", "MIL|2018-19", "LAL|2019-20"];

// La rotazione con cui si scrivono i minuti sulle caselle. Normale è quella di
// partenza: il coach si sceglie dopo il draft, quindi durante il draft il
// giocatore vede i minuti "di base".
const ROTAZIONE = "normale";

// La rosa parziale su cui si guarda il mockup: sei caselle piene, quattro
// libere. Serve a vedere le carte SPENTE (nessuna casella per loro) e la
// panchina riempita a salti, che è metà del punto della schermata nuova.
const PIENE = [
  { tipo: TITOLARE, ruolo: "PG" },
  { tipo: TITOLARE, ruolo: "SG" },
  { tipo: TITOLARE, ruolo: "SF" },
  { tipo: TITOLARE, ruolo: "C" },
  { tipo: PANCA, posto: 6 },
  { tipo: PANCA, posto: 8 },
];

const carta = (c) => ({
  player_id: c.player_id,
  name: c.name,
  team: c.team, team_abbr: c.team_abbr, season: c.season,
  ovr: c.ovr,
  pos: { primary: c.pos.primary, secondary: c.pos.secondary ?? null },
  stats_real: c.stats_real,
});

// Le dieci caselle come le disegna la schermata: etichetta ("6° uomo") e minuti
// li dà il motore, così il mockup non se li riscrive a mano e non può sbagliarli.
const casella = (slot) => ({
  ...slot, etichetta: etichettaSlot(slot), minuti: minutiSlot(slot, ROTAZIONE),
});

function spin(key) {
  const rosa = costruisciRosa(CARDS_BY_TEAM_SEASON[key]);
  const [team, season] = key.split("|");
  return {
    key, team, season,
    // Le dieci in ordine di casella: quintetto PG→C, poi panchina 6°→10°. La
    // casella è quella che la carta occupa nella SUA squadra: serve a mostrare
    // da dove viene, non a decidere dove la metti tu.
    cards: SLOTS.map((slot) => ({ ...carta(cartaIn(rosa, slot)), da: casella(slot) })),
  };
}

// La rosa del giocatore: prendo carte da una squadra che NON è fra gli spin,
// così nessun candidato risulta già preso e le carte spente lo sono per le
// caselle finite, non per il doppione.
function rosaParziale() {
  const mia = costruisciRosa(CARDS_BY_TEAM_SEASON["SAS|2015-16"]);
  let out = emptyRosa();
  for (const slot of PIENE) out = assegnaRosa(out, slot, cartaIn(mia, slot));
  return out;
}

const mia = rosaParziale();

// La rosa in forma piatta, una voce per casella: il mockup disegna il campo
// scorrendo questa lista e non deve sapere com'è fatta la rosa dentro.
const caselle = SLOTS.map((slot) => {
  const c = cartaIn(mia, slot);
  return { ...casella(slot), carta: c ? carta(c) : null };
});

const dati = {
  rotazione: ROTAZIONE,
  spin: SPIN.map(spin),
  caselle,
  libere: caselleLibere(mia).map(casella),
};

// Controllo che il mockup mostri davvero il caso interessante: almeno una carta
// spenta e almeno una piazzabile in ogni spin. Se salta, il mockup mentirebbe.
//
// Da G7 una carta è spenta solo se NON ha nessuna casella libera: con un posto
// di panchina vuoto non succede mai, ed è giusto così - il caso "spento" torna
// quando resta libero solo il quintetto.
for (const s of dati.spin) {
  const piazzabili = s.cards.filter((c) => caselleDove(mia, c).length > 0);
  if (piazzabili.length === 0) {
    console.error(`ATTENZIONE ${s.key}: nessuna carta piazzabile, scenario inutile`);
  }
}

process.stdout.write(
  "// GENERATO da tools/dati-draft10.mjs - non modificare a mano.\n" +
  "export const DRAFT10 = " + JSON.stringify(dati, null, 1) + ";\n");
