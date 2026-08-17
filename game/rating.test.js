import { test } from "node:test";
import assert from "node:assert/strict";
import { teamRating, votoDaReparti, votoCarta, PESI } from "./rating.js";
import { REPARTI } from "./reparti.js";
import { card } from "./fixtures.js";

const rep = (o = {}) => ({ t3: 50, fin: 50, dif: 50, reb: 50, reg: 50, ...o });

test("i pesi sommano a uno e coprono tutti e cinque i reparti", () => {
  const somma = REPARTI.reduce((s, r) => s + PESI[r], 0);
  assert.ok(Math.abs(somma - 1) < 1e-9, `somma pesi ${somma}`);
  for (const r of REPARTI) assert.ok(PESI[r] > 0, `peso nullo su '${r}'`);
});

test("difesa e attacco pesano uguale, i rimbalzi meno di entrambi", () => {
  const att = PESI.t3 + PESI.fin + PESI.reg;
  assert.ok(Math.abs(att - PESI.dif) < 1e-9, "attacco e difesa devono bilanciarsi");
  assert.ok(PESI.reb < PESI.dif, "i rimbalzi non possono pesare quanto la difesa");
});

test("una squadra tutta mediana vale 50", () => {
  assert.equal(votoDaReparti(rep()), 50);
});

test("il voto cresce con ogni reparto, nessuno escluso", () => {
  for (const r of REPARTI) {
    assert.ok(votoDaReparti(rep({ [r]: 80 })) > votoDaReparti(rep()),
      `alzare '${r}' non alza il voto`);
  }
});

test("teamRating è il voto dei reparti medi, non degli overall 2K", () => {
  // Stessi overall, reparti opposti: il voto deve seguire i reparti.
  const forte = Array.from({ length: 5 }, () => card({ ovr: 70, reparti: rep({ dif: 85, fin: 85 }) }));
  const debole = Array.from({ length: 5 }, () => card({ ovr: 95, reparti: rep({ dif: 20, fin: 20 }) }));
  assert.ok(teamRating(forte).ovr > teamRating(debole).ovr,
    "l'overall 2K non deve più decidere il voto");
});

test("teamRating restituisce anche i reparti medi, che servono alla partita", () => {
  const cards = [card({ reparti: rep({ t3: 90 }) }), card({ reparti: rep({ t3: 70 }) })];
  const r = teamRating(cards);
  assert.equal(r.reparti.t3, 80);
  assert.equal(r.reparti.dif, 50);
  assert.ok(Number.isInteger(r.ovr));
});

test("il voto resta dentro 0-99", () => {
  const top = Array.from({ length: 5 }, () => card({ reparti: rep({ t3: 99, fin: 99, dif: 99, reb: 99, reg: 99 }) }));
  const bot = Array.from({ length: 5 }, () => card({ reparti: rep({ t3: 0, fin: 0, dif: 0, reb: 0, reg: 0 }) }));
  assert.ok(teamRating(top).ovr <= 99 && teamRating(top).ovr >= 95);
  assert.ok(teamRating(bot).ovr >= 0 && teamRating(bot).ovr <= 4);
});

test("votoCarta dà il numero grande della scheda", () => {
  assert.equal(votoCarta(card({ reparti: rep() })), 50);
  assert.ok(votoCarta(card({ reparti: rep({ dif: 95, reb: 95 }) })) > 60);
});

test("carta senza reparti lancia (niente NaN silenzioso)", () => {
  assert.throws(() => votoCarta({ name: "x" }), /reparti/);
  assert.throws(() => votoCarta({ name: "x", reparti: { t3: 1 } }), /fin/);
  assert.throws(() => teamRating([{ name: "x" }]), /reparto/);
});

test("lista vuota lancia", () => {
  assert.throws(() => teamRating([]), /almeno una carta/);
});
