# L'IMBATTUTO — Motore di gioco (Piano A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire il motore di gioco puro (JavaScript, senza UI) della modalità L'IMBATTUTO: voto squadra + coach, assegnamento slot per ruolo, difficoltà/aiuti, pool avversari storici, macchina del run imbattuto (Approccio A).

**Architecture:** Moduli ES puri in `game/`, ognuno con una responsabilità, testati con il runner integrato di Node (`node --test`). Nessuna dipendenza esterna, nessun build. Le costanti della formula e i dati delle carte entrano come **parametri iniettati** (mai globali), così il motore è testabile con carte-fixture e non dipende né dai mockup (Piano B) né dall'esecuzione dello Step 2 dei dati.

**Tech Stack:** JavaScript ES modules, `node:test` + `node:assert/strict`. Nessuna libreria. Zero build.

## Global Constraints

- **Niente fallback silenzioso:** input non valido (slot occupato, ruolo incompatibile, meno di 5 candidati, carta senza attributi) → **eccezione chiara**, mai un valore finto/zero silenzioso.
- **Solo funzioni pure + stato esplicito:** nessun accesso a `window`, `localStorage`, DOM o `NBA_DATA` globale dentro il motore. Tutto passa per argomenti. (Persistenza e UI sono Piano C e Piano B.)
- **Esito round = Approccio A (deterministico):** si vince un round se e solo se `OVR_tuo ≥ OVR_avversario`. Nessuna varianza/RNG.
- **Ruoli fissi (ordine):** `ROLES = ["PG", "SG", "SF", "PF", "C"]`.
- **Pesi formula (fissi, da `data/team_refit.py`):** `WOFF = [1.4, 1.1, 1.2, 0.7, 0.8, 0.9, 0.9]`, `WDEF = [1.3, 1.3, 1.1, 1.1, 0.7]`.
- **Costanti manopola (default tarabili nel banco, iniettate come oggetto `K`):**
  `{ A: 0.6, AO: 13, BO: 0.6, DB: 75, SD: 6, mediaDefW: 52, ovrMix: 0.5 }`.
  Sono default ragionevoli (come da spec §14), **non** placeholder: il gioco gira con questi e si limano nel banco `59-formula-squadra`.
- **Modello voto (da `data/team_refit.py`, portato in JS):** per ogni carta
  `attP = ovr + A·(offW(att) − (AO + BO·ovr))`, `defP = DB + SD·(defW(def) − mediaDefW)`;
  squadra = media dei 5; `ovr = round(ovrMix·att + (1−ovrMix)·dif)`.
- **Struttura carta (sola lettura, prodotta dallo Step 2):**
  `{ player_id, name, season, team, ovr, pos:{primary, secondary|null}, att:[7], def:[5] }`.
  I test usano carte-fixture minime con questi campi.
- **Commit frequenti**, Conventional Commits, sul branch corrente. Il commit lo lancia l'esecutore; l'utente conferma il push separatamente.

---

## File Structure

- **Create** `game/package.json` — `{"type":"module"}`, per abilitare gli ES module in `game/`.
- **Create** `game/rating.js` — `offW`, `defW`, `teamRating` (modello voto squadra).
- **Create** `game/coach.js` — `applyCoach` (effetto voti OFF/DEF sul voto squadra).
- **Create** `game/roster.js` — `ROLES`, `canPlay`, `emptyQuintet`, `assign`, `isComplete`.
- **Create** `game/difficulty.js` — `DIFFICULTIES` (aiuti, N, scala avversari per livello).
- **Create** `game/opponents.js` — `buildHistoricalQuintets`, `pickOpponent`.
- **Create** `game/run.js` — macchina del run: `newRun`, `draftPick`, `useAid`, `chooseCoach`, `startRun`, `resolveRound`.
- **Create** i test affiancati: `game/rating.test.js`, `game/coach.test.js`, `game/roster.test.js`, `game/difficulty.test.js`, `game/opponents.test.js`, `game/run.test.js`.
- **Create** `game/fixtures.js` — helper `card(over)` per generare carte-fixture nei test.

Comando test globale: `node --test game/`

---

## Task 1: Modello voto squadra (rating)

**Files:**
- Create: `game/package.json`
- Create: `game/rating.js`
- Create: `game/fixtures.js`
- Test: `game/rating.test.js`

