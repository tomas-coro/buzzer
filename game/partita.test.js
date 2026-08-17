import test from "node:test";
import assert from "node:assert/strict";
import {
  simulaPartita, rngSeed, attacco, difesa, possessiAttesi, satura, cronaca,
  POSSESSI_BASE, PPP_BASE, SAT_EFFICIENZA,
} from "./partita.js";

// Squadra di riferimento: tutti i reparti a 50, cioè la mediana della lega.
function squadra(over = {}) {
  const { nome = "Test", ritmo = 0, ...reparti } = over;
  return {
    nome,
    ritmo,
    reparti: { t3: 50, fin: 50, dif: 50, reb: 50, reg: 50, ...reparti },
  };
}

// Sposta tutti e cinque i reparti della stessa quantità: serve a costruire una
// squadra "d punti più forte" senza cambiarne il profilo.
function shift(base, d) {
  const r = {};
  for (const k of Object.keys(base.reparti)) r[k] = base.reparti[k] + d;
  return { ...base, reparti: r };
}

function media(xs) {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

// Banco: N partite tra due squadre, con un seme solo per tutta la serie.
function banco(casa, ospite, n = 2000, seme = 7) {
  const rng = rngSeed(seme);
  const out = [];
  for (let i = 0; i < n; i++) out.push(simulaPartita({ casa, ospite, rng }));
  return out;
}

test("stesso seme, stessa partita: la simulazione è riproducibile", () => {
  const a = simulaPartita({ casa: squadra(), ospite: squadra(), rng: rngSeed(1) });
  const b = simulaPartita({ casa: squadra(), ospite: squadra(), rng: rngSeed(1) });
  assert.deepEqual(a, b);
});

test("semi diversi danno partite diverse", () => {
  const a = simulaPartita({ casa: squadra(), ospite: squadra(), rng: rngSeed(1) });
  const b = simulaPartita({ casa: squadra(), ospite: squadra(), rng: rngSeed(2) });
  assert.notDeepEqual(a.punti, b.punti);
});

test("non esistono pareggi: c'è sempre un vincitore", () => {
  for (const p of banco(squadra(), squadra(), 500)) {
    assert.ok(p.vincitore === "casa" || p.vincitore === "ospite");
    assert.notEqual(p.punti.casa, p.punti.ospite);
    const vince = p.vincitore === "casa" ? p.punti.casa > p.punti.ospite
      : p.punti.ospite > p.punti.casa;
    assert.ok(vince, "il vincitore deve avere più punti");
  }
});

test("il punteggio finale è la somma dei quarti", () => {
  for (const p of banco(squadra(), shift(squadra(), -3), 200)) {
    assert.equal(p.quarti.reduce((s, q) => s + q.casa, 0), p.punti.casa);
    assert.equal(p.quarti.reduce((s, q) => s + q.ospite, 0), p.punti.ospite);
  }
});

test("quattro quarti sempre, overtime solo in coda", () => {
  for (const p of banco(squadra(), squadra(), 500)) {
    assert.ok(p.quarti.length >= 4);
    for (let i = 0; i < 4; i++) assert.equal(p.quarti[i].overtime, false);
    for (let i = 4; i < p.quarti.length; i++) assert.equal(p.quarti[i].overtime, true);
    // Un overtime esiste solo se al 4° si era pari.
    if (p.quarti.length > 4) {
      const c = p.quarti.slice(0, 4).reduce((s, q) => s + q.casa, 0);
      const o = p.quarti.slice(0, 4).reduce((s, q) => s + q.ospite, 0);
      assert.equal(c, o, "overtime senza parità al 48'");
    }
  }
});

test("gli overtime capitano, ma sono rari", () => {
  const p = banco(squadra(), squadra(), 2000);
  const conOt = p.filter((x) => x.quarti.length > 4).length;
  assert.ok(conOt > 0, "in 2000 partite pari almeno un overtime deve uscire");
  assert.ok(conOt / p.length < 0.15, `overtime nel ${Math.round(100 * conOt / p.length)}% delle partite: troppi`);
});

test("punteggi realistici: media intorno ai 105-115", () => {
  const p = banco(squadra(), squadra(), 2000);
  const m = media(p.map((x) => x.punti.casa));
  assert.ok(m > 100 && m < 118, `media punti ${m.toFixed(1)} fuori dalla forbice NBA`);
});

test("esiste la partita bassa da 90 punti e non esiste quella da 160", () => {
  const lente = banco(squadra({ ritmo: -1 }), squadra({ ritmo: -1 }), 1000);
  const tutte = banco(squadra(), squadra(), 2000).concat(lente);
  const punteggi = tutte.flatMap((x) => [x.punti.casa, x.punti.ospite]);
  assert.ok(Math.min(...punteggi) < 95, "nessuna partita bassa: la coda sotto i 95 non esiste");
  assert.ok(Math.max(...punteggi) < 160, "punteggi da videogioco arcade sopra i 160");
});

test("ritmo alto = più punti di ritmo basso, a parità di squadra", () => {
  const veloci = banco(squadra({ ritmo: 1 }), squadra({ ritmo: 1 }), 800);
  const lente = banco(squadra({ ritmo: -1 }), squadra({ ritmo: -1 }), 800);
  const mv = media(veloci.map((x) => x.punti.casa));
  const ml = media(lente.map((x) => x.punti.casa));
  assert.ok(mv - ml > 10, `il ritmo sposta solo ${(mv - ml).toFixed(1)} punti: manopola inutile`);
});

test("il ritmo è la media dei due coach: uno solo non basta a correre", () => {
  const entrambi = media(banco(squadra({ ritmo: 1 }), squadra({ ritmo: 1 }), 600).map((x) => x.punti.casa));
  const soloUno = media(banco(squadra({ ritmo: 1 }), squadra({ ritmo: -1 }), 600).map((x) => x.punti.casa));
  assert.ok(entrambi > soloUno, "chi corre da solo deve segnare meno di due che corrono");
});

test("i rimbalzi danno possessi extra, non efficienza", () => {
  const rimbalzisti = squadra({ reb: 90 });
  const scarsi = squadra({ reb: 20 });
  const p = banco(rimbalzisti, scarsi, 800);
  const possCasa = media(p.map((x) => x.possessi.casa));
  const possOsp = media(p.map((x) => x.possessi.ospite));
  assert.ok(possCasa - possOsp > 2,
    `solo ${(possCasa - possOsp).toFixed(1)} possessi di scarto con 70 punti di rimbalzi`);
  // e quei possessi devono tradursi in vittorie, altrimenti non contano
  const vinte = p.filter((x) => x.vincitore === "casa").length / p.length;
  assert.ok(vinte > 0.6, `chi domina a rimbalzo vince solo il ${Math.round(100 * vinte)}%`);
});

test("l'attacco batte la difesa avversaria, non la propria", () => {
  // Stessa squadra, ma una ha davanti una difesa di ferro: deve segnare meno.
  const p1 = media(banco(squadra(), squadra({ dif: 20 }), 600).map((x) => x.punti.casa));
  const p2 = media(banco(squadra(), squadra({ dif: 90 }), 600).map((x) => x.punti.casa));
  assert.ok(p1 - p2 > 8, `la difesa avversaria toglie solo ${(p1 - p2).toFixed(1)} punti`);
});

test("la squadra più forte vince quasi sempre, ma non sempre", () => {
  const p = banco(shift(squadra(), 20), squadra(), 1000);
  const vinte = p.filter((x) => x.vincitore === "casa").length / p.length;
  assert.ok(vinte > 0.85, `una squadra 20 punti sopra vince solo il ${Math.round(100 * vinte)}%`);
  assert.ok(vinte < 0.995, "nessuna sorpresa possibile: la partita è finta");
});

test("varianza calibrata: l'outsider da -6 vince circa 1 volta su 4", () => {
  const p = banco(squadra(), shift(squadra(), 6), 3000, 11);
  const sorprese = p.filter((x) => x.vincitore === "casa").length / p.length;
  assert.ok(sorprese > 0.19 && sorprese < 0.31,
    `l'outsider vince il ${Math.round(100 * sorprese)}%, target 25%`);
});

test("partita in equilibrio: il 4° quarto è più imprevedibile del 1°", () => {
  // Su partite tra pari, lo scarto del 4° quarto deve avere un'escursione
  // maggiore del 1°: è la varianza legata all'equilibrio.
  const p = banco(squadra(), squadra(), 2000, 3).filter((x) => {
    const c = x.quarti.slice(0, 3).reduce((s, q) => s + q.casa, 0);
    const o = x.quarti.slice(0, 3).reduce((s, q) => s + q.ospite, 0);
    return Math.abs(c - o) <= 5;
  });
  assert.ok(p.length > 200, "campione di partite in equilibrio troppo piccolo");
  const esc = (i) => media(p.map((x) => Math.abs(x.quarti[i].casa - x.quarti[i].ospite)));
  assert.ok(esc(3) > esc(0) * 1.1,
    `4° quarto ${esc(3).toFixed(2)} contro 1° ${esc(0).toFixed(2)}: l'equilibrio non alza la varianza`);
});

test("con 20 punti di scarto il 4° quarto non impazzisce", () => {
  const p = banco(shift(squadra(), 25), squadra(), 1500, 5).filter((x) => {
    const c = x.quarti.slice(0, 3).reduce((s, q) => s + q.casa, 0);
    const o = x.quarti.slice(0, 3).reduce((s, q) => s + q.ospite, 0);
    return c - o >= 15;
  });
  assert.ok(p.length > 100, "campione di partite scappate troppo piccolo");
  const rimonte = p.filter((x) => x.vincitore === "ospite").length / p.length;
  assert.ok(rimonte < 0.06, `rimonte da -15 nel ${Math.round(100 * rimonte)}% dei casi: troppe`);
});

test("cronaca: una riga per quarto, con il punteggio dentro", () => {
  const p = simulaPartita({ casa: squadra({ nome: "Bulls" }), ospite: squadra({ nome: "Jazz" }), rng: rngSeed(4) });
  assert.equal(p.cronaca.length, p.quarti.length);
  for (const [i, riga] of p.cronaca.entries()) {
    assert.ok(riga.testo.length > 10, "riga di cronaca vuota");
    assert.ok(riga.testo.includes(`${p.quarti[i].cumCasa}`), "manca il punteggio corrente");
    assert.equal(typeof riga.quarto, "string");
  }
});

test("cronaca: i nomi delle squadre finiscono nel testo", () => {
  const p = simulaPartita({ casa: squadra({ nome: "Bulls" }), ospite: squadra({ nome: "Jazz" }), rng: rngSeed(4) });
  const tutto = p.cronaca.map((r) => r.testo).join(" ");
  assert.ok(tutto.includes("Bulls") || tutto.includes("Jazz"));
});

// Quarti costruiti a mano: servono a controllare le frasi senza dipendere dal caso.
function quarto(n, casa, ospite, cum, overtime = false) {
  return { n, casa, ospite, cumCasa: cum[0], cumOspite: cum[1], overtime,
    possessi: { casa: 25, ospite: 25 } };
}

test("cronaca: un parziale di chi insegue non è mai un allungo", () => {
  // Casa avanti 78-69, poi Ospiti fanno 33-25 ma perdono 103-102.
  const q = [
    quarto(1, 22, 23, [22, 23]),
    quarto(2, 28, 19, [50, 42]),
    quarto(3, 28, 27, [78, 69]),
    quarto(4, 25, 33, [103, 102]),
  ];
  const c = cronaca(q, "Bulls", "Jazz");
  const ultima = c[3].testo;
  assert.ok(!/largo|chiude i conti/.test(ultima), `frase sbagliata: "${ultima}"`);
  assert.ok(ultima.includes("Jazz"), "il parziale è dei Jazz, devono comparire");
  assert.ok(ultima.includes("vince Bulls"), "l'ultima riga deve dire chi ha vinto");
});

test("cronaca: chi allunga è sempre chi sta davanti", () => {
  const p = banco(squadra(), shift(squadra(), -4), 1500, 9);
  for (const x of p) {
    for (const [i, r] of x.cronaca.entries()) {
      if (r.tipo !== "allungo" || i === 0) continue;
      const q = x.quarti[i];
      const parzialeDi = q.casa > q.ospite ? "casa" : "ospite";
      const avanti = q.cumCasa > q.cumOspite ? "casa" : "ospite";
      assert.equal(parzialeDi, avanti, `"${r.testo}" ma avanti c'è l'altra`);
    }
  }
});

test("cronaca: la parità al 48' annuncia i supplementari", () => {
  const q = [
    quarto(1, 25, 25, [25, 25]), quarto(2, 25, 25, [50, 50]),
    quarto(3, 25, 25, [75, 75]), quarto(4, 25, 25, [100, 100]),
    quarto(5, 12, 9, [112, 109], true),
  ];
  const c = cronaca(q, "Bulls", "Jazz");
  assert.match(c[3].testo, /supplementari/i);
  assert.match(c[4].quarto, /suppl/i);
  assert.ok(c[4].testo.includes("vince Bulls"));
});

test("satura: lineare da vicino, piatta da lontano", () => {
  assert.equal(satura(0, SAT_EFFICIENZA), 0);
  assert.ok(Math.abs(satura(5, SAT_EFFICIENZA) - 5) < 0.5, "sotto soglia deve passare quasi intero");
  assert.ok(satura(60, SAT_EFFICIENZA) < SAT_EFFICIENZA * 1.01, "oltre soglia deve appiattirsi");
  assert.equal(satura(-10, SAT_EFFICIENZA), -satura(10, SAT_EFFICIENZA), "deve essere simmetrica");
});

test("attacco e difesa: sintesi leggibili dei reparti", () => {
  assert.equal(attacco({ t3: 50, fin: 50, dif: 50, reb: 50, reg: 50 }), 50);
  assert.equal(difesa({ t3: 50, fin: 50, dif: 60, reb: 50, reg: 50 }), 60);
  assert.ok(attacco({ t3: 90, fin: 90, dif: 0, reb: 0, reg: 90 }) > 80,
    "la difesa non deve entrare nell'attacco");
});

test("possessiAttesi: parte dalla base e il ritmo la sposta", () => {
  assert.equal(possessiAttesi(0, 0), POSSESSI_BASE);
  assert.ok(possessiAttesi(1, 1) > POSSESSI_BASE);
  assert.ok(possessiAttesi(-1, -1) < POSSESSI_BASE);
  assert.equal(possessiAttesi(1, -1), POSSESSI_BASE);
});

test("PPP_BASE resta una manopola esportata per il banco", () => {
  assert.ok(PPP_BASE > 0.9 && PPP_BASE < 1.3);
});

test("input sbagliati danno errori chiari, non punteggi finti", () => {
  const s = squadra();
  assert.throws(() => simulaPartita({ casa: s, rng: rngSeed(1) }), /ospite/i);
  assert.throws(() => simulaPartita({ casa: s, ospite: {}, rng: rngSeed(1) }), /reparti/i);
  assert.throws(() => simulaPartita({ casa: s, ospite: s, rng: "no" }), /rng/i);
  assert.throws(
    () => simulaPartita({ casa: s, ospite: squadra({ ritmo: 5 }), rng: rngSeed(1) }),
    /ritmo/i,
  );
  const rotta = { nome: "X", ritmo: 0, reparti: { t3: 50, fin: 50, dif: 50, reb: 50 } };
  assert.throws(() => simulaPartita({ casa: s, ospite: rotta, rng: rngSeed(1) }), /reg/);
});

test("rngSeed produce numeri in [0,1) e non si ripete subito", () => {
  const r = rngSeed(42);
  const v = Array.from({ length: 100 }, () => r());
  for (const x of v) assert.ok(x >= 0 && x < 1, `valore fuori range: ${x}`);
  assert.equal(new Set(v).size, 100, "il generatore si ripete");
});
