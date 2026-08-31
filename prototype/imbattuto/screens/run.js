import { ROLES } from "../../../game/roster.js";
import { partitaRound, boxScoreRound, playByPlayRound, titolari, ROTAZIONE_AVVERSARIO } from "../../../game/run.js";
import { minutiRosa } from "../../../game/rosa.js";
import { log } from "../../../game/playbyplay.js";
import { attacco, difesa } from "../../../game/partita.js";
import { votoCarta } from "../../../game/rating.js";
import { toDisplayOvr } from "../display.js";
import { teamColors, initials } from "../team-colors.js";
import { appHeader, wireAppHeader, esc } from "./_chrome.js";

// LA PARTITA - regia "Cruscotto" (mockup 77, direzione A scelta da Tomas).
//
// Cosa mostra: punteggio grande col margine in tempo reale, box score a quarti
// che si riempie una casella per volta, duello dei cinque reparti, e la colonna
// destra che prima del via è il briefing e dopo diventa la cronaca. Sotto, le
// due formazioni: prima del via sono tessere, al fischio d'inizio diventano le
// righe del box score per giocatore.
//
// I due vincoli tecnici che decidono la struttura:
//
// 1. app.js ri-renderizza tutta la schermata a ogni dispatch. Quindi la partita
//    si anima in LOCALE (quarto, velocità, timer) e il dispatch parte solo alla
//    fine, quando l'utente preme la CTA. Se dispatchassimo al via, la schermata
//    verrebbe sostituita a metà animazione.
// 2. `partitaRound` e `boxScoreRound` sono funzioni pure dello stato: quello che
//    animiamo qui è esattamente quello che `resolveRound` salverà nella storia.
//    Nessun risultato da passarsi tra schermate, nessuna doppia simulazione.

const PLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;

// Millisecondi per quarto. Sono i tempi del mockup, dove si sono sentiti: a
// Lenta una corsa da 16 partite sarebbe ~4,5 minuti di sola simulazione, per
// questo la velocità si cambia in corsa e resta scelta per tutta la corsa.
const VELOCITA = { lenta: 4000, normale: 2000, rapida: 800, salta: 150 };
const VELOCITA_NOME = { lenta: "Lenta", normale: "Normale", rapida: "Rapida", salta: "Salta" };
const CHIAVE_VELOCITA = "buzzer.velocita";

const REPARTI = [["t3", "Tiro 3"], ["fin", "Finaliz."], ["dif", "Difesa"], ["reb", "Rimbalzi"], ["reg", "Regia"]];

// Cosa ti costa, in campo, il reparto in cui sei sotto. Serve al briefing: il
// numero da solo non dice al giocatore cosa gli succederà.
const CONSEGUENZA = {
  t3: "ti puniscono da fuori",
  fin: "segnano vicino a canestro",
  dif: "faticherai a trovare il canestro",
  reb: "prendono secondi tiri",
  reg: "girano meglio la palla",
};

const cognome = (nome) => {
  const p = String(nome).trim().split(/\s+/);
  return p.length > 1 ? p.slice(1).join(" ") : nome;
};

function leggiVelocita() {
  try {
    const v = window.localStorage.getItem(CHIAVE_VELOCITA);
    return v && v in VELOCITA ? v : "normale";
  } catch {
    // localStorage negato (navigazione privata, cookie bloccati): non è un
    // errore da mostrare, la partita funziona lo stesso col valore di default.
    return "normale";
  }
}
function scriviVelocita(v) {
  try { window.localStorage.setItem(CHIAVE_VELOCITA, v); } catch { /* vedi sopra */ }
}

// Media di un reparto sul quintetto: è il numero su cui gira game/partita.js.
function repartiSquadra(carte) {
  const out = {};
  for (const [k] of REPARTI) {
    out[k] = Math.round(carte.reduce((a, c) => a + c.reparti[k], 0) / carte.length);
  }
  return out;
}