**Interfaces:**
- Produces:
  - `WOFF: number[]`, `WDEF: number[]`, `DEFAULT_K: object`.
  - `offW(att: number[]) -> number`, `defW(def: number[]) -> number`.
  - `teamRating(cards: Card[], k = DEFAULT_K) -> { att: number, dif: number, ovr: number }`.
  - fixtures: `card(over = {}) -> Card`.

- [ ] **Step 1: Crea** `game/package.json`

```json
{
  "type": "module",
  "private": true
}
```

- [ ] **Step 2: Crea** `game/fixtures.js`

```js
// Carta-fixture minima per i test del motore. Override via `over`.
export function card(over = {}) {
  return {
    player_id: over.player_id ?? "test-player",
    name: over.name ?? "Test Player",
    season: over.season ?? "2015-16",
    team: over.team ?? "GSW",
    ovr: over.ovr ?? 80,
    pos: over.pos ?? { primary: "PG", secondary: null },
    att: over.att ?? [70, 70, 70, 70, 70, 70, 70],
    def: over.def ?? [70, 70, 70, 70, 70],
  };
}
```

- [ ] **Step 3: Scrivi il test (fallisce)** `game/rating.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { offW, defW, teamRating, WOFF, WDEF, DEFAULT_K } from "./rating.js";
import { card } from "./fixtures.js";

test("offW è la media pesata nota", () => {
  const att = [99, 0, 0, 0, 0, 0, 0]; // solo tiro da 3
  const sumW = WOFF.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(offW(att) - (99 * WOFF[0]) / sumW) < 1e-9);
});

test("defW è la media pesata nota", () => {
  const def = [0, 99, 0, 0, 0]; // solo dif. interna
  const sumW = WDEF.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(defW(def) - (99 * WDEF[1]) / sumW) < 1e-9);
});

test("teamRating restituisce att/dif/ovr interi in range", () => {
  const five = [card(), card(), card(), card(), card()];
  const r = teamRating(five);
  for (const key of ["att", "dif", "ovr"]) {
    assert.ok(Number.isInteger(r[key]), `${key} intero`);
    assert.ok(r[key] >= 0 && r[key] <= 120, `${key} in range`);
  }
});

test("squadra migliore ha ovr più alto di squadra scarsa", () => {
  const forte = Array.from({ length: 5 }, () => card({ ovr: 95, att: [95,95,95,95,95,95,95], def: [95,95,95,95,95] }));
  const scarsa = Array.from({ length: 5 }, () => card({ ovr: 65, att: [60,60,60,60,60,60,60], def: [60,60,60,60,60] }));
  assert.ok(teamRating(forte).ovr > teamRating(scarsa).ovr);
});

test("teamRating con costanti custom usa ovrMix", () => {
  const five = [card(), card(), card(), card(), card()];
  const soloAtt = teamRating(five, { ...DEFAULT_K, ovrMix: 1 });
  assert.equal(soloAtt.ovr, soloAtt.att);
});
```

- [ ] **Step 4: Lancia il test, deve fallire**

Run: `node --test game/rating.test.js`
Expected: FAIL con `Cannot find module './rating.js'`

- [ ] **Step 5: Implementa** `game/rating.js`

```js
// Modello voto squadra (asimmetrico), portato da data/team_refit.py.
// I pesi sono fissi; le costanti K sono manopole tarabili nel banco.
export const WOFF = [1.4, 1.1, 1.2, 0.7, 0.8, 0.9, 0.9];
export const WDEF = [1.3, 1.3, 1.1, 1.1, 0.7];

export const DEFAULT_K = { A: 0.6, AO: 13, BO: 0.6, DB: 75, SD: 6, mediaDefW: 52, ovrMix: 0.5 };

function wmean(values, weights) {
  let num = 0, den = 0;
  for (let i = 0; i < weights.length; i++) {
    num += values[i] * weights[i];
    den += weights[i];
  }
  return num / den;
}

export function offW(att) {
  return wmean(att, WOFF);
}

export function defW(def) {
  return wmean(def, WDEF);
}

// Voto di un singolo giocatore (interno).
function playerAtt(c, k) {
  return c.ovr + k.A * (offW(c.att) - (k.AO + k.BO * c.ovr));
}
function playerDef(c, k) {
  return k.DB + k.SD * (defW(c.def) - k.mediaDefW);
}

export function teamRating(cards, k = DEFAULT_K) {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("teamRating: servono almeno una carta");
  }
  const n = cards.length;
  const att = cards.reduce((s, c) => s + playerAtt(c, k), 0) / n;
  const dif = cards.reduce((s, c) => s + playerDef(c, k), 0) / n;
  const ovr = k.ovrMix * att + (1 - k.ovrMix) * dif;
  return { att: Math.round(att), dif: Math.round(dif), ovr: Math.round(ovr) };
}
```

