# Prototipo UI L'IMBATTUTO (Piano B) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire il prototipo web statico e cliccabile della modalità L'IMBATTUTO (Home → Draft → Coach → Run → Esito → Leaderboard), collegato al motore vero `game/*.js`, con dati carta reali (blend buzzer + nba-sim), così Tomas gioca un run intero e approva flusso ed estetica prima dell'app vera.

**Architecture:** Web-app statica in `prototype/imbattuto/`, servita con `python3 -m http.server`. `app.js` importa i moduli ES del motore (`../../game/*.js`) e li usa come sorgente di verità dello stato; ogni schermata è una funzione di render pura che riceve lo `State` e degli handler. I dati carta sono generati una tantum da uno script node in `cards.js`. Moduli logici puri (derivazione attributi, pool/spin, meta localStorage) sono testati con `node --test`; le schermate sono verificate visivamente nel browser.

**Tech Stack:** JavaScript ES modules nel browser, `node:test` + `node:assert/strict` per i moduli puri, `python3 -m http.server` per servire. Nessun framework, nessun build, nessuna dipendenza npm.

## Global Constraints

- **Niente fallback silenzioso:** input non valido o dati mancanti → stato/errore chiaro a schermo, mai valori finti spacciati per reali. Le carte con attributi derivati sono marcate `estimated:true` e mostrano un marcatore visivo ("attributi provvisori").
- **Motore vero, non duplicato:** le schermate chiamano `game/*.js` (`newRun`, `draftPick`, `useAid`, `chooseCoach`, `startRun`, `resolveRound`, `buildHistoricalQuintets`, `pickOpponent`). Nessuna logica di gioco riscritta in `app.js`.
- **Stato unico immutabile:** l'oggetto `State` del motore è la verità; gli handler producono un nuovo `State` (le funzioni del motore sono pure) e ri-renderizzano. `app.js` non muta `State` in-place.
- **Struttura carta (da rispettare per il motore, Piano A):** `{ player_id, name, season, team, team_abbr, ovr, pos:{primary, secondary|null}, att:[7], def:[5], estimated }`. Ordine attributi OFF: `["Tiro 3","Tiro medio","Finalizzazione","Tiro libero","Palleggio","Playmaking","Senza palla"]`; DEF: `["Dif. perimetro","Dif. interna","Palle rubate","Stoppate","Rimbalzi"]`.
- **Ruoli (ordine):** `["PG","SG","SF","PF","C"]`.
- **Draft (deciso in brainstorming):** spin automatico di una coppia team+stagione; si mostrano i **top-5 per OVR** di quella rosa; assegnabili al ruolo del turno solo i compatibili (`role ∈ {pos.primary, pos.secondary}`), gli altri visibili ma disabilitati; scegli 1 compatibile oppure re-spin. Lo spin pesca solo team-stagioni con **almeno 1 compatibile** nei top-5 per il ruolo corrente (così Incubo, 0 aiuti, resta giocabile).
- **Leaderboard:** minima, persistita in `localStorage` (il motore meta Piano C non esiste ancora).
- **Servire, non aprire da file://:** gli import ES dal motore non funzionano da `file://`; il prototipo va servito via http.server. Documentarlo nel README del prototipo.
- **Commit frequenti**, Conventional Commits, sul branch corrente. Push separato, confermato da Tomas.

---

## File Structure

- **Create** `prototype/imbattuto/index.html` — contenitore, monta `app.js` come modulo.
- **Create** `prototype/imbattuto/styles.css` — stile condiviso (near-black + oro, condensato maiuscolo, arena/sirena), lift dai mockup di riferimento.
- **Create** `prototype/imbattuto/README.md` — come avviare (`python3 -m http.server` + URL).
- **Create** `prototype/imbattuto/derive.mjs` — `deriveAttributes(card)`, `inferPosition(stats)` (fallback attributi/posizione dai box stats). Puro, testato.
- **Create** `prototype/imbattuto/derive.test.js`.
- **Create** `prototype/imbattuto/build-cards.mjs` — script node una tantum: legge `data/nba-data.js` + `mockups/59-players-data.js`, fa il join per nome, applica il fallback derivato, scrive `cards.js`.
- **Create** `prototype/imbattuto/cards.js` — GENERATO da `build-cards.mjs` (committato): esporta `CARDS_BY_TEAM_SEASON` e `ALL_CARDS`.
- **Create** `prototype/imbattuto/cards.smoke.test.js` — smoke test sul `cards.js` generato (struttura carta valida per il motore).
- **Create** `prototype/imbattuto/pool.js` — helper puri sul pool: `topFive`, `candidatesForRole`, `spin`, `opponentPool`. Testato.
- **Create** `prototype/imbattuto/pool.test.js`.
- **Create** `prototype/imbattuto/meta.js` — leaderboard/stats su `localStorage` (storage iniettabile). Testato.
- **Create** `prototype/imbattuto/meta.test.js`.
- **Create** `prototype/imbattuto/app.js` — orchestratore: stato, router schermate, wiring motore, registry di render.
- **Create** `prototype/imbattuto/screens/home.js`, `draft.js`, `coach.js`, `run.js`, `esito.js`, `leaderboard.js` — ogni file esporta `render(ctx)` che ritorna un elemento DOM; nessuna logica di gioco (solo lettura di `State` + emissione di eventi via `ctx`).

Comando test dei moduli puri: `node --test prototype/imbattuto/*.test.js`

---

## Task 1: Scaffold servibile del prototipo

**Files:**
- Create: `prototype/imbattuto/index.html`
- Create: `prototype/imbattuto/styles.css`
- Create: `prototype/imbattuto/app.js`
- Create: `prototype/imbattuto/README.md`

**Interfaces:**
- Produces: una pagina servibile che monta `app.js` in `#app` e mostra un titolo, per validare il setup http.server + ES modules.

- [ ] **Step 1: Crea** `prototype/imbattuto/index.html`

```html
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>L'IMBATTUTO — prototipo</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main id="app" aria-live="polite"></main>
  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Crea** `prototype/imbattuto/styles.css` (base della direzione: near-black + oro, display condensato)

```css
:root {
  --nero: #0b0b0d;
  --nero-2: #141418;
  --oro: #e8b23a;
  --oro-soft: #caa04e;
  --testo: #f4f2ec;
  --testo-soft: #a9a49a;
  --linea: #26262c;
  --ok: #4caf7d;
  --ko: #d1495b;
  --display: "Barlow Condensed", "Oswald", system-ui, sans-serif; /* condensato; il font reale si rifinisce nel prototipo */
  --testo-font: system-ui, sans-serif;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--nero); color: var(--testo); font-family: var(--testo-font); }