// Punteggio dopo `n` quarti. Con n = 0 la partita non è ancora iniziata.
function cumulato(quarti, n) {
  if (n <= 0) return { casa: 0, ospite: 0 };
  const q = quarti[Math.min(n, quarti.length) - 1];
  return { casa: q.cumCasa, ospite: q.cumOspite };
}

// Riga di un giocatore dopo `n` quarti: si somma quello che ha fatto finora.
function parziale(riga, n) {
  const t = { pts: 0, reb: 0, ast: 0, stl: 0, tov: 0, blk: 0 };
  for (let i = 0; i < Math.min(n, riga.per.length); i++) {
    for (const k in t) t[k] += riga.per[i][k];
  }
  return t;
}

// Foto vera del giocatore (tools/build-volti.py), stesso pattern di draft.js:
// c'è sempre, se il file manca l'<img> si toglie da sola e restano le
// iniziali sul gradiente colore squadra (deciso il 18/08, portato dal mockup 80).
const VOLTI_PATH = "../../assets/volti";
function facciaHTML(card) {
  const { c1, c2 } = teamColors(card.team_abbr);
  const foto = `<img class="ph" src="${VOLTI_PATH}/${encodeURIComponent(card.player_id)}.webp"
      alt="" loading="lazy" decoding="async"
      onload="this.parentNode.classList.add('hasph')" onerror="this.remove()">`;
  return `<span class="sh-face" style="--tc1:${c1};--tc2:${c2}"><span class="ini">${esc(initials(card.name))}</span>${foto}</span>`;
}

// OVR · ATT · DIF. Il numero grande si chiama OVR, non "voto" (deciso col grill).
function ratingsHTML(reparti, ovr, hero) {
  return `<span class="sh-ratings">
    <span class="sh-rat${hero ? " hero" : ""}"><span>Ovr</span><b>${ovr}</b></span>
    <span class="sh-rat"><span>Att</span><b>${toDisplayOvr(attacco(reparti))}</b></span>
    <span class="sh-rat"><span>Dif</span><b>${toDisplayOvr(difesa(reparti))}</b></span>
  </span>`;
}