- [ ] **Step 6: Lancia i test, devono passare**

Run: `node --test game/rating.test.js`
Expected: PASS (5 test)

- [ ] **Step 7: Commit**

```bash
git add game/package.json game/rating.js game/fixtures.js game/rating.test.js
git commit -m "feat(imbattuto): modello voto squadra (rating)"
```

---

## Task 2: Effetto del coach sul voto squadra

**Files:**
- Create: `game/coach.js`
- Test: `game/coach.test.js`

**Interfaces:**
- Consumes: `teamRating` output `{att, dif, ovr}`, `DEFAULT_K.ovrMix`.
- Produces:
  - `GRADE_MULT: object` (A..F → moltiplicatore).
  - `applyCoach(rating: {att,dif,ovr}, coach: {off_grade, def_grade, champ_bonus?}, k = DEFAULT_K) -> {att,dif,ovr}`.

- [ ] **Step 1: Scrivi il test (fallisce)** `game/coach.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCoach, GRADE_MULT } from "./coach.js";

const base = { att: 80, dif: 80, ovr: 80 };

test("coach OFF 'A' alza l'attacco, DEF 'C' lascia la difesa", () => {
  const r = applyCoach(base, { off_grade: "A", def_grade: "C" });
  assert.ok(r.att > base.att);
  assert.equal(r.dif, Math.round(80 * GRADE_MULT.C));
});

test("coach DEF 'A' alza la difesa", () => {
  const r = applyCoach(base, { off_grade: "C", def_grade: "A" });
  assert.ok(r.dif > base.dif);
});

test("coach 'F' abbassa il lato corrispondente", () => {
  const r = applyCoach(base, { off_grade: "F", def_grade: "F" });
  assert.ok(r.att < base.att && r.dif < base.dif);
});

test("champ_bonus si somma all'ovr", () => {
  const senza = applyCoach(base, { off_grade: "C", def_grade: "C", champ_bonus: 0 });
  const con = applyCoach(base, { off_grade: "C", def_grade: "C", champ_bonus: 3 });
  assert.equal(con.ovr - senza.ovr, 3);
});

test("ovr resta coerente con att/dif dopo il coach", () => {
  const r = applyCoach(base, { off_grade: "A", def_grade: "A" });
  assert.equal(r.ovr, Math.round(0.5 * r.att + 0.5 * r.dif));
});
```

- [ ] **Step 2: Lancia il test, deve fallire**

Run: `node --test game/coach.test.js`
Expected: FAIL con `Cannot find module './coach.js'`

- [ ] **Step 3: Implementa** `game/coach.js`

```js
import { DEFAULT_K } from "./rating.js";

// Curva voti coach A..F → moltiplicatore sul lato del campo. Default tarabili.
export const GRADE_MULT = { A: 1.06, B: 1.03, C: 1.0, D: 0.97, E: 0.94, F: 0.91 };

function mult(grade) {
  const m = GRADE_MULT[grade];
  if (m === undefined) throw new Error(`Voto coach non valido: ${grade}`);
  return m;
}

// Applica l'effetto del coach a un voto squadra già calcolato.
export function applyCoach(rating, coach, k = DEFAULT_K) {
  const att = rating.att * mult(coach.off_grade);
  const dif = rating.dif * mult(coach.def_grade);
  const bonus = coach.champ_bonus ?? 0;
  const ovr = k.ovrMix * att + (1 - k.ovrMix) * dif + bonus;
  return { att: Math.round(att), dif: Math.round(dif), ovr: Math.round(ovr) };
}
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `node --test game/coach.test.js`
Expected: PASS (5 test)

- [ ] **Step 5: Commit**

```bash
git add game/coach.js game/coach.test.js
git commit -m "feat(imbattuto): effetto coach OFF/DEF sul voto squadra"
```

---

## Task 3: Assegnamento slot per ruolo (roster)

**Files:**
- Create: `game/roster.js`
- Test: `game/roster.test.js`

**Interfaces:**
- Produces:
  - `ROLES: string[]`.
  - `canPlay(card, role) -> boolean`.
  - `emptyQuintet() -> { PG:null, SG:null, SF:null, PF:null, C:null }`.
  - `assign(quintet, role, card) -> quintet` (nuovo oggetto; **throw** se ruolo occupato o carta incompatibile).
  - `isComplete(quintet) -> boolean`.

- [ ] **Step 1: Scrivi il test (fallisce)** `game/roster.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { ROLES, canPlay, emptyQuintet, assign, isComplete } from "./roster.js";
import { card } from "./fixtures.js";