#app { min-height: 100dvh; max-width: 960px; margin: 0 auto; padding: 20px; }
h1, h2, .display { font-family: var(--display); text-transform: uppercase; letter-spacing: 0.02em; margin: 0; }
button { font: inherit; cursor: pointer; }
.estimated-badge { font-size: 11px; color: var(--nero); background: var(--oro-soft); border-radius: 3px; padding: 1px 5px; text-transform: uppercase; letter-spacing: .03em; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
```

- [ ] **Step 3: Crea** `prototype/imbattuto/app.js` (shell minima montabile)

```js
// Orchestratore del prototipo. Per ora monta solo un titolo:
// il router e le schermate arrivano nei task successivi.
const app = document.getElementById("app");

function boot() {
  const h = document.createElement("h1");
  h.className = "display";
  h.textContent = "L'IMBATTUTO";
  app.replaceChildren(h);
}

boot();
```

- [ ] **Step 4: Crea** `prototype/imbattuto/README.md`

```markdown
# Prototipo L'IMBATTUTO

Prototipo cliccabile della modalità, collegato al motore `game/*.js`.

## Avvio

Gli import ES dal motore non funzionano da `file://`. Servi il repo e apri l'URL:

```bash
# dalla root del repo buzzer
python3 -m http.server 8000
# poi apri: http://localhost:8000/prototype/imbattuto/
```

## Test dei moduli puri

```bash
node --test prototype/imbattuto/*.test.js
```

## Dati carta

`cards.js` è generato da `build-cards.mjs` (blend dati buzzer + nba-sim). Per rigenerarlo:

```bash
node prototype/imbattuto/build-cards.mjs
```

Le carte con `estimated:true` hanno attributi derivati (provvisori) e sono marcate a schermo.
```

- [ ] **Step 5: Verifica manuale (browser)**

Run: `python3 -m http.server 8000` (da root repo), apri `http://localhost:8000/prototype/imbattuto/`
Expected: pagina near-black con titolo "L'IMBATTUTO". Nessun errore in console.

- [ ] **Step 6: Commit**

```bash
git add prototype/imbattuto/index.html prototype/imbattuto/styles.css prototype/imbattuto/app.js prototype/imbattuto/README.md
git commit -m "feat(proto): scaffold servibile prototipo L'IMBATTUTO"
```

---

## Task 2: Derivazione attributi e posizione (fallback)

**Files:**
- Create: `prototype/imbattuto/derive.mjs`
- Test: `prototype/imbattuto/derive.test.js`

**Interfaces:**
- Produces:
  - `deriveAttributes(card) -> { att: number[7], def: number[5] }` — dai `stats_real` + `ovr`.
  - `inferPosition(stats) -> { primary: string, secondary: null }` — euristica dai box stats.
  - Ordine attributi come nei Global Constraints.

- [ ] **Step 1: Scrivi il test (fallisce)** `prototype/imbattuto/derive.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveAttributes, inferPosition } from "./derive.mjs";

const base = {
  ovr: 80,
  stats_real: { pts: 15, reb: 5, ast: 4, stl: 1, blk: 0.5, tov: 1.5, fg_pct: 46, tp_pct: 36, ft_pct: 80, min: 30, gp: 70, plus_minus: 1 },
};

test("deriveAttributes ritorna 7 off + 5 def, tutti in [25,99]", () => {
  const { att, def } = deriveAttributes(base);
  assert.equal(att.length, 7);
  assert.equal(def.length, 5);
  for (const v of [...att, ...def]) {
    assert.ok(Number.isInteger(v) && v >= 25 && v <= 99, `valore ${v} fuori range`);
  }
});

test("più tiro da 3 → 'Tiro 3' (indice 0) più alto", () => {
  const scarso = deriveAttributes({ ...base, stats_real: { ...base.stats_real, tp_pct: 20 } });
  const cecchino = deriveAttributes({ ...base, stats_real: { ...base.stats_real, tp_pct: 45 } });
  assert.ok(cecchino.att[0] > scarso.att[0]);
});

test("più rimbalzi → 'Rimbalzi' (def indice 4) più alto", () => {
  const guardia = deriveAttributes({ ...base, stats_real: { ...base.stats_real, reb: 3 } });
  const centro = deriveAttributes({ ...base, stats_real: { ...base.stats_real, reb: 12 } });
  assert.ok(centro.def[4] > guardia.def[4]);
});

test("inferPosition: tanti assist → PG, tanti rimbalzi+stoppate → C", () => {
  assert.equal(inferPosition({ ast: 8, reb: 3, blk: 0.2 }).primary, "PG");
  assert.equal(inferPosition({ ast: 1.5, reb: 11, blk: 1.6 }).primary, "C");
});

test("inferPosition ritorna sempre un ruolo valido e secondary null", () => {
  const p = inferPosition({ ast: 3, reb: 5, blk: 0.4 });
  assert.ok(["PG", "SG", "SF", "PF", "C"].includes(p.primary));
  assert.equal(p.secondary, null);
});
```

- [ ] **Step 2: Lancia il test, deve fallire**

Run: `node --test prototype/imbattuto/derive.test.js`
Expected: FAIL con `Cannot find module './derive.mjs'`

- [ ] **Step 3: Implementa** `prototype/imbattuto/derive.mjs`

```js
// Fallback SOLO per il prototipo: deriva attributi/posizione plausibili dai box
// stats quando la carta non ha un match reale in nba-sim. Marcata estimated:true altrove.

function clamp(x) {
  return Math.max(25, Math.min(99, Math.round(x)));
}

// Normalizza uno stat su una scala 0..1 rispetto a un tetto plausibile per-partita.
function norm(v, cap) {
  return Math.max(0, Math.min(1, v / cap));
}

// Attributo = ancora sull'OVR + spinta/penalità dallo stat rilevante.
export function deriveAttributes(card) {
  const o = card.ovr;
  const s = card.stats_real;
  const anchor = o - 6; // base leggermente sotto l'OVR, poi gli stat spingono
  const att = [
    anchor + 45 * (norm(s.tp_pct, 45) - 0.5),        // Tiro 3
    anchor + 30 * (norm(s.fg_pct, 55) - 0.45),       // Tiro medio
    anchor + 24 * (norm(s.pts, 28) - 0.4) + 8 * (norm(s.fg_pct, 60) - 0.5), // Finalizzazione
    anchor + 40 * (norm(s.ft_pct, 92) - 0.55),       // Tiro libero
    anchor + 28 * (norm(s.ast, 9) - 0.35),           // Palleggio
    anchor + 34 * (norm(s.ast, 9) - 0.3) - 20 * (norm(s.tov, 4) - 0.4), // Playmaking
    anchor + 18 * (norm(s.pts, 28) - 0.4),           // Senza palla
  ].map(clamp);
  const def = [
    anchor + 30 * (norm(s.stl, 2.2) - 0.4),          // Dif. perimetro
    anchor + 30 * (norm(s.blk, 2.2) - 0.35),         // Dif. interna
    anchor + 34 * (norm(s.stl, 2.2) - 0.4),          // Palle rubate
    anchor + 40 * (norm(s.blk, 2.5) - 0.3),          // Stoppate
    anchor + 40 * (norm(s.reb, 13) - 0.35),          // Rimbalzi
  ].map(clamp);
  return { att, def };
}

// Euristica di ruolo dai box stats per-partita.
export function inferPosition(stats) {
  const ast = stats.ast ?? 0;
  const reb = stats.reb ?? 0;
  const blk = stats.blk ?? 0;
  let primary;
  if (reb >= 9 || blk >= 1.3) primary = "C";
  else if (reb >= 6.5) primary = "PF";
  else if (ast >= 5) primary = "PG";
  else if (ast >= 3) primary = "SG";
  else primary = "SF";
  return { primary, secondary: null };
}
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `node --test prototype/imbattuto/derive.test.js`
Expected: PASS (5 test)

- [ ] **Step 5: Commit**

```bash
git add prototype/imbattuto/derive.mjs prototype/imbattuto/derive.test.js
git commit -m "feat(proto): derivazione attributi/posizione fallback dai box stats"
```

---

## Task 3: Generatore dati carta (blend) → `cards.js`

**Files:**
- Create: `prototype/imbattuto/build-cards.mjs`
- Create: `prototype/imbattuto/cards.js` (generato)
- Test: `prototype/imbattuto/cards.smoke.test.js`

**Interfaces:**
- Consumes: `deriveAttributes`, `inferPosition` (Task 2); `data/nba-data.js`; `mockups/59-players-data.js`.
- Produces: `cards.js` che esporta:
  - `CARDS_BY_TEAM_SEASON: { "ABBR|SEASON": Card[] }`.
  - `ALL_CARDS: Card[]`.
  - Card = struttura dei Global Constraints, con `estimated` boolean.

- [ ] **Step 1: Implementa** `prototype/imbattuto/build-cards.mjs`

```js
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
```

- [ ] **Step 2: Genera `cards.js`**

Run: `node prototype/imbattuto/build-cards.mjs`
Expected: stampa il numero di carte/team-stagione/estimated; crea `prototype/imbattuto/cards.js`.

- [ ] **Step 3: Scrivi lo smoke test** `prototype/imbattuto/cards.smoke.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { CARDS_BY_TEAM_SEASON, ALL_CARDS } from "./cards.js";
import { teamRating } from "../../game/rating.js";

test("ci sono carte e team-stagione", () => {
  assert.ok(ALL_CARDS.length > 100);
  assert.ok(Object.keys(CARDS_BY_TEAM_SEASON).length > 20);
});

test("ogni carta ha la struttura richiesta dal motore", () => {
  for (const c of ALL_CARDS.slice(0, 200)) {
    assert.equal(c.att.length, 7, `${c.name} att`);
    assert.equal(c.def.length, 5, `${c.name} def`);
    assert.ok(["PG", "SG", "SF", "PF", "C"].includes(c.pos.primary), `${c.name} pos`);
    assert.equal(typeof c.estimated, "boolean");
  }
});

test("il motore accetta un quintetto reale senza lanciare", () => {
  const anyKey = Object.keys(CARDS_BY_TEAM_SEASON).find((k) => CARDS_BY_TEAM_SEASON[k].length >= 5);
  const five = CARDS_BY_TEAM_SEASON[anyKey].slice(0, 5);
  const r = teamRating(five);
  assert.ok(Number.isInteger(r.ovr));
});
```

- [ ] **Step 4: Lancia lo smoke test, deve passare**

Run: `node --test prototype/imbattuto/cards.smoke.test.js`
Expected: PASS (3 test)

- [ ] **Step 5: Commit** (includi il `cards.js` generato)

```bash
git add prototype/imbattuto/build-cards.mjs prototype/imbattuto/cards.js prototype/imbattuto/cards.smoke.test.js
git commit -m "feat(proto): generatore dati carta blend buzzer+nba-sim"
```

---

## Task 4: Pool e spin del draft

**Files:**
- Create: `prototype/imbattuto/pool.js`
- Test: `prototype/imbattuto/pool.test.js`

**Interfaces:**
- Consumes: `CARDS_BY_TEAM_SEASON` (Task 3), `canPlay`/`ROLES` (`game/roster.js`), `buildHistoricalQuintets` (`game/opponents.js`).
- Produces:
  - `topFive(cards) -> Card[]` — i 5 di OVR più alto.
  - `candidatesForRole(cardsByKey, key, role) -> { key, cards: Card[5], assignable: boolean[5] }`.
  - `spin(cardsByKey, role, rng=Math.random) -> { key, cards, assignable }` — pesca una team-stagione con ≥1 compatibile nei top-5 per `role`.
  - `opponentPool(cardsByKey, k?) -> Opponent[]` — delega a `buildHistoricalQuintets`.

- [ ] **Step 1: Scrivi il test (fallisce)** `prototype/imbattuto/pool.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { topFive, candidatesForRole, spin, opponentPool } from "./pool.js";

// fixture: una team-stagione con ruoli noti
function card(name, ovr, primary) {
  return { player_id: name, name, season: "2015-16", team: "X", team_abbr: "X", ovr,
    pos: { primary, secondary: null }, att: [70,70,70,70,70,70,70], def: [52,52,52,52,52], estimated: false };
}
const KEY = "X|2015-16";
const byKey = {
  [KEY]: [
    card("PG1", 90, "PG"), card("SG1", 88, "SG"), card("SF1", 86, "SF"),
    card("PF1", 84, "PF"), card("C1", 82, "C"), card("PG2", 60, "PG"),
  ],
};

test("topFive prende i 5 OVR più alti", () => {
  const t = topFive(byKey[KEY]);
  assert.deepEqual(t.map((c) => c.ovr), [90, 88, 86, 84, 82]);
});

test("candidatesForRole marca assegnabile solo il compatibile", () => {
  const r = candidatesForRole(byKey, KEY, "PG");
  assert.equal(r.cards.length, 5);
  // solo PG1 (nei top-5) è PG
  assert.deepEqual(r.assignable, [true, false, false, false, false]);
});

test("spin ritorna una team-stagione con almeno un compatibile", () => {
  const r = spin(byKey, "C", () => 0);
  assert.ok(r.assignable.some(Boolean), "almeno un compatibile per C");
});

test("spin lancia se nessuna team-stagione ha un compatibile per il ruolo", () => {
  const soloGuardie = { "Y|2015-16": [card("a",80,"PG"),card("b",79,"SG"),card("c",78,"PG"),card("d",77,"SG"),card("e",76,"SG")] };
  assert.throws(() => spin(soloGuardie, "C", () => 0), /nessuna/i);
});

test("opponentPool costruisce quintetti valutati", () => {
  const pool = opponentPool(byKey);
  assert.equal(pool.length, 1);
  assert.ok(pool[0].voto.ovr > 0);
});
```

- [ ] **Step 2: Lancia il test, deve fallire**

Run: `node --test prototype/imbattuto/pool.test.js`
Expected: FAIL con `Cannot find module './pool.js'`

- [ ] **Step 3: Implementa** `prototype/imbattuto/pool.js`

```js
import { canPlay } from "../../game/roster.js";
import { buildHistoricalQuintets } from "../../game/opponents.js";

export function topFive(cards) {
  return [...cards].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
}

export function candidatesForRole(cardsByKey, key, role) {
  const cards = topFive(cardsByKey[key]);
  const assignable = cards.map((c) => canPlay(c, role));
  return { key, cards, assignable };
}

// Pesca una team-stagione (con ≥5 carte) i cui top-5 contengono almeno un compatibile.
export function spin(cardsByKey, role, rng = Math.random) {
  const keys = Object.keys(cardsByKey).filter((k) => cardsByKey[k].length >= 5);
  const valide = keys.filter((k) => candidatesForRole(cardsByKey, k, role).assignable.some(Boolean));
  if (valide.length === 0) throw new Error(`spin: nessuna team-stagione con un compatibile per ${role}`);
  const key = valide[Math.floor(rng() * valide.length)];
  return candidatesForRole(cardsByKey, key, role);
}

export function opponentPool(cardsByKey, k) {
  return buildHistoricalQuintets(cardsByKey, k);
}
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `node --test prototype/imbattuto/pool.test.js`
Expected: PASS (5 test)

- [ ] **Step 5: Commit**

```bash
git add prototype/imbattuto/pool.js prototype/imbattuto/pool.test.js
git commit -m "feat(proto): pool e spin del draft (top-5 + filtro ruolo)"
```

---

## Task 5: Orchestratore app + router + schermata Home

**Files:**
- Modify: `prototype/imbattuto/app.js`
- Create: `prototype/imbattuto/screens/home.js`

**Interfaces:**
- Consumes: `newRun` (`game/run.js`), `DIFFICULTIES` (`game/difficulty.js`), `CARDS_BY_TEAM_SEASON`/`opponentPool`.
- Produces:
  - `app.js`: tiene `state` (State del motore o null), `ui` (fase UI: `"home"|"leaderboard"` oltre agli stati del motore), un `ctx` passato alle schermate `{ state, dispatch, go }`, e `render()` che sceglie la schermata.
  - `render(ctx) -> HTMLElement` è il contratto di ogni file in `screens/`.
  - Home emette `dispatch({type:"newRun", formato, difficolta})`.

- [ ] **Step 1: Implementa** `prototype/imbattuto/screens/home.js`

```js
import { DIFFICULTIES } from "../../../game/difficulty.js";

const FORMATI = ["playoff", "stagione", "sfida"];

// ctx: { state, dispatch, go }
export function render(ctx) {
  const el = document.createElement("section");
  el.className = "screen home";
  el.innerHTML = `
    <h1 class="display">L'IMBATTUTO</h1>
    <p class="tagline">Un quintetto. Nessuna sconfitta.</p>
    <fieldset class="pick" id="formato"><legend class="display">Formato</legend></fieldset>
    <fieldset class="pick" id="difficolta"><legend class="display">Difficoltà</legend></fieldset>
    <button class="cta" id="via" disabled>Inizia il draft</button>
  `;
  const scelte = { formato: null, difficolta: null };
  const via = el.querySelector("#via");
  const sync = () => { via.disabled = !(scelte.formato && scelte.difficolta); };

  function group(name, valori, into) {
    for (const v of valori) {
      const b = document.createElement("button");
      b.className = "chip"; b.textContent = v; b.dataset.v = v;
      b.onclick = () => {
        scelte[name] = v;
        into.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c === b));
        sync();
      };
      into.appendChild(b);
    }
  }
  group("formato", FORMATI, el.querySelector("#formato"));
  group("difficolta", Object.keys(DIFFICULTIES), el.querySelector("#difficolta"));

  via.onclick = () => ctx.dispatch({ type: "newRun", ...scelte });
  return el;
}
```

- [ ] **Step 2: Riscrivi** `prototype/imbattuto/app.js` (orchestratore + router)

```js
import { newRun } from "../../game/run.js";
import { CARDS_BY_TEAM_SEASON } from "./cards.js";
import { opponentPool } from "./pool.js";
import { render as home } from "./screens/home.js";

const app = document.getElementById("app");

// Stato del prototipo: lo State del motore (o null) + la fase UI corrente.
let state = null;          // State del motore
let ui = "home";           // "home" | "leaderboard" | (altrimenti deriva da state.stato)
const cards = CARDS_BY_TEAM_SEASON;
const pool = opponentPool(cards); // pool avversari, calcolato una volta

// Registry di render: le altre schermate si aggiungono nei task successivi.
const screens = { home };

function ctx() {
  return { state, cards, pool, dispatch, go };
}

function go(nextUi) { ui = nextUi; render(); }

function dispatch(action) {
  switch (action.type) {
    case "newRun":
      state = newRun({ formato: action.formato, difficolta: action.difficolta });
      ui = null; // d'ora in poi la schermata deriva da state.stato
      break;
    default:
      throw new Error(`azione sconosciuta: ${action.type}`);
  }
  render();
}

function currentScreenName() {
  if (ui) return ui;                 // home / leaderboard
  return state.stato;                // "draft" | "coach" | "run" | "finito"
}

function render() {
  const name = currentScreenName();
  const screen = screens[name];
  if (!screen) {
    app.replaceChildren(Object.assign(document.createElement("pre"),
      { textContent: `Schermata non ancora implementata: ${name}` }));
    return;
  }
  app.replaceChildren(screen(ctx()));
}

render();
```

- [ ] **Step 3: Verifica manuale (browser)**

Run: server attivo, apri `http://localhost:8000/prototype/imbattuto/`
Expected: Home con formato + difficoltà; scelte attivano il pulsante; premendo "Inizia il draft" la pagina mostra il placeholder "Schermata non ancora implementata: draft" (conferma che `newRun` ha prodotto `stato:"draft"`). Nessun errore console.

- [ ] **Step 4: Commit**

```bash
git add prototype/imbattuto/app.js prototype/imbattuto/screens/home.js
git commit -m "feat(proto): orchestratore, router e schermata Home"
```

---

## Task 6: Schermata Draft (spin, top-5, assegnazione, aiuti)

**Files:**
- Create: `prototype/imbattuto/screens/draft.js`
- Modify: `prototype/imbattuto/app.js` (registra la schermata + azioni `spin`/`assign`/`aid`)

**Interfaces:**
- Consumes: `draftPick`, `useAid` (`game/run.js`); `ROLES` (`game/roster.js`); `spin`, `candidatesForRole` (`pool.js`).
- Produces: azioni `dispatch({type:"spin"})`, `dispatch({type:"assign", card})`, `dispatch({type:"aid", aid})`. Lo stato UI del draft (turno corrente, candidati mostrati) vive in `app.js` accanto allo `State` del motore.

- [ ] **Step 1: Estendi** `prototype/imbattuto/app.js` — import e stato del draft

Aggiungi agli import in cima:
```js
import { draftPick, useAid } from "../../game/run.js";
import { ROLES } from "../../game/roster.js";
import { spin as spinPool } from "./pool.js";
import { render as draft } from "./screens/draft.js";
```
Aggiungi una variabile di modulo (sotto `let ui = "home";`):
```js
let draftView = null; // { role, key, cards, assignable } dei candidati mostrati nel turno
```
Registra la schermata:
```js
const screens = { home, draft };
```

- [ ] **Step 2: Estendi** `dispatch` in `app.js` con i casi del draft

Dentro lo `switch (action.type)` aggiungi:
```js
    case "newRun":
      state = newRun({ formato: action.formato, difficolta: action.difficolta });
      ui = null;
      draftView = firstSpin();      // primo turno: pesca subito
      break;
    case "spin":
      draftView = spinFor(currentRole());
      break;
    case "assign": {
      state = draftPick(state, draftView.role, action.card);
      // se restano ruoli, pesca il turno successivo; altrimenti stato passa a "coach"
      draftView = state.stato === "draft" ? spinFor(currentRole()) : null;
      break;
    }
    case "aid":
      state = useAid(state, action.aid);
      if (action.aid === "respin") draftView = spinFor(currentRole());
      break;
```
(Rimuovi il vecchio `case "newRun"` duplicato: resta solo questa versione.)

Aggiungi le funzioni helper in `app.js`:
```js
// Il ruolo del turno = il primo slot vuoto in ordine ROLES.
function currentRole() {
  return ROLES.find((r) => state.quintetto[r] === null);
}
function spinFor(role) {
  const { key, cards: shown, assignable } = spinPool(cards, role);
  return { role, key, cards: shown, assignable };
}
function firstSpin() {
  return spinFor(currentRole());
}
```
Esponi `draftView` nel `ctx`:
```js
function ctx() {
  return { state, cards, pool, draftView, dispatch, go };
}
```

- [ ] **Step 3: Implementa** `prototype/imbattuto/screens/draft.js`

```js
import { ROLES } from "../../../game/roster.js";

// ctx: { state, draftView, dispatch }
export function render(ctx) {
  const { state, draftView } = ctx;
  const el = document.createElement("section");
  el.className = "screen draft";

  // Barra dei 5 slot (stato del quintetto)
  const slots = ROLES.map((r) => {
    const c = state.quintetto[r];
    return `<div class="slot ${c ? "full" : ""} ${r === draftView.role ? "active" : ""}">
      <span class="role">${r}</span>
      <span class="who">${c ? c.name : "—"}</span>
    </div>`;
  }).join("");

  // Aiuti rimasti
  const a = state.aids;
  const aidBtn = (tipo, label) =>
    `<button class="aid" data-aid="${tipo}" ${a[tipo] <= 0 ? "disabled" : ""}>${label} (${a[tipo]})</button>`;

  // I 5 candidati (top-5 della team-stagione pescata)
  const cand = draftView.cards.map((c, i) => {
    const ok = draftView.assignable[i];
    const badge = c.estimated ? `<span class="estimated-badge">provv.</span>` : "";
    return `<button class="cand ${ok ? "" : "off"}" data-i="${i}" ${ok ? "" : "disabled"}>
      <span class="cand-ovr">${c.ovr}</span>
      <span class="cand-name">${c.name} ${badge}</span>
      <span class="cand-pos">${c.pos.primary}</span>
    </button>`;
  }).join("");

  el.innerHTML = `
    <div class="slots">${slots}</div>
    <h2 class="display">Turno: ${draftView.role} — ${draftView.key.replace("|", " ")}</h2>
    <div class="cands">${cand}</div>
    <div class="aids">
      ${aidBtn("respin", "Re-spin")}
      ${aidBtn("squadra", "Cambia squadra")}
      ${aidBtn("stagione", "Cambia stagione")}
    </div>
  `;

  el.querySelectorAll(".cand:not([disabled])").forEach((b) => {
    b.onclick = () => ctx.dispatch({ type: "assign", card: draftView.cards[Number(b.dataset.i)] });
  });
  el.querySelectorAll(".aid:not([disabled])").forEach((b) => {
    const aid = b.dataset.aid;
    // "Cambia squadra"/"Cambia stagione" nel prototipo = ripescano un nuovo turno (nuova team-stagione)
    b.onclick = () => {
      ctx.dispatch({ type: "aid", aid });
      if (aid !== "respin") ctx.dispatch({ type: "spin" });
    };
  });
  return el;
}
```

- [ ] **Step 4: Verifica manuale (browser)**

Run: server attivo; dalla Home scegli formato+difficoltà → Inizia il draft.
Expected: 5 slot in alto (PG attivo). 5 candidati con l'OVR; solo i compatibili col ruolo cliccabili, gli altri grigi. Cliccando un compatibile lo slot si riempie e parte il turno successivo. Gli aiuti mostrano il conteggio e si consumano (in Facile gli switch non calano). Riempiti i 5 slot → placeholder "coach". Le carte provvisorie mostrano il badge.

- [ ] **Step 5: Commit**

```bash
git add prototype/imbattuto/app.js prototype/imbattuto/screens/draft.js
git commit -m "feat(proto): schermata Draft con spin, top-5 e aiuti"
```

---

## Task 7: Schermata Coach

**Files:**
- Create: `prototype/imbattuto/screens/coach.js`
- Modify: `prototype/imbattuto/app.js` (registra schermata + azione `chooseCoach`)

**Interfaces:**
- Consumes: `chooseCoach`, `startRun` (`game/run.js`); `pool` (avversari).
- Produces: azione `dispatch({type:"chooseCoach", coach})` che chiama `chooseCoach` e subito `startRun(state, pool)` per entrare nel run.

- [ ] **Step 1: Estendi** `app.js`

Import:
```js
import { chooseCoach, startRun } from "../../game/run.js";
import { render as coach } from "./screens/coach.js";
```
Registry:
```js
const screens = { home, draft, coach };
```
Caso in `dispatch`:
```js
    case "chooseCoach":
      state = chooseCoach(state, action.coach);
      state = startRun(state, pool);   // entra nel run: calcola voto + primo avversario
      break;
```

- [ ] **Step 2: Implementa** `prototype/imbattuto/screens/coach.js`

```js
// Tre coach fissi con voti OFF/DEF diversi (nel prototipo bastano a mostrare l'effetto).
const COACH = [
  { id: "off", name: "Coach d'Attacco", off_grade: "A", def_grade: "C", champ_bonus: 0 },
  { id: "bil", name: "Coach Equilibrato", off_grade: "B", def_grade: "B", champ_bonus: 1 },
  { id: "def", name: "Coach di Difesa", off_grade: "C", def_grade: "A", champ_bonus: 0 },
];

// ctx: { dispatch }
export function render(ctx) {
  const el = document.createElement("section");
  el.className = "screen coach";
  el.innerHTML = `<h2 class="display">Scegli il coach</h2>
    <div class="coaches">${COACH.map((c) => `
      <button class="coach-card" data-id="${c.id}">
        <span class="coach-name display">${c.name}</span>
        <span class="grades">OFF ${c.off_grade} · DEF ${c.def_grade}${c.champ_bonus ? ` · +${c.champ_bonus}` : ""}</span>
      </button>`).join("")}</div>`;
  el.querySelectorAll(".coach-card").forEach((b) => {
    b.onclick = () => ctx.dispatch({ type: "chooseCoach", coach: COACH.find((c) => c.id === b.dataset.id) });
  });
  return el;
}
```

- [ ] **Step 3: Verifica manuale (browser)**

Run: server attivo; completa il draft.
Expected: 3 coach; scegliendone uno la pagina passa al placeholder "run" (conferma che `chooseCoach`+`startRun` hanno prodotto `stato:"run"` con `voto` e `avversario`).

- [ ] **Step 4: Commit**

```bash
git add prototype/imbattuto/app.js prototype/imbattuto/screens/coach.js
git commit -m "feat(proto): schermata Coach + ingresso nel run"
```

---

## Task 8: Schermata Run (tabellone + meter, risoluzione round)

**Files:**
- Create: `prototype/imbattuto/screens/run.js`
- Modify: `prototype/imbattuto/app.js` (registra schermata `run` + azione `resolveRound`)

**Interfaces:**
- Consumes: `resolveRound` (`game/run.js`).
- Produces: azione `dispatch({type:"resolveRound"})`. La schermata legge `state.voto`, `state.avversario`, `state.vittorie`, `state.round`, e la `N` della difficoltà per il meter.

- [ ] **Step 1: Estendi** `app.js`

Import:
```js
import { resolveRound } from "../../game/run.js";
import { DIFFICULTIES } from "../../game/difficulty.js";
import { render as run } from "./screens/run.js";
```
Registry:
```js
const screens = { home, draft, coach, run };
```
Caso in `dispatch`:
```js
    case "resolveRound":
      state = resolveRound(state);
      break;
```
Passa `N` nel `ctx` (utile al meter):
```js
function ctx() {
  const N = state ? DIFFICULTIES[state.difficolta].N : null;
  return { state, cards, pool, draftView, N, dispatch, go };
}
```

- [ ] **Step 2: Implementa** `prototype/imbattuto/screens/run.js`

```js
// ctx: { state, N, dispatch }
export function render(ctx) {
  const { state, N } = ctx;
  const el = document.createElement("section");
  el.className = "screen run";

  // Meter del calore: N tacche, accese = vittorie
  const tacche = Array.from({ length: N }, (_, i) =>
    `<span class="tacca ${i < state.vittorie ? "on" : ""}"></span>`).join("");

  const avv = state.avversario;
  el.innerHTML = `
    <div class="meter" title="Vittorie di fila per l'imbattuto">
      <span class="meter-label display">SU ${N}</span>
      <div class="tacche">${tacche}</div>
    </div>
    <div class="tabellone">
      <div class="lato tuo">
        <span class="lato-nome display">Tu</span>
        <span class="lato-ovr">${state.voto.ovr}</span>
      </div>
      <span class="vs display">VS</span>
      <div class="lato loro">
        <span class="lato-nome display">${avv.team} ${avv.season}</span>
        <span class="lato-ovr">${avv.voto.ovr}</span>
      </div>
    </div>
    <p class="round-info">Round ${state.round}</p>
    <button class="cta" id="gioca">Gioca il round</button>
  `;
  el.querySelector("#gioca").onclick = () => ctx.dispatch({ type: "resolveRound" });
  return el;
}
```

- [ ] **Step 3: Verifica manuale (browser)**

Run: server attivo; completa draft + coach.
Expected: tabellone con il tuo OVR vs OVR avversario, meter "SU N" con tacche, round corrente. "Gioca il round": se vinci, tacca accesa, nuovo avversario (OVR più alto), round+1; se perdi o raggiungi N → placeholder "finito". La soglia avversari cresce round dopo round.

- [ ] **Step 4: Commit**

```bash
git add prototype/imbattuto/app.js prototype/imbattuto/screens/run.js
git commit -m "feat(proto): schermata Run con tabellone e meter del calore"
```

---

## Task 9: Schermata Esito (fine run)

**Files:**
- Create: `prototype/imbattuto/screens/esito.js`
- Modify: `prototype/imbattuto/app.js` (registra la schermata `finito`)

**Interfaces:**
- Consumes: `state.esito` (`"imbattuto"|"sconfitta"`), `state.vittorie`, `state.storia`.
- Produces: pulsanti che emettono `dispatch({type:"reset"})` (torna alla Home) e `go("leaderboard")`.

- [ ] **Step 1: Estendi** `app.js`

Import + registry (la chiave della schermata è lo `stato` del motore `"finito"`):
```js
import { render as esito } from "./screens/esito.js";
```
```js
const screens = { home, draft, coach, run, finito: esito };
```
Caso `reset` in `dispatch`:
```js
    case "reset":
      state = null; ui = "home"; draftView = null;
      break;
```

- [ ] **Step 2: Implementa** `prototype/imbattuto/screens/esito.js`

```js
// ctx: { state, dispatch, go }
export function render(ctx) {
  const { state } = ctx;
  const vinto = state.esito === "imbattuto";
  const el = document.createElement("section");
  el.className = `screen esito ${vinto ? "win" : "lose"}`;
  const righe = state.storia.map((h) =>
    `<li>Round ${h.round}: ${h.vinto ? "✓" : "✗"} ${h.tuo} vs ${h.loro} (${h.avversario})</li>`).join("");
  el.innerHTML = `
    <h1 class="display">${vinto ? "IMBATTUTO" : "SCONFITTA"}</h1>
    <p class="riepilogo">${state.vittorie} vittorie di fila</p>
    <ul class="storia">${righe}</ul>
    <div class="azioni">
      <button class="cta" id="leaderboard">Leaderboard</button>
      <button class="chip" id="ancora">Nuovo run</button>
    </div>
  `;
  el.querySelector("#ancora").onclick = () => ctx.dispatch({ type: "reset" });
  el.querySelector("#leaderboard").onclick = () => ctx.go("leaderboard");
  return el;
}
```

- [ ] **Step 3: Verifica manuale (browser)**

Run: server attivo; gioca un run fino alla fine (vinci N o perdi).
Expected: schermata IMBATTUTO o SCONFITTA con il riepilogo dei round (storia). "Nuovo run" torna alla Home; "Leaderboard" mostra il placeholder "leaderboard".

- [ ] **Step 4: Commit**

```bash
git add prototype/imbattuto/app.js prototype/imbattuto/screens/esito.js
git commit -m "feat(proto): schermata Esito con riepilogo del run"
```

---

## Task 10: Meta (localStorage) + schermata Leaderboard

**Files:**
- Create: `prototype/imbattuto/meta.js`
- Test: `prototype/imbattuto/meta.test.js`
- Create: `prototype/imbattuto/screens/leaderboard.js`
- Modify: `prototype/imbattuto/app.js` (salva il run finito + registra la schermata `leaderboard`)

**Interfaces:**
- Produces (`meta.js`, storage iniettabile per il test):
  - `recordRun(store, { formato, difficolta, vittorie, esito }) -> void` — accoda una run.
  - `leaderboard(store, formato, difficolta) -> Run[]` — le run di quel bucket, ordinate per `vittorie` desc.
  - `lifetimeStats(store) -> { runs, imbattuti, migliorStreak }`.
- Consumes in `app.js`: `recordRun` (al passaggio in `finito`), `leaderboard`/`lifetimeStats` (schermata).

- [ ] **Step 1: Scrivi il test (fallisce)** `prototype/imbattuto/meta.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { recordRun, leaderboard, lifetimeStats } from "./meta.js";

// finto localStorage: solo getItem/setItem su una Map
function fakeStore() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
}

test("recordRun + leaderboard: ordina per vittorie desc nel bucket", () => {
  const s = fakeStore();
  recordRun(s, { formato: "playoff", difficolta: "normale", vittorie: 3, esito: "sconfitta" });
  recordRun(s, { formato: "playoff", difficolta: "normale", vittorie: 6, esito: "imbattuto" });
  recordRun(s, { formato: "playoff", difficolta: "facile", vittorie: 4, esito: "imbattuto" });
  const lb = leaderboard(s, "playoff", "normale");
  assert.deepEqual(lb.map((r) => r.vittorie), [6, 3]); // solo il bucket normale, ordinato
});

test("lifetimeStats aggrega run/imbattuti/miglior streak", () => {
  const s = fakeStore();
  recordRun(s, { formato: "playoff", difficolta: "normale", vittorie: 3, esito: "sconfitta" });
  recordRun(s, { formato: "playoff", difficolta: "normale", vittorie: 6, esito: "imbattuto" });
  const st = lifetimeStats(s);
  assert.equal(st.runs, 2);
  assert.equal(st.imbattuti, 1);
  assert.equal(st.migliorStreak, 6);
});

test("leaderboard di un bucket vuoto è []", () => {
  assert.deepEqual(leaderboard(fakeStore(), "sfida", "incubo"), []);
});
```

- [ ] **Step 2: Lancia il test, deve fallire**

Run: `node --test prototype/imbattuto/meta.test.js`
Expected: FAIL con `Cannot find module './meta.js'`

- [ ] **Step 3: Implementa** `prototype/imbattuto/meta.js`

```js
const KEY = "imbattuto:runs";

function readAll(store) {
  const raw = store.getItem(KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}
function writeAll(store, runs) {
  store.setItem(KEY, JSON.stringify(runs));
}

export function recordRun(store, run) {
  const runs = readAll(store);
  runs.push({ ...run, ts: Date.now() });
  writeAll(store, runs);
}

export function leaderboard(store, formato, difficolta) {
  return readAll(store)
    .filter((r) => r.formato === formato && r.difficolta === difficolta)
    .sort((a, b) => b.vittorie - a.vittorie);
}

export function lifetimeStats(store) {
  const runs = readAll(store);
  return {
    runs: runs.length,
    imbattuti: runs.filter((r) => r.esito === "imbattuto").length,
    migliorStreak: runs.reduce((m, r) => Math.max(m, r.vittorie), 0),
  };
}
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `node --test prototype/imbattuto/meta.test.js`
Expected: PASS (3 test)

- [ ] **Step 5: Implementa** `prototype/imbattuto/screens/leaderboard.js`

```js
import { leaderboard, lifetimeStats } from "../meta.js";

// ctx: { state, dispatch, go }  — usa window.localStorage nel browser
export function render(ctx) {
  const store = window.localStorage;
  const st = lifetimeStats(store);
  // Se veniamo da un run finito, mostriamo il suo bucket; altrimenti un default.
  const formato = ctx.state?.formato ?? "playoff";
  const difficolta = ctx.state?.difficolta ?? "normale";
  const lb = leaderboard(store, formato, difficolta);

  const el = document.createElement("section");
  el.className = "screen leaderboard";
  const righe = lb.length
    ? lb.map((r, i) => `<li><span class="pos">${i + 1}</span> ${r.vittorie} vittorie · ${r.esito}</li>`).join("")
    : `<li class="vuoto">Ancora nessun run in questo bucket.</li>`;
  el.innerHTML = `
    <h1 class="display">Leaderboard</h1>
    <p class="bucket">${formato} · ${difficolta}</p>
    <ol class="classifica">${righe}</ol>
    <div class="lifetime">
      <span>Run: ${st.runs}</span><span>Imbattuti: ${st.imbattuti}</span><span>Miglior streak: ${st.migliorStreak}</span>
    </div>
    <button class="chip" id="home">Home</button>
  `;
  el.querySelector("#home").onclick = () => ctx.dispatch({ type: "reset" });
  return el;
}
```

- [ ] **Step 6: Estendi** `app.js` — salva il run e registra la schermata

Import:
```js
import { recordRun } from "./meta.js";
import { render as leaderboard } from "./screens/leaderboard.js";
```
Registry:
```js
const screens = { home, draft, coach, run, finito: esito, leaderboard };
```
Salva quando il run finisce: nel caso `resolveRound` del `dispatch`, dopo `state = resolveRound(state);` aggiungi:
```js
      if (state.stato === "finito") {
        recordRun(window.localStorage, {
          formato: state.formato, difficolta: state.difficolta,
          vittorie: state.vittorie, esito: state.esito,
        });
      }
```

- [ ] **Step 7: Verifica manuale (browser)**

Run: server attivo; gioca un paio di run interi, poi apri la Leaderboard.
Expected: la classifica del bucket (formato·difficoltà) ordinata per vittorie; le stats a vita (run/imbattuti/miglior streak) crescono tra un run e l'altro (persistono al refresh grazie a localStorage). "Home" torna all'inizio.

- [ ] **Step 8: Commit**

```bash
git add prototype/imbattuto/meta.js prototype/imbattuto/meta.test.js prototype/imbattuto/screens/leaderboard.js prototype/imbattuto/app.js
git commit -m "feat(proto): meta localStorage + schermata Leaderboard"
```

---

## Verifica finale

- [ ] Run: `node --test prototype/imbattuto/*.test.js` → verdi (derive, cards.smoke, pool, meta).
- [ ] Run: `node --test game/*.test.js` → i 38 test del motore restano verdi (nessuna regressione).
- [ ] Verifica manuale end-to-end nel browser: Home → Draft (5 turni, aiuti) → Coach → Run (più round, meter, soglia crescente) → Esito → Leaderboard. Un run intero senza errori console, sia vinto (imbattuto) sia perso.
- [ ] Le carte con attributi provvisori mostrano il badge; nessun dato finto non dichiarato.

---

## Self-Review (in fase di scrittura)

- **Copertura spec (prototipo-ui-design):** §4 architettura→Task 1/5 (scaffold+orchestratore, http.server, import motore); §5 schermate→Task 5-10 (una per schermata, variante mockup indicata); §6 dati blend→Task 2/3 (derive + build-cards, join per nome, estimated); §6 spin→Task 4/6 (pool.spin top-5 + filtro ruolo, ≥1 compatibile); §7 vero-vs-provvisorio→badge estimated + meta localStorage; §8 errori→spin lancia se nessun compatibile, badge provvisori, azione sconosciuta lancia; §9 DoD→Verifica finale. Fuori scope (dataset definitivo, motore Piano C) non incluso, come da §10.
- **Placeholder:** nessuno "TODO". I placeholder di render ("Schermata non ancora implementata") sono intenzionali e temporanei, sostituiti man mano dai task delle schermate; alla fine ogni `state.stato`/`ui` ha una schermata registrata.
- **Coerenza tipi/nomi:** `ctx` espone `{state, cards, pool, draftView, N, dispatch, go}`; ogni `screens/*.js` esporta `render(ctx)->HTMLElement`; le azioni `dispatch` (`newRun/spin/assign/aid/chooseCoach/resolveRound/reset`) sono tutte gestite nello `switch`. Le funzioni del motore usate (`newRun, draftPick, useAid, chooseCoach, startRun, resolveRound, buildHistoricalQuintets, pickOpponent`) e i loro campi di `State` (`quintetto, aids, stato, voto, avversario, vittorie, round, storia, esito, formato, difficolta`) corrispondono a Piano A.
- **Struttura carta:** `build-cards.mjs` produce esattamente i campi richiesti dal motore; lo smoke test lo verifica passando un quintetto reale a `teamRating`.

## Rischi noti per l'esecutore

- **Estetica da rifinire nel browser:** i task delle schermate danno struttura + wiring; palette/spaziatura/animazioni si limano guardando il prototipo (è lo scopo del mockup). Le classi CSS usate nelle schermate vanno stilizzate in `styles.css` (i task le nominano; lo styling di dettaglio è lavoro visivo iterativo con Tomas).
- **Sparsità per ruolo:** con `estimated` che copre tutte le 2412 carte buzzer, ogni team-stagione ha rosa completa; `spin` filtra comunque a chi ha ≥1 compatibile nei top-5. Se un ruolo risultasse raro, allargare i candidati oltre i top-5 è una modifica localizzata in `pool.js`.
- **Font display:** `styles.css` usa un condensato di sistema come fallback; il font reale della direzione (es. Barlow Condensed, già presente in nba-sim) si può incorporare nel prototipo in fase di rifinitura.
- **`cards.js` generato e committato:** se cambiano i dataset sorgente, rigenerare con `build-cards.mjs` e ricommittare.
