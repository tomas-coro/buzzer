import test from "node:test";
import assert from "node:assert/strict";
import { card } from "./fixtures.js";
import { ROLES } from "./roster.js";
import { emptyRosa, assegnaRosa, listaRosa, TITOLARE, RISERVA, repartiRosa } from "./rosa.js";
import { applyCoach, VALORE_MIRATO, VALORE_DIFFUSO, VALORE_MALUS } from "./coach.js";

// Rosa piena di carte identiche a 50: ogni scostamento nei reparti viene dal
// coach e da nient'altro.
function rosaPiatta(liv = 50) {
  let r = emptyRosa();
  for (const ruolo of ROLES) {
    for (const tipo of [TITOLARE, RISERVA]) {
      r = assegnaRosa(r, ruolo, tipo, card({
        player_id: `${ruolo}-${tipo}`,
        name: `${ruolo} ${tipo}`,
        pos: { primary: ruolo, secondary: null },
        reparti: { t3: liv, fin: liv, dif: liv, reb: liv, reg: liv },
      }));
    }
  }
  return r;
}

const NEUTRO = { id: "neutro", name: "Nessuno", plus: [], malus: null };

const cerca = (rosa, ruolo, tipo) => rosa[ruolo][tipo];

test("un coach neutro non sposta niente", () => {
  const rosa = rosaPiatta();
  const out = applyCoach(rosa, NEUTRO);
  assert.deepEqual(out.voto.reparti, repartiRosa(rosa));
  assert.equal(out.ritmo, 0);
  assert.equal(out.rotazione, "normale");
  assert.deepEqual(out.effetti, []);
});

test("un plus mirato alza il reparto SOLO ai ruoli bersaglio", () => {
  const coach = { ...NEUTRO, plus: [{ reparto: "dif", ruoli: ["PF", "C"] }] };
  const out = applyCoach(rosaPiatta(), coach);
  assert.equal(cerca(out.rosa, "C", TITOLARE).reparti.dif, 50 + VALORE_MIRATO);
  assert.equal(cerca(out.rosa, "PF", RISERVA).reparti.dif, 50 + VALORE_MIRATO);
  assert.equal(cerca(out.rosa, "PG", TITOLARE).reparti.dif, 50, "le guardie non c'entrano");
  assert.equal(cerca(out.rosa, "C", TITOLARE).reparti.t3, 50, "gli altri reparti non si toccano");
});

test("un plus diffuso alza tutta la squadra, ma di meno", () => {
  const out = applyCoach(rosaPiatta(), { ...NEUTRO, plus: [{ reparto: "reg" }] });
  for (const c of listaRosa(out.rosa)) assert.equal(c.reparti.reg, 50 + VALORE_DIFFUSO);
  assert.ok(VALORE_DIFFUSO < VALORE_MIRATO, "il diffuso deve pesare meno del mirato");
});

test("il malus è il prezzo della tattica: lo paga tutta la squadra", () => {
  const out = applyCoach(rosaPiatta(), { ...NEUTRO, malus: { reparto: "reb" } });
  for (const c of listaRosa(out.rosa)) assert.equal(c.reparti.reb, 50 - VALORE_MALUS);
});

test("due plus e un malus convivono sulla stessa rosa", () => {
  const dantoni = {
    ...NEUTRO,
    plus: [{ reparto: "t3", ruoli: ["PG", "SG", "SF"] }, { reparto: "reg" }],
    malus: { reparto: "dif" },
    ritmo: 0.8,
  };
  const out = applyCoach(rosaPiatta(), dantoni);
  const guardia = cerca(out.rosa, "SG", TITOLARE).reparti;
  const centro = cerca(out.rosa, "C", TITOLARE).reparti;
  assert.equal(guardia.t3, 50 + VALORE_MIRATO);
  assert.equal(centro.t3, 50, "il centro non tira da tre per decreto");
  assert.equal(guardia.reg, 50 + VALORE_DIFFUSO);
  assert.equal(centro.dif, 50 - VALORE_MALUS);
  assert.equal(out.ritmo, 0.8);
});

test("gli effetti sono elencati per giocatore: la schermata coach li mostra", () => {
  const coach = { ...NEUTRO, plus: [{ reparto: "dif", ruoli: ["C"] }], malus: { reparto: "t3" } };
  const out = applyCoach(rosaPiatta(), coach);
  const sulCentro = out.effetti.filter((e) => e.player_id === "C-titolare");
  assert.deepEqual(
    sulCentro.sort((a, b) => a.reparto.localeCompare(b.reparto)),
    [
      { player_id: "C-titolare", ruolo: "C", tipo: TITOLARE, reparto: "dif", delta: VALORE_MIRATO },
      { player_id: "C-titolare", ruolo: "C", tipo: TITOLARE, reparto: "t3", delta: -VALORE_MALUS },
    ],
  );
  // una guardia prende solo il malus
  const sullaGuardia = out.effetti.filter((e) => e.player_id === "PG-titolare");
  assert.equal(sullaGuardia.length, 1);
  assert.equal(sullaGuardia[0].reparto, "t3");
});

