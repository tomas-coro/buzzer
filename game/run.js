// La corsa: draft di dieci, scelta del coach, e poi una partita per round
// finché non perdi o non arrivi a sedici vittorie.
//
// COSA È CAMBIATO CON LA ROSA DA 10. Prima lo stato teneva un `quintetto` di
// cinque caselle e il coach moltiplicava un voto medio. Adesso lo stato tiene
// una `rosa` di dieci caselle (cinque titolari per ruolo + cinque posti di
// panchina liberi, 6°-10°), e il coach allena
// le CARTE una per una: da lì nasce `rosaAllenata`, che è quella che scende in
// campo. Le due rose restano separate di proposito - `rosa` è quello che hai
// draftato, `rosaAllenata` è quello che il coach ne ha fatto - così la
// schermata può mostrare il prima e il dopo, e cambiare coach non consuma
// niente di irreversibile.
//
// I minuti vengono dalla ROTAZIONE del coach, e sono il peso di tutto: reparti
// di squadra, box score e punto a punto leggono da lì.

import { ROLES } from "./roster.js";
import {
  emptyRosa, assegnaRosa, rosaCompleta, minutiRosa, caselleDove, cartaIn,
  etichettaSlot, TITOLARE, caselleLibere,
} from "./rosa.js";
import { applyCoach } from "./coach.js";
import { pickOpponent, chiaveAvversario } from "./opponents.js";
import { DIFFICULTIES, TETTI } from "./difficulty.js";
import { salarioCarta, limiteDuro, firmabile, malusApron } from "./salary.js";
import { votoDaReparti } from "./rating.js";
import { simulaPartita, rngSeed } from "./partita.js";
import { boxScorePartita } from "./boxscore.js";
import { playByPlay } from "./playbyplay.js";
import { teamName } from "./team-names.js";

// La rotazione dell'avversario storico. Neutra come il suo ritmo, e per lo
// stesso motivo: non sappiamo chi allenava quella squadra in quella stagione,
// e inventarglielo sposterebbe la taratura senza aggiungere verità.
export const ROTAZIONE_AVVERSARIO = "normale";

export function newRun({
  formato, difficolta, k = null, seme = semeCasuale(),
  // Il nome che il giocatore dà alla sua squadra. Entra nella cronaca, quindi
  // non è solo un'etichetta: senza, le frasi restano su "La tua squadra" e
  // suonano male in mezzo ai nomi veri delle squadre NBA.
  squadra = "La tua squadra",
}) {
  const d = DIFFICULTIES[difficolta];
  if (!d) throw new Error(`Difficoltà inesistente: ${difficolta}`);
  if (!Number.isInteger(seme)) throw new Error("newRun: il seme deve essere un intero");
  if (typeof squadra !== "string" || squadra.trim() === "") {
    throw new Error("newRun: il nome squadra non può essere vuoto");
  }
  return {
    formato, difficolta, k, seme, squadra: squadra.trim(),
    rosa: emptyRosa(),
    // Il tetto di spesa della difficoltà, e quanto ne hai già impegnato. Stanno
    // nello stato e non si ricalcolano dalla rosa perché il prezzo pagato può
    // essere diverso dal cartellino: la firma di ripiego costa il minimo (vedi
    // draftPick e `firmaDiRipiego` in salary.js).
    tetto: TETTI[difficolta],
    speso: 0,
    rosaAllenata: null,
    coach: null,
    aids: { ...d.aids },
    round: 0,
    vittorie: 0,
    avversario: null,
    // Chi hai già incontrato in questa corsa: serve a non rigiocare due volte
    // contro la stessa squadra-stagione (vedi pickOpponent).
    affrontati: [],
    voto: null,
    ritmo: 0,
    rotazione: "normale",
    effetti: [],
    stato: "draft",
    esito: null,
    storia: [],
  };
}

/**
 * Piazza una carta in una casella scelta.
 *
 * La casella arriva da chi gioca, non la decide più il motore: da quando la
 * panchina è libera e numerata (6°-10°), DOVE metti una carta è una scelta di
 * minuti, cioè di strategia. `slot` è { tipo: "titolare", ruolo } oppure
 * { tipo: "panca", posto }.
 */
export function draftPick(state, slot, carta, costo = salarioCarta(carta)) {
  if (state.stato !== "draft") throw new Error("draftPick: non in fase draft");
  if (cartaIn(state.rosa, slot) !== null) {
    throw new Error(`draftPick: la casella ${etichettaSlot(slot)} è già occupata`);
  }
  // Il tetto non è un muro: si firma fino al secondo apron, e quello che sta
  // sopra il tetto si paga in campo (vedi `malusApron` in salary.js, applicato
  // in startRun). Oltre l'apron invece non si firma, punto.
  const residuo = limiteDuro(state.tetto) - state.speso;
  const vuote = caselleLibere(state.rosa).length;
  if (!firmabile(costo, residuo, vuote)) {
    throw new Error(
      `draftPick: ${carta?.name ?? "la carta"} costa troppo (${costo} su ${residuo} disponibili, `
      + `${vuote - 1} caselle ancora da coprire)`,
    );
  }
  const rosa = assegnaRosa(state.rosa, slot, carta);
  const stato = rosaCompleta(rosa) ? "coach" : "draft";
  return { ...state, rosa, speso: state.speso + costo, stato };
}

