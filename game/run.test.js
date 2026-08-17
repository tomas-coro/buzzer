import { test } from "node:test";
import assert from "node:assert/strict";
import { newRun, draftPick, useAid, chooseCoach, startRun, resolveRound } from "./run.js";
import { ROLES } from "./roster.js";
import { DIFFICULTIES } from "./difficulty.js";
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

test("useAid con tipo inesistente lancia (niente aiuto fantasma)", () => {
  const s = newRun({ formato: "playoff", difficolta: "normale" });
  assert.throws(() => useAid(s, "bogus"), /inesistente/);
});

test("chooseCoach/startRun fuori dalla fase coach lanciano", () => {
  let s = fullDraft(newRun({ formato: "playoff", difficolta: "normale" }), 90);
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(60));
  s = resolveRound(s); // 1 vittoria, run ancora attivo (N=16)
  assert.equal(s.stato, "run");
  assert.throws(() => chooseCoach(s, COACH), /non in fase coach/);
  assert.throws(() => startRun(s, poolAt(60)), /non in fase coach/);
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
  const N = DIFFICULTIES.normale.N; // 16 (target playoff, uguale in ogni difficoltà)
  let s = fullDraft(newRun({ formato: "playoff", difficolta: "normale" }), 99);
  s = chooseCoach(s, COACH);
  s = startRun(s, poolAt(50));
  for (let i = 0; i < N; i++) s = resolveRound(s);
  assert.equal(s.stato, "finito");
  assert.equal(s.esito, "imbattuto");
  assert.equal(s.vittorie, N);
});
