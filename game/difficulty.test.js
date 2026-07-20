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