// Dove può andare questa carta nella rosa di adesso: serve alle schermate e ai
// banchi di prova, che così non devono conoscere la forma della rosa.
export function caselleDisponibili(state, carta) {
  return caselleDove(state.rosa, carta);
}

const AID_TYPES = ["squadra", "stagione", "respin"];

export function useAid(state, type) {
  if (!AID_TYPES.includes(type)) throw new Error(`Tipo aiuto inesistente: ${type}`);
  // Ogni aiuto costa, in ogni difficoltà: finite le scorte l'unico modo di
  // vedere una rosa nuova è piazzare una carta (vedi difficulty.js).
  if (state.aids[type] <= 0) throw new Error(`Aiuto '${type}' esaurito`);
  return { ...state, aids: { ...state.aids, [type]: state.aids[type] - 1 } };
}

export function chooseCoach(state, coach) {
  if (!rosaCompleta(state.rosa)) throw new Error("chooseCoach: rosa incompleta");
  if (state.stato !== "coach") throw new Error("chooseCoach: non in fase coach");
  return { ...state, coach, stato: "coach" };
}

// Abbassa tutti i reparti della squadra di `punti` e rifà il voto complessivo.
// I reparti sono percentili: sotto zero non si scende.
function tassaSuiReparti(voto, punti) {
  if (punti <= 0) return voto;
  const reparti = {};
  for (const [r, v] of Object.entries(voto.reparti)) reparti[r] = Math.max(0, v - punti);
  return { ovr: votoDaReparti(reparti), reparti };
}

export function startRun(state, pool) {
  if (state.stato !== "coach") throw new Error("startRun: non in fase coach");
  if (!state.coach) throw new Error("startRun: manca il coach");
  // Qui il coach entra davvero in campo: alza e abbassa i reparti dei singoli,
  // e da quelle carte allenate nascono voto, ritmo e minuti della corsa.
  const { rosa, voto: votoLordo, ritmo, rotazione, effetti } = applyCoach(state.rosa, state.coach);
  // La tassa del secondo apron si paga qui, una volta sola, sui reparti della
  // squadra: da questo momento partita, box score e cronaca leggono i reparti
  // già tassati e nessuno di loro deve sapere che esiste un tetto di spesa.
  const voto = tassaSuiReparti(votoLordo, malusApron(state.speso, state.tetto));
  const d = DIFFICULTIES[state.difficolta];
  const round = 1;
  const avversario = pickOpponent(pool, round, d, semeAvversario(state.seme, round));
  return {
    ...state, rosaAllenata: rosa, voto, ritmo, rotazione, effetti,
    round, avversario, pool, stato: "run",
  };
}

// I cinque che partono, in ordine PG→C. Le schermate che hanno spazio per un
// quintetto e non per dieci righe (l'esito, il tabellone) leggono da qui.
export function titolari(state) {
  const rosa = state.rosaAllenata ?? state.rosa;
  return ROLES.map((r) => cartaIn(rosa, { tipo: TITOLARE, ruolo: r }));
}

// L'rng che pesca l'avversario del round. Ha un seme tutto suo, staccato da
// quello della partita e da quello del box score: cambiare la taratura degli
// avversari non deve cambiare come si gioca una partita già pescata.
const semeAvversario = (seme, round) => rngSeed(seme + round * 31 + 5171);

// Seme di partenza di una corsa. Non è un fallback che nasconde un errore: è la
// pallina della roulette, e chi vuole una corsa riproducibile (test, replay,
// "sfida del giorno" uguale per tutti) lo passa a newRun.
function semeCasuale() {
  return Math.floor(Math.random() * 2 ** 31);
}

// La partita del round: funzione PURA dello stato, non tocca niente.
//
// Il seme del round nasce da `seme + round`, e questo è il punto: la UI può
// chiamarla per mostrare il tabellone che si riempie DURANTE l'animazione, e
// resolveRound rigiocherà esattamente la stessa partita quando applica il
// risultato. Senza il seme derivato servirebbe passarsi il risultato tra
// schermate, oppure - peggio - si simulerebbe due volte con due esiti diversi.
export function partitaRound(state) {
  if (state.stato !== "run") throw new Error("partitaRound: run non attivo");
  return simulaPartita({
    casa: {
      nome: state.squadra ?? "La tua squadra",
      reparti: state.voto.reparti,
      ritmo: state.ritmo ?? 0,
    },
    ospite: {
      // Il nome per esteso, non la sigla: la cronaca è un testo da leggere, e
      // "Miami Heat avanti di 6" dice a chi stai giocando contro, "MIA" no.
      // L'identità dell'avversario resta `team`: qui cambia solo come si legge.
      nome: teamName(state.avversario.team),
      reparti: state.avversario.voto.reparti,
      ritmo: 0,
    },
    rng: rngSeed(state.seme + state.round),
  });
}