test("ROLES sono i 5 ruoli in ordine", () => {
  assert.deepEqual(ROLES, ["PG", "SG", "SF", "PF", "C"]);
});

test("canPlay accetta primaria e secondaria", () => {
  const c = card({ pos: { primary: "SG", secondary: "PG" } });
  assert.equal(canPlay(c, "SG"), true);
  assert.equal(canPlay(c, "PG"), true);
  assert.equal(canPlay(c, "C"), false);
});

test("assign riempie uno slot compatibile", () => {
  const q = assign(emptyQuintet(), "PG", card({ pos: { primary: "PG", secondary: null } }));
  assert.equal(q.PG.name, "Test Player");
});

test("assign su ruolo incompatibile lancia (niente fuori ruolo silenzioso)", () => {
  const c = card({ pos: { primary: "C", secondary: null } });
  assert.throws(() => assign(emptyQuintet(), "PG", c), /incompatibile/);
});

test("assign su slot già occupato lancia", () => {
  const q = assign(emptyQuintet(), "PG", card({ pos: { primary: "PG", secondary: null } }));
  assert.throws(() => assign(q, "PG", card({ pos: { primary: "PG", secondary: null } })), /occupato/);
});

test("isComplete vero solo con tutti e 5 gli slot pieni", () => {
  let q = emptyQuintet();
  assert.equal(isComplete(q), false);
  for (const role of ROLES) q = assign(q, role, card({ pos: { primary: role, secondary: null } }));
  assert.equal(isComplete(q), true);
});
```

- [ ] **Step 2: Lancia il test, deve fallire**

Run: `node --test game/roster.test.js`
Expected: FAIL con `Cannot find module './roster.js'`

- [ ] **Step 3: Implementa** `game/roster.js`

```js
export const ROLES = ["PG", "SG", "SF", "PF", "C"];

export function canPlay(card, role) {
  return card.pos.primary === role || card.pos.secondary === role;
}

export function emptyQuintet() {
  return { PG: null, SG: null, SF: null, PF: null, C: null };
}

export function assign(quintet, role, card) {
  if (!ROLES.includes(role)) throw new Error(`Ruolo inesistente: ${role}`);
  if (quintet[role] !== null) throw new Error(`Slot ${role} già occupato`);
  if (!canPlay(card, role)) throw new Error(`Carta incompatibile con ${role}`);
  return { ...quintet, [role]: card };
}

export function isComplete(quintet) {
  return ROLES.every((role) => quintet[role] !== null);
}
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `node --test game/roster.test.js`
Expected: PASS (6 test)

- [ ] **Step 5: Commit**

```bash
git add game/roster.js game/roster.test.js
git commit -m "feat(imbattuto): assegnamento slot per ruolo (roster)"
```

---

## Task 4: Difficoltà e aiuti

**Files:**
- Create: `game/difficulty.js`
- Test: `game/difficulty.test.js`

**Interfaces:**
- Produces:
  - `DIFFICULTIES: { facile, normale, difficile, incubo }` dove ogni livello è
    `{ aids: { squadra, stagione, respin }, freeSwitch: boolean, N: number, oppMin: number, oppMax: number }`.
    `aids` = numero di aiuti; `freeSwitch:true` (solo Facile) = switch squadra/stagione illimitati;
    `N` = vittorie di fila per l'imbattuto; `oppMin/oppMax` = banda OVR avversari del bracket.

