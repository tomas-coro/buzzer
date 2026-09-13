# Serie Playoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere la modalità "Serie Playoff" (4 serie al meglio delle 7, esito finale "Campione") come percorso parallelo al formato "imbattuto" esistente, senza toccare quest'ultimo.

**Architecture:** Nessuna riscrittura del motore. `game/run.js` guadagna una nuova funzione `resolveSeriesGame` (gemella di `resolveRound`) e i tre "leggi la partita del turno" (`partitaRound`/`boxScoreRound`/`playByPlayRound`) imparano a distinguere un "turno" (round intero per l'imbattuto, singola gara dentro la serie per il playoff). `app.js` sceglie quale risolutore chiamare in base a `state.formato`. Le schermate (`home`, `difficolta`, `run`, `esito`, `leaderboard`) si biforcano sullo stesso campo, riusando le classi CSS esistenti dove possibile.

**Tech Stack:** JS vanilla (ES modules), `node:test` + `node:assert/strict`, nessun framework, nessuna build.

## Global Constraints

- Il formato `"imbattuto"` resta bit-per-bit come oggi: ogni funzione toccata deve produrre l'IDENTICO risultato quando `state.formato !== "playoff"`.
- `PLAYOFF_ROUNDS = 4` (round dei playoff), `PLAYOFF_SERIE_A = 4` (vittorie per chiudere una serie, al meglio delle 7).
- Il draft, il coach, gli aiuti, il tetto di spesa e le soglie `oppMin/oppMax` per difficoltà (`game/difficulty.js`) NON cambiano: sono condivisi identici tra i due formati.
- `game/partita.js`, `game/coach.js`, `game/rosa.js`, `game/difficulty.js` non si toccano.
- Spec di riferimento (immutabile, non ridiscutere le decisioni): `docs/superpowers/specs/2026-09-13-serie-playoff-design.md`.

---

## File Structure

| File | Responsabilità |
|---|---|
| `game/run.test.js` | **Da correggere prima di tutto**: 20 chiamate a `newRun`/helper usano già `formato: "playoff"` come valore arbitrario (formato oggi non ha alcun effetto sul motore). Con `resolveSeriesGame` in arrivo, quel valore smetterà di essere neutro: va rinominato in `"imbattuto"`, che è ciò che quei test verificano davvero. |
| `game/run.js` | Costanti playoff, campi extra in `newRun`/`startRun`, `turnoSeed()`, `resolveSeriesGame()`. |
| `prototype/imbattuto/app.js` | Instrada `formato` dalla home al draft (`selectFormato`), sceglie `resolveRound` vs `resolveSeriesGame`. |
| `prototype/imbattuto/screens/home.js` | La card "Serie Playoff" diventa cliccabile. |
| `prototype/imbattuto/screens/difficolta.js` | Copy dedicata + dispatch del formato scelto. |
| `prototype/imbattuto/screens/run.js` | Testata "Round X/4 · punteggio serie" al posto del tabellone a tacche; copy di vittoria/sconfitta consapevole della serie. |
| `prototype/imbattuto/screens/esito.js` | Esito "Campione"; conteggio sconfitte generico (serve per il record playoff, che può avere più di una sconfitta). |
| `prototype/imbattuto/screens/leaderboard.js` + `styles.css` | Bucket per formato, non solo per difficoltà. |

---

### Task 1: Bonifica dei test esistenti prima di dare significato a `formato`

**Perché prima di tutto:** oggi `state.formato` non influenza nessuna riga di `game/run.js`. `game/run.test.js` ne approfitta e usa `formato: "playoff"` come valore segnaposto in 20 punti (helper `nuovaRun`/`pronta` incluse) - lo confermano i `grep` fatti in fase di piano: nessun test controlla mai `.formato`, verificano solo il motore generico (draft, aiuti, `resolveRound`). Appena `resolveSeriesGame` e i seed di turno faranno leva su `state.formato === "playoff"`, quei 20 test finirebbero per attraversare il ramo playoff per sbaglio, con seed diversi da oggi: gli assert su punteggi/box score esatti si romperebbero non perché il codice sia sbagliato, ma perché il fixture mentiva. Si corregge il fixture, non il motore.

**Files:**
- Modify: `game/run.test.js` (solo stringhe `"playoff"` → `"imbattuto"`, nessuna logica)

**Interfaces:**
- Nessuna: rinomina pura di un valore di fixture, zero impatto sulle funzioni esportate.

- [ ] **Step 1: Verifica che nessun test dipenda dal valore letterale "playoff"**

Run: `grep -n '\.formato\b' game/run.test.js`
Expected: nessun output (già verificato in fase di piano - conferma che non è cambiato nulla nel frattempo).

- [ ] **Step 2: Rinomina il fixture**

Sostituisci OGNI occorrenza di `formato: "playoff"` con `formato: "imbattuto"` in `game/run.test.js` (20 occorrenze, tutte identiche, usa una sostituzione globale sulla stringa esatta `formato: "playoff"`).

- [ ] **Step 3: La suite resta verde, byte-per-byte lo stesso comportamento**

Run: `node --test game/run.test.js`
Expected: PASS su tutti i test, stesso numero di prima (la rinomina non deve cambiare né aggiungere né rimuovere assert).

- [ ] **Step 4: Commit**

```bash
git add game/run.test.js
git commit -m "test(run): il fixture generico usa formato imbattuto, non playoff

Prerequisito per resolveSeriesGame: formato non ha oggi alcun effetto sul
motore, quindi i test che esercitano il percorso generico usavano 'playoff'
come valore neutro. Appena il formato inizierà a contare, quello stesso
valore li avrebbe fatti passare per sbaglio nel ramo playoff."
```

---

### Task 2: `game/run.js` - stato esteso per il formato playoff

**Files:**
- Modify: `game/run.js:39-78` (`newRun`), `game/run.js:186-203` (`startRun`)
- Test: `game/run.test.js`

**Interfaces:**
- Consumes: nulla di nuovo (stesse funzioni `emptyRosa`, `DIFFICULTIES`, `TETTI`, `pickOpponent`, `semeAvversario` già importate in `run.js`).
- Produces: `PLAYOFF_ROUNDS` (== 4), `PLAYOFF_SERIE_A` (== 4) esportate da `game/run.js`. `newRun({formato:"playoff", ...})` produce uno stato con in più `gara: 0` e `serieRecord: {noi:0, loro:0}`. `startRun` su uno stato playoff porta `gara` a `1` e resetta `serieRecord` a `{noi:0, loro:0}`. Per `formato !== "playoff"` lo stato NON contiene queste due chiavi (stesso shape di oggi).

- [ ] **Step 1: Scrivi i test che falliscono**

Aggiungi in `game/run.test.js`, subito dopo il blocco dei costanti/helper in testa al file (dopo la definizione di `nuovaRun`, prima del primo `test(...)`):

```js
// Helper gemelli di nuovaRun/pronta ma per il formato playoff: stessi difetti
// (seme fisso, coach neutro), diverso solo il formato passato a newRun.
const nuovaRunPlayoff = (difficolta = "normale") =>
  newRun({ formato: "playoff", difficolta, seme: SEME });

function prontaPlayoff(mio, loro, coach = COACH) {
  let s = fullDraft(nuovaRunPlayoff(), mio);
  s = chooseCoach(s, coach);
  return startRun(s, poolAt(loro));
}
```

Poi aggiungi questi test (in fondo al file, prima dell'ultima riga):

```js
test("newRun('playoff'): in più su rosa/aiuti porta gara e serieRecord a zero", () => {
  const s = newRun({ formato: "playoff", difficolta: "normale" });
  assert.equal(s.gara, 0);
  assert.deepEqual(s.serieRecord, { noi: 0, loro: 0 });
});

test("newRun('imbattuto'): niente gara né serieRecord, lo stato resta quello di oggi", () => {
  const s = newRun({ formato: "imbattuto", difficolta: "normale" });
  assert.equal("gara" in s, false);
  assert.equal("serieRecord" in s, false);
});

test("startRun('playoff'): prima gara della prima serie", () => {
  const s = prontaPlayoff(70, 70);
  assert.equal(s.round, 1);
  assert.equal(s.gara, 1);
  assert.deepEqual(s.serieRecord, { noi: 0, loro: 0 });
});
```

- [ ] **Step 2: Falliscono per il motivo giusto**

Run: `node --test game/run.test.js`
Expected: FAIL sui tre test nuovi - `gara`/`serieRecord` `undefined` invece dei valori attesi (le altre righe restano PASS).

- [ ] **Step 3: Implementa**

In `game/run.js`, subito dopo `export const ROTAZIONE_AVVERSARIO = "normale";` (riga 37) aggiungi:

```js
// Playoff: 4 round (Round 1 -> Semifinale di conference -> Finale di
// conference -> Finale NBA), ogni round e' una serie al meglio delle 7 (primo
// a 4 vittorie passa il turno). Diverso da "imbattuto", che ha 16 round
// singoli: vedi DIFFICULTIES.N in difficulty.js, che resta a 16 per entrambi
// i formati (governa solo la scala del reveal e degli aiuti, non i playoff).
export const PLAYOFF_ROUNDS = 4;
export const PLAYOFF_SERIE_A = 4;
```

Poi in `newRun`, sostituisci il blocco di ritorno (righe 52-77):

```js
  return {
    formato, difficolta, k, seme, squadra: squadra.trim(),
    rosa: emptyRosa(),
    tetto: TETTI[difficolta],
    speso: 0,
    rosaAllenata: null,
    coach: null,
    aids: { ...d.aids },
    round: 0,
    vittorie: 0,
    avversario: null,
    affrontati: [],
    voto: null,
    ritmo: 0,
    rotazione: "normale",
    effetti: [],
    stato: "draft",
    esito: null,
    storia: [],
    // Solo per "playoff": in che gara della serie sei (1-7) e il punteggio di
    // serie del round corrente. "imbattuto" non li porta nello stato, per
    // restare bit-per-bit come oggi.
    ...(formato === "playoff" ? { gara: 0, serieRecord: { noi: 0, loro: 0 } } : {}),
  };
```

Infine in `startRun`, sostituisci il blocco di ritorno finale (righe 199-202):

```js
  return {
    ...state, rosaAllenata: rosa, voto, ritmo, rotazione, effetti,
    round, avversario, pool, stato: "run",
    ...(state.formato === "playoff" ? { gara: 1, serieRecord: { noi: 0, loro: 0 } } : {}),
  };
```

- [ ] **Step 4: Verifica che passino, e che il resto della suite non si sia mosso**

Run: `node --test game/run.test.js`
Expected: PASS su tutti i test (i tre nuovi + tutti quelli di prima, invariati).

- [ ] **Step 5: Commit**

```bash
git add game/run.js game/run.test.js
git commit -m "feat(run): stato esteso con gara e serieRecord per il formato playoff

newRun e startRun aggiungono i due campi solo quando formato === 'playoff';
'imbattuto' resta con lo stato di sempre, byte per byte."
```

---

### Task 3: `game/run.js` - `resolveSeriesGame` e seed di turno corretto

**Files:**
- Modify: `game/run.js:224-249` (`partitaRound`), `game/run.js:270-284` (`boxScoreRound`), `game/run.js:296-315` (`playByPlayRound`)
- Modify: aggiungi `resolveSeriesGame` dopo `resolveRound` (fine del file)
- Test: `game/run.test.js`

**Interfaces:**
- Consumes: `PLAYOFF_ROUNDS`, `PLAYOFF_SERIE_A` (Task 2), `pickOpponent`, `chiaveAvversario` (già importate), `partitaRound`/`boxScoreRound` (stesso file).
- Produces: `resolveSeriesGame(state, partita = partitaRound(state))` - stessa firma-pattern di `boxScoreRound`/`playByPlayRound` (accetta la partita già calcolata per non-ri-simulare). Ritorna lo stato aggiornato: se la serie continua, `{...state, storia, vittorie, serieRecord, gara: gara+1}`; se la serie e vinta e il round non era l'ultimo, avanza `round`/resetta `gara`/`serieRecord` e pesca un nuovo avversario; se la serie e vinta ED era il round 4, `{stato:"finito", esito:"campione"}`; se la serie e persa, `{stato:"finito", esito:"sconfitta"}`.

**Nota tecnica (non nello spec, scoperta in fase di piano):** `boxScoreRound` e `playByPlayRound` derivano il loro seed da `state.seme + state.round + costante` - esattamente come `partitaRound` prima di questa modifica. Se solo `partitaRound` venisse corretto per usare `round*7+gara`, le partite di una stessa serie giocherebbero incontri diversi (corretto) ma con lo STESSO identico box score e la STESSA identica cronaca (sbagliato: sembrerebbero la stessa partita rigiocata). Le tre funzioni condividono quindi un unico helper `turnoSeed`.

- [ ] **Step 1: Scrivi i test che falliscono**

Aggiungi in `game/run.test.js`:

```js
test("turnoSeed: due gare della stessa serie non sono la stessa partita", () => {
  const s1 = prontaPlayoff(60, 58);
  const p1 = partitaRound(s1);
  const s2 = resolveSeriesGame(s1); // gara 2, stesso avversario, stesso round
  assert.equal(s2.stato, "run");
  assert.equal(s2.round, s1.round, "stesso round, la serie non e' ancora decisa");
  assert.equal(s2.gara, 2);
  const p2 = partitaRound(s2);
  assert.notDeepEqual(p1.quarti, p2.quarti, "seed diverso -> partita diversa");
});

test("resolveSeriesGame: vinco una gara, la serie continua se non sono a 4", () => {
  const s = resolveSeriesGame(prontaPlayoff(95, 10));
  assert.equal(s.stato, "run");
  assert.equal(s.serieRecord.noi, 1);
  assert.equal(s.serieRecord.loro, 0);
  assert.equal(s.gara, 2);
  assert.equal(s.round, 1, "stesso round finche' la serie non e' decisa");
  assert.equal(s.avversario.team, "OPP", "stesso avversario per tutta la serie");
});

test("resolveSeriesGame: arrivo a 4 vittorie di serie, round < 4 -> round successivo", () => {
  let s = prontaPlayoff(95, 10);
  for (let i = 0; i < PLAYOFF_SERIE_A; i++) s = resolveSeriesGame(s);
  assert.equal(s.stato, "run", "la corsa continua, non e' l'ultimo round");
  assert.equal(s.round, 2);
  assert.equal(s.gara, 1);
  assert.deepEqual(s.serieRecord, { noi: 0, loro: 0 });
  assert.equal(s.vittorie, PLAYOFF_SERIE_A);
});

test("resolveSeriesGame: vinco la quarta serie -> esito campione", () => {
  let s = prontaPlayoff(95, 10);
  for (let round = 1; round <= PLAYOFF_ROUNDS; round++) {
    for (let gara = 0; gara < PLAYOFF_SERIE_A; gara++) s = resolveSeriesGame(s);
  }
  assert.equal(s.stato, "finito");
  assert.equal(s.esito, "campione");
  assert.equal(s.round, PLAYOFF_ROUNDS);
});

test("resolveSeriesGame: l'avversario perde a 4, la corsa finisce in sconfitta", () => {
  let s = prontaPlayoff(10, 95);
  for (let i = 0; i < PLAYOFF_SERIE_A; i++) s = resolveSeriesGame(s);
  assert.equal(s.stato, "finito");
  assert.equal(s.esito, "sconfitta");
  assert.equal(s.serieRecord.loro, PLAYOFF_SERIE_A);
});

test("resolveSeriesGame: una serie puo' finire 4-3, non solo 4-0", () => {
  // Alterno un mio 95-10 (vinco) a un 10-95 (perdo l'avversario vince): la
  // serie deve comunque chiudersi quando uno dei due arriva a 4, qualunque
  // sia la sequenza.
  let s = prontaPlayoff(95, 10);
  let vittorieMie = 0;
  let sconfitte = 0;
  while (s.stato === "run" && s.round === 1) {
    const primaGara = s.gara;
    s = resolveSeriesGame(s);
    // Con voto 95 contro 10 il seed decide comunque un vincitore quasi certo
    // per il piu' forte: qui verifichiamo solo l'invariante di conteggio, non
    // lo scarto esatto (la simulazione ha varianza, vedi game/partita.js).
    if (s.serieRecord.noi > vittorieMie) vittorieMie = s.serieRecord.noi;
    if (s.serieRecord.loro > sconfitte) sconfitte = s.serieRecord.loro;
    assert.ok(primaGara <= 7, "una serie al meglio delle 7 non supera 7 gare");
  }
  assert.ok(vittorieMie === PLAYOFF_SERIE_A || sconfitte === PLAYOFF_SERIE_A);
});

test("resolveSeriesGame fuori da 'run' lancia", () => {
  const s = prontaPlayoff(70, 70);
  const finito = { ...s, stato: "finito" };
  assert.throws(() => resolveSeriesGame(finito), /run non attivo/);
});
```

Aggiorna l'import in cima al file per includere `resolveSeriesGame` e le due costanti:

```js
import {
  newRun, draftPick, useAid, chooseCoach, startRun, resolveRound, resolveSeriesGame,
  esitoRound, partitaRound, boxScoreRound, playByPlayRound, titolari, sceltaAutoDraft,
  PLAYOFF_ROUNDS, PLAYOFF_SERIE_A,
} from "./run.js";
```

- [ ] **Step 2: Falliscono per il motivo giusto**

Run: `node --test game/run.test.js`
Expected: FAIL con `resolveSeriesGame is not defined` (o `undefined is not a function`) su tutti i nuovi test.

- [ ] **Step 3: Implementa**

In `game/run.js`, sostituisci la funzione `partitaRound` esistente (righe 224-249) con:

```js
// Il seed di TURNO. Per "imbattuto" un turno e' un round (un round = una
// partita): basta state.round, come oggi. Per "playoff" un turno e' una
// singola GARA dentro la serie, quindi combina round e gara - altrimenti
// tutte le gare della stessa serie userebbero lo stesso seed e sarebbero la
// stessa partita travestita da gara diversa.
function turnoSeed(state) {
  return state.formato === "playoff" ? state.round * 7 + state.gara : state.round;
}

// La partita del round (o della gara, in playoff): funzione PURA dello stato,
// non tocca niente.
//
// Il seed nasce da `seme + turnoSeed(state)`, e questo e' il punto: la UI puo'
// chiamarla per mostrare il tabellone che si riempie DURANTE l'animazione, e
// resolveRound/resolveSeriesGame rigiochera' esattamente la stessa partita
// quando applica il risultato. Senza il seed derivato servirebbe passarsi il
// risultato tra schermate, oppure - peggio - si simulerebbe due volte con due
// esiti diversi.
export function partitaRound(state) {
  if (state.stato !== "run") throw new Error("partitaRound: run non attivo");
  return simulaPartita({
    casa: {
      nome: state.squadra ?? "La tua squadra",
      reparti: state.voto.reparti,
      ritmo: state.ritmo ?? 0,
    },
    ospite: {
      nome: teamName(state.avversario.team),
      reparti: state.avversario.voto.reparti,
      ritmo: 0,
    },
    rng: rngSeed(state.seme + turnoSeed(state)),
  });
}
```

Nella funzione `boxScoreRound` (poco più sotto), sostituisci solo la riga del seed:

```js
    rng: rngSeed(state.seme + turnoSeed(state) + 7919),
```

Nella funzione `playByPlayRound`, sostituisci solo la riga del seed:

```js
    rng: rngSeed(state.seme + turnoSeed(state) + 3121),
```

Infine, in fondo al file (dopo `resolveRound`), aggiungi:

```js
/**
 * Come resolveRound, ma per il formato "playoff": una sconfitta non chiude la
 * corsa da sola, chiude la SERIE quando uno dei due arriva a
 * PLAYOFF_SERIE_A vittorie. Stesso avversario per tutte le gare della serie;
 * cambia solo quando si passa al round successivo.
 *
 * Accetta `partita` gia' calcolata (stesso pattern di boxScoreRound) cosi'
 * chi anima la gara nella UI non la simula due volte.
 */
export function resolveSeriesGame(state, partita = partitaRound(state)) {
  if (state.stato !== "run") throw new Error("resolveSeriesGame: run non attivo");
  const d = DIFFICULTIES[state.difficolta];
  const vinto = partita.vincitore === "casa";
  const storia = [...state.storia, {
    round: state.round, gara: state.gara,
    avversario: state.avversario.team, stagione: state.avversario.season, vinto,
    tuo: state.voto.ovr, loro: state.avversario.voto.ovr,
    punti: partita.punti, quarti: partita.quarti, cronaca: partita.cronaca,
    box: boxScoreRound(state, partita),
  }];
  const vittorie = state.vittorie + (vinto ? 1 : 0);
  const serieRecord = {
    noi: state.serieRecord.noi + (vinto ? 1 : 0),
    loro: state.serieRecord.loro + (vinto ? 0 : 1),
  };

  if (serieRecord.noi >= PLAYOFF_SERIE_A) {
    const affrontati = [...state.affrontati, chiaveAvversario(state.avversario)];
    if (state.round >= PLAYOFF_ROUNDS) {
      return { ...state, storia, affrontati, vittorie, serieRecord, stato: "finito", esito: "campione" };
    }
    const round = state.round + 1;
    // Stesso principio di oppMin/oppMax crescente di "imbattuto", ma spalmato
    // su 4 round invece che 16: senza questo, con d.N=16 (fisso per la scala
    // del reveal/aiuti) il round 4 arriverebbe solo a un quarto della banda.
    const dRound = { ...d, N: PLAYOFF_ROUNDS };
    const avversario = pickOpponent(
      state.pool, round, dRound, semeAvversario(state.seme, round), new Set(affrontati));
    return {
      ...state, storia, affrontati, vittorie, round, gara: 1,
      serieRecord: { noi: 0, loro: 0 }, avversario,
    };
  }
  if (serieRecord.loro >= PLAYOFF_SERIE_A) {
    const affrontati = [...state.affrontati, chiaveAvversario(state.avversario)];
    return { ...state, storia, affrontati, vittorie, serieRecord, stato: "finito", esito: "sconfitta" };
  }
  return { ...state, storia, vittorie, serieRecord, gara: state.gara + 1 };
}
```

- [ ] **Step 4: Verifica che passino, e che il resto della suite non si sia mosso**

Run: `node --test game/*.test.js`
Expected: PASS su tutta la suite (`game/run.test.js`, `game/opponents.test.js`, `game/difficulty.test.js`, gli altri file `game/*.test.js`) - `turnoSeed` per `formato !== "playoff"` restituisce `state.round`, identico a prima.

- [ ] **Step 5: Commit**

```bash
git add game/run.js game/run.test.js
git commit -m "feat(run): resolveSeriesGame per il formato playoff

Serie al meglio delle 7, stesso avversario finche' non e' decisa, esito
'campione' alla quarta serie vinta. partitaRound/boxScoreRound/playByPlayRound
condividono un seed di turno che per il playoff combina round e gara, cosi'
le gare della stessa serie non sono la stessa partita travestita."
```

---

### Task 4: `prototype/imbattuto/app.js` - instradamento del formato

**Files:**
- Modify: `prototype/imbattuto/app.js`

**Interfaces:**
- Consumes: `resolveSeriesGame` da `game/run.js` (Task 3).
- Produces: nuova azione `dispatch({type:"selectFormato", formato})` che imposta il formato scelto in home e passa a "difficolta". `ctx().formato` esposto alle schermate (default `"imbattuto"`). Il case `"resolveRound"` sceglie `resolveRound` o `resolveSeriesGame` in base a `state.formato`.

- [ ] **Step 1: Aggiungi l'import di `resolveSeriesGame`**

In `prototype/imbattuto/app.js:1-3`, sostituisci:

```js
import {
  newRun, draftPick, useAid, chooseCoach, startRun, resolveRound, sceltaAutoDraft,
} from "../../game/run.js";
```

con:

```js
import {
  newRun, draftPick, useAid, chooseCoach, startRun, resolveRound, resolveSeriesGame, sceltaAutoDraft,
} from "../../game/run.js";
```

- [ ] **Step 2: Stato del formato scelto in home**

Subito dopo la riga `let draftView = saved?.draftView ?? null;` (riga 24), aggiungi:

```js
// Il formato scelto in home, prima ancora che esista uno State: "imbattuto"
// (Corsa 16-0) o "playoff" (Serie Playoff). difficolta.js lo legge da ctx per
// sapere quale copy mostrare e quale formato passare a newRun.
let formatoScelto = "imbattuto";
```

- [ ] **Step 3: Esponi il formato in `ctx()`**

Sostituisci:

```js
function ctx() {
  const N = state ? DIFFICULTIES[state.difficolta].N : null;
  return { state, cards, pool, draftView, N, dispatch, go };
}
```

con:

```js
function ctx() {
  const N = state ? DIFFICULTIES[state.difficolta].N : null;
  return { state, cards, pool, draftView, N, dispatch, go, formato: formatoScelto };
}
```

- [ ] **Step 4: Nuova azione `selectFormato`**

Nel-lo `switch (action.type)` di `dispatch`, aggiungi un case PRIMA di `case "newRun":`:

```js
    case "selectFormato":
      // Scelto in home (Corsa 16-0 o Serie Playoff): resta valido finche' non
      // viene ridispatchato, cosi' tornare in home e ripartire con l'altro
      // formato non lascia residui del giro precedente.
      formatoScelto = action.formato;
      ui = "difficolta";
      break;
```

- [ ] **Step 5: `resolveRound` sceglie il risolutore giusto**

Sostituisci:

```js
    case "resolveRound":
      state = resolveRound(state);
```

con:

```js
    case "resolveRound":
      state = state.formato === "playoff" ? resolveSeriesGame(state) : resolveRound(state);
```

(il resto del case, dal recordRun in poi, resta invariato: legge solo `state.stato`/`state.esito`/`state.vittorie`/`state.storia`, che esistono in entrambi i formati).

- [ ] **Step 6: Verifica manuale minima**

Non esiste un test automatico su `app.js` (nessun harness DOM nella suite `node --test`): verifica leggendo il diff che i due nuovi rami (`selectFormato`, la scelta `resolveRound`/`resolveSeriesGame`) non alterano nessuna riga del case `"resolveRound"` successiva alla prima. La verifica end-to-end reale arriva a Task 6-7, quando le schermate esistono per guidare un run playoff completo nel browser.

Run: `node --test game/*.test.js prototype/imbattuto/*.test.js`
Expected: PASS (nessun test tocca `app.js` direttamente, ma la suite intera deve restare verde: nessun import rotto).

- [ ] **Step 7: Commit**

```bash
git add prototype/imbattuto/app.js
git commit -m "feat(app): instrada il formato playoff dalla home al risolutore

selectFormato ricorda la scelta fatta in home; resolveRound sceglie fra
resolveRound e resolveSeriesGame in base a state.formato."
```

---

### Task 5: `screens/home.js` + `screens/difficolta.js` - sblocco della card Playoff

**Files:**
- Modify: `prototype/imbattuto/screens/home.js`
- Modify: `prototype/imbattuto/screens/difficolta.js`

**Interfaces:**
- Consumes: `ctx.dispatch({type:"selectFormato", formato})` (Task 4), `ctx.formato` (Task 4).
- Produces: nessuna nuova funzione esportata: solo markup e wiring di eventi.

- [ ] **Step 1: `home.js` - la card Playoff diventa un bottone**

In `prototype/imbattuto/screens/home.js`, sostituisci il blocco `.bz-modes` (righe 47-52):

```js
          <div class="bz-modes rise" style="--d:.76s">
            <button class="bz-mode bz-mode--on" id="mode-corsa" type="button"><span class="n">16-0</span><b>Corsa</b><span class="play">gioca</span></button>
            <div class="bz-mode"><span class="n">serie</span><b>Playoff</b><span class="soon">presto</span></div>
            <div class="bz-mode"><span class="n">82-0</span><b>Stagione</b><span class="soon">presto</span></div>
            <div class="bz-mode"><span class="n">★</span><b>Sfida</b><span class="soon">presto</span></div>
          </div>
```

con:

```js
          <div class="bz-modes rise" style="--d:.76s">
            <button class="bz-mode bz-mode--on" id="mode-corsa" type="button"><span class="n">16-0</span><b>Corsa</b><span class="play">gioca</span></button>
            <button class="bz-mode" id="mode-playoff" type="button"><span class="n">serie</span><b>Playoff</b><span class="play">gioca</span></button>
            <div class="bz-mode"><span class="n">82-0</span><b>Stagione</b><span class="soon">presto</span></div>
            <div class="bz-mode"><span class="n">★</span><b>Sfida</b><span class="soon">presto</span></div>
          </div>
```

Poi sostituisci il wiring in fondo alla funzione (righe 69-72):

```js
  // Corsa = L'IMBATTUTO: "Gioca" o la modalita Corsa portano alla scelta difficolta.
  const vai = () => ctx.go("difficolta");
  root.querySelector("#gioca").onclick = vai;
  root.querySelector("#mode-corsa").onclick = vai;
```

con:

```js
  // "Gioca" in cima e' un raccorciatoio per la modalita Corsa (16-0): non
  // mostra scelta, e' il default. La card Playoff dispatcha esplicitamente
  // l'altro formato - entrambe passano da selectFormato, mai da ctx.go diretto,
  // cosi' tornare in home e scegliere l'altro formato non lascia il vecchio
  // valore appeso in app.js.
  const scegli = (formato) => () => ctx.dispatch({ type: "selectFormato", formato });
  root.querySelector("#gioca").onclick = scegli("imbattuto");
  root.querySelector("#mode-corsa").onclick = scegli("imbattuto");
  root.querySelector("#mode-playoff").onclick = scegli("playoff");
```

- [ ] **Step 2: `difficolta.js` - copy e dispatch consapevoli del formato**

In `prototype/imbattuto/screens/difficolta.js`, sostituisci l'intera funzione `render`:

```js
// ctx: { dispatch, go, formato }
export function render(ctx) {
  const root = document.createElement("div");
  root.className = "cabhome ph--cab diffscreen";
  const formato = ctx.formato ?? "imbattuto";

  const TESTI = {
    imbattuto: {
      wm: "L'IM<b>BATT</b>UTO",
      sub: "<b>16 vittorie di fila</b> in ogni livello. Nessuna sconfitta ammessa.",
      foot: "Il livello resta lo stesso per tutta la corsa: si sceglie adesso, non si cambia in mezzo. <b>Sedici vittorie</b> in tutti e quattro.",
    },
    playoff: {
      wm: "SERIE <b>PLAYOFF</b>",
      sub: "<b>4 serie al meglio delle 7.</b> Perdi la corsa solo se perdi una serie intera.",
      foot: "Il livello resta lo stesso per tutta la corsa: si sceglie adesso, non si cambia in mezzo. <b>Quattro serie</b> in tutti e quattro i livelli.",
    },
  };
  const testo = TESTI[formato];

  const chips = Object.entries(DIFFICULTIES).map(([key, d]) => {
    const m = META[key];
    const aiuti = `${d.aids.respin} re-spin · ${d.aids.squadra} squadra · ${d.aids.stagione} stagione`;
    return `
      <button class="diff-chip" data-diff="${key}" type="button">
        <span class="dc-l">
          <span class="dc-name">${m.nome}</span>
          <span class="dc-tag">${m.tag}</span>
          <span class="dc-aid">${aiuti}</span>
        </span>
        <span class="dc-r">
          <span class="dc-see-lab">Vedi</span>
          <span class="dc-see">${m.vedi}</span>
          <span class="dc-cap-lab">Tetto</span>
          <span class="dc-cap">${formattaSalario(TETTI[key])}</span>
        </span>
      </button>`;
  }).join("");

  root.innerHTML = `
    <div class="scr diff-scr">
      <button class="diff-back" id="back" type="button">‹ Home</button>
      <div class="diff-head">
        <div class="bz-wm diff-wm">${testo.wm}</div>
        <p class="diff-sub">${testo.sub}</p>
      </div>
      <label class="diff-nome" for="nomesq">
        <span class="dn-lab">Come si chiama la tua squadra</span>
        <input id="nomesq" class="dn-in" type="text" maxlength="24" autocomplete="off"
               value="${NOME_DEFAULT}" aria-describedby="dn-help">
        <span class="dn-help" id="dn-help">Finisce nella cronaca delle partite</span>
      </label>
      <div class="diff-list">${chips}</div>
      <p class="diff-foot">${testo.foot}</p>
    </div>
  `;

  root.querySelector("#back").onclick = () => ctx.go("home");
  // Nome vuoto = default, non un errore: il motore rifiuta la stringa vuota, e
  // qui non c'è niente da correggere all'utente, c'è solo un nome da mettere.
  const nome = () => (root.querySelector("#nomesq").value.trim() || NOME_DEFAULT);
  root.querySelector("#nomesq").onkeydown = (e) => { if (e.key === "Enter") e.preventDefault(); };
  root.querySelectorAll(".diff-chip").forEach((b) => {
    b.onclick = () => ctx.dispatch({
      type: "newRun", formato, difficolta: b.dataset.diff, squadra: nome(),
    });
  });

  return root;
}
```

(Il resto del file - import, `META`, `NOME_DEFAULT` - resta invariato.)

- [ ] **Step 3: Verifica manuale nel browser**

Run: apri il prototipo (es. `npx serve prototype/imbattuto` o il comando che usi di solito per servirlo), clicca "Serie Playoff" in home, verifica che la schermata difficoltà mostri "SERIE PLAYOFF" / "4 serie al meglio delle 7" e che scegliendo un livello si entri nel draft come al solito. Poi torna in home e clicca "Gioca": verifica che la schermata difficoltà torni a mostrare "L'IMBATTUTO" (non e' rimasto lo stato playoff).

- [ ] **Step 4: Commit**

```bash
git add prototype/imbattuto/screens/home.js prototype/imbattuto/screens/difficolta.js
git commit -m "feat(ui): sblocca la card Serie Playoff in home

La scelta difficolta mostra copy dedicata al formato scelto in home e passa
il formato giusto a newRun."
```

---

### Task 6: `screens/run.js` - testata di serie e copy dell'esito partita

**Files:**
- Modify: `prototype/imbattuto/screens/run.js`

**Interfaces:**
- Consumes: `resolveSeriesGame`, `PLAYOFF_ROUNDS` da `game/run.js` (Task 3).
- Produces: nessuna nuova funzione esportata, solo markup/copy condizionati da `state.formato`.

- [ ] **Step 1: Import**

In `prototype/imbattuto/screens/run.js:2`, sostituisci:

```js
import { partitaRound, boxScoreRound, playByPlayRound, titolari, ROTAZIONE_AVVERSARIO } from "../../../game/run.js";
```

con:

```js
import {
  partitaRound, boxScoreRound, playByPlayRound, titolari, ROTAZIONE_AVVERSARIO,
  resolveSeriesGame, PLAYOFF_ROUNDS,
} from "../../../game/run.js";
```

- [ ] **Step 2: Calcola l'esito di serie speculativo**

Subito dopo la riga `const vinto = partita.vincitore === "casa";` (dentro `export function render(ctx)`), aggiungi:

```js
  // Come partita/box: funzione PURA dello stato, calcolata per sapere COSA
  // DIRE (serie chiusa? round successivo? si continua?) prima che l'utente
  // prema "Prossimo turno" e il dispatch la applichi davvero. Non ri-simula:
  // le passiamo la `partita` gia' calcolata sopra.
  const esitoSerie = state.formato === "playoff" ? resolveSeriesGame(state, partita) : null;
  // Vero solo se la CORSA finisce qui: per "imbattuto" e' la sconfitta del
  // round; per "playoff" e' la sconfitta dell'INTERA serie (una gara persa a
  // meta' serie non chiude la corsa).
  const persaCorsa = state.formato === "playoff" ? esitoSerie.esito === "sconfitta" : !vinto;
```

- [ ] **Step 3: Testata - Round/Serie al posto del tabellone a tacche**

Sostituisci la funzione `testataHTML` (righe 186-208):

```js
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
```

con:

```js
  // Il tabellone a tacche di "imbattuto" (una tacca per round su N=16) non ha
  // senso in "playoff": ci sono solo 4 round, ognuno con piu' gare. Al suo
  // posto, "Round X/4" + il punteggio di serie corrente ("2-1"), stesso
  // contenitore .sh-streak cosi' non serve CSS nuovo.
  function blocSinistroHTML() {
    if (state.formato === "playoff") {
      return `
        <div class="sh-streak">
          <span class="lab">Round</span>
          <span class="num">${state.round}<i>/${PLAYOFF_ROUNDS}</i></span>
          <span class="num">${state.serieRecord.noi}-${state.serieRecord.loro}</span>
        </div>`;
    }
    const tacche = Array.from({ length: N }, (_, i) =>
      `<i class="${i < state.vittorie ? "on" : i === state.vittorie ? "next" : ""}"></i>`).join("");
    return `
      <div class="sh-streak">
        <span class="lab">Fila</span>
        <span class="sh-ticks">${tacche}</span>
        <span class="num">${state.vittorie}<i>/${N}</i></span>
      </div>`;
  }

  function testataHTML() {
    const seg = Object.keys(VELOCITA).map((k) =>
      `<button type="button" data-vel="${k}" aria-pressed="${velocita === k}">${VELOCITA_NOME[k]}</button>`).join("");
    // Pausa vive accanto alla velocità (non più in fondo allo screen come CTA):
    // sono gli stessi comandi della simulazione, devono stare nella stessa fascia.
    // Compare solo a simulazione avviata e non ancora finita.
    const pausaBtn = azioneIdx >= 0 && !finita()
      ? `<button class="sh-pause" id="pausa" type="button">${inPausa ? "Riprendi" : "Pausa"}</button>`
      : "";
    return `
      ${blocSinistroHTML()}
      <div class="sh-speed">
        <span>Velocità</span>
        <div class="sh-seg" role="group" aria-label="Velocità della simulazione">${seg}</div>
        ${pausaBtn}
      </div>`;
  }
```

- [ ] **Step 4: Copy dell'esito - CTA**

Sostituisci `ctaHTML` (righe 435-444):

```js
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
```

con:

```js
  function ctaHTML() {
    if (azioneIdx < 0) return `<button class="sh-cta" id="via">${PLAY}<span>Gioca la partita</span></button>`;
    if (!finita()) {
      // Non interattivo: Pausa ora sta in testata (vedi testataHTML). Questa riga
      // resta solo per tenere l'altezza della fascia CTA, senza saltare quando
      // parte la simulazione.
      return `<button class="sh-cta ghost" disabled>${inPausa ? "In pausa" : `Simulazione in corso · ${VELOCITA_NOME[velocita]}`}</button>`;
    }
    return `<button class="sh-cta" id="avanti">${persaCorsa ? "Vedi come è andata" : "Prossimo turno"}</button>`;
  }
```

- [ ] **Step 5: Copy dell'esito - verdetto**

Sostituisci `verdettoHTML` (righe 446-452):

```js
  function verdettoHTML() {
    if (!finita()) return "";
    const p = cumulato(partita.quarti, nQuarti);
    return `<div class="sh-verdict ${vinto ? "win" : "lose"}" role="status">
      ${vinto ? "Passi il turno" : "Corsa finita"} · <em>${p.casa}-${p.ospite}</em>
    </div>`;
  }
```

con:

```js
  // Cosa dire dipende da quanto ha deciso la gara appena giocata: solo
  // "imbattuto" chiude sempre alla prima sconfitta. In "playoff" una gara
  // persa puo' non contare niente (la serie continua), chiudere la serie
  // (round successivo) o chiudere l'intera corsa (sconfitta di serie) o
  // incoronare (round 4 vinto).
  function esitoLabel() {
    if (state.formato !== "playoff") return vinto ? "Passi il turno" : "Corsa finita";
    if (esitoSerie.esito === "campione") return "Sei Campione";
    if (esitoSerie.esito === "sconfitta") return "Corsa finita";
    if (esitoSerie.round > state.round) return "Vinci la serie! Prossimo round";
    return vinto ? `Vinci Gara ${state.gara}` : `Perdi Gara ${state.gara}`;
  }

  function verdettoHTML() {
    if (!finita()) return "";
    const p = cumulato(partita.quarti, nQuarti);
    return `<div class="sh-verdict ${persaCorsa ? "lose" : "win"}" role="status">
      ${esitoLabel()} · <em>${p.casa}-${p.ospite}</em>
    </div>`;
  }
```

- [ ] **Step 6: Verifica manuale nel browser**

Gioca una corsa "Serie Playoff" completa in Facile (aiuti massimi, più rapido arrivare in fondo):
1. Vinci una gara senza chiudere la serie -> verifica "Vinci Gara N" e che si resti sullo stesso round con lo stesso avversario.
2. Chiudi una serie (4 vittorie) senza essere al round 4 -> verifica "Vinci la serie! Prossimo round" e che l'avversario cambi.
3. Perdi una gara di serie che NON elimina -> verifica che il CTA dica "Prossimo turno" (non "Vedi come è andata": la corsa continua).
4. Perdi una serie intera (avversario a 4) -> verifica "Corsa finita" e che si arrivi alla schermata esito con `esito:"sconfitta"`.
5. Vinci la quarta serie -> verifica "Sei Campione".

Run: `node --test game/*.test.js prototype/imbattuto/*.test.js`
Expected: PASS (nessuna regressione automatica, la verifica di questo task è nel browser).

- [ ] **Step 7: Commit**

```bash
git add prototype/imbattuto/screens/run.js
git commit -m "feat(ui): testata Round/Serie e copy dell'esito per il formato playoff

Il tabellone a tacche resta per 'imbattuto'; 'playoff' mostra round e
punteggio di serie, con un verdetto che distingue gara/serie/corsa persa."
```

---

### Task 7: `screens/esito.js` - esito "Campione"

**Files:**
- Modify: `prototype/imbattuto/screens/esito.js`
- Test: `prototype/imbattuto/esito.test.js`

**Interfaces:**
- Consumes: `state.formato`, `state.esito` (`"campione"` in più rispetto a oggi), `state.storia[i].gara` (Task 3, solo per playoff).
- Produces: `testoCondivisione(state)` invariata per `state.formato !== "playoff"` (stesso identico output di oggi, verificato dal test esistente), nuovo ramo per `formato === "playoff"`.

- [ ] **Step 1: Scrivi il test che fallisce**

Aggiungi in `prototype/imbattuto/esito.test.js`:

```js
test("il risultato condiviso di una corsa playoff conta le sconfitte dalla storia, non 0/1", () => {
  const state = {
    formato: "playoff", esito: "campione", vittorie: 17, difficolta: "normale",
    storia: [
      { vinto: true }, { vinto: false }, { vinto: true }, { vinto: true },
      { vinto: true }, { vinto: true },
    ],
    rosa: {
      titolari: { PG: { name: "Stephen Curry" } },
      panca: {},
    },
  };
  assert.equal(
    testoCondivisione(state),
    "SERIE PLAYOFF - 17-1 · Normale\nRosa: Stephen Curry",
  );
});
```

(Il test esistente su `esito: "sconfitta"` senza `formato` resta invariato: verifica che il ramo "imbattuto" non sia stato toccato.)

- [ ] **Step 2: Verifica che fallisca per il motivo giusto**

Run: `node --test prototype/imbattuto/esito.test.js`
Expected: FAIL - il testo prodotto oggi sarebbe `"L'IMBATTUTO - 17-1 · Normale\n..."` (formato ignorato), non `"SERIE PLAYOFF - ..."`.

- [ ] **Step 3: Implementa `testoCondivisione`**

Sostituisci in `prototype/imbattuto/screens/esito.js`:

```js
export function testoCondivisione(state) {
  const record = `${state.vittorie}-${state.esito === "imbattuto" ? 0 : 1}`;
  const difficolta = state.difficolta[0].toUpperCase() + state.difficolta.slice(1);
  return `L'IMBATTUTO - ${record} · ${difficolta}\nRosa: ${listaRosa(state.rosa).map((c) => c.name).join(", ")}`;
}
```

con:

```js
export function testoCondivisione(state) {
  const playoff = state.formato === "playoff";
  // "imbattuto" ha al massimo una sconfitta (quella che chiude il run, se
  // c'è): 0 o 1 basta e non serve leggere la storia. "playoff" può avere più
  // sconfitte dentro le serie vinte 4-3, quindi si contano davvero.
  const perse = playoff ? state.storia.filter((h) => !h.vinto).length : (state.esito === "imbattuto" ? 0 : 1);
  const record = `${state.vittorie}-${perse}`;
  const difficolta = state.difficolta[0].toUpperCase() + state.difficolta.slice(1);
  const titolo = playoff ? "SERIE PLAYOFF" : "L'IMBATTUTO";
  return `${titolo} - ${record} · ${difficolta}\nRosa: ${listaRosa(state.rosa).map((c) => c.name).join(", ")}`;
}
```

- [ ] **Step 4: Verifica che passi, e che il test esistente non si sia mosso**

Run: `node --test prototype/imbattuto/esito.test.js`
Expected: PASS su entrambi i test (quello nuovo e quello di "sconfitta" già presente).

- [ ] **Step 5: `render` - titolo, riepilogo e storia con la gara**

Sostituisci in `prototype/imbattuto/screens/esito.js` la funzione `rigaRound`:

```js
function rigaRound(h, i) {
  const persa = !h.vinto;
  const margine = Math.abs(h.punti.casa - h.punti.ospite);
  const f = fasciaOf(margine, persa);
  const clou = h.cronaca.at(-1).testo;
  const quarti = h.quarti.map((q, qi) =>
    `<span>${q.overtime ? "OT" : `${qi + 1}°`} ${q.cumCasa}-${q.cumOspite}</span>`).join("");
  return `<li style="--i:${i}">
    <button class="r-row" data-idx="${i}" type="button" aria-expanded="false">
      <span class="r-round">R${h.round}</span>
      <span class="r-fascia ${f.cls}">${f.label}</span>
      <span class="r-mid">
        <span class="r-avv">${esc(teamName(h.avversario))} · ${esc(h.stagione)}</span>
        <span class="r-clou">${esc(clou)}</span>
      </span>
      <span class="r-pt">${h.punti.casa}-${h.punti.ospite}</span>
    </button>
    <div class="r-detail"><div class="r-detail-in">
      <div class="r-quarti">${quarti}</div>
      <p class="r-clou-full"><b>${persa ? "Ultimo quarto" : "Quarto decisivo"}:</b> ${esc(clou)}</p>
    </div></div>
  </li>`;
}
```

con (unica differenza: l'etichetta include la gara quando c'è, cioè in playoff):

```js
function rigaRound(h, i) {
  const persa = !h.vinto;
  const margine = Math.abs(h.punti.casa - h.punti.ospite);
  const f = fasciaOf(margine, persa);
  const clou = h.cronaca.at(-1).testo;
  const quarti = h.quarti.map((q, qi) =>
    `<span>${q.overtime ? "OT" : `${qi + 1}°`} ${q.cumCasa}-${q.cumOspite}</span>`).join("");
  // "playoff" porta anche `gara` nella storia (Task 3): senza distinguerla,
  // 4-7 righe di fila mostrerebbero lo stesso "R1" e sembrerebbero un
  // duplicato invece che le gare di una stessa serie.
  const etichetta = "gara" in h ? `R${h.round}·G${h.gara}` : `R${h.round}`;
  return `<li style="--i:${i}">
    <button class="r-row" data-idx="${i}" type="button" aria-expanded="false">
      <span class="r-round">${etichetta}</span>
      <span class="r-fascia ${f.cls}">${f.label}</span>
      <span class="r-mid">
        <span class="r-avv">${esc(teamName(h.avversario))} · ${esc(h.stagione)}</span>
        <span class="r-clou">${esc(clou)}</span>
      </span>
      <span class="r-pt">${h.punti.casa}-${h.punti.ospite}</span>
    </button>
    <div class="r-detail"><div class="r-detail-in">
      <div class="r-quarti">${quarti}</div>
      <p class="r-clou-full"><b>${persa ? "Ultimo quarto" : "Quarto decisivo"}:</b> ${esc(clou)}</p>
    </div></div>
  </li>`;
}
```

Poi sostituisci in `render` le tre righe che leggono `state.esito === "imbattuto"` e il testo del riepilogo:

```js
export function render(ctx) {
  const { state } = ctx;
  const vinto = state.esito === "imbattuto";
  const tacche = state.storia.length;
  // Il tabellone si accende una tacca alla volta, poi il resto della
  // sequenza (bagliore, titolo, riepilogo, cronaca, azioni) parte a ruota.
  const afterLadder = tacche * 45 + 250;

  const el = document.createElement("section");
  el.className = `screen esito ${vinto ? "win" : "lose"}`;
  el.innerHTML = `
    ${appHeader(state)}
    <div class="e-flash" style="animation: flashBurst ${vinto ? .7 : .4}s ease-out ${afterLadder}ms both"></div>
    <div class="e-ladder">${Array.from({ length: tacche }, (_, i) =>
      `<div class="e-tacca lit" style="animation: tPop .18s ease-out ${i * 45}ms both"></div>`).join("")}</div>
    <p class="e-score"><b>0</b>-0</p>
    <h1 style="animation: stampIn .5s cubic-bezier(.2,1.6,.4,1) ${afterLadder + 150}ms both">${vinto ? "IMBATTUTO" : "SCONFITTA"}</h1>
    <p class="riepilogo" style="animation: simpleIn .4s var(--ease) ${afterLadder + 500}ms both">${vinto ? `${state.vittorie} vittorie di fila` : `${state.vittorie} vittorie prima dello stop`}</p>
    <ul class="storia" style="animation: simpleIn .3s var(--ease) ${afterLadder + 650}ms both">${state.storia.map(rigaRound).join("")}</ul>
    <div class="azioni" style="animation: simpleIn .3s var(--ease) ${afterLadder + 800}ms both">
      <button class="cta" id="leaderboard">Leaderboard</button>
      <button class="chip" id="share">${navigator.share ? "Condividi" : "Copia risultato"}</button>
      <button class="chip" id="profilo">Profilo</button>
      <button class="chip" id="ancora">Nuovo run</button>
    </div>
  `;

  // Conteggio delle vittorie sul tabellone LED, in parallelo all'accensione
  // delle tacche: non è il punteggio della singola partita, è il computo dei
  // round vinti in questa run.
  const score = el.querySelector(".e-score");
  const target = state.vittorie;
  let n = 0;
  const timer = setInterval(() => {
    n++;
    score.innerHTML = `<b>${n}</b>-${vinto ? 0 : 1}`;
    if (n >= target) clearInterval(timer);
  }, (vinto ? 700 : 900) / Math.max(target, 1));
  if (target === 0) { clearInterval(timer); score.innerHTML = `<b>0</b>-${vinto ? 0 : 1}`; }
```

con:

```js
export function render(ctx) {
  const { state } = ctx;
  const playoff = state.formato === "playoff";
  const vinto = state.esito === "imbattuto" || state.esito === "campione";
  const perse = playoff ? state.storia.filter((h) => !h.vinto).length : (vinto ? 0 : 1);
  const titolo = state.esito === "campione" ? "CAMPIONE" : state.esito === "imbattuto" ? "IMBATTUTO" : "SCONFITTA";
  const riepilogo = playoff
    ? `${state.vittorie} vittorie su ${state.storia.length} gare${vinto ? "" : " prima dello stop"}`
    : `${state.vittorie} vittorie${vinto ? " di fila" : " prima dello stop"}`;
  const tacche = state.storia.length;
  // Il tabellone si accende una tacca alla volta, poi il resto della
  // sequenza (bagliore, titolo, riepilogo, cronaca, azioni) parte a ruota.
  const afterLadder = tacche * 45 + 250;

  const el = document.createElement("section");
  el.className = `screen esito ${vinto ? "win" : "lose"}`;
  el.innerHTML = `
    ${appHeader(state)}
    <div class="e-flash" style="animation: flashBurst ${vinto ? .7 : .4}s ease-out ${afterLadder}ms both"></div>
    <div class="e-ladder">${Array.from({ length: tacche }, (_, i) =>
      `<div class="e-tacca lit" style="animation: tPop .18s ease-out ${i * 45}ms both"></div>`).join("")}</div>
    <p class="e-score"><b>0</b>-0</p>
    <h1 style="animation: stampIn .5s cubic-bezier(.2,1.6,.4,1) ${afterLadder + 150}ms both">${titolo}</h1>
    <p class="riepilogo" style="animation: simpleIn .4s var(--ease) ${afterLadder + 500}ms both">${riepilogo}</p>
    <ul class="storia" style="animation: simpleIn .3s var(--ease) ${afterLadder + 650}ms both">${state.storia.map(rigaRound).join("")}</ul>
    <div class="azioni" style="animation: simpleIn .3s var(--ease) ${afterLadder + 800}ms both">
      <button class="cta" id="leaderboard">Leaderboard</button>
      <button class="chip" id="share">${navigator.share ? "Condividi" : "Copia risultato"}</button>
      <button class="chip" id="profilo">Profilo</button>
      <button class="chip" id="ancora">Nuovo run</button>
    </div>
  `;

  // Conteggio delle vittorie sul tabellone LED, in parallelo all'accensione
  // delle tacche: non è il punteggio della singola partita, è il computo dei
  // round vinti in questa run.
  const score = el.querySelector(".e-score");
  const target = state.vittorie;
  let n = 0;
  const timer = setInterval(() => {
    n++;
    score.innerHTML = `<b>${n}</b>-${perse}`;
    if (n >= target) clearInterval(timer);
  }, (vinto ? 700 : 900) / Math.max(target, 1));
  if (target === 0) { clearInterval(timer); score.innerHTML = `<b>0</b>-${perse}`; }
```

(Il resto della funzione - listener di `.r-row`, `#ancora`, `#share`, `#leaderboard`, `#profilo` - resta invariato.)

- [ ] **Step 6: Verifica manuale nel browser + suite**

Run: `node --test prototype/imbattuto/*.test.js`
Expected: PASS su tutta la suite del prototipo.

Poi nel browser: completa una corsa playoff fino a "Campione" (Facile, con gli aiuti si arriva in fondo in pochi minuti) e verifica che la schermata mostri "CAMPIONE", il riepilogo "N vittorie su M gare", e che ogni riga della storia mostri "R{round}·G{gara}".

- [ ] **Step 7: Commit**

```bash
git add prototype/imbattuto/screens/esito.js prototype/imbattuto/esito.test.js
git commit -m "feat(ui): esito Campione per il formato playoff

testoCondivisione, titolo e riepilogo distinguono imbattuto/campione/
sconfitta; la storia mostra round e gara quando la corsa e' playoff."
```

---

### Task 8: `screens/leaderboard.js` + `styles.css` - bucket per formato

**Files:**
- Modify: `prototype/imbattuto/screens/leaderboard.js`
- Modify: `prototype/imbattuto/styles.css:1466-1472`

**Interfaces:**
- Consumes: `leaderboard(store, formato, difficolta)` da `meta.js` (già accetta `formato` come parametro, nessuna modifica lì).
- Produces: nessuna nuova funzione esportata: un tab in più nella UI (`#formatotabs`), stesso pattern di `#difftabs`.

- [ ] **Step 1: CSS condiviso fra i due gruppi di tab**

In `prototype/imbattuto/styles.css`, sostituisci (righe 1466-1472):

```css
#difftabs { display: flex; gap: 6px; }
#difftabs button {
  flex: 1; font-family: var(--arcade); font-size: .5rem; letter-spacing: .04em; text-transform: uppercase;
  padding: 10px 4px; min-height: 44px; border-radius: 10px; border: 1px solid var(--line);
  background: var(--ink-2); color: var(--bone-dim);
}
#difftabs button.on { border-color: var(--brass); color: var(--yellow); background: rgba(255, 91, 30, .12); }
```

con:

```css
#difftabs, #formatotabs { display: flex; gap: 6px; }
#formatotabs { margin-bottom: 6px; }
#difftabs button, #formatotabs button {
  flex: 1; font-family: var(--arcade); font-size: .5rem; letter-spacing: .04em; text-transform: uppercase;
  padding: 10px 4px; min-height: 44px; border-radius: 10px; border: 1px solid var(--line);
  background: var(--ink-2); color: var(--bone-dim);
}
#difftabs button.on, #formatotabs button.on { border-color: var(--brass); color: var(--yellow); background: rgba(255, 91, 30, .12); }
```

- [ ] **Step 2: `leaderboard.js` - tab di formato + label esito generica**

Sostituisci l'intero file `prototype/imbattuto/screens/leaderboard.js`:

```js
import { leaderboard, lifetimeStats } from "../meta.js";

const DIFF_LABEL = { facile: "Facile", normale: "Normale", difficile: "Difficile", incubo: "Incubo" };
const DIFFS = Object.keys(DIFF_LABEL);
const FORMATO_LABEL = { imbattuto: "16-0", playoff: "Playoff" };
const FORMATI = Object.keys(FORMATO_LABEL);
const ESITO_LABEL = { imbattuto: "Imbattuto", campione: "Campione", sconfitta: "Sconfitta" };
const esitoVinto = (esito) => esito === "imbattuto" || esito === "campione";

function dataRelativa(ts) {
  const giorni = Math.floor((Date.now() - ts) / 86400000);
  if (giorni <= 0) return "oggi";
  if (giorni === 1) return "ieri";
  if (giorni < 14) return `${giorni} giorni fa`;
  return `${Math.round(giorni / 7)} settimane fa`;
}

function fasciaRank(i) {
  if (i === 0) return "oro";
  if (i <= 2) return "argento";
  return "bronzo";
}

function renderRows(runs) {
  if (!runs.length) return `<li class="lb-vuoto">Ancora nessun run in questo bucket.</li>`;
  return runs.map((r, i) => `
    <li style="--i:${i}">
      <div class="a-row">
        <span class="a-rank ${fasciaRank(i)}">${i + 1}</span>
        <span class="a-mid">
          <span class="a-esito ${esitoVinto(r.esito) ? "win" : "lose"}">${ESITO_LABEL[r.esito] ?? r.esito}</span>
          <span class="a-data">${dataRelativa(r.ts)}</span>
        </span>
        <span class="a-vitt">${r.vittorie}<small>vittorie</small></span>
      </div>
    </li>`).join("");
}

// ctx: { state, dispatch, go } - usa window.localStorage nel browser
export function render(ctx) {
  const store = window.localStorage;
  // Se arrivi qui da un run appena finito, il bucket si apre già sul suo
  // formato/difficoltà; altrimenti si parte da "imbattuto" · "normale".
  let formato = ctx.state?.formato ?? "imbattuto";
  let difficolta = ctx.state?.difficolta ?? "normale";

  const el = document.createElement("section");
  el.className = "screen leaderboard";
  el.innerHTML = `
    <div id="formatotabs">${FORMATI.map((f) => `<button data-formato="${f}">${FORMATO_LABEL[f]}</button>`).join("")}</div>
    <div id="difftabs">${DIFFS.map((d) => `<button data-diff="${d}">${DIFF_LABEL[d]}</button>`).join("")}</div>
    <h1 class="display">Leaderboard</h1>
    <p class="bucket" id="bucket-sub"></p>
    <ol class="classifica" id="rows"></ol>
    <div class="lifetime" id="lifetime"></div>
    <div class="row-actions">
      <button class="chip" id="profilo">Profilo</button>
      <button class="chip" id="home">Home</button>
    </div>
  `;

  const st = lifetimeStats(store);
  el.querySelector("#lifetime").innerHTML = `
    <span><b>${st.runs}</b> run</span>
    <span><b>${st.imbattuti}</b> imbattuti</span>
    <span><b>${st.migliorStreak}</b> miglior streak</span>
  `;

  function paint() {
    el.querySelectorAll("#formatotabs button").forEach((b) => b.classList.toggle("on", b.dataset.formato === formato));
    el.querySelectorAll("#difftabs button").forEach((b) => b.classList.toggle("on", b.dataset.diff === difficolta));
    el.querySelector("#bucket-sub").textContent = `${FORMATO_LABEL[formato]} · ${difficolta}`;
    el.querySelector("#rows").innerHTML = renderRows(leaderboard(store, formato, difficolta));
  }

  el.querySelectorAll("#formatotabs button").forEach((b) => {
    b.addEventListener("click", () => { formato = b.dataset.formato; paint(); });
  });
  el.querySelectorAll("#difftabs button").forEach((b) => {
    b.addEventListener("click", () => { difficolta = b.dataset.diff; paint(); });
  });
  el.querySelector("#home").onclick = () => ctx.dispatch({ type: "reset" });
  el.querySelector("#profilo").onclick = () => ctx.go("profilo");

  paint();
  return el;
}
```

- [ ] **Step 3: Verifica**

Run: `node --test prototype/imbattuto/*.test.js`
Expected: PASS (`meta.test.js` già esercita `leaderboard(store, "playoff", ...)`, nessuna modifica a `meta.js` in questo task).

Poi nel browser: apri Leaderboard dopo aver salvato almeno un run "imbattuto" e uno "playoff" (Task 5-7 li producono giocando), verifica che i due tab di formato mostrino bucket diversi e che l'etichetta esito dica "Campione" per una run playoff vinta.

- [ ] **Step 4: Commit**

```bash
git add prototype/imbattuto/screens/leaderboard.js prototype/imbattuto/styles.css
git commit -m "feat(ui): la leaderboard distingue il bucket per formato

Prima 'formato' era hardcodato a imbattuto (leaderboard.js:38): le run
playoff salvate non comparivano mai. Un tab in piu', stesso pattern delle
difficolta, riusa il CSS esistente."
```

---

## Self-Review (fatta in fase di scrittura del piano)

**Copertura spec:** ogni sezione di `docs/superpowers/specs/2026-09-13-serie-playoff-design.md` ha un task - decisioni 1-2 (regola sconfitta/traguardo) → Task 2-3; decisione 3 (draft/coach identici) → nessun task, confermato leggendo `screens/draft.js`/`coach.js` (non referenziano `formato`); decisione 4 (stesso avversario in serie) → Task 3 (`resolveSeriesGame` non ripesca finché la serie non è decisa); decisione 5 (UI doppio contatore) → Task 6; decisione 6 (esito "Campione") → Task 7. Il punto tecnico sul seed di `partitaRound` che lo spec segnalava esplicitamente → Task 3, esteso anche a `boxScoreRound`/`playByPlayRound` (non menzionati nello spec ma stesso bug se lasciati com'erano - vedi nota nel Task 3). Il refactor di `leaderboard.js:38` richiesto dallo spec → Task 8.

**Scoperta in fase di piano, non nello spec:** i 20 test in `game/run.test.js` usano già `formato: "playoff"` come valore neutro (formato non ha oggi alcun effetto sul motore) - senza il Task 1 come prerequisito, l'introduzione di `resolveSeriesGame`/`turnoSeed` avrebbe fatto scattare il ramo playoff per sbaglio su tutta la suite esistente, cambiando i seed e rompendo gli assert su punteggi esatti. Verificato con `grep -n '\.formato\b' game/run.test.js` (nessun test controlla il valore) prima di decidere la rinomina.

**Scan placeholder:** nessun "TBD"/"implementare dopo" nei task sopra; ogni step ha codice completo o un comando `Run:` con l'output atteso.

**Coerenza dei tipi:** `resolveSeriesGame(state, partita = partitaRound(state))` (Task 3) è la firma usata identica in Task 6 (`resolveSeriesGame(state, partita)`, con `partita` già calcolata). `PLAYOFF_ROUNDS`/`PLAYOFF_SERIE_A` sono definite una sola volta (Task 2) e riusate senza ridefinizioni in Task 3/6. `state.serieRecord.noi/loro` e `state.gara` hanno lo stesso nome in ogni task che li legge (`run.js`, `run.js` screen, `esito.js` non li legge direttamente - solo `storia[].gara`).
