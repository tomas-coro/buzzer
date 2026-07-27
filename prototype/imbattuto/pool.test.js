import { test } from "node:test";
import assert from "node:assert/strict";
import { topFive, spinRoster, opponentPool } from "./pool.js";

// fixture: carte con ruolo noto
function card(name, ovr, primary, secondary = null, season = "2015-16", team = "X") {
  return { player_id: name, name, season, team, team_abbr: team, ovr,
    pos: { primary, secondary }, att: [70,70,70,70,70,70,70], def: [52,52,52,52,52], estimated: false };
}
const KEY = "X|2015-16";
const byKey = {
  [KEY]: [
    card("PG1", 90, "PG"), card("SG1", 88, "SG"), card("SF1", 86, "SF"),
    card("PF1", 84, "PF"), card("C1", 82, "C"), card("PG2", 60, "PG"),
  ],
};
const ALL_ROLES = ["PG", "SG", "SF", "PF", "C"];

test("topFive prende i 5 OVR più alti", () => {
  const t = topFive(byKey[KEY]);
  assert.deepEqual(t.map((c) => c.ovr), [90, 88, 86, 84, 82]);
});

test("spinRoster ritorna la top-5 di una rosa che copre uno slot libero", () => {
  const r = spinRoster(byKey, ["C"], {}, () => 0);
  assert.equal(r.key, KEY);
  assert.equal(r.cards.length, 5);
  assert.ok(r.cards.some((c) => c.pos.primary === "C" || c.pos.secondary === "C"), "c'è un C");
});

test("spinRoster rispetta il vincolo sameSeason (aiuto squadra)", () => {
  const multi = {
    "X|2015-16": byKey[KEY],
    "Y|2018-19": [card("a",90,"PG","",  "2018-19","Y"), card("b",88,"SG",null,"2018-19","Y"),
      card("c",86,"SF",null,"2018-19","Y"), card("d",84,"PF",null,"2018-19","Y"), card("e",82,"C",null,"2018-19","Y")],
  };
  const r = spinRoster(multi, ALL_ROLES, { sameSeason: "2015-16", excludeKey: "" }, () => 0);
  assert.ok(r.key.endsWith("2015-16"), "tiene la stagione 2015-16");
});

test("spinRoster esclude la chiave corrente (excludeKey) quando c'è alternativa", () => {
  const multi = {
    "X|2015-16": byKey[KEY],
    "Z|2015-16": [card("a",90,"PG",null,"2015-16","Z"), card("b",88,"SG",null,"2015-16","Z"),
      card("c",86,"SF",null,"2015-16","Z"), card("d",84,"PF",null,"2015-16","Z"), card("e",82,"C",null,"2015-16","Z")],
  };
  const r = spinRoster(multi, ALL_ROLES, { excludeKey: KEY }, () => 0);
  assert.notEqual(r.key, KEY, "pesca l'altra rosa, non quella esclusa");
});

test("spinRoster: se il vincolo svuota tutto, fallback (non lascia l'aiuto a vuoto)", () => {
  // un solo key: escluderlo svuota, ma il fallback lo riammette
  const r = spinRoster(byKey, ["C"], { excludeKey: KEY }, () => 0);
  assert.equal(r.key, KEY);
  assert.equal(r.fallback, true);
});

test("spinRoster lancia se nessuna rosa copre gli slot liberi", () => {
  const soloGuardie = { "Y|2015-16": [card("a",80,"PG"),card("b",79,"SG"),card("c",78,"PG"),card("d",77,"SG"),card("e",76,"SG")] };
  assert.throws(() => spinRoster(soloGuardie, ["C"], {}, () => 0), /nessuna/i);
});

test("opponentPool costruisce quintetti valutati", () => {
  const pool = opponentPool(byKey);
  assert.equal(pool.length, 1);
  assert.ok(pool[0].voto.ovr > 0);
});