- [ ] **Step 1: Scrivi il test (fallisce)** `game/difficulty.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { DIFFICULTIES } from "./difficulty.js";

test("esistono i 4 livelli", () => {
  assert.deepEqual(Object.keys(DIFFICULTIES), ["facile", "normale", "difficile", "incubo"]);
});

test("ogni livello ha aiuti, N e banda avversari coerenti", () => {
  for (const key of Object.keys(DIFFICULTIES)) {
    const d = DIFFICULTIES[key];
    assert.ok(d.N >= 1, `${key}: N ≥ 1`);
    assert.ok(d.oppMax >= d.oppMin, `${key}: banda avversari valida`);
    for (const a of ["squadra", "stagione", "respin"]) {
      assert.ok(Number.isInteger(d.aids[a]) && d.aids[a] >= 0, `${key}: aids.${a}`);
    }
  }
});

test("Incubo ha zero aiuti e nessuno switch libero", () => {
  const inc = DIFFICULTIES.incubo;
  assert.deepEqual(inc.aids, { squadra: 0, stagione: 0, respin: 0 });
  assert.equal(inc.freeSwitch, false);
});

test("Facile ha switch liberi", () => {
  assert.equal(DIFFICULTIES.facile.freeSwitch, true);
});

test("la difficoltà cresce: N e banda avversari non calano", () => {
  const order = ["facile", "normale", "difficile", "incubo"];
  for (let i = 1; i < order.length; i++) {
    assert.ok(DIFFICULTIES[order[i]].N >= DIFFICULTIES[order[i - 1]].N);
    assert.ok(DIFFICULTIES[order[i]].oppMax >= DIFFICULTIES[order[i - 1]].oppMax);
  }
});
```

- [ ] **Step 2: Lancia il test, deve fallire**

Run: `node --test game/difficulty.test.js`
Expected: FAIL con `Cannot find module './difficulty.js'`

- [ ] **Step 3: Implementa** `game/difficulty.js`

```js
// Configurazione dei 4 livelli. Numeri = default tarabili nel banco.
export const DIFFICULTIES = {
  facile:    { aids: { squadra: 3, stagione: 3, respin: 2 }, freeSwitch: true,  N: 4,  oppMin: 70, oppMax: 82 },
  normale:   { aids: { squadra: 2, stagione: 2, respin: 1 }, freeSwitch: false, N: 6,  oppMin: 76, oppMax: 88 },
  difficile: { aids: { squadra: 1, stagione: 1, respin: 0 }, freeSwitch: false, N: 8,  oppMin: 82, oppMax: 93 },
  incubo:    { aids: { squadra: 0, stagione: 0, respin: 0 }, freeSwitch: false, N: 10, oppMin: 88, oppMax: 99 },
};
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `node --test game/difficulty.test.js`
Expected: PASS (5 test)

- [ ] **Step 5: Commit**

```bash
git add game/difficulty.js game/difficulty.test.js
git commit -m "feat(imbattuto): configurazione difficoltà e aiuti"
```

---

## Task 5: Pool avversari storici

**Files:**
- Create: `game/opponents.js`
- Test: `game/opponents.test.js`

**Interfaces:**
- Consumes: `teamRating`, carte (struttura Global Constraints).
- Produces:
  - `buildHistoricalQuintets(cardsByTeamSeason, k?) -> Opponent[]` dove
    `cardsByTeamSeason: { "GSW|2015-16": Card[], ... }` e
    `Opponent = { team, season, quintet: Card[5], voto: {att,dif,ovr} }`.
    Salta i gruppi con meno di 5 carte (niente quintetto finto). Prende i 5 di OVR più alto.
  - `pickOpponent(pool, round, difficulty) -> Opponent` — sceglie in modo **deterministico**
    l'avversario il cui `voto.ovr` è più vicino alla soglia del round
    `oppMin + (oppMax − oppMin) · (round − 1) / max(N − 1, 1)`.

- [ ] **Step 1: Scrivi il test (fallisce)** `game/opponents.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHistoricalQuintets, pickOpponent } from "./opponents.js";
import { DIFFICULTIES } from "./difficulty.js";
import { card } from "./fixtures.js";

function team(over, n) {
  return Array.from({ length: n }, (_, i) => card({ ...over, ovr: (over.ovr ?? 80) - i }));
}

test("costruisce un quintetto (top-5 OVR) per ogni team-stagione con almeno 5 carte", () => {
  const src = {
    "GSW|2015-16": team({ team: "GSW" }, 7),
    "LAL|2015-16": team({ team: "LAL", ovr: 70 }, 5),
  };
  const pool = buildHistoricalQuintets(src);
  assert.equal(pool.length, 2);
  const gsw = pool.find((o) => o.team === "GSW");
  assert.equal(gsw.quintet.length, 5);
  assert.ok(gsw.voto.ovr > 0);
});

test("salta i gruppi con meno di 5 carte (niente quintetto finto)", () => {
  const src = { "MIA|2015-16": team({ team: "MIA" }, 4) };
  assert.deepEqual(buildHistoricalQuintets(src), []);
});