test("i reparti restano nella scala 0-99, senza sfondare sopra o sotto", () => {
  const alto = applyCoach(rosaPiatta(97), { ...NEUTRO, plus: [{ reparto: "dif" }] });
  for (const c of listaRosa(alto.rosa)) assert.equal(c.reparti.dif, 99);
  const basso = applyCoach(rosaPiatta(2), { ...NEUTRO, malus: { reparto: "dif" } });
  for (const c of listaRosa(basso.rosa)) assert.equal(c.reparti.dif, 0);
});

test("il delta elencato è quello vero, non quello chiesto: col tetto a 99 si accorcia", () => {
  const out = applyCoach(rosaPiatta(97), { ...NEUTRO, plus: [{ reparto: "dif", ruoli: ["C"] }] });
  const e = out.effetti.find((x) => x.player_id === "C-titolare" && x.reparto === "dif");
  assert.equal(e.delta, 2, "da 97 a 99 il coach dà due punti, non otto");
});

test("gli anelli sono un bonus piccolo su tutti i reparti di tutti", () => {
  const out = applyCoach(rosaPiatta(), { ...NEUTRO, champ_bonus: 2 });
  const c = cerca(out.rosa, "SF", RISERVA).reparti;
  assert.equal(c.t3, 52);
  assert.equal(c.dif, 52);
});

test("il voto della squadra nasce dalla rosa già allenata, pesata per minuti", () => {
  const coach = { ...NEUTRO, plus: [{ reparto: "dif", ruoli: ["C"] }] };
  const out = applyCoach(rosaPiatta(), coach);
  assert.deepEqual(out.voto.reparti, repartiRosa(out.rosa));
  // un solo reparto alzato su due giocatori: il voto sale di poco ma sale
  assert.ok(out.voto.ovr >= 50);
});

test("la rotazione del coach cambia i minuti e quindi il voto", () => {
  let rosa = emptyRosa();
  for (const ruolo of ROLES) {
    rosa = assegnaRosa(rosa, ruolo, TITOLARE, card({
      player_id: `t-${ruolo}`, pos: { primary: ruolo, secondary: null },
      reparti: { t3: 90, fin: 90, dif: 90, reb: 90, reg: 90 },
    }));
    rosa = assegnaRosa(rosa, ruolo, RISERVA, card({
      player_id: `r-${ruolo}`, pos: { primary: ruolo, secondary: null },
      reparti: { t3: 30, fin: 30, dif: 30, reb: 30, reg: 30 },
    }));
  }
  const corta = applyCoach(rosa, { ...NEUTRO, rotazione: "corta" });
  const larga = applyCoach(rosa, { ...NEUTRO, rotazione: "larga" });
  assert.ok(corta.voto.ovr > larga.voto.ovr, "accorciare le rotazioni con questa panchina conviene");
  assert.equal(corta.rotazione, "corta");
});

// --- input sbagliato = errore leggibile -------------------------------------

test("un reparto inesistente nel plus lancia invece di essere ignorato", () => {
  assert.throws(() => applyCoach(rosaPiatta(), { ...NEUTRO, plus: [{ reparto: "tiro" }] }), /reparto/i);
});

test("un ruolo inesistente nel bersaglio lancia", () => {
  assert.throws(
    () => applyCoach(rosaPiatta(), { ...NEUTRO, plus: [{ reparto: "dif", ruoli: ["PIVOT"] }] }),
    /ruolo/i,
  );
});

test("più di due plus o un malus in più non passano: la regola è 2 e 1", () => {
  const tre = { ...NEUTRO, plus: [{ reparto: "t3" }, { reparto: "dif" }, { reparto: "reg" }] };
  assert.throws(() => applyCoach(rosaPiatta(), tre), /due plus/i);
});

test("ritmo e rotazione fuori scala lanciano", () => {
  assert.throws(() => applyCoach(rosaPiatta(), { ...NEUTRO, ritmo: 2 }), /ritmo/i);
  assert.throws(() => applyCoach(rosaPiatta(), { ...NEUTRO, rotazione: "elastica" }), /rotazione/i);
});

test("applyCoach non tocca la rosa che gli passi", () => {
  const rosa = rosaPiatta();
  applyCoach(rosa, { ...NEUTRO, plus: [{ reparto: "dif" }] });
  assert.equal(cerca(rosa, "C", TITOLARE).reparti.dif, 50);
});
