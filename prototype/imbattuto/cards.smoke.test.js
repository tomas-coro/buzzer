import { test } from "node:test";
import assert from "node:assert/strict";
import { CARDS_BY_TEAM_SEASON, ALL_CARDS } from "./cards.js";
import { teamRating } from "../../game/rating.js";

test("ci sono carte e team-stagione", () => {
  assert.ok(ALL_CARDS.length > 100);
  assert.ok(Object.keys(CARDS_BY_TEAM_SEASON).length > 20);
});

test("ogni carta ha la struttura richiesta dal motore", () => {
  const STAT_KEYS = ["pts", "reb", "ast", "stl", "blk", "fg_pct", "tp_pct", "ft_pct"];
  for (const c of ALL_CARDS.slice(0, 200)) {
    assert.ok(Number.isFinite(c.ovr), `${c.name} ovr`);
    assert.ok(c.stats_real, `${c.name} stats_real`);
    for (const k of STAT_KEYS) assert.ok(c.stats_real[k] != null, `${c.name} ${k}`);
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