test("il quintetto prende i 5 OVR più alti", () => {
  const src = { "GSW|2015-16": team({ team: "GSW", ovr: 90 }, 8) };
  const [gsw] = buildHistoricalQuintets(src);
  const ovrs = gsw.quintet.map((c) => c.ovr).sort((a, b) => b - a);
  assert.deepEqual(ovrs, [90, 89, 88, 87, 86]);
});

test("pickOpponent sceglie il voto più vicino alla soglia crescente del round", () => {
  const pool = [
    { team: "A", season: "x", quintet: [], voto: { att: 0, dif: 0, ovr: 72 } },
    { team: "B", season: "x", quintet: [], voto: { att: 0, dif: 0, ovr: 88 } },
    { team: "C", season: "x", quintet: [], voto: { att: 0, dif: 0, ovr: 99 } },
  ];
  const d = DIFFICULTIES.incubo; // oppMin 88, oppMax 99, N 10
  const primo = pickOpponent(pool, 1, d);   // soglia = 88 → B
  const ultimo = pickOpponent(pool, 10, d);  // soglia = 99 → C
  assert.equal(primo.team, "B");
  assert.equal(ultimo.team, "C");
});
```

- [ ] **Step 2: Lancia il test, deve fallire**

Run: `node --test game/opponents.test.js`
Expected: FAIL con `Cannot find module './opponents.js'`

- [ ] **Step 3: Implementa** `game/opponents.js`

```js
import { teamRating, DEFAULT_K } from "./rating.js";

// Da { "TEAM|SEASON": Card[] } → lista di avversari (top-5 OVR) valutati.
export function buildHistoricalQuintets(cardsByTeamSeason, k = DEFAULT_K) {
  const out = [];
  for (const [key, cards] of Object.entries(cardsByTeamSeason)) {
    if (!Array.isArray(cards) || cards.length < 5) continue; // niente quintetto finto
    const quintet = [...cards].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
    const [team, season] = key.split("|");
    out.push({ team, season, quintet, voto: teamRating(quintet, k) });
  }
  return out;
}

// Soglia OVR del round: cresce linearmente da oppMin (round 1) a oppMax (round N).
function roundThreshold(round, d) {
  const span = Math.max(d.N - 1, 1);
  return d.oppMin + (d.oppMax - d.oppMin) * ((round - 1) / span);
}

// Avversario col voto.ovr più vicino alla soglia del round (deterministico).
export function pickOpponent(pool, round, d) {
  if (!pool.length) throw new Error("pickOpponent: pool avversari vuoto");
  const target = roundThreshold(round, d);
  let best = pool[0];
  let bestDist = Math.abs(best.voto.ovr - target);
  for (const o of pool) {
    const dist = Math.abs(o.voto.ovr - target);
    if (dist < bestDist) { best = o; bestDist = dist; }
  }
  return best;
}
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `node --test game/opponents.test.js`
Expected: PASS (4 test)

- [ ] **Step 5: Commit**

```bash
git add game/opponents.js game/opponents.test.js
git commit -m "feat(imbattuto): pool avversari storici e scelta per round"
```

---

## Task 6: Macchina del run imbattuto

**Files:**
- Create: `game/run.js`
- Test: `game/run.test.js`

**Interfaces:**
- Consumes: `emptyQuintet`, `assign`, `isComplete`, `ROLES`, `teamRating`, `applyCoach`,
  `pickOpponent`, `DIFFICULTIES`, `DEFAULT_K`.
- Produces (tutte pure: prendono `state`, ritornano **nuovo** `state`):
  - `newRun({ formato, difficolta, k? }) -> State`.
  - `draftPick(state, role, card) -> State` (assegna; **throw** se non in fase "draft").
  - `useAid(state, type) -> State` (`type` ∈ `squadra|stagione|respin`; **throw** se esauriti e non freeSwitch).
  - `chooseCoach(state, coach) -> State` (**throw** se quintetto incompleto).
  - `startRun(state, pool) -> State` (**throw** se manca coach; calcola voto squadra, primo avversario, `stato="run"`).
  - `resolveRound(state) -> State` (Approccio A; aggiorna `vittorie`, `stato`, `esito`).
- `State = { formato, difficolta, k, quintetto, coach, aids, round, vittorie, avversario, voto, stato, esito, storia }`
  con `stato ∈ "draft"|"coach"|"run"|"finito"` ed `esito ∈ null|"imbattuto"|"sconfitta"`.