// Le dieci righe di una rosa pronte per il box score: la carta più i minuti che
// gioca. È l'unico punto in cui la rotazione entra nelle statistiche dei
// singoli, e per questo sta qui e non dentro boxscore.js.
function giocatoriConMinuti(rosa, rotazione) {
  // `ruolo` qui è quello con cui il motore tratta la carta: della casella se è
  // titolare, della carta se è in panchina (la panchina non ha posizioni).
  return minutiRosa(rosa, rotazione).map(({ carta, minuti, ruolo, tipo, slot }) => ({
    ...carta, minuti, ruolo, tipo, slot,
  }));
}

// Il box score del round: chi ha fatto cosa, quarto per quarto, dieci righe per
// lato.
//
// Puro come `partitaRound` e per lo stesso motivo: la UI riempie le righe
// mentre la partita si anima, `resolveRound` le rigenera identiche quando le
// salva nella storia. Il seme è staccato da quello della partita (`+ 7919`)
// perché le due estrazioni non devono interferire: cambiare la taratura del box
// score non deve cambiare chi vince il round.
export function boxScoreRound(state, partita = partitaRound(state)) {
  if (state.stato !== "run") throw new Error("boxScoreRound: run non attivo");
  return boxScorePartita({
    partita,
    casa: {
      giocatori: giocatoriConMinuti(state.rosaAllenata, state.rotazione),
      reparti: state.voto.reparti,
    },
    ospite: {
      giocatori: giocatoriConMinuti(state.avversario.rosa, ROTAZIONE_AVVERSARIO),
      reparti: state.avversario.voto.reparti,
    },
    rng: rngSeed(state.seme + state.round + 7919),
  });
}

// Il punto a punto del round: la partita azione per azione, con i nomi e
// l'orologio.
//
// Puro come `partitaRound` e `boxScoreRound`, e col suo seme staccato
// (`+ 3121`) per la stessa ragione: ritarare il racconto non deve cambiare né
// chi vince né le righe del tabellino.
//
// NON finisce in `storia`. Le ~350 azioni di una partita si ricalcolano da qui
// in qualsiasi momento partendo dal seme, mentre salvarle vorrebbe dire
// portarsi dietro qualche megabyte per una corsa da sedici partite.
export function playByPlayRound(
  state, partita = partitaRound(state), box = boxScoreRound(state, partita)
) {
  if (state.stato !== "run") throw new Error("playByPlayRound: run non attivo");
  return playByPlay({
    partita,
    box,
    casa: {
      nome: state.squadra ?? "La tua squadra",
      giocatori: giocatoriConMinuti(state.rosaAllenata, state.rotazione),
      reparti: state.voto.reparti,
    },
    ospite: {
      nome: teamName(state.avversario.team),
      giocatori: giocatoriConMinuti(state.avversario.rosa, ROTAZIONE_AVVERSARIO),
      reparti: state.avversario.voto.reparti,
    },
    rng: rngSeed(state.seme + state.round + 3121),
  });
}

// Esito del round corrente, senza toccare lo stato. Serve alla UI, che deve
// mostrare il verdetto DURANTE l'animazione del buzzer, cioè prima di applicare
// resolveRound. Sta qui e non nella schermata perché la regola di chi vince deve
// restare una sola: se un domani cambia (pareggi, tie-break), cambia in un posto.
export function esitoRound(state) {
  if (state.stato !== "run") throw new Error("esitoRound: run non attivo");
  return partitaRound(state).vincitore === "casa";
}

export function resolveRound(state) {
  if (state.stato !== "run") throw new Error("resolveRound: run non attivo");
  const d = DIFFICULTIES[state.difficolta];
  const partita = partitaRound(state);
  const vinto = partita.vincitore === "casa";
  const storia = [...state.storia, {
    round: state.round, avversario: state.avversario.team, vinto,
    tuo: state.voto.ovr, loro: state.avversario.voto.ovr,
    // Il punteggio vero e la cronaca: servono alla schermata esito e al
    // tabellone di fine corsa, che prima potevano mostrare solo due voti.
    punti: partita.punti, quarti: partita.quarti, cronaca: partita.cronaca,
    // Le righe dei dieci: senza salvarle, a fine corsa non esistono medie da
    // mostrare e la classifica dei giocatori più usati non ha su cosa contare.
    box: boxScoreRound(state, partita),
  }];
  const affrontati = [...state.affrontati, chiaveAvversario(state.avversario)];
  if (!vinto) {
    return { ...state, storia, affrontati, stato: "finito", esito: "sconfitta" };
  }
  const vittorie = state.vittorie + 1;
  if (vittorie >= d.N) {
    return { ...state, storia, affrontati, vittorie, stato: "finito", esito: "imbattuto" };
  }
  const round = state.round + 1;
  const avversario = pickOpponent(
    state.pool, round, d, semeAvversario(state.seme, round), new Set(affrontati));
  return { ...state, storia, affrontati, vittorie, round, avversario };
}
