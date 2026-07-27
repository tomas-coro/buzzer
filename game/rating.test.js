import { test } from "node:test";
import assert from "node:assert/strict";
import { teamRating } from "./rating.js";
import { card } from "./fixtures.js";

test("teamRating è la media (arrotondata) degli overall", () => {
  const cards = [card({ ovr: 90 }), card({ ovr: 80 }), card({ ovr: 70 })];
  const r = teamRating(cards);
  assert.equal(r.ovr, 80); // (90+80+70)/3
});

test("teamRating restituisce un ovr intero in range", () => {
  const five = [card(), card(), card(), card(), card()];
  const r = teamRating(five);
  assert.ok(Number.isInteger(r.ovr));
  assert.ok(r.ovr >= 0 && r.ovr <= 120);
});

test("squadra migliore ha ovr più alto di squadra scarsa", () => {
  const forte = Array.from({ length: 5 }, () => card({ ovr: 95 }));
  const scarsa = Array.from({ length: 5 }, () => card({ ovr: 65 }));
  assert.ok(teamRating(forte).ovr > teamRating(scarsa).ovr);
});

test("carta senza overall lancia (niente NaN silenzioso)", () => {
  assert.throws(() => teamRating([{ name: "x" }]), /overall/);
  assert.throws(() => teamRating([{ name: "x", ovr: NaN }]), /overall/);
});

test("lista vuota lancia", () => {
  assert.throws(() => teamRating([]), /almeno una carta/);
});