- [ ] **Step 1: Scrivi il test (fallisce)** `game/run.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { newRun, draftPick, useAid, chooseCoach, startRun, resolveRound } from "./run.js";
import { ROLES } from "./roster.js";
import { card } from "./fixtures.js";

function fullDraft(state, ovr = 80) {
  for (const role of ROLES) {
    state = draftPick(state, role, card({ pos: { primary: role, secondary: null }, ovr,
      att: [ovr,ovr,ovr,ovr,ovr,ovr,ovr], def: [ovr,ovr,ovr,ovr,ovr] }));
  }
  return state;
}
const COACH = { off_grade: "C", def_grade: "C" };

function poolAt(ovr) {
  return [{ team: "OPP", season: "x", quintet: [], voto: { att: ovr, dif: ovr, ovr } }];
}

test("newRun parte in fase draft con aiuti della difficoltà", () => {
  const s = newRun({ formato: "playoff", difficolta: "normale" });
  assert.equal(s.stato, "draft");
  assert.equal(s.vittorie, 0);
  assert.equal(s.aids.respin, 1);
});

test("draftPick riempie gli slot; a 5 passa in fase coach", () => {
  let s = newRun({ formato: "playoff", difficolta: "normale" });
  s = fullDraft(s);
  assert.equal(s.stato, "coach");
});

test("useAid consuma un aiuto; se esaurito e non freeSwitch lancia", () => {
  let s = newRun({ formato: "playoff", difficolta: "difficile" }); // respin 0, squadra 1
  s = useAid(s, "squadra");
  assert.equal(s.aids.squadra, 0);
  assert.throws(() => useAid(s, "squadra"), /esaurit/);
});

test("Facile: switch liberi non si esauriscono", () => {
  let s = newRun({ formato: "playoff", difficolta: "facile" });
  for (let i = 0; i < 9; i++) s = useAid(s, "squadra");
  assert.ok(s.aids.squadra >= 0);
});

test("chooseCoach prima del quintetto completo lancia", () => {
  const s = newRun({ formato: "playoff", difficolta: "normale" });
  assert.throws(() => chooseCoach(s, COACH), /incompleto/);
});

test("startRun calcola il voto squadra e il primo avversario", () => {
  let s = fullDraft(newRun({ formato: "playoff", difficolta: "normale" }));
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(70));
  assert.equal(s.stato, "run");
  assert.equal(s.round, 1);
  assert.ok(s.voto.ovr > 0);
  assert.equal(s.avversario.team, "OPP");
});

test("resolveRound: vinco se voto ≥ avversario, la streak sale", () => {
  let s = fullDraft(newRun({ formato: "playoff", difficolta: "normale" }), 90);
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(60));
  s = resolveRound(s);
  assert.equal(s.vittorie, 1);
});

test("resolveRound: perdo se voto < avversario → run finito, sconfitta", () => {
  let s = fullDraft(newRun({ formato: "playoff", difficolta: "normale" }), 60);
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(99));
  s = resolveRound(s);
  assert.equal(s.stato, "finito");
  assert.equal(s.esito, "sconfitta");
});

test("raggiungere N vittorie chiude come imbattuto", () => {
  let s = fullDraft(newRun({ formato: "playoff", difficolta: "normale" }), 99); // N = 6
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(50));
  for (let i = 0; i < 6; i++) s = resolveRound(s);
  assert.equal(s.stato, "finito");
  assert.equal(s.esito, "imbattuto");
  assert.equal(s.vittorie, 6);
});
```

- [ ] **Step 2: Lancia il test, deve fallire**

Run: `node --test game/run.test.js`
Expected: FAIL con `Cannot find module './run.js'`

- [ ] **Step 3: Implementa** `game/run.js`

