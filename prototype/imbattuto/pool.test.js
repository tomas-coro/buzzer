import { test } from "node:test";
import assert from "node:assert/strict";
import { spinRoster, opponentPool, chiaveCarta } from "./pool.js";

// fixture: carte con ruolo noto
function card(name, ovr, primary, secondary = null, season = "2015-16", team = "X") {
  return { player_id: name, name, season, team, team_abbr: team, ovr,
    pos: { primary, secondary }, att: [70,70,70,70,70,70,70], def: [52,52,52,52,52], estimated: false,
    // I reparti sono quello che il motore valuta davvero (game/rating.js): senza,
    // teamRating non può costruire il voto dell'avversario.
    reparti: { t3: ovr - 30, fin: ovr - 30, dif: ovr - 30, reb: ovr - 30, reg: ovr - 30 } };
}
// Dieci carte per squadra-stagione: da G6 lo spin mostra la ROSA INTERA
// (`costruisciRosa`), non più la top-5, quindi sotto le dieci la rosa non esiste.
function rosaDieci(team = "X", season = "2015-16", base = 90) {
  return [
    card(`${team}-PG1`, base,      "PG", null, season, team),
    card(`${team}-SG1`, base - 2,  "SG", null, season, team),
    card(`${team}-SF1`, base - 4,  "SF", null, season, team),
    card(`${team}-PF1`, base - 6,  "PF", null, season, team),
    card(`${team}-C1`,  base - 8,  "C",  null, season, team),
    card(`${team}-PG2`, base - 30, "PG", null, season, team),
    card(`${team}-SG2`, base - 32, "SG", null, season, team),
    card(`${team}-SF2`, base - 33, "SF", null, season, team),
    card(`${team}-PF2`, base - 34, "PF", null, season, team),
    card(`${team}-C2`,  base - 35, "C",  null, season, team),
  ];
}
const KEY = "X|2015-16";
const byKey = { [KEY]: rosaDieci() };
const ALL_ROLES = ["PG", "SG", "SF", "PF", "C"];

test("spinRoster ritorna la rosa da dieci di una squadra che copre uno slot libero", () => {
  const r = spinRoster(byKey, ["C"], {}, () => 0);
  assert.equal(r.key, KEY);
  assert.equal(r.cards.length, 10);
  assert.ok(r.cards.some((c) => c.pos.primary === "C" || c.pos.secondary === "C"), "c'è un C");
});

test("spinRoster dice per ogni carta da quale casella della rosa viene", () => {
  const r = spinRoster(byKey, ALL_ROLES, {}, () => 0);
  assert.equal(r.slots.length, r.cards.length);
  assert.equal(r.slots.filter((s) => s.tipo === "titolare").length, 5);
  assert.equal(r.slots.filter((s) => s.tipo === "riserva").length, 5);
  // Il quintetto viene prima della panchina: la lista si disegna in quest'ordine.
  assert.deepEqual(r.slots.slice(0, 5).map((s) => s.tipo), Array(5).fill("titolare"));
  // I titolari sono i migliori del loro ruolo: PG1 (90) titolare, PG2 (60) riserva.
  const pgTit = r.slots.findIndex((s) => s.ruolo === "PG" && s.tipo === "titolare");
  assert.equal(r.cards[pgTit].player_id, "X-PG1");
});

test("le carte dello spin non portano addosso la casella (ci va la rosa vera)", () => {
  const r = spinRoster(byKey, ALL_ROLES, {}, () => 0);
  assert.ok(!("ruolo" in r.cards[0]) && !("tipo" in r.cards[0]),
    "la carta resta una carta: il ruolo lo decide chi la piazza");
});

test("spinRoster rispetta il vincolo sameSeason (aiuto squadra)", () => {
  const multi = { [KEY]: byKey[KEY], "Y|2018-19": rosaDieci("Y", "2018-19") };
  const r = spinRoster(multi, ALL_ROLES, { sameSeason: "2015-16", excludeKey: "" }, () => 0);
  assert.ok(r.key.endsWith("2015-16"), "tiene la stagione 2015-16");
});

test("spinRoster esclude la chiave corrente (excludeKey) quando c'è alternativa", () => {
  const multi = { [KEY]: byKey[KEY], "Z|2015-16": rosaDieci("Z") };
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
  const soloGuardie = {
    "Y|2015-16": Array.from({ length: 10 }, (_, i) =>
      card(`g${i}`, 80 - i, i % 2 ? "PG" : "SG", null, "2015-16", "Y")),
  };
  assert.throws(() => spinRoster(soloGuardie, ["C"], {}, () => 0), /nessuna/i);
});

test("opponentPool costruisce rose valutate", () => {
  const pool = opponentPool(byKey);
  assert.equal(pool.length, 1);
  assert.equal(pool[0].lista.length, 10);
  assert.ok(pool[0].voto.ovr > 0);
});

test("opponentPool scarta le squadre-stagione sotto le dieci carte", () => {
  assert.equal(opponentPool({ [KEY]: byKey[KEY].slice(0, 9) }).length, 0);
});

// --- carte già in rosa: non si ripescano (rosa da 10, dieci pick sullo stesso pool) ---

test("spinRoster non ripesca le carte già in rosa", () => {
  const dodici = { [KEY]: [...byKey[KEY], card("X-SF3", 54, "SF"), card("X-PF3", 53, "PF")] };
  const presi = new Set(["X-PG1|2015-16", "X-SG1|2015-16"]);
  const r = spinRoster(dodici, ALL_ROLES, { escludi: presi }, () => 0);
  assert.equal(r.cards.length, 10);
  assert.ok(!r.cards.some((c) => presi.has(chiaveCarta(c))), "nessuna carta già presa");
});

test("chiaveCarta separa lo stesso giocatore in due stagioni", () => {
  const a = card("LBJ", 96, "SF", null, "2012-13");
  const b = card("LBJ", 94, "SF", null, "2017-18");
  assert.notEqual(chiaveCarta(a), chiaveCarta(b));
  assert.equal(chiaveCarta(a), "LBJ|2012-13");
});

test("spinRoster salta le rose che senza le carte prese scendono sotto le dieci", () => {
  const due = { [KEY]: byKey[KEY], "Z|2015-16": [...rosaDieci("Z", "2015-16", 70), card("Z-C3", 33, "C", null, "2015-16", "Z")] };
  // una sola carta presa dalla X la porta a nove disponibili: resta fuori
  const r = spinRoster(due, ALL_ROLES, { escludi: ["X-PG1|2015-16"] }, () => 0);
  assert.equal(r.key, "Z|2015-16");
});
