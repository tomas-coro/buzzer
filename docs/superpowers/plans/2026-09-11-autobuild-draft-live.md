# Autobuild draft live sulla board - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** L'autobuild del draft ("Completa rosa") riempie la board vera uno slot alla volta con la stessa animazione del pick manuale (ticker + volo mirino), invece di calcolare tutto in un colpo e saltare a una schermata `draftReveal.js` separata.

**Architettura:** `game/run.js` (motore) resta intatto. `game/rosa.js` guadagna un helper puro `chiaveSlot(slot)` condiviso. `prototype/imbattuto/app.js` orchestra l'autoplay un pick alla volta con un nuovo helper `spinAutoStep`, portando il flag `auto` dentro `draftView` e dentro l'azione `assign`. `prototype/imbattuto/screens/draft.js` esegue la sequenza visiva automatica riusando le funzioni già presenti (`selectCand`, `placeIn`, `scanThenLock`) e aggiunge il render per "rosa completa" e il bottone "Ferma". `draftReveal.js` viene eliminato.

**Tech Stack:** JS vanilla (no framework), `node:test` per i test di logica, Playwright (`tools/smoke_imbattuto.py`) per lo smoke end-to-end.

## Global Constraints

- Motore di gioco (`game/*.js`, incluso `sceltaAutoDraft` e `draftPick`) non si tocca: la spec riguarda solo l'orchestrazione UI.
- Cadenza dell'autoplay identica al pick manuale: ticker "radar lock" (~610ms, 7 tick 55ms+8ms/tick) + volo mirino (~360ms flight + ~260ms flash slot = ~620ms totale), più una pausa fissa di 250ms tra selezione carta e volo (vedi spec).
- Durante l'autoplay la UI è bloccata: solo il bottone "Ferma" resta interattivo.
- A fine autobuild: pausa sulla board piena + bottone "Vai al coach" esplicito, nessun timer automatico (vale anche con `prefers-reduced-motion: reduce`, che oggi bypassa la sola parte animata, non la scelta "serve un click").
- Nessun test unitario nuovo per `app.js`/`draft.js` (nessuna convenzione DOM-test esiste già in questo repo per gli screen - solo per moduli dati/logica come `pool.js`, `rosa.js`): la verifica di questi due file è lo smoke Playwright + un controllo manuale nel browser.
- `npm test` (`node --test game/*.test.js prototype/imbattuto/*.test.js`) deve continuare a passare dopo ogni task.

---

### Task 1: `chiaveSlot` condivisa in `game/rosa.js`

Oggi `draft.js` definisce una funzione locale `keySlot(s)` (`T-${ruolo}` / `P-${posto}`) usata solo lì. Serve anche in `app.js` per dire a `draft.js` quale slot piazzare durante l'autoplay: va promossa a helper condiviso di `game/rosa.js`, accanto a `etichettaSlot`, invece di duplicarla.

**Files:**
- Modify: `game/rosa.js` (aggiungere export dopo `etichettaSlot`, riga 117-121)
- Modify: `game/rosa.test.js` (aggiungere il test, import in cima)
- Test: `game/rosa.test.js`

**Interfaces:**
- Produces: `chiaveSlot(slot) => string` - `"T-PG"` per `{ tipo: TITOLARE, ruolo: "PG" }`, `"P-6"` per `{ tipo: PANCA, posto: 6 }`. Usata da Task 2 (`draft.js`) e Task 3 (`app.js`).

- [ ] **Step 1: Scrivere il test che fallisce**

In `game/rosa.test.js`, aggiungere `chiaveSlot` all'import esistente (riga 6-9):

```js
import {
  SLOTS, MINUTI, POSTI_PANCA, emptyRosa, assegnaRosa, cartaIn, titolareLibero,
  postiPancaLiberi, caselleLibere, caselleDove, etichettaSlot, chiaveSlot, ruoloDi, rosaCompleta,
  listaRosa, minutiRosa, repartiRosa, costruisciRosa, TITOLARE, PANCA,
} from "./rosa.js";
```

Subito dopo il test `etichettaSlot scrive la casella come la legge chi gioca` (dopo la riga 113), aggiungere:

```js
test("chiaveSlot identifica la casella in modo univoco e stabile", () => {
  assert.equal(chiaveSlot(tit("PG")), "T-PG");
  assert.equal(chiaveSlot(panca(6)), "P-6");
  assert.equal(chiaveSlot(panca(10)), "P-10");
  assert.notEqual(chiaveSlot(tit("C")), chiaveSlot(panca(6)));
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `node --test game/rosa.test.js`
Expected: FAIL - `chiaveSlot is not a function` (o `undefined`)

- [ ] **Step 3: Implementare `chiaveSlot`**

In `game/rosa.js`, subito dopo `etichettaSlot` (dopo la riga 121):

```js
// Identità stabile di una casella per il DOM/dispatch (draft.js, app.js):
// "T-PG" per il titolare PG, "P-6" per il 6° uomo. Non è testo per l'utente
// (quello è etichettaSlot) - è una chiave per ritrovare lo slot giusto.
export function chiaveSlot(slot) {
  checkSlot(slot);
  return slot.tipo === TITOLARE ? `T-${slot.ruolo}` : `P-${slot.posto}`;
}
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

Run: `node --test game/rosa.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add game/rosa.js game/rosa.test.js
git commit -m "feat(rosa): esporta chiaveSlot, condivisa tra draft.js e il futuro autobuild"
```

---

### Task 2: `draft.js` usa `chiaveSlot` al posto della funzione locale

Sposta `draft.js` sulla funzione condivisa prima di aggiungere la logica di autoplay, così Task 4 non deve toccare due posti diversi che fanno la stessa cosa.

**Files:**
- Modify: `prototype/imbattuto/screens/draft.js:1-3` (import), `:225-226` (rimozione funzione locale + uso)

**Interfaces:**
- Consumes: `chiaveSlot` da `../../../game/rosa.js` (Task 1).

- [ ] **Step 1: Aggiornare l'import**

In `prototype/imbattuto/screens/draft.js`, riga 1-3, aggiungere `chiaveSlot` all'elenco già importato da `../../../game/rosa.js`:

```js
import {
  SLOTS, TITOLARE, PANCA, cartaIn, caselleDove, etichettaSlot, chiaveSlot, minutiSlot, ruoloDi, listaRosa,
} from "../../../game/rosa.js";
```

- [ ] **Step 2: Rimuovere la funzione locale e usare quella condivisa**

Riga 225-226 oggi:

```js
  const eligibleSlots = (card) => caselleDove(state.rosa, card);
  const keySlot = (s) => (s.tipo === TITOLARE ? `T-${s.ruolo}` : `P-${s.posto}`);
  const slotByKey = new Map(SLOTS.map((s) => [keySlot(s), s]));
```

Diventa:

```js
  const eligibleSlots = (card) => caselleDove(state.rosa, card);
  const slotByKey = new Map(SLOTS.map((s) => [chiaveSlot(s), s]));
```

Tutti gli altri usi di `keySlot(...)` nel file (righe 316, 401, 497, 502-503, 528, 533, 577) restano identici ma chiamano `chiaveSlot` invece della funzione locale rimossa - fare una sostituzione testuale `keySlot(` → `chiaveSlot(` su tutto il file (sono la stessa firma, un solo argomento `slot`).

- [ ] **Step 3: Verificare che il draft manuale funzioni ancora**

Run: `npm test` (deve passare, nessun test JS copre `draft.js` direttamente, ma verifica che non ci siano errori di import a cascata)

Poi verifica manuale veloce:
```bash
python3 -m http.server 8899
```
Apri `http://localhost:8899/prototype/imbattuto/`, entra in una run, pesca e piazza una carta a mano: deve funzionare come prima (nessun cambio di comportamento visibile in questo task).

- [ ] **Step 4: Commit**

```bash
git add prototype/imbattuto/screens/draft.js
git commit -m "refactor(draft): usa chiaveSlot condivisa invece della copia locale"
```

---

### Task 3: `app.js` - `spinAutoStep` e riscrittura di `autoDraft`/`assign`/`stopAutoDraft`

Il cuore della logica: un pick alla volta invece del `while` sincrono, con l'esito già deciso prima di mostrare lo spin (niente ticker "a vuoto" su tentativi scartati internamente).

**Files:**
- Modify: `prototype/imbattuto/app.js`

**Interfaces:**
- Consumes: `sceltaAutoDraft(state, candidati, malusPunti)` da `game/run.js` (già importato, invariato) - ritorna `{ carta, slot, costo }` o `null`. `chiaveSlot(slot)` da `game/rosa.js` (Task 1). `spinRosterView(filtro)` (funzione locale già esistente in app.js, righe 51-56) - ritorna `{ key, cards, slots }`.
- Produces: helper locale `spinAutoStep(malusMax) => { key, cards, slots, ticker: true, auto: { cardIndex, slotKey, costo, malusMax } }`. Azione `assign` accetta ora un campo opzionale `auto: { malusMax }` che Task 4 (`draft.js`) dovrà passare quando il piazzamento è automatico. Nuova azione `{ type: "stopAutoDraft" }`.

- [ ] **Step 1: Aggiornare gli import**

Riga 4 oggi:

