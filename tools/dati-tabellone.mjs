// Estrae dati VERI dal motore per i mockup della partita.
// Niente numeri inventati: box score, cronaca, medie e voti del mockup devono
// essere quelli che il motore produce davvero, altrimenti il mockup mente.
import { CARDS_BY_TEAM_SEASON } from "../prototype/imbattuto/cards.js";
import { pickCoaches } from "../prototype/imbattuto/coaches.js";
import { opponentPool, spinRoster } from "../prototype/imbattuto/pool.js";
import { toDisplayOvr } from "../prototype/imbattuto/display.js";
import { teamName } from "../prototype/imbattuto/team-names.js";
import { ROLES, canPlay } from "../game/roster.js";
import { SLOTS, slotLibero, minutiRosa } from "../game/rosa.js";
import { votoCarta } from "../game/rating.js";
import { attacco, difesa } from "../game/partita.js";
import { medieCarriera } from "../game/boxscore.js";
import {
  newRun, draftPick, chooseCoach, startRun, resolveRound, partitaRound,
  boxScoreRound, playByPlayRound, ROTAZIONE_AVVERSARIO,
} from "../game/run.js";

// Con `--azioni` i tre scenari portano anche il punto a punto (azioni, tiri,
// falli). E' un flag e non il comportamento normale perche' il file passa da
// ~200 KB a qualche MB, e il mockup 77 quelle azioni non le usa.
const CON_AZIONI = process.argv.includes("--azioni");

const SQUADRA = "Dinamo Sofà";
const POOL = opponentPool(CARDS_BY_TEAM_SEASON);
const rngFrom = (s) => () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;

function draftaBene(state, giri, rng) {
  // Una carta si prende UNA volta sola. Senza questo, la stessa rosa esce da due
  // giri diversi e in squadra finiscono due James Harden 2016-17 identici: nel
  // tabellino sono due righe uguali e nel racconto due nomi indistinguibili.
  const presi = new Set();
  for (const _ of SLOTS) {
    const liberi = ROLES.filter((r) => slotLibero(state.rosa, r) !== null);
    let migliore = null, ruolo = null;
    for (let g = 0; g < giri; g++) {
      const { cards } = spinRoster(CARDS_BY_TEAM_SEASON, liberi, {}, rng);
      for (const c of cards) for (const r of liberi) {
        if (!canPlay(c, r) || presi.has(c.player_id)) continue;
        if (!migliore || votoCarta(c) > votoCarta(migliore)) { migliore = c; ruolo = r; }
      }
    }
    if (!migliore) throw new Error("draftaBene: nessuna carta libera per gli slot rimasti");
    presi.add(migliore.player_id);
    state = draftPick(state, ruolo, migliore);
  }
  return state;
}

// ATT e DIF sulla stessa scala del numero grande: sono percentili come il voto,
// quindi passano dallo stesso rimappaggio 60-99 di `toDisplayOvr`. Senza, in
// scheda finirebbero tre numeri con tre scale diverse.
const attDif = (reparti) => ({
  att: toDisplayOvr(attacco(reparti)),
  dif: toDisplayOvr(difesa(reparti)),
});

const carta = (c, ruolo) => ({
  // `team` resta la sigla per le colonne strette, `teamNome` è il nome per
  // esteso da usare dove c'è spazio (scheda giocatore, migliore in campo).
  nome: c.name, ruolo, team: c.team_abbr, teamNome: teamName(c.team_abbr), stagione: c.season,
  ovr: toDisplayOvr(votoCarta(c)), ovr2k: c.ovr,
  ...attDif(c.reparti),
  reparti: c.reparti,
});

// Le dieci righe di una rosa nell'ordine degli slot: prima il quintetto PG→C,
// poi la panchina. `tipo` e `minuti` servono al mockup, che deve poter mettere
// una riga di separazione tra titolari e riserve e stampare i minuti.
const rosaCarte = (rosa, rotazione) =>
  minutiRosa(rosa, rotazione).map(({ carta: c, ruolo, tipo, minuti }) =>
    ({ ...carta(c, ruolo), tipo, minuti }));