// ctx: { state, N, dispatch }
export function render(ctx) {
  const { state, N } = ctx;
  const el = document.createElement("section");
  el.className = "screen run";

  // La partita è già decisa: la animiamo, non la giochiamo. Una sola chiamata,
  // e il box score nasce dalla stessa partita (non da una seconda simulazione).
  const partita = partitaRound(state);
  const box = boxScoreRound(state, partita);
  const vinto = partita.vincitore === "casa";

  const avv = state.avversario;
  const avvSigla = avv.quintet[0]?.team_abbr ?? avv.team;
  // Il quintetto (5 carte): basta per le tessere pre-via e per i reparti.
  const mieCarte = titolari(state);
  const loroCarte = avv.quintet;
  const loroRuoli = loroCarte.map((c) => c.pos?.primary ?? "");
  // Le dieci righe (titolari + panchina), nello STESSO ordine con cui
  // `boxScoreRound` chiama `giocatoriConMinuti` (che internamente usa proprio
  // `minutiRosa`): `box.*.righe[i]` e `*Box[i]` sono lo stesso giocatore.
  // Servono per foto, ruolo e sheet stats nel box score, che ha 10 righe - il
  // quintetto sopra ne ha solo 5 e lascerebbe le riserve senza carta/ruolo.
  const mieMinuti = minutiRosa(state.rosaAllenata ?? state.rosa, state.rotazione);
  const loroMinuti = minutiRosa(avv.rosa, ROTAZIONE_AVVERSARIO);
  const mieCarteBox = mieMinuti.map((r) => r.carta);
  const loroCarteBox = loroMinuti.map((r) => r.carta);
  const mieRuoliBox = mieMinuti.map((r) => r.ruolo ?? "");
  const loroRuoliBox = loroMinuti.map((r) => r.ruolo ?? "");
  const mieiReparti = repartiSquadra(mieCarte);
  const loroReparti = repartiSquadra(loroCarte);
  const ovrTuo = toDisplayOvr(state.voto.ovr);
  const ovrLoro = toDisplayOvr(avv.voto.ovr);
  const nQuarti = partita.quarti.length;

  // Il punto a punto vero: stesso seme di `partita` e `box` (via
  // playByPlayRound), qui serve per animare punteggio/orologio/cronaca canestro
  // per canestro invece che quarto per quarto.
  const azioni = playByPlayRound(state, partita, box).azioni;
  // Per ogni quarto: gli indici (nell'array `azioni`) dei canestri, e l'ultimo
  // indice in assoluto - serve a chiudere il quarto includendo anche le azioni
  // notevoli senza punti (una stoppata sulla sirena) successive all'ultimo canestro.
  const canestriPerQuarto = partita.quarti.map(() => []);
  const ultimaAzioneQuarto = partita.quarti.map(() => -1);
  azioni.forEach((a, i) => {
    if (a.punti > 0) canestriPerQuarto[a.q].push(i);
    ultimaAzioneQuarto[a.q] = i;
  });

  // ---- stato locale dell'animazione ---------------------------------------
  let quarto = 0;            // quarti già mostrati (box score, duello, tabellino)
  // `azioneIdx` è invece il punto a punto: -1 prima del via, poi cresce di
  // canestro in canestro dentro il quarto in corso. Punteggio, orologio e
  // cronaca leggono da qui; il resto della schermata resta a grana di quarto.
  let azioneIdx = -1;
  let canestriQuarto = [];   // canestri del quarto in corso
  let idxCanestro = 0;       // quanti ne ho già mostrati
  let velocita = leggiVelocita();
  let inCorso = false;
  let inPausa = false;
  let timer = null;
  let pausaDaSheet = false; // pausa messa da openStatSheet: solo lei la deve togliere alla chiusura
  const senzaMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const finita = () => quarto >= nQuarti;
  // Budget della VELOCITA del quarto (invariato) spalmato sui suoi canestri:
  // stesso tempo totale per quarto, cambia solo quanto dura ogni singolo passo.
  const tickMs = () => VELOCITA[velocita] / Math.max(canestriQuarto.length, 1);

  // ---- pezzi della schermata ----------------------------------------------

  function testataHTML() {
    const tacche = Array.from({ length: N }, (_, i) =>
      `<i class="${i < state.vittorie ? "on" : i === state.vittorie ? "next" : ""}"></i>`).join("");
    const seg = Object.keys(VELOCITA).map((k) =>
      `<button type="button" data-vel="${k}" aria-pressed="${velocita === k}">${VELOCITA_NOME[k]}</button>`).join("");
    // Pausa vive accanto alla velocità (non più in fondo allo screen come CTA):
    // sono gli stessi comandi della simulazione, devono stare nella stessa fascia.
    // Compare solo a simulazione avviata e non ancora finita.
    const pausaBtn = azioneIdx >= 0 && !finita()
      ? `<button class="sh-pause" id="pausa" type="button">${inPausa ? "Riprendi" : "Pausa"}</button>`
      : "";
    return `
      <div class="sh-streak">
        <span class="lab">Fila</span>
        <span class="sh-ticks">${tacche}</span>
        <span class="num">${state.vittorie}<i>/${N}</i></span>
      </div>
      <div class="sh-speed">
        <span>Velocità</span>
        <div class="sh-seg" role="group" aria-label="Velocità della simulazione">${seg}</div>
        ${pausaBtn}
      </div>`;
  }

  // Punteggio, margine e "quarto in corso" live: leggono l'ultima azione
  // mostrata (canestro per canestro), non più il totale del quarto.
  function punteggioHTML() {
    const iniziata = azioneIdx >= 0;
    const p = iniziata ? azioni[azioneIdx] : { casa: 0, ospite: 0 };
    const d = p.casa - p.ospite;
    const margine = !iniziata
      ? "Palla a due"
      : `${d > 0 ? "+" : ""}${d}${finita() ? "" : ` · ${azioni[azioneIdx].periodo}`}`;
    const classeMargine = !iniziata ? "" : d > 0 ? "pos" : d < 0 ? "neg" : "";
    const lampo = iniziata ? " sh-flash" : "";
    return `
      <div class="a-scoreline">
        <div class="a-team mine">
          <div class="nm">${esc(state.squadra)}</div>
          ${ratingsHTML(state.voto.reparti, ovrTuo, true)}
        </div>
        <div>
          <div class="a-score">
            <b class="${p.casa > p.ospite ? "lead" : ""}${lampo}">${p.casa}</b>
            <i>·</i>
            <b class="${p.ospite > p.casa ? "lead" : ""}${lampo}">${p.ospite}</b>
          </div>
          <div class="a-margin ${classeMargine}">${margine}</div>
        </div>
        <div class="a-team right">
          <div class="nm">${esc(avvSigla)}</div>
          <div class="sub">${esc(avv.season)}</div>
          ${ratingsHTML(avv.voto.reparti, ovrLoro)}
        </div>
      </div>`;
  }

  // Box score a quarti: qui e solo qui si legge il quarto in corso, per questo
  // il cerchio "1° QUARTO" del mockup precedente non serve più.
  function quartiHTML() {
    const intestazioni = partita.quarti.map((q, i) =>
      `<th class="${i === quarto - 1 && !finita() ? "live" : ""}">${q.overtime ? "OT" : `${i + 1}°`}</th>`).join("");
    const riga = (etichetta, lato, mia) => {
      const celle = partita.quarti.map((q, i) => {
        const accesa = i < quarto;
        const classi = ["cell"];
        if (!accesa) classi.push("off");
        if (i === quarto - 1 && !finita()) classi.push("live");
        if (i === quarto - 1) classi.push("just");
        return `<td><div class="${classi.join(" ")}">${accesa ? q[lato] : "·"}</div></td>`;
      }).join("");
      const tot = cumulato(partita.quarti, quarto)[lato];
      return `<tr class="${mia ? "mine" : ""}">
        <td>${esc(etichetta)}</td>${celle}
        <td><div class="cell${quarto === 0 ? " off" : ""}">${quarto === 0 ? "·" : tot}</div></td>
      </tr>`;
    };
    return `
      <table class="a-quarti">
        <thead><tr class="a-qhead"><th>Quarti</th>${intestazioni}<th>Tot</th></tr></thead>
        <tbody>${riga("Tu", "casa", true)}${riga(avvSigla, "ospite", false)}</tbody>
      </table>`;
  }

  // Il duello dei reparti risponde alla domanda che il punteggio non risponde:
  // perché è finita così. Sono i cinque numeri su cui gira la simulazione.
  function duelloHTML() {
    const righe = REPARTI.map(([k, lab]) => {
      const a = mieiReparti[k];
      const b = loroReparti[k];
      const lato = (val, vince, cls) => `
        <span class="side ${cls}">
          <span class="val${vince ? " win" : ""}">${val}</span>
          <span class="bar"><i style="width:${Math.max(4, val)}%"></i></span>
        </span>`;
      return `<div class="r">${lato(a, a >= b, "sx")}<span class="lab">${lab}</span>${lato(b, b > a, "dx")}</div>`;
    }).join("");
    return `<div class="sh-duel">
      <div class="head"><span>${esc(state.squadra)}</span><span>${esc(avvSigla)}</span></div>
      ${righe}
    </div>`;
  }

  // Prima del via la colonna destra dice chi allena, che ritmo si gioca e dove
  // sei meglio o peggio: senza, resterebbe un rettangolo vuoto alto 300px.
  function briefingHTML() {
    const scarti = REPARTI.map(([k, lab]) => ({ k, lab, d: mieiReparti[k] - loroReparti[k] }));
    const meglio = scarti.slice().sort((x, y) => y.d - x.d)[0];
    const peggio = scarti.slice().sort((x, y) => x.d - y.d)[0];
    const gap = ovrTuo - ovrLoro;
    const notaPeggio = peggio.d < 0
      ? `Ti battono a <b>${peggio.lab.toLowerCase()}</b> (${loroReparti[peggio.k]} contro ${mieiReparti[peggio.k]}): ${CONSEGUENZA[peggio.k]}.`
      : "Non hanno un reparto in cui ti superano: la partita la perdi solo per la serata storta.";
    // Il terzo avviso è il patto col giocatore, ed è il numero vero della
    // taratura del motore: essere più forti non basta.
    const notaGap = gap > 0
      ? `Sei favorito di <b>${gap}</b> di OVR. Nel motore chi è più debole di sei punti vince comunque <b>una volta su quattro</b>.`
      : `Parti sotto di <b>${Math.abs(gap)}</b> di OVR. Una su quattro finisce lo stesso dalla tua parte.`;
    return `
      <div class="sh-brief">
        <div class="r"><span>Coach</span><b>${esc(state.coach?.name ?? "senza coach")}</b></div>
        <div class="r"><span>Tattica</span><b>${esc(state.coach?.tattica ?? "-")}</b></div>
        <div class="r"><span>Ritmo previsto</span><b>${partita.possessi.casa} possessi</b></div>
        <ul class="sh-note">
          <li>Il tuo vantaggio è <b>${meglio.lab.toLowerCase()}</b>: ${mieiReparti[meglio.k]} contro ${loroReparti[meglio.k]}.</li>
          <li>${notaPeggio}</li>
          <li>${notaGap}</li>
        </ul>
      </div>`;
  }

  // Cronaca vera, canestro per canestro: il livello "essenziale" del motore
  // (~45 azioni notevoli su ~350), filtrato su quanto abbiamo già mostrato. Il
  // colore della riga viene da chi era avanti in quel momento della partita.
  function cronacaHTML() {
    if (azioneIdx < 0) return "";
    const notevoli = log(azioni.slice(0, azioneIdx + 1), "essenziale");
    return `<ul class="sh-log">${notevoli.map((a) => {
      const d = a.casa - a.ospite;
      const cls = d > 0 ? "pos" : d < 0 ? "neg" : "par";
      const q = partita.quarti[a.q];
      return `<li class="${cls}">
        <span class="q">${q.overtime ? "OT" : `${a.q + 1}°`}</span>
        <span class="t">${esc(a.testo)}</span>
      </li>`;
    }).join("")}</ul>`;
  }

  function tabellaHTML(righe, carte, ruoli, side) {
    const totali = righe.map((r) => parziale(r, quarto));
    const maxPt = Math.max(...totali.map((v) => v.pts));
    const corpo = righe.map((r, i) => {
      const v = totali[i];
      const c = carte[i];
      const ruolo = ruoli[i] ?? "";
      const celle = [["pts", "pt"], ["reb"], ["ast"], ["stl"], ["tov"], ["blk"]].map(([k, cls]) => {
        const classi = [cls || (v[k] === 0 ? "zero" : "")];
        // Lampo solo su chi ha appena mosso la statistica: un'animazione per
        // ogni cifra a ogni quarto sarebbe rumore.
        if (quarto > 0 && r.per[quarto - 1]?.[k] > 0) classi.push("sh-flash");
        return `<td class="${classi.filter(Boolean).join(" ")}">${v[k]}</td>`;
      }).join("");
      const titolo = `${r.nome}${c.season ? ` · ${c.team_abbr} ${c.season}` : ""}`;
      return `<tr class="stat-row ${v.pts === maxPt && quarto > 0 ? "top" : ""}" data-side="${side}" data-idx="${i}">
        <td title="${esc(titolo)}">${facciaHTML(c)}<span class="ruolo">${esc(ruolo)}</span>${esc(cognome(r.nome))}</td>
        ${celle}
      </tr>`;
    }).join("");
    const somma = totali.reduce((a, v) => {
      for (const k in a) a[k] += v[k];
      return a;
    }, { pts: 0, reb: 0, ast: 0, stl: 0, tov: 0, blk: 0 });
    const piede = ["pts", "reb", "ast", "stl", "tov", "blk"].map((k) => `<td>${somma[k]}</td>`).join("");
    return `
      <table class="sh-box">
        <thead><tr>
          <th>Giocatore</th><th>PT</th><th>RIMB</th><th>AST</th><th>RUB</th><th>PP</th><th>STP</th>
        </tr></thead>
        <tbody>${corpo}</tbody>
        <tfoot><tr><td>Squadra</td>${piede}</tr></tfoot>
      </table>`;
  }

  // Sheet stats live (click su una riga del box score dopo il via): totali +
  // dettaglio quarto per quarto, dati VERI della partita in corso - non lo
  // sheet statico di draft.js. Riusa .c1/.c1-head/.c1-tot (già nel Profilo).
  const STAT_COLS = [["pts", "PT"], ["reb", "RIMB"], ["ast", "AST"], ["stl", "RUB"], ["tov", "PP"], ["blk", "STP"]];
  function statSheetHTML(riga, carta, ruolo) {
    const tot = parziale(riga, quarto);
    const head = `<div class="c1-head">
      ${facciaHTML(carta)}
      <span class="c1-id"><span class="nm">${esc(riga.nome)}</span>
        <span class="sub">${esc(ruolo)} · ${esc(carta.team_abbr ?? "")} ${esc(carta.season ?? "")}</span></span>
    </div>`;
    const strip = `<div class="c1-tot">
      <span class="lbl">Totale partita</span>
      <div class="grid">${STAT_COLS.map(([k, lab]) => `<span class="cell"><b>${tot[k]}</b><small>${lab}</small></span>`).join("")}</div>
    </div>`;
    const righeQ = riga.per.slice(0, quarto).map((q, i) => {
      const lab = partita.quarti[i].overtime ? "OT" : `${i + 1}°`;
      return `<tr><td>${lab}</td>${STAT_COLS.map(([k]) => `<td>${q[k]}</td>`).join("")}</tr>`;
    }).join("");
    const perq = `<div class="c1-perq">
      <span class="lbl">Quarto per quarto</span>
      <table>
        <thead><tr><th></th>${STAT_COLS.map(([, lab]) => `<th>${lab}</th>`).join("")}</tr></thead>
        <tbody>${righeQ}</tbody>
      </table>
    </div>`;
    return `<div class="c1">${head}${strip}${perq}</div>`;
  }

  // Auto-pausa quando apre: senza, la tabella dietro continua a muoversi e lo
  // snapshot nello sheet diventa stale mentre lo stai leggendo.
  function openStatSheet(riga, carta, ruolo) {
    if (inCorso && !inPausa) { pausaToggle(); pausaDaSheet = true; }
    let dlg = document.getElementById("stat-sheet");
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.id = "stat-sheet";
      dlg.className = "sheet";
      document.body.appendChild(dlg);
    }
    dlg.innerHTML = `
      <button class="sheet-x" id="stat-x" type="button" aria-label="Chiudi">×</button>
      ${statSheetHTML(riga, carta, ruolo)}`;
    dlg.querySelector("#stat-x").onclick = () => dlg.close();
    dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };
    // "close" nativo copre X, click sul backdrop ED Esc (che bypassa gli
    // onclick sopra): un solo punto per riprendere la simulazione.
    dlg.onclose = () => {
      if (pausaDaSheet) { pausaDaSheet = false; if (inCorso && inPausa) pausaToggle(); }
    };
    dlg.showModal();
  }

  // Prima del via la formazione È il contenuto: tessere grandi. Dopo il via
  // diventa il box score, che è quello che si guarda mentre la partita gira.
  function formazioneHTML(carte, carteBox, righe, ruoli, ruoliBox, side) {
    if (quarto > 0) return tabellaHTML(righe, carteBox, ruoliBox, side);
    return `<div class="a-lineup">${carte.map((c, i) => `
      <div class="a-card">
        ${facciaHTML(c)}
        <div class="ru">${esc(ruoli[i] ?? "")}</div>
        <div class="nm" title="${esc(c.name)}">${esc(cognome(c.name))}</div>
        <div class="ov">${toDisplayOvr(votoCarta(c))}</div>
      </div>`).join("")}</div>`;
  }

  function ctaHTML() {
    if (azioneIdx < 0) return `<button class="sh-cta" id="via">${PLAY}<span>Gioca la partita</span></button>`;
    if (!finita()) {
      // Non interattivo: Pausa ora sta in testata (vedi testataHTML). Questa riga
      // resta solo per tenere l'altezza della fascia CTA, senza saltare quando
      // parte la simulazione.
      return `<button class="sh-cta ghost" disabled>${inPausa ? "In pausa" : `Simulazione in corso · ${VELOCITA_NOME[velocita]}`}</button>`;
    }
    return `<button class="sh-cta" id="avanti">${vinto ? "Prossimo turno" : "Vedi come è andata"}</button>`;
  }

  function verdettoHTML() {
    if (!finita()) return "";
    const p = cumulato(partita.quarti, nQuarti);
    return `<div class="sh-verdict ${vinto ? "win" : "lose"}" role="status">
      ${vinto ? "Passi il turno" : "Corsa finita"} · <em>${p.casa}-${p.ospite}</em>
    </div>`;
  }

  // ---- disegno + eventi ----------------------------------------------------

  function disegna() {
    el.innerHTML = `
      ${appHeader(state)}
      <div class="sh-hd">${testataHTML()}</div>
      <div class="sh-body">
        <div class="a-top">
          <div class="a-panel">
            ${punteggioHTML()}
            ${quartiHTML()}
            <div class="sh-cap"><span>Il duello dei reparti</span><b>Perché finisce così</b></div>
            ${duelloHTML()}
          </div>
          <div class="a-panel">
            <div class="sh-cap">
              <span>${azioneIdx < 0 ? "Prima del via" : "Cronaca"}</span>
              <b>${azioneIdx < 0 ? "Come si vince" : `${quarto}/${nQuarti}`}</b>
            </div>
            ${azioneIdx < 0 ? briefingHTML() : cronacaHTML()}
            ${verdettoHTML()}
          </div>
        </div>
        <div class="a-bot">
          <div class="a-panel">
            <div class="sh-cap"><span>Il tuo quintetto</span><b>${quarto === 0 ? "Formazione" : "Box score"}</b></div>
            ${formazioneHTML(mieCarte, mieCarteBox, box.casa.righe, ROLES, mieRuoliBox, "mia")}
          </div>
          <div class="a-panel">
            <div class="sh-cap"><span>Chi hai di fronte</span><b>${quarto === 0 ? "Formazione" : "Box score"}</b></div>
            ${formazioneHTML(loroCarte, loroCarteBox, box.ospite.righe, loroRuoli, loroRuoliBox, "loro")}
          </div>
        </div>
        ${ctaHTML()}
      </div>`;
    aggancia();
    // La lista scrolla dentro di sé (vedi .sh-log): senza questo resterebbe
    // ancorata in cima e l'ultima riga arrivata finirebbe fuori vista.
    const lista = el.querySelector(".sh-log");
    if (lista) lista.scrollTop = lista.scrollHeight;
  }

  function aggancia() {
    // onExit ferma il timer di animazione prima del dispatch: il dispatch
    // sostituisce l'intero screen, ma il setTimeout in corso resterebbe attivo
    // nella vecchia closure e continuerebbe a schedulare passi a vuoto.
    wireAppHeader(el, ctx, {
      onExit: () => { fermaTimer(); pausaDaSheet = false; document.getElementById("stat-sheet")?.close(); },
    });
    el.querySelector("#via")?.addEventListener("click", via);
    el.querySelector("#pausa")?.addEventListener("click", pausaToggle);
    el.querySelector("#avanti")?.addEventListener("click", () => {
      fermaTimer();
      pausaDaSheet = false;
      document.getElementById("stat-sheet")?.close();
      ctx.dispatch({ type: "resolveRound" });
    });
    el.querySelectorAll(".sh-seg button").forEach((b) => {
      b.addEventListener("click", () => cambiaVelocita(b.dataset.vel));
    });
    el.querySelectorAll(".sh-box tr.stat-row").forEach((tr) => {
      const mia = tr.dataset.side === "mia";
      const i = Number(tr.dataset.idx);
      const righe = mia ? box.casa.righe : box.ospite.righe;
      const carte = mia ? mieCarteBox : loroCarteBox;
      const ruoli = mia ? mieRuoliBox : loroRuoliBox;
      tr.addEventListener("click", () => openStatSheet(righe[i], carte[i], ruoli[i] ?? ""));
    });
  }

  function fermaTimer() {
    if (timer) { clearTimeout(timer); timer = null; }
  }

  function cambiaVelocita(v) {
    // Il ridisegno butta via il bottone su cui stavi: chi naviga da tastiera si
    // ritroverebbe il focus sul body dopo ogni click. Lo rimetto dov'era.
    const daTastiera = el.querySelector(".sh-seg button:focus") !== null;
    velocita = v;
    scriviVelocita(v);
    // Il cambio vale SUBITO, non dal prossimo canestro: a Lenta, premere Rapida
    // e non vedere succedere niente per un pezzo sembra un bottone rotto. In
    // pausa invece il valore resta solo memorizzato: non deve far ripartire il
    // timer da sola (altrimenti "Pausa" + cambio velocità riavvia la partita).
    if (inCorso && !inPausa) {
      fermaTimer();
      timer = setTimeout(passo, tickMs());
    }
    disegna();
    riprendiFocus(v, daTastiera);
  }

  function riprendiFocus(v, attivo) {
    if (attivo) el.querySelector(`.sh-seg button[data-vel="${v}"]`)?.focus();
  }

  function pausaToggle() {
    if (!inCorso || finita()) return;
    inPausa = !inPausa;
    if (inPausa) {
      fermaTimer();
    } else {
      timer = setTimeout(passo, tickMs());
    }
    disegna();
  }

  // Salto istantaneo alla fine: SOLO per prefers-reduced-motion, che bypassa
  // sempre ogni animazione senza eccezioni. "Salta" come velocità scelta
  // dall'utente ora anima canestro per canestro come le altre (vedi VELOCITA
  // e passo()), non salta più di scatto.
  function finisciSubito() {
    fermaTimer();
    quarto = nQuarti;
    azioneIdx = azioni.length - 1;
    inCorso = false;
    inPausa = false;
    disegna();
  }

  // Prepara i canestri del quarto `q`: da qui `passo` sa quanti passi servono
  // e quanto dura ciascuno (vedi `tickMs`).
  function iniziaQuarto(q) {
    canestriQuarto = canestriPerQuarto[q];
    idxCanestro = 0;
  }

  function passo() {
    // Quarto senza canestri (in teoria impossibile, il motore non lo garantisce
    // qui): un solo passo porta dritti alla fine del quarto.
    if (canestriQuarto.length === 0) {
      azioneIdx = ultimaAzioneQuarto[quarto];
    } else {
      azioneIdx = canestriQuarto[idxCanestro];
      idxCanestro++;
    }
    const quartoFinito = idxCanestro >= canestriQuarto.length;
    if (quartoFinito) {
      // Chiude sull'ultima azione in assoluto del quarto, non sull'ultimo
      // canestro: così un'azione notevole senza punti dopo l'ultimo canestro
      // (una stoppata sulla sirena) resta comunque in cronaca.
      azioneIdx = ultimaAzioneQuarto[quarto];
      quarto++;
    }
    disegna();
    if (finita()) { inCorso = false; return; }
    if (quartoFinito) iniziaQuarto(quarto);
    timer = setTimeout(passo, tickMs());
  }

  function via() {
    if (inCorso || finita()) return;
    // Chi ha chiesto meno movimento vede il finale subito: niente attesa, mai
    // un'eccezione (nemmeno se ha scelto "Salta" come velocità).
    if (senzaMovimento) { finisciSubito(); return; }
    inCorso = true;
    inPausa = false;
    iniziaQuarto(quarto);
    passo();
  }

  disegna();
  return el;
}