```js
import {
  newRun, draftPick, useAid, chooseCoach, startRun, resolveRound, sceltaAutoDraft,
} from "../../game/run.js";
```

Aggiungere `chiaveSlot` dall'import di `rosa.js` (riga 5 oggi: `import { caselleLibere, listaRosa, minutiRosa } from "../../game/rosa.js";`):

```js
import { caselleLibere, chiaveSlot, listaRosa, minutiRosa } from "../../game/rosa.js";
```

- [ ] **Step 2: Rimuovere l'import e la voce di registry di `draftReveal`**

Riga 12: rimuovere `import { render as draftReveal } from "./screens/draftReveal.js";`

Riga 30, oggi:

```js
const screens = { home, difficolta, draft, draftReveal, coach, run, finito: esito, leaderboard, profilo };
```

Diventa:

```js
const screens = { home, difficolta, draft, coach, run, finito: esito, leaderboard, profilo };
```

- [ ] **Step 3: Aggiungere `spinAutoStep`**

Subito dopo `spinRosterView` (dopo la riga 56), aggiungere:

```js
// Un passo di autobuild: pesca rose finché sceltaAutoDraft (game/run.js, stesso
// criterio del draft manuale) non trova un pick valido, poi lo restituisce già
// deciso - draft.js non deve conoscere le regole di gioco, esegue solo il pick
// che gli viene passato. Lo spin che l'utente VEDE ha sempre un esito garantito:
// niente ticker "a vuoto" sui tentativi scartati qui dentro (stesso limite di
// guardia di 500 giri che aveva il vecchio while sincrono).
function spinAutoStep(malusMax) {
  let giri = 0;
  while (true) {
    if (++giri > 500) {
      throw new Error("autoDraft: non trovo una rosa completabile dopo 500 spin");
    }
    const view = spinRosterView();
    const scelta = sceltaAutoDraft(state, view.cards, malusMax);
    if (!scelta) continue;
    const cardIndex = view.cards.indexOf(scelta.carta);
    return {
      ...view,
      ticker: true,
      auto: { cardIndex, slotKey: chiaveSlot(scelta.slot), costo: scelta.costo, malusMax },
    };
  }
}
```

- [ ] **Step 4: Riscrivere il case `autoDraft`**

