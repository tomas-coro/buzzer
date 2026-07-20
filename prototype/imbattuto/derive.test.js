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