const corse = [];
const finite = [];
// Tante corse perché serve anche una corsa CHIUSA 16-0, e in Normale succede
// circa una volta su nove: con sei corse ci si ritrova solo sconfitte.
for (let seme = 1; seme <= 200 && finite.length < 40; seme++) {
  const rng = rngFrom(seme * 7919);
  let s = newRun({ formato: "playoff", difficolta: "normale", seme, squadra: SQUADRA });
  s = draftaBene(s, 3, rng);
  s = chooseCoach(s, pickCoaches(rng)[0]);
  s = startRun(s, POOL);
  // La rosa ALLENATA: è quella che scende in campo, quindi è quella che il
  // mockup deve mostrare. I reparti sono già quelli dopo il coach.
  const mio = rosaCarte(s.rosaAllenata, s.rotazione);
  while (s.stato === "run") {
    const p = partitaRound(s);
    const box = boxScoreRound(s, p);
    corse.push({
      seme, round: s.round,
      coach: s.coach.name, tattica: s.coach.tattica,
      ovrTuo: toDisplayOvr(s.voto.ovr), ...attDif(s.voto.reparti),
      ovrLoro: toDisplayOvr(s.avversario.voto.ovr),
      loroAttDif: attDif(s.avversario.voto.reparti),
      avv: `${s.avversario.team} ${s.avversario.season}`,
      avvSigla: s.avversario.rosa.PG.titolare?.team_abbr ?? s.avversario.team,
      // Nome per esteso e annata separati: a schermo grande "Miami Heat 2014-15"
      // dice contro chi giochi, "MIA" no. La sigla resta per le colonne strette.
      avvNome: teamName(s.avversario.rosa.PG.titolare?.team_abbr ?? s.avversario.team),
      avvAnno: s.avversario.season,
      mio,
      loro: rosaCarte(s.avversario.rosa, ROTAZIONE_AVVERSARIO),
      // Sotto il cofano fino alla scelta degli scenari: servono a ricavare il
      // punto a punto solo per le tre partite che finiscono nel mockup, non
      // per tutte le duecento simulate. Ripuliti prima di stampare.
      _s: s, _p: p, _box: box,
      punti: p.punti, quarti: p.quarti, cronaca: p.cronaca, vincitore: p.vincitore,
      possessi: p.possessi,
      box: {
        casa: box.casa.righe.map((r) => ({ nome: r.nome, minuti: r.minuti, per: r.per, tot: r.tot })),
        ospite: box.ospite.righe.map((r) => ({ nome: r.nome, minuti: r.minuti, per: r.per, tot: r.tot })),
      },
    });
    s = resolveRound(s);
  }
  finite.push({ seme, stato: s, mio });
}

// ---------------------------------------------------------------------------
// Tre scenari per il tabellone: volata, dominio, sconfitta.
// ---------------------------------------------------------------------------
const m = (g) => Math.abs(g.punti.casa - g.punti.ospite);
const volata = corse.filter((g) => g.vincitore === "casa" && m(g) <= 4)[0];
const dominio = corse.filter((g) => g.vincitore === "casa" && m(g) >= 14)[0];
const sconfitta = corse.filter((g) => g.vincitore === "ospite")[0];
const scelti = [volata, dominio, sconfitta].filter(Boolean);
const NOMI_SCENARIO = ["Volata", "Dominio", "Sconfitta"];
scelti.forEach((g, i) => { g.scenario = NOMI_SCENARIO[i]; });

// Il punto a punto delle sole tre partite scelte. `playByPlayRound` e' puro e
// ha il suo seme staccato: rigenerarlo qui da' esattamente le azioni che l'app
// mostrera' quando la partita si giochera' davvero.
if (CON_AZIONI) {
  for (const g of scelti) {
    const pbp = playByPlayRound(g._s, g._p, g._box);
    g.azioni = pbp.azioni;
    // Totali di tiro e falli per giocatore, nello stesso ordine delle righe del
    // box score. Il mockup li accumula dalle azioni, quindi questi servono come
    // controllo: se le due strade non danno lo stesso numero, il mockup mente.
    g.tiri = pbp.tiri;
    g.falli = pbp.falli;
  }
}
for (const g of corse) { delete g._s; delete g._p; delete g._box; }

