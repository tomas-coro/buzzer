import { test } from "node:test";
import assert from "node:assert/strict";
import { card } from "./fixtures.js";
import {
  SALARIO_MIN, SALARIO_MAX,
  salarioDaVoto, salarioStorico, salarioCarta, etichettaSalarioCarta, firmabile, prenotato,
  firmaDiRipiego, formattaSalario,
  APRON, TASSA_PER_MILIONE, limiteDuro, sforo, malusApron, monteIngaggi,
} from "./salary.js";

const M = 1_000_000;

test("la curva sta sempre fra minimo e max contract", () => {
  for (let v = 0; v <= 99; v++) {
    const s = salarioDaVoto(v);
    assert.ok(s >= SALARIO_MIN, `voto ${v}: ${s} sotto il minimo`);
    assert.ok(s <= SALARIO_MAX, `voto ${v}: ${s} sopra il max contract`);
  }
});

test("la curva non scende mai: più forte non costa meno", () => {
  let prima = 0;
  for (let v = 0; v <= 99; v++) {
    const s = salarioDaVoto(v);
    assert.ok(s >= prima, `voto ${v} costa meno del ${v - 1}`);
    prima = s;
  }
});

test("è convessa come nella NBA: il salto in alto vale più del salto in basso", () => {
  // Dieci punti di voto in fondo alla scala spostano pochi spiccioli, gli stessi
  // dieci in cima spostano decine di milioni. È l'intera ragione del cap: se la
  // curva fosse lineare, il tetto sarebbe solo "voto medio massimo".
  const bassa = salarioDaVoto(40) - salarioDaVoto(30);
  const alta = salarioDaVoto(80) - salarioDaVoto(70);
  assert.ok(alta > bassa * 5, `salto alto ${alta} contro basso ${bassa}`);
});

test("gli ancoraggi cadono dove li abbiamo messi", () => {
  // Misurati sul dataset (2412 carte): mediana 48, p95 75, massimo 91.
  // La mediana deve costare come il salario mediano NBA vero, ~6 milioni.
  assert.ok(Math.abs(salarioDaVoto(48) - 6 * M) < 1.5 * M, `mediana a ${salarioDaVoto(48)}`);
  assert.equal(salarioDaVoto(20), SALARIO_MIN);
  assert.equal(salarioDaVoto(90), SALARIO_MAX);
});

test("usa il salario storico normalizzato al tetto di oggi quando esiste", () => {
  // LeBron 2014-15 prendeva 20.6M nominali, cioè il 32.7% del tetto 2014-15
  // (63M): la stessa quota vale 50.6M sul tetto 2025-26 (154.6M).
  const lebron = card({ player_id: "lebron-james", season: "2014-15" });
  assert.equal(salarioStorico(lebron), 50_623_873);
  assert.equal(salarioCarta(lebron), 50_623_873);
  assert.equal(etichettaSalarioCarta(lebron), "Salario stagionale");
});

test("un salario mancante resta null e usa l'OVR senza rumore", () => {
  const mancante = card({ player_id: "nessuno", season: "1900-01" });
  const gemello = card({ player_id: "altro", season: "1900-01", ovr: mancante.ovr });
  assert.equal(salarioStorico(mancante), null);
  assert.equal(etichettaSalarioCarta(mancante), "Costo draft");
  assert.equal(salarioCarta(mancante), salarioCarta(gemello));
  assert.equal(salarioCarta(mancante) % 100_000, 0);
});

test("usa i salari reali 2025-26", () => {
  assert.equal(salarioCarta(card({ player_id: "desmond-bane", season: "2025-26" })), 36_725_670);
  assert.equal(salarioCarta(card({ player_id: "jalen-suggs", season: "2025-26" })), 35_000_000);
});

test("prenotato: ogni casella ancora vuota tiene da parte un contratto minimo", () => {
  assert.equal(prenotato(0), 0);
  assert.equal(prenotato(4), 4 * SALARIO_MIN);
});

test("firmabile: puoi spendere tutto tranne il minimo delle caselle che restano", () => {
  // Tre caselle vuote, 20 milioni in cassa: dopo questa firma ne restano due da
  // riempire, quindi 2 minimi vanno lasciati sul tavolo.
  const residuo = 20 * M;
  const tetto = residuo - 2 * SALARIO_MIN;
  assert.equal(firmabile(tetto, residuo, 3), true);
  assert.equal(firmabile(tetto + 100_000, residuo, 3), false);
});

test("firmabile: sull'ultima casella si può spendere fino all'ultimo dollaro", () => {
  assert.equal(firmabile(9 * M, 9 * M, 1), true);
  assert.equal(firmabile(9 * M + 100_000, 9 * M, 1), false);
});

test("firmabile: una carta al minimo passa sempre, anche a cassa vuota", () => {
  // La rete che impedisce il draft bloccato: col budget ridotto all'osso il
  // minimo resta firmabile, sempre, su qualsiasi casella.
  for (const vuote of [1, 2, 5, 10]) {
    assert.equal(firmabile(SALARIO_MIN, prenotato(vuote), vuote), true, `vuote ${vuote}`);
  }
});

test("formattaSalario scrive milioni con un decimale", () => {
  assert.equal(formattaSalario(12_400_000), "$12.4M");
  assert.equal(formattaSalario(2_000_000), "$2.0M");
  assert.equal(formattaSalario(55_000_000), "$55.0M");
});

test("firmaDiRipiego: non scatta finché qualcosa è firmabile", () => {
  // 20 milioni in cassa e tre caselle: il contratto da 5 ci sta comodo.
  assert.equal(firmaDiRipiego([30 * M, 5 * M, 40 * M], 20 * M, 3), -1);
});

test("firmaDiRipiego: a cassa secca scende al minimo la carta MENO cara", () => {
  // Il caso vero trovato al banco: 8 milioni, quattro caselle vuote, quindi si
  // può spendere solo il minimo - e nessuno dei candidati ci arriva.
  const costi = [9 * M, 2.6 * M, 4.1 * M];
  assert.equal(costi.some((c) => firmabile(c, 8 * M, 4)), false, "lo scenario deve essere bloccato");
  assert.equal(firmaDiRipiego(costi, 8 * M, 4), 1);
});

test("firmaDiRipiego: mazzo vuoto, nessun ripiego", () => {
  assert.equal(firmaDiRipiego([], 8 * M, 4), -1);
});

// ---- il secondo apron ----

test("sotto il tetto non si paga niente", () => {
  assert.equal(sforo(140 * M, 150 * M), 0);
  assert.equal(malusApron(140 * M, 150 * M), 0);
});

test("il limite duro sta un quarto sopra il tetto", () => {
  assert.equal(limiteDuro(100 * M), 125 * M);
  assert.equal(limiteDuro(150 * M), 187.5 * M);
});

test("cinque milioni di sforo costano un punto di reparto", () => {
  assert.equal(malusApron(155 * M, 150 * M), 1);
  assert.equal(malusApron(175 * M, 150 * M), 5);
});

test("il malus cresce liscio: nessuno scalino sopra il tetto", () => {
  let prima = -1;
  for (let s = 150; s <= 190; s += 1) {
    const m = malusApron(s * M, 150 * M);
    assert.ok(m >= prima, `a ${s}M il malus scende`);
    prima = m;
  }
});

test("il monte ingaggi somma i cartellini e regge i buchi", () => {
  const a = card({ player_id: "a", season: "2016-17" });
  const b = card({ player_id: "b", season: "2017-18" });
  assert.equal(monteIngaggi([a, b, null]), salarioCarta(a) + salarioCarta(b));
  assert.equal(monteIngaggi([]), 0);
});
