import { test } from "node:test";
import assert from "node:assert/strict";
import { card } from "./fixtures.js";
import {
  SALARIO_MIN, SALARIO_MAX,
  salarioDaVoto, salarioStorico, salarioCarta, etichettaSalarioCarta, firmabile, prenotato,
  firmaDiRipiego, formattaSalario,
  APRON, TASSA_PER_MILIONE, limiteDuro, sforo, malusApron, monteIngaggi,
  clampStorico, BANDA_STORICO_MIN, BANDA_STORICO_MAX,
  contestoCarriera,
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

test("gli ancoraggi OVR cadono agli estremi della curva", () => {
  // La curva salariale usa l'OVR 2K visibile sulla carta: il dataset arriva a 99.
  assert.equal(salarioDaVoto(20), SALARIO_MIN);
  assert.equal(salarioDaVoto(99), SALARIO_MAX);
  assert.ok(salarioDaVoto(94) < SALARIO_MAX, "94 OVR non deve già saturare il max contract");
});

test("lo storico resta disponibile ma il contratto finale segue il modello BUZZER", () => {
  const lebron = card({
    player_id: "lebron-james",
    season: "2014-15",
    ovr: 96,
  });

  const storico = salarioStorico(lebron);
  const finale = salarioCarta(lebron);
  const base = salarioDaVoto(96);

  // Il dato storico reale resta intatto come segnale della specifica stagione.
  assert.equal(storico, 50_623_873);

  // Il contratto BUZZER non replica più automaticamente il contratto NBA.
  assert.notEqual(finale, storico);

  // Deve però restare coerente con il valore della carta.
  assert.ok(
    finale >= base * 0.75 && finale <= base * 1.25,
    `finale ${finale} troppo lontano dalla base OVR ${base}`,
  );

  // I contratti mostrati nel gioco restano leggibili a passi da 100k.
  assert.equal(finale % 100_000, 0);

  assert.equal(
    etichettaSalarioCarta(lebron),
    "Salario stagionale",
  );
});

test("salarioCarta usa l'OVR visibile e ignora il voto-motore dei reparti", () => {
  const scarsoMotore = card({
    player_id: "nessuno-a", season: "1900-01", ovr: 94,
    reparti: { t3: 10, fin: 10, dif: 10, reb: 10, reg: 10 },
  });
  const forteMotore = card({
    player_id: "nessuno-b", season: "1900-01", ovr: 94,
    reparti: { t3: 99, fin: 99, dif: 99, reb: 99, reg: 99 },
  });

  assert.equal(salarioCarta(scarsoMotore), salarioDaVoto(94));
  assert.equal(salarioCarta(forteMotore), salarioDaVoto(94));
  assert.equal(salarioCarta(scarsoMotore), salarioCarta(forteMotore));
});

test("un salario mancante resta null e usa l'OVR senza rumore", () => {
  const mancante = card({ player_id: "nessuno", season: "1900-01" });
  const gemello = card({ player_id: "altro", season: "1900-01", ovr: mancante.ovr });
  assert.equal(salarioStorico(mancante), null);
  assert.equal(etichettaSalarioCarta(mancante), "Costo draft");
  assert.equal(salarioCarta(mancante), salarioCarta(gemello));
  assert.equal(salarioCarta(mancante) % 100_000, 0);
});

test("due carte con stesso OVR possono avere contratti diversi per il contesto", () => {
  const bane = card({
    player_id: "desmond-bane",
    season: "2025-26",
    ovr: 80,
  });

  const suggs = card({
    player_id: "jalen-suggs",
    season: "2025-26",
    ovr: 80,
  });

  const base = salarioDaVoto(80);

  const sb = salarioCarta(bane);
  const ss = salarioCarta(suggs);

  assert.ok(sb >= SALARIO_MIN && sb <= SALARIO_MAX);
  assert.ok(ss >= SALARIO_MIN && ss <= SALARIO_MAX);

  assert.ok(
    Math.abs(sb - base) < base * 0.20,
    `Bane ${sb} troppo lontano dalla base OVR ${base}`,
  );

  assert.ok(
    Math.abs(ss - base) < base * 0.20,
    `Suggs ${ss} troppo lontano dalla base OVR ${base}`,
  );
});

test("il contesto carriera distingue almeno prime e crescita quando disponibili", () => {
  const prime = contestoCarriera({
    player_id: "lebron-james",
    season: "2014-15",
    ovr: 96,
  });

  assert.ok(["prime", "rising", "decline", "stable"].includes(prime.phase));
  assert.ok(prime.factor >= 0.90 && prime.factor <= 1.10);
});

// ---- il clamp storico/formula ----

test("clampStorico: alza il pavimento quando il rookie è sottopagato rispetto all'OVR", () => {
  // Il caso trovato in playtest: un fuoriclasse su contratto di scala che
  // costerebbe meno di un mediocre su contratto gonfiato.
  const formula = 50_000_000;
  const min = formula * BANDA_STORICO_MIN;
  assert.equal(clampStorico(formula, 5_000_000), min);
});

test("clampStorico: abbassa il tetto quando il veterano è sovrapagato rispetto all'OVR", () => {
  const formula = 10_000_000;
  const max = formula * BANDA_STORICO_MAX;
  assert.equal(clampStorico(formula, 30_000_000), max);
});

test("clampStorico: non tocca lo storico già dentro banda", () => {
  const formula = 40_000_000;
  assert.equal(clampStorico(formula, 35_000_000), 35_000_000);
});

test("clampStorico: il caso Davis/Campbell torna coerente con l'OVR", () => {
  // Test isolato della banda su due formule rappresentative: il clamp deve evitare
  // che un contratto storico molto basso trasformi il giocatore più caro in un affare anomalo.
  const davis = clampStorico(50_800_000, 11_400_000);
  const campbell = clampStorico(41_900_000, 29_000_000);
  assert.ok(davis >= campbell, `Davis (88, ${davis}) dovrebbe costare almeno quanto Campbell (83, ${campbell})`);
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