// ---------------------------------------------------------------------------
// Fine corsa: la più lunga fra quelle simulate. Serve la schermata con le medie
// di ogni giocatore su tutte le partite giocate, non su una sola.
// ---------------------------------------------------------------------------
function riassumiCorsa(f) {
  const medie = medieCarriera(f.stato.storia.flatMap((h) => h.box.casa.righe));
  const perNome = new Map(f.mio.map((c) => [c.nome, c]));
  return {
    seme: f.seme,
    esito: f.stato.esito,
    vittorie: f.stato.vittorie,
    obiettivo: 16,
    coach: f.stato.coach.name,
    rosa: f.mio,
    // Totali della corsa: quanto hai segnato e quanto hai subito in tutto.
    // Servono a riempire la fine corsa con un dato che la media non dice.
    totali: {
      fatti: f.stato.storia.reduce((a, h) => a + h.punti.casa, 0),
      subiti: f.stato.storia.reduce((a, h) => a + h.punti.ospite, 0),
      margine: f.stato.storia.reduce((a, h) => a + h.punti.casa - h.punti.ospite, 0)
        / f.stato.storia.length,
      piuLarga: f.stato.storia.slice()
        .sort((a, b) => (b.punti.casa - b.punti.ospite) - (a.punti.casa - a.punti.ospite))[0],
      piuTirata: f.stato.storia.slice()
        .sort((a, b) => Math.abs(a.punti.casa - a.punti.ospite) - Math.abs(b.punti.casa - b.punti.ospite))[0],
    },
    medie: medie.map((v) => ({
      nome: v.nome, gp: v.gp, medie: v.medie, somma: v.somma, max: v.max,
      ruolo: perNome.get(v.nome)?.ruolo ?? "",
      ovr: perNome.get(v.nome)?.ovr ?? null,
      team: perNome.get(v.nome)?.team ?? "",
      stagione: perNome.get(v.nome)?.stagione ?? "",
    })),
    storia: f.stato.storia.map((h) => ({
      round: h.round, avversario: h.avversario, vinto: h.vinto, punti: h.punti,
    })),
  };
}

// Due finali diversi da mostrare: la corsa imbattuta e quella interrotta. Sono
// due schermate con lo stesso impianto e due toni opposti, e vanno viste
// entrambe prima di dire che il layout regge.
const perLunghezza = finite.slice().sort((a, b) => b.stato.storia.length - a.stato.storia.length);
const vinta = perLunghezza.find((f) => f.stato.esito === "imbattuto");
const persa = perLunghezza.find((f) => f.stato.esito === "sconfitta");
const fineRun = [vinta, persa].filter(Boolean).map(riassumiCorsa);

// ---------------------------------------------------------------------------
// Profilo: le statistiche che si accumulano fra una corsa e l'altra. Aggregate
// per PERSONA, non per carta: LeBron 2012-13 e LeBron 2017-18 sono lo stesso
// LeBron, come deciso.
// ---------------------------------------------------------------------------
const tutteLeMie = corse.flatMap((g) => g.box.casa.map((r) => r));
const carriera = medieCarriera(tutteLeMie);
const profilo = {
  squadra: SQUADRA,
  corse: finite.length,
  partite: tutteLeMie.length / SLOTS.length,
  imbattute: finite.filter((f) => f.stato.esito === "imbattuto").length,
  giocatori: carriera
    .map((v) => ({ nome: v.nome, gp: v.gp, medie: v.medie, somma: v.somma, max: v.max }))
    .sort((a, b) => b.gp - a.gp)
    .slice(0, 30),
};

// Tutto in ASCII puro: un file .js servito senza `charset` viene letto in
// latin-1 da Chrome, e "Dinamo Sofa'" diventa "Dinamo SofA". Le lettere accentate
// escono come \uXXXX, che e' la stessa stringa senza dipendere dagli header.
const ascii = (s) => s.replace(/[\u0080-\uffff]/g,
  (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));

// `window.X` e non `export`: i mockup si aprono con file://, e un modulo ESM
// da file:// viene bloccato dal CORS del browser. Stessa scelta del mockup 76.
console.log("// dati veri dal motore - generati da tools/dati-tabellone.mjs, non a mano.");
console.log("// Box score, cronaca, medie e OVR sono quelli che il motore produce davvero.");
// Con le azioni l'indentazione triplica il peso del file per niente: e' roba
// generata, non si legge a mano.
console.log("window.PARTITE = " + ascii(JSON.stringify(scelti, null, CON_AZIONI ? 0 : 1)) + ";");
console.log("window.FINE_RUN = " + ascii(JSON.stringify(fineRun, null, 1)) + ";");
console.log("window.PROFILO = " + ascii(JSON.stringify(profilo, null, 1)) + ";");
console.error("scenari:", scelti.map((g) => `${g.punti.casa}-${g.punti.ospite} vs ${g.avv}`));
console.error("fine run:", fineRun.map((f) => `${f.esito} ${f.vittorie}/16`).join(" + "));
console.error("profilo:", profilo.partite, "partite,", profilo.giocatori.length, "giocatori in classifica");
if (CON_AZIONI) {
  console.error("azioni:", scelti.map((g) =>
    `${g.scenario} ${g.azioni.length} (${g.azioni.filter((a) => a.notevole).length} notevoli)`).join(" · "));
}
