import { test } from "node:test";
import assert from "node:assert/strict";
import { DIFFICULTIES, TETTI, REVEAL, mostra } from "./difficulty.js";

test("esistono i 4 livelli", () => {
  assert.deepEqual(Object.keys(DIFFICULTIES), ["facile", "normale", "difficile", "incubo"]);
});

test("ogni livello ha aiuti, N e banda avversari coerenti", () => {
  for (const key of Object.keys(DIFFICULTIES)) {
    const d = DIFFICULTIES[key];
    assert.ok(d.N >= 1, `${key}: N ≥ 1`);
    assert.ok(d.oppMax >= d.oppMin, `${key}: banda avversari valida`);
    for (const a of ["squadra", "stagione", "respin"]) {
      assert.ok(Number.isInteger(d.aids[a]) && d.aids[a] >= 0, `${key}: aids.${a}`);
    }
  }
});

// Incubo non ha più zero aiuti (G6): ha gli stessi di Difficile, e si distingue
// per la banda avversari e per il draft al buio. Quello che deve restare vero è
// che nessun livello ne ha più di Facile.
test("Incubo non ha più aiuti di Facile", () => {
  const tot = (k) => Object.values(DIFFICULTIES[k].aids).reduce((s, n) => s + n, 0);
  assert.ok(tot("incubo") < tot("facile"));
});

// Il flag freeSwitch è stato tolto in G6: nessun livello ha più aiuti infiniti,
// e questo test è la sentinella che impedisce di reintrodurlo di soppiatto.
test("nessun livello ha switch illimitati", () => {
  for (const [key, d] of Object.entries(DIFFICULTIES)) {
    assert.equal(d.freeSwitch, undefined, `${key}: freeSwitch non deve esistere`);
  }
});

// Gli aiuti non risalgono mai: Incubo e Difficile pareggiano di proposito, ma
// nessun livello più duro può averne di più di uno più facile.
test("gli aiuti non crescono al salire della difficoltà", () => {
  const order = ["facile", "normale", "difficile", "incubo"];
  const tot = (k) => Object.values(DIFFICULTIES[k].aids).reduce((s, n) => s + n, 0);
  for (let i = 1; i < order.length; i++) {
    assert.ok(tot(order[i]) <= tot(order[i - 1]), `${order[i]} non può avere più aiuti di ${order[i - 1]}`);
  }
});

test("il target è sempre 16-0, in ogni difficoltà", () => {
  for (const key of Object.keys(DIFFICULTIES)) {
    assert.equal(DIFFICULTIES[key].N, 16, `${key}: N deve essere 16`);
  }
});

test("la difficoltà cresce: la banda avversari non cala (N resta costante)", () => {
  const order = ["facile", "normale", "difficile", "incubo"];
  for (let i = 1; i < order.length; i++) {
    assert.ok(DIFFICULTIES[order[i]].oppMax >= DIFFICULTIES[order[i - 1]].oppMax);
  }
  // L'ultimo livello deve stringere anche in partenza, non solo all'arrivo:
  // in Incubo la prima partita è già seria.
  assert.ok(DIFFICULTIES.incubo.oppMin > DIFFICULTIES.facile.oppMin);
});

// Le 175 rose storiche stanno tra 38 e 69 sulla scala nativa del voto, mediana
// 52. Il tetto si è mosso due volte: 74 quando l'avversario era una top-5, 67
// con le rose da dieci pesate per minuti, 69 da G7 - la panchina avversaria
// adesso prende i cinque migliori rimasti invece del secondo di ogni ruolo,
// quindi le squadre storiche sono un po' più forti. Soglie fuori da lì non sono
// "difficili": sono rotte, perché pickOpponent finirebbe per pescare sempre le
// stesse squadre - è esattamente quello che è successo quando il voto è passato
// dagli overall 2K ai reparti e le soglie sono rimaste a 70-99. I numeri qui
// sotto si rimisurano con `node tools/taratura-soglie.mjs`.
test("le soglie stanno dentro l'intervallo reale delle rose storiche", () => {
  const POOL_MIN = 38;
  const POOL_MAX = 69;
  for (const [key, d] of Object.entries(DIFFICULTIES)) {
    assert.ok(d.oppMin >= POOL_MIN, `${key}: oppMin ${d.oppMin} sotto il pool (${POOL_MIN})`);
    assert.ok(d.oppMax <= POOL_MAX, `${key}: oppMax ${d.oppMax} sopra il pool (${POOL_MAX})`);
    // La soglia deve salire: un livello con la banda piatta gioca sedici volte
    // la stessa partita.
    assert.ok(d.oppMax - d.oppMin >= 5,
      `${key}: banda di ${d.oppMax - d.oppMin} punti, la soglia non sale`);
  }
});

// Nei due livelli d'ingresso la rampa deve sentirsi: si parte da avversari
// abbordabili e si finisce contro i mostri. Negli altri due la corsa è dura da
// subito, ed è il senso di "difficile" e "incubo".
test("Facile e Normale hanno una rampa vera, non una banda stretta", () => {
  for (const key of ["facile", "normale"]) {
    const d = DIFFICULTIES[key];
    assert.ok(d.oppMax - d.oppMin >= 15,
      `${key}: banda di ${d.oppMax - d.oppMin} punti, troppo piatta per una rampa`);
  }
});

// ---- la scala del reveal ----

test("ogni difficoltà ha il suo reveal, con gli stessi campi", () => {
  const campi = ["voto", "stat", "annata", "squadra", "ruolo"];
  for (const liv of Object.keys(DIFFICULTIES)) {
    assert.ok(REVEAL[liv], `manca il reveal di ${liv}`);
    assert.deepEqual(Object.keys(REVEAL[liv]).sort(), [...campi].sort(), `campi diversi in ${liv}`);
  }
});

test("la scala non risale mai: piu difficile non mostra piu cose", () => {
  const scala = ["facile", "normale", "difficile", "incubo"];
  for (let i = 1; i < scala.length; i++) {
    for (const campo of Object.keys(REVEAL[scala[i]])) {
      if (mostra(scala[i], campo)) {
        assert.ok(mostra(scala[i - 1], campo),
          `${scala[i]} mostra ${campo} ma ${scala[i - 1]} lo nasconde`);
      }
    }
  }
});

test("facile e normale mostrano le stesse cose: cambiano aiuti e tetto", () => {
  assert.deepEqual(REVEAL.facile, REVEAL.normale);
  assert.notDeepEqual(DIFFICULTIES.facile.aids, DIFFICULTIES.normale.aids);
  assert.notEqual(TETTI.facile, TETTI.normale);
});

test("da difficile spariscono voto e annata, in incubo resta solo il cartellino", () => {
  assert.equal(mostra("difficile", "voto"), false);
  assert.equal(mostra("difficile", "annata"), false);
  assert.equal(mostra("difficile", "stat"), true);
  for (const campo of Object.keys(REVEAL.incubo)) assert.equal(mostra("incubo", campo), false);
});

test("mostra si arrabbia su livelli e campi inventati", () => {
  assert.throws(() => mostra("impossibile", "voto"), /Difficoltà inesistente/);
  assert.throws(() => mostra("facile", "colore"), /Campo inesistente/);
});