Righe 89-111 oggi (l'intero blocco con il `while` sincrono e il salto a `draftReveal`):

```js
    case "autoDraft": {
      // Riempie da sola le caselle rimaste, una scelta per spin, con lo stesso
      // criterio (firmabile / firmaDiRipiego) che userebbe un piazzamento
      // manuale: vedi sceltaAutoDraft in game/run.js. `malusMax` è quanti punti
      // di reparto Tomas accetta di pagare pur di prendere carte più forti
      // (scelto nella UI del draft, 0 = resta sotto il tetto pulito).
      let giri = 0;
      while (state.stato === "draft") {
        if (++giri > 500) {
          throw new Error("autoDraft: non trovo una rosa completabile dopo 500 spin");
        }
        const scelta = sceltaAutoDraft(state, draftView.cards, action.malusMax ?? 0);
        if (!scelta) { draftView = spinRosterView(); continue; }
        state = draftPick(state, scelta.slot, scelta.carta, scelta.costo);
        draftView = state.stato === "draft" ? spinRosterView() : null;
      }
      // La rosa è già piena (state.stato è già "coach"): invece di saltare
      // dritti lì, ci si ferma un istante sul reveal a scaletta della squadra
      // appena presa (draftReveal.js), che poi si fa avanzare da solo.
      draftView = null;
      ui = "draftReveal";
      break;
    }
```

Diventa:

```js
    case "autoDraft":
      // Un solo passo, non tutta la rosa: draft.js gira i pick successivi da
      // solo dispatchando "assign" con auto valorizzato (vedi quel case sotto).
      // `malusMax` è quanti punti di reparto Tomas accetta di pagare pur di
      // prendere carte più forti (scelto nella UI del draft, 0 = tetto pulito).
      draftView = spinAutoStep(action.malusMax ?? 0);
      break;
```

- [ ] **Step 5: Aggiornare il case `assign` per proseguire l'autoplay**

Righe 78-88 oggi:

```js
    case "assign": {
      // Piazzamento libero: la carta va nella casella scelta dall'utente
      // ({ tipo: "titolare", ruolo } oppure { tipo: "panca", posto }).
      state = draftPick(state, action.slot, action.card);
      // se restano slot, pesca una nuova rosa; altrimenti lo stato passa a "coach".
      // `ticker: true` dice al draft di far "cercare" il ticker rosa (mockup 86,
      // radar lock) invece di saltare di scatto: qui c'era già un valore prima,
      // sulla primissima pesca del turno (newRun) non c'è niente da cercare.
      draftView = state.stato === "draft" ? { ...spinRosterView(), ticker: true } : null;
      break;
    }
```

Diventa:

```js
    case "assign": {
      // Piazzamento libero: la carta va nella casella scelta dall'utente
      // ({ tipo: "titolare", ruolo } oppure { tipo: "panca", posto }) - o,
      // quando action.auto è valorizzato, dall'autoplay (draft.js ha già scelto
      // carta e slot secondo il pick deciso da spinAutoStep, qui si applica e basta).
      state = draftPick(state, action.slot, action.card);
      if (state.stato === "draft") {
        // Se restano slot: pesca una nuova rosa. In autoplay il prossimo passo è
        // già deciso (spinAutoStep); a mano è solo un nuovo spin con ticker
        // (mockup 86, radar lock - qui c'era già un valore prima, sulla
        // primissima pesca del turno (newRun) non c'è niente da cercare).
        draftView = action.auto ? spinAutoStep(action.auto.malusMax) : { ...spinRosterView(), ticker: true };
      } else {
        // Rosa piena. A mano si passa subito a "coach" (comportamento invariato).
        // In autoplay invece si resta sulla board piena finché l'utente non preme
        // "Vai al coach" (autoDraftAdvance sotto) - draft.js sa disegnare questo
        // stato perché nFilled arriva a 10 con draftView null.
        draftView = null;
        if (action.auto) ui = "draft";
      }
      break;
    }
```

- [ ] **Step 6: Aggiungere il case `stopAutoDraft`**

Subito dopo il case `autoDraftAdvance` (dopo la riga 116), aggiungere:

```js
    case "stopAutoDraft":
      // L'utente ha premuto "Ferma" a metà autobuild: i pick già piazzati
      // restano, si torna al draft manuale con un nuovo spin normale (niente
      // auto, quindi niente pick automatico sul prossimo giro).
      draftView = { ...spinRosterView(), ticker: true };
      break;
```

- [ ] **Step 7: Verificare che i test esistenti passino**

Run: `npm test`
Expected: PASS (nessun test copre ancora l'autoplay end-to-end, ma nessun modulo di logica è cambiato: deve restare tutto verde)

- [ ] **Step 8: Verifica manuale che il vecchio comportamento sincrono sia sparito**

```bash
python3 -m http.server 8899
```
Apri `http://localhost:8899/prototype/imbattuto/`, entra in una run, clicca "Completa rosa": aspettati che ORA si veda un solo spin (non la rosa già finita) - la sequenza completa arriva solo dopo Task 4, qui basta verificare che non crashi e che compaia un singolo `draftView` con un ticker in corso.

- [ ] **Step 9: Commit**

```bash
git add prototype/imbattuto/app.js
git commit -m "feat(draft): autoDraft procede un pick alla volta invece di un while sincrono"
```

---

### Task 4: `draft.js` - sequenza visiva dell'autoplay + pannello "rosa completa"

Qui la board diventa "viva": quando `draftView.auto` è presente, la schermata esegue da sola la stessa sequenza che farebbe un click umano; quando `draftView` è `null` con rosa piena, mostra il pannello finale.

**Files:**
- Modify: `prototype/imbattuto/screens/draft.js`

**Interfaces:**
- Consumes: `draftView.auto = { cardIndex, slotKey, costo, malusMax }` (da Task 3), o `draftView === null` (rosa completa, autoplay in pausa finale). Funzioni già definite più in basso nello stesso `render()`: `selectCand(i)`, `placeIn(key)`, `scanThenLock(...)`, `reduceMotion()`.
- Produces: nessuna nuova funzione esportata - solo comportamento del componente. Dispatcha `{ type: "assign", slot, card, auto: { malusMax } }` (tramite `commit()` esistente, esteso) e `{ type: "stopAutoDraft" }` e `{ type: "autoDraftAdvance" }` (quest'ultima già esistente, invariata).

- [ ] **Step 1: Gestire `draftView === null` (rosa completa, pausa finale)**

Oggi `render(ctx)` (riga 210-213) assume sempre `draftView` non nullo:

```js
export function render(ctx) {
  const { state, draftView } = ctx;
  const rv = REVEAL[state.difficolta] ?? REVEAL.normale;
  const el = document.createElement("section");
  el.className = "screen draft draft-free";
```

Aggiungere subito dopo (prima di `const inRosa = listaRosa(state.rosa);`) un ramo separato che si ferma qui quando la rosa è piena e non c'è nessun candidato da mostrare (arriva solo dall'autoplay, vedi Task 3 Step 5):

```js
  if (!draftView) {
    // Rosa completa via autobuild (app.js, case "assign" con auto): niente
    // candidati da mostrare, si vede la board piena un istante e si aspetta
    // il click su "Vai al coach" - niente timer automatico (decisione grill-me
    // 11/09/2026, vedi docs/superpowers/specs/2026-09-11-autobuild-draft-live-design.md).
    const titolariSlots = SLOTS.filter((s) => s.tipo === TITOLARE);
    const pancaSlots = SLOTS.filter((s) => s.tipo === PANCA);
    const cellHTML = (slot) => {
      const c = cartaIn(state.rosa, slot);
      const isT = slot.tipo === TITOLARE;
      const label = isT ? slot.ruolo : `${slot.posto}°`;
      return `<button class="dslot full ${isT ? "titolare" : "riserva"}" data-slot="${chiaveSlot(slot)}" data-filled="1" type="button" aria-label="Scheda ${esc(c.name)}">
        <span class="ds-face">${faceHTML(c, { ovr: rv.ovr ? c.ovr : null, role: isT ? slot.ruolo : ruoloDi(c, slot) })}</span></button>`;
    };
    el.innerHTML = `
      ${appHeader(state)}
      <div class="court-block">
        <div class="seclab"><span>La tua rosa · 10/10</span></div>
        <div class="dcourt">
          <div class="dcrow-lab">Titolari</div>
          ${titolariSlots.map(cellHTML).join("")}
          <div class="dcrow-lab">Panchina</div>
          ${pancaSlots.map(cellHTML).join("")}
        </div>
      </div>
      <div class="autod-done">
        <p>Rosa completa.</p>
        <button class="cta" id="autod-vai-coach" type="button">Vai al coach</button>
      </div>`;
    wireAppHeader(el, ctx);
    // Tocco su una casella piena: apre la stessa scheda dettaglio del draft
    // normale (denseSheetHTML, dialog nativo #player-sheet) - non è la funzione
    // `openSheet` definita più in basso nel ramo normale (chiude su `dlg` locale
    // a QUEL ramo), è una copia minima perché qui non passiamo mai da lì.
    el.querySelectorAll(".dslot").forEach((slot) => {
      slot.onclick = () => {
        const c = cartaIn(state.rosa, [...titolariSlots, ...pancaSlots].find((s) => chiaveSlot(s) === slot.dataset.slot));
        if (!c) return;
        let dlg = document.getElementById("player-sheet");
        if (!dlg) {
          dlg = document.createElement("dialog");
          dlg.id = "player-sheet";
          dlg.className = "sheet";
          document.body.appendChild(dlg);
        }
        dlg.innerHTML = `<button class="sheet-x" id="sheet-x" type="button" aria-label="Chiudi">×</button>${denseSheetHTML(c, rv)}`;
        dlg.querySelector("#sheet-x").onclick = () => dlg.close();
        dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };
        dlg.showModal();
      };
    });
    el.querySelector("#autod-vai-coach").onclick = () => ctx.dispatch({ type: "autoDraftAdvance" });
    return el;
  }
```

Questo ramo usa `cartaIn`, `ruoloDi`, `chiaveSlot`, `faceHTML`, `appHeader`, `wireAppHeader`, `esc`, `denseSheetHTML`, tutti già disponibili nel file (import esistenti + funzioni locali sopra `render`).

- [ ] **Step 2: Unificare il callback "dopo il ticker" per innestarci l'auto-pick**

Righe 473-482 oggi:

```js
  const tikFrame = el.querySelector("[data-tikframe]");
  const tikTxt = el.querySelector("[data-tiktxt]");
  if (tikFrame && tikTxt) {
    if (draftView.ticker && !reduceMotion()) {
      scanThenLock(tikFrame, tikTxt, draftView.key, Object.keys(ctx.cards), revealRosa);
    } else {
      tikFrame.classList.add("tik-locked");
      revealRosa();
    }
  }
```

Diventa:

```js
  const tikFrame = el.querySelector("[data-tikframe]");
  const tikTxt = el.querySelector("[data-tiktxt]");
  // Dopo la rivelazione della rosa: se questo spin è autoplay (draftView.auto,
  // vedi app.js spinAutoStep), il pick è già deciso - lo esegue da sola invece
  // di aspettare un click. `busyAuto` fa da guardia: se l'utente ha premuto
  // "Ferma" nel frattempo, `stoppedAuto` è già true e qui non si fa nulla.
  const afterReveal = () => {
    revealRosa();
    if (draftView.auto && !stoppedAuto) {
      const wait = reduceMotion() ? 0 : 250;
      setTimeout(() => {
        if (stoppedAuto) return;
        selectCand(draftView.auto.cardIndex);
        placeIn(draftView.auto.slotKey);
      }, wait);
    }
  };
  if (tikFrame && tikTxt) {
    if (draftView.ticker && !reduceMotion()) {
      scanThenLock(tikFrame, tikTxt, draftView.key, Object.keys(ctx.cards), afterReveal);
    } else {
      tikFrame.classList.add("tik-locked");
      afterReveal();
    }
  }
```

- [ ] **Step 3: Dichiarare `stoppedAuto` e passare `auto` dentro `commit()`**

Vicino a `let sel = null; let busy = false;` (righe 484-485), aggiungere:

```js
  let sel = null;   // indice candidato selezionato
  let busy = false; // animazione in corso
  let stoppedAuto = false; // l'utente ha premuto "Ferma" durante l'autoplay
```

In `placeIn` (righe 526-541), la riga `const commit = () => ctx.dispatch({ type: "assign", slot: slotObj, card });` diventa:

```js
    const commit = () => ctx.dispatch({ type: "assign", slot: slotObj, card, ...(draftView.auto ? { auto: { malusMax: draftView.auto.malusMax } } : {}) });
```

- [ ] **Step 4: Bloccare la UI durante l'autoplay e aggiungere il bottone "Ferma"**

Nella sezione `---- Auto-draft ----` (righe 260-277), la barra oggi mostra sempre i gradini di malus + "Completa rosa". Sostituire il template `autoDraftBar` per riflettere lo stato: durante l'autoplay (`draftView.auto` presente) mostra "Ferma" al posto di "Completa rosa" e disabilita i gradini.

Riga 268-277 oggi:

```js
  const autoDraftBar = `
    <div class="autod-bar">
      <span class="autod-lab">Auto-draft</span>
      <div class="sh-seg" id="autod-malus" role="group" aria-label="Malus reparti accettato">
        ${MALUS_GRADINI.map((m) =>
          `<button type="button" data-malus="${m}" aria-pressed="${m === 0}">${m === 0 ? "Pulito" : `-${m}`}</button>`
        ).join("")}
      </div>
      <button class="autod-go" id="autod-go" type="button">Completa rosa</button>
    </div>`;
```

Diventa:

```js
  const inAuto = !!draftView.auto;
  const autoDraftBar = `
    <div class="autod-bar">
      <span class="autod-lab">Auto-draft</span>
      <div class="sh-seg" id="autod-malus" role="group" aria-label="Malus reparti accettato">
        ${MALUS_GRADINI.map((m) =>
          `<button type="button" data-malus="${m}" aria-pressed="${m === 0}" ${inAuto ? "disabled" : ""}>${m === 0 ? "Pulito" : `-${m}`}</button>`
        ).join("")}
      </div>
      ${inAuto
        ? `<button class="autod-go autod-stop" id="autod-stop" type="button">Ferma</button>`
        : `<button class="autod-go" id="autod-go" type="button">Completa rosa</button>`}
    </div>`;
```

Nella sezione listener `---- Auto-draft ----` (righe 592-603), sostituire:

```js
  el.querySelector("#autod-go").onclick = () => {
    if (busy) return;
    ctx.dispatch({ type: "autoDraft", malusMax: malusAuto });
  };
```

con (mantenendo il blocco `#autod-malus` sopra invariato, dato che i bottoni sono già `disabled` via HTML quando `inAuto`):

```js
  const autodGo = el.querySelector("#autod-go");
  if (autodGo) autodGo.onclick = () => {
    if (busy) return;
    ctx.dispatch({ type: "autoDraft", malusMax: malusAuto });
  };
  const autodStop = el.querySelector("#autod-stop");
  if (autodStop) autodStop.onclick = () => {
    stoppedAuto = true;
    ctx.dispatch({ type: "stopAutoDraft" });
  };
```

Infine, disattivare gli altri controlli interattivi mentre `inAuto` è vero (blocco richiesto dalla spec, punto 2): nella sezione `---- Listener ----` (righe 565-590), avvolgere l'attacco dei listener su carte/slot/aiuti:

Riga 566-571 oggi:

```js
  el.querySelectorAll(".crd:not(.off)").forEach((row) => {
    row.onclick = () => selectCand(+row.dataset.i);
    row.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectCand(+row.dataset.i); }
    };
  });
```

Diventa (idem per il blocco `.dslot` alle righe 575-581 e `.aid:not([disabled])` alle righe 588-590 - avvolgere tutti e tre in `if (!inAuto) { ... }`):

```js
  if (!inAuto) {
    el.querySelectorAll(".crd:not(.off)").forEach((row) => {
      row.onclick = () => selectCand(+row.dataset.i);
      row.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectCand(+row.dataset.i); }
      };
    });
    el.querySelectorAll(".r-info").forEach((b) => {
      b.onclick = (e) => { e.stopPropagation(); openSheet(draftView.cards[+b.dataset.info]); };
    });
    el.querySelectorAll(".dslot").forEach((slot) => {
      slot.onclick = () => {
        const key = slot.dataset.slot;
        if (slot.dataset.filled === "1") { openSheet(cartaIn(state.rosa, slotByKey.get(key))); return; }
        if (slot.classList.contains("elig")) placeIn(key);
      };
    });
    el.querySelectorAll(".aid:not([disabled])").forEach((b) => {
      b.onclick = () => { if (busy) return; ctx.dispatch({ type: "aid", aid: b.dataset.aid }); };
    });
  }
```

(`.r-info` era in mezzo ai tre blocchi nel file originale - va incluso nello stesso `if` dato che apre la scheda dettaglio, un'interazione manuale.)

- [ ] **Step 5: Verifica manuale in browser (draft manuale invariato)**

```bash
python3 -m http.server 8899
```
Apri `http://localhost:8899/prototype/imbattuto/`, gioca a mano qualche pick: deve comportarsi esattamente come prima (nessuna riga cambiata nel percorso `!inAuto`, che è il default quando `draftView.auto` è assente).

- [ ] **Step 6: Verifica manuale in browser (autoplay live)**

Nella stessa pagina, a metà di un draft manuale, clicca "Completa rosa": aspettati di vedere gli slot riempirsi uno alla volta con ticker + volo mirino, il bottone "Ferma" al posto di "Completa rosa", e alla fine il pannello "Rosa completa" con il bottone "Vai al coach" (non deve passare da solo). Clicca "Ferma" a metà di un altro tentativo: il draft deve tornare manuale con i pick fatti fin lì.

- [ ] **Step 7: Commit**

```bash
git add prototype/imbattuto/screens/draft.js
git commit -m "feat(draft): autoplay live sulla board con Ferma e pannello rosa completa"
```

---

### Task 5: Rimuovere `draftReveal.js`

Non è più referenziato da nessuna schermata dopo i Task 3-4.

**Files:**
- Delete: `prototype/imbattuto/screens/draftReveal.js`

- [ ] **Step 1: Verificare che non resti nessun riferimento**

Run: `grep -rn "draftReveal" prototype/ --include="*.js"`
Expected: nessun risultato (Task 3 Step 2 ha già tolto l'unico import/uso in `app.js`)

- [ ] **Step 2: Cancellare il file**

```bash
git rm prototype/imbattuto/screens/draftReveal.js
```

- [ ] **Step 3: Rimuovere lo stile CSS dedicato, se esiste**

Run: `grep -n "draft-reveal\|\.rv-" prototype/imbattuto/styles.css`

Se emergono regole CSS per `.draft-reveal`/`.rv-*` (usate solo da `draftReveal.js`), rimuoverle da `prototype/imbattuto/styles.css` con `Edit` (non con sed, per controllare il blocco esatto prima di toglierlo).

- [ ] **Step 4: Eseguire i test**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(draft): rimuove draftReveal.js, sostituito dall'autoplay live sulla board"
```

---

### Task 6: CSS per il pannello "rosa completa" e il bottone "Ferma"

Le nuove classi introdotte nei Task 4 (`.autod-done`, `.autod-stop`) non hanno ancora stile: senza CSS il pannello finale sarebbe un blocco di testo grezzo.

**Files:**
- Modify: `prototype/imbattuto/styles.css` (dopo il blocco `.autod-go:hover` intorno alla riga 488)

- [ ] **Step 1: Aggiungere lo stile**

Dopo `.autod-go:hover { filter: brightness(1.08); }` (riga 488), aggiungere:

```css
.autod-stop {
  background: transparent; color: var(--bone); border-color: var(--line);
}
.autod-stop:hover { border-color: #d9534f; color: #d9534f; filter: none; }

/* ---- Pannello di chiusura autobuild (rosa completa, niente timer) ---- */
.autod-done {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  margin: 14px auto 0; padding: 16px; max-width: 360px; text-align: center;
}
.autod-done p {
  margin: 0; font-family: var(--arcade); font-size: .58rem; letter-spacing: .06em;
  text-transform: uppercase; color: var(--bone-dim);
}
```

- [ ] **Step 2: Verifica visiva**

Ripeti la verifica del Task 4 Step 6 (autoplay fino in fondo) e controlla che il pannello finale non sia testo grezzo senza stile, e che il bottone "Ferma" sia visivamente distinto da "Completa rosa" (contorno invece che pieno giallo).

- [ ] **Step 3: Commit**

```bash
git add prototype/imbattuto/styles.css
git commit -m "style(draft): veste il pannello rosa completa e il bottone Ferma"
```

---

### Task 7: Aggiornare lo smoke test Playwright

`tools/smoke_imbattuto.py` oggi clicca `#autod-go` e si aspetta di arrivare dritto alla schermata coach (`.ct-row`). Con il nuovo flusso, anche con `reduced_motion="reduce"` (che nella pagina azzera i tempi delle animazioni ma NON salta il click su "Vai al coach" - decisione esplicita della spec, vale anche a motion ridotto), serve un passaggio in più.

**Files:**
- Modify: `tools/smoke_imbattuto.py:56` (script Python, non JS - unica eccezione di linguaggio nel repo per questo ruolo, coerente con quanto già esiste)

**Interfaces:**
- Consumes: id DOM `#autod-go` (invariato), nuovo id `#autod-vai-coach` (Task 4 Step 1).

- [ ] **Step 1: Aggiornare la sequenza di click**

Riga 56 oggi:

```python
    page.locator("#autod-go").click()
    page.locator(".ct-row").first.wait_for()
```

Diventa:

```python
    page.locator("#autod-go").click()
    page.locator("#autod-vai-coach").wait_for(timeout=15_000)
    page.locator("#autod-vai-coach").click()
    page.locator(".ct-row").first.wait_for()
```

(`timeout=15_000` perché anche con reduced motion l'autoplay deve girare su fino a 10 slot in sequenza, con `setTimeout` reali seppur a 0ms/pochi ms: il default di Playwright, 30s, va bene lo stesso, ma un timeout esplicito rende leggibile perché quell'attesa è più lunga delle altre righe del file.)

- [ ] **Step 2: Eseguire lo smoke test**

Run: `python3 tools/smoke_imbattuto.py`
Expected: `ok 1280x900` e `ok 375x812` stampati, nessuna eccezione.

Se fallisce con un timeout su `#autod-vai-coach`: verificare prima con il browser reale (Task 4 Step 6) che il pannello compaia con `prefers-reduced-motion` **non** impostato - se compare lì ma non nello smoke test, il problema è che il ramo `reduceMotion()` di `afterReveal` (Task 4 Step 2, `wait = reduceMotion() ? 0 : 250`) o il ramo `if (reduceMotion() || !row || !slotEl) { commit(); return; }` già esistente in `flyMirino`/`placeIn` non incatena correttamente le chiamate `setTimeout(...,0)` una dietro l'altra - controllare che `spinAutoStep` in `app.js` non lanci mai (rosa sempre completabile con `malusMax` di default 0, dato che lo smoke usa il seme fisso `s = 7` già presente nel file, riga 26-28).

- [ ] **Step 3: Commit**

```bash
git add tools/smoke_imbattuto.py
git commit -m "test(smoke): clicca Vai al coach dopo l'autobuild live"
```

---

### Task 8: Verifica finale end-to-end

Ultimo giro di controllo completo prima di considerare il lavoro chiuso, seguendo la sezione "Testing" della spec.

**Files:** nessuno (solo verifica)

- [ ] **Step 1: Suite completa**

Run: `npm test`
Expected: PASS, tutti i file `game/*.test.js` e `prototype/imbattuto/*.test.js`

- [ ] **Step 2: Smoke Playwright**

Run: `python3 tools/smoke_imbattuto.py`
Expected: `ok 1280x900`, `ok 375x812`

- [ ] **Step 3: Playtest manuale mirato (checklist della spec)**

Con `python3 -m http.server 8899`, viewport mobile (390x844) via claude-in-chrome o browser reale, senza `reduced_motion`:

1. Autoplay fino in fondo con "Pulito" (malus 0): verificare che le 10 caselle si riempiano una alla volta, ~1.2s+250ms a slot, senza salti a scatto.
2. Autoplay con un gradino di malus diverso da 0 (es. "-2"): verificare che completi comunque (o dia errore visibile, non silenzioso, se la guardia dei 500 giri scattasse - improbabile con dataset reale).
3. "Ferma" a metà rosa: verificare che il draft torni manuale con le caselle già piazzate intatte, e che si possa continuare a mano normalmente.
4. A fine autoplay: la board resta piena SENZA passare da sola al coach finché non si preme "Vai al coach".

- [ ] **Step 4: Aggiornare la memoria di progetto**

Il punto 1 di `playtest-mobile-reale-6-problemi` (memoria) va segnato come risolto, sul modello di come è già stato fatto per i punti 1-2 (flash facce, edge-to-edge). Aggiornare il file di memoria corrispondente per riflettere che l'autobuild draft è stato risolto in data odierna, cosa è stato fatto e quali file sono cambiati (stesso stile delle voci già chiuse nello stesso file).
