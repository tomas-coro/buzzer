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
