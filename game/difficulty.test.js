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

test("il target è sempre 16-0, in ogni difficoltà", () => {
  for (const key of Object.keys(DIFFICULTIES)) {
    assert.equal(DIFFICULTIES[key].N, 16, `${key}: N deve essere 16`);
  }
});

test("la difficoltà cresce: la banda avversari non cala (N resta costante)", () => {
  const order = ["facile", "normale", "difficile", "incubo"];
  for (let i = 1; i < order.length; i++) {
    assert.ok(DIFFICULTIES[order[i]].oppMax >= DIFFICULTIES[order[i - 1]].oppMax);
  }
  // L'ultimo livello deve stringere anche in partenza, non solo all'arrivo:
  // in Incubo la prima partita è già seria.
  assert.ok(DIFFICULTIES.incubo.oppMin > DIFFICULTIES.facile.oppMin);
});

// I 180 quintetti storici stanno tra 40 e 74 sulla scala nativa del voto. Soglie
// fuori da lì non sono "difficili": sono rotte, perché pickOpponent finirebbe per
// pescare sempre lo stesso quintetto - è esattamente quello che è successo quando
// il voto è passato dagli overall 2K ai reparti e le soglie sono rimaste a 70-99.
// La taratura vera si rifà con `node tools/banco-corse.mjs`.
test("le soglie stanno dentro l'intervallo reale dei quintetti storici", () => {
  const POOL_MIN = 40;
  const POOL_MAX = 74;
  for (const [key, d] of Object.entries(DIFFICULTIES)) {
    assert.ok(d.oppMin >= POOL_MIN, `${key}: oppMin ${d.oppMin} sotto il pool (${POOL_MIN})`);
    assert.ok(d.oppMax <= POOL_MAX, `${key}: oppMax ${d.oppMax} sopra il pool (${POOL_MAX})`);
    assert.ok(d.oppMax - d.oppMin >= 15,
      `${key}: banda di ${d.oppMax - d.oppMin} punti, la corsa non ha una rampa`);
  }
});
