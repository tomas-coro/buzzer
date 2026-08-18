// Dati VERI per il mockup del draft col tetto di spesa (mockup 80).
//
// Come tutti gli altri generatori: il mockup non inventa niente. Le dieci carte
// di ogni spin escono da `costruisciRosa`, il voto da `votoCarta`, il numero a
// schermo da `toDisplayOvr` e il cartellino da `salarioCarta`. Se un domani la
// curva dei salari cambia, il mockup cambia con lei senza toccarlo.
//
// La rosa parte VUOTA, al contrario del mockup 79: qui il punto è vedere il
// budget consumarsi pick dopo pick, e con una rosa già piena a metà non si
// vedrebbe.
//
// Uso: node tools/dati-draft-cap.mjs > mockups/80-draft-cap-data.js
import { CARDS_BY_TEAM_SEASON } from "../prototype/imbattuto/cards.js";
import { costruisciRosa, cartaIn, etichettaSlot, minutiSlot, SLOTS } from "../game/rosa.js";
import { votoCarta } from "../game/rating.js";
import { toDisplayOvr } from "../prototype/imbattuto/display.js";
import { salarioCarta, SALARIO_MIN, SALARIO_MAX, RUMORE } from "../game/salary.js";
import { TETTI } from "../game/difficulty.js";

// Cinque squadre-stagione scelte a mano, non pescate a caso: un mockup deve
// essere stabile fra un'apertura e l'altra. Cinque e non tre perché con la rosa
// vuota servono dieci pick, e con tre spin da dieci si finisce il pescato.
// Sono scelte per coprire la scala dei monte ingaggi: GSW 2016-17 è il superteam
// da 213 milioni che sotto il tetto non ci sta, PHX 2016-17 è la squadra mediana.
const SPIN = ["GSW|2016-17", "SAS|2015-16", "PHX|2016-17", "MIL|2018-19", "LAL|2019-20"];

// La rotazione con cui si scrivono i minuti sulle caselle: il coach si sceglie
// dopo il draft, quindi durante il draft si vedono i minuti di base.
const ROTAZIONE = "normale";

const carta = (c) => {
  const voto = votoCarta(c);
  return {
    player_id: c.player_id,
    name: c.name,
    team: c.team, team_abbr: c.team_abbr, season: c.season,
    // `voto` è la scala nativa del motore (percentili), `ovr` è il numero che va
    // a schermo. Il salario nasce dal NATIVO, che è quello che gioca.
    voto, ovr: toDisplayOvr(voto),
    salario: salarioCarta(c),
    pos: { primary: c.pos.primary, secondary: c.pos.secondary ?? null },
    stats_real: c.stats_real,
  };
};

// Etichetta ("6° uomo") e minuti li dà il motore, così il mockup non se li
// riscrive a mano e non può sbagliarli.
const casella = (slot) => ({
  ...slot, etichetta: etichettaSlot(slot), minuti: minutiSlot(slot, ROTAZIONE),
});

function spin(key) {
  const rosa = costruisciRosa(CARDS_BY_TEAM_SEASON[key]);
  const [team, season] = key.split("|");
  const cards = SLOTS.map((slot) => ({ ...carta(cartaIn(rosa, slot)), da: casella(slot) }));
  return { key, team, season, cards, monte: cards.reduce((s, c) => s + c.salario, 0) };
}

const dati = {
  rotazione: ROTAZIONE,
  caselle: SLOTS.map(casella),
  spin: SPIN.map(spin),
  salario: { min: SALARIO_MIN, max: SALARIO_MAX, rumore: RUMORE },
  tetti: TETTI,
};

// IL CONTROLLO GUARDAVA LA COSA SBAGLIATA. Prima chiedeva se una singola rosa
// storica, presa in blocco, sfondasse il tetto: ma nel draft non si prende una
// rosa in blocco, si pesca il meglio da cinque spin diversi. La rosa più cara
// del mazzo costa 213 milioni e da sola non sfonda niente, mentre dieci carte
// scelte fra cinquanta arrivano molto più in alto. Il controllo diceva "scenario
// innocuo" su uno scenario che innocuo non è.
//
// Le due domande vere sono: il draft PUÒ sfondare il tetto più largo (se no, il
// budget è decorazione) e PUÒ starci sotto quello più stretto (se no, è
// impossibile e il mockup si inchioda)?
const tutte = dati.spin.flatMap((s) => s.cards).sort((a, b) => b.salario - a.salario);
const massimo = tutte.slice(0, SLOTS.length).reduce((s, c) => s + c.salario, 0);
const minimo = tutte.slice(-SLOTS.length).reduce((s, c) => s + c.salario, 0);
const M = 1_000_000;
console.error(`draft più caro possibile ${(massimo / M).toFixed(0)}M, `
  + `più economico ${(minimo / M).toFixed(0)}M, tetti `
  + Object.entries(TETTI).map(([k, v]) => `${k} ${(v / M).toFixed(0)}M`).join(", "));
if (massimo <= TETTI.facile) {
  console.error("ATTENZIONE: nemmeno il draft più caro tocca il tetto di Facile, budget decorativo");
}
if (minimo > TETTI.incubo) {
  console.error("ATTENZIONE: nemmeno il draft più economico sta sotto il tetto di Incubo, livello impossibile");
}

process.stdout.write(
  "// GENERATO da tools/dati-draft-cap.mjs - non modificare a mano.\n" +
  "export const DRAFTCAP = " + JSON.stringify(dati, null, 1) + ";\n");