```js
import { emptyQuintet, assign, isComplete, ROLES } from "./roster.js";
import { teamRating, DEFAULT_K } from "./rating.js";
import { applyCoach } from "./coach.js";
import { pickOpponent } from "./opponents.js";
import { DIFFICULTIES } from "./difficulty.js";

export function newRun({ formato, difficolta, k = DEFAULT_K }) {
  const d = DIFFICULTIES[difficolta];
  if (!d) throw new Error(`Difficoltà inesistente: ${difficolta}`);
  return {
    formato, difficolta, k,
    quintetto: emptyQuintet(),
    coach: null,
    aids: { ...d.aids },
    round: 0,
    vittorie: 0,
    avversario: null,
    voto: null,
    stato: "draft",
    esito: null,
    storia: [],
  };
}

export function draftPick(state, role, card) {
  if (state.stato !== "draft") throw new Error("draftPick: non in fase draft");
  const quintetto = assign(state.quintetto, role, card);
  const stato = isComplete(quintetto) ? "coach" : "draft";
  return { ...state, quintetto, stato };
}

export function useAid(state, type) {
  const d = DIFFICULTIES[state.difficolta];
  if (d.freeSwitch && (type === "squadra" || type === "stagione")) {
    return state; // switch illimitati in Facile
  }
  if (state.aids[type] <= 0) throw new Error(`Aiuto '${type}' esaurito`);
  return { ...state, aids: { ...state.aids, [type]: state.aids[type] - 1 } };
}

export function chooseCoach(state, coach) {
  if (!isComplete(state.quintetto)) throw new Error("chooseCoach: quintetto incompleto");
  return { ...state, coach, stato: "coach" };
}

export function startRun(state, pool) {
  if (!state.coach) throw new Error("startRun: manca il coach");
  const cards = ROLES.map((r) => state.quintetto[r]);
  const voto = applyCoach(teamRating(cards, state.k), state.coach, state.k);
  const d = DIFFICULTIES[state.difficolta];
  const round = 1;
  const avversario = pickOpponent(pool, round, d);
  return { ...state, voto, round, avversario, pool, stato: "run" };
}

export function resolveRound(state) {
  if (state.stato !== "run") throw new Error("resolveRound: run non attivo");
  const d = DIFFICULTIES[state.difficolta];
  const vinto = state.voto.ovr >= state.avversario.voto.ovr;
  const storia = [...state.storia, {
    round: state.round, avversario: state.avversario.team, vinto,
    tuo: state.voto.ovr, loro: state.avversario.voto.ovr,
  }];
  if (!vinto) {
    return { ...state, storia, stato: "finito", esito: "sconfitta" };
  }
  const vittorie = state.vittorie + 1;
  if (vittorie >= d.N) {
    return { ...state, storia, vittorie, stato: "finito", esito: "imbattuto" };
  }
  const round = state.round + 1;
  const avversario = pickOpponent(state.pool, round, d);
  return { ...state, storia, vittorie, round, avversario };
}
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `node --test game/run.test.js`
Expected: PASS (9 test)

- [ ] **Step 5: Commit**

```bash
git add game/run.js game/run.test.js
git commit -m "feat(imbattuto): macchina del run (draft, coach, bracket, esito)"
```

---

## Verifica finale (tutta la suite del motore)

- [ ] Run: `node --test game/` → tutti verdi (rating, coach, roster, difficulty, opponents, run).
- [ ] Run: `python -m pytest -q` → i 20 test dello Step 1 restano verdi (nessuna regressione: il motore JS è separato dalla pipeline Python).

---

## Self-Review (eseguito in fase di scrittura)

- **Copertura spec:** §5.1 struttura carta→fixtures; §5.2 slot→Task 3; §5.3 coach→Task 2; §5.4 stato run→Task 6; §5.5 avversario→Task 5; §6 motore voto+coach+Approccio A→Task 1/2/6; §7 difficoltà/aiuti→Task 4/6; §8 formati→campo `formato` in `newRun` (la logica specifica per-formato — pool e vincoli — entra col Piano B/dati); §11 errori→throw in ogni task; §12 testing→ogni task in TDD. Fuori da questo piano (per design): §9 meta/leaderboard (Piano C), §10 UI (Piano B).
- **Placeholder:** nessuno. Le costanti `K`, i moltiplicatori coach e i numeri di `DIFFICULTIES` sono **default tarabili** dichiarati (spec §14), non TODO.
- **Coerenza tipi:** `teamRating`→`{att,dif,ovr}` consumato da `applyCoach` e `startRun`; `Opponent.voto.ovr` usato in `pickOpponent`/`resolveRound`; `quintetto` chiavi `PG..C` prodotte da `emptyQuintet`/`assign` e lette in `startRun` via `ROLES`. Coerenti.

## Rischi noti per l'esecutore

- I default di `K`/coach/difficoltà danno un bilanciamento "circa giusto": la taratura fine è lavoro da banco (Piano B), non un bug al primo giro.
- `startRun` memorizza `pool` nello stato per i round successivi: è di proposito (il bracket riusa lo stesso pool). Quando arriverà il Piano C (persistenza), valutare se serializzare o ricostruire il pool.
- Il campo `formato` qui è solo trasportato: le differenze reali fra Playoff/Stagione/Sfida (dimensione bracket, vincoli) si concretizzano quando si collegano i dati veri e la UI.
```
