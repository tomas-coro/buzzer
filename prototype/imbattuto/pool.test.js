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
