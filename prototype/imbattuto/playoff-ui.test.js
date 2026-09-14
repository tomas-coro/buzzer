import { test } from "node:test";
import assert from "node:assert/strict";
import * as runScreen from "./screens/run.js";
import * as esitoScreen from "./screens/esito.js";

test("la schermata run espone i dati del broadcast playoff", () => {
  assert.equal(typeof runScreen.playoffHeaderData, "function");
});

test("l'esito espone il riepilogo delle serie playoff", () => {
  assert.equal(typeof esitoScreen.seriePlayoff, "function");
});

test("il bracket riassume record e avversario di ogni round", () => {
  const serie = esitoScreen.seriePlayoff([
    { round: 1, avversario: "BOS", stagione: "1985-86", vinto: true },
    { round: 1, avversario: "BOS", stagione: "1985-86", vinto: false },
    { round: 1, avversario: "BOS", stagione: "1985-86", vinto: true },
    { round: 1, avversario: "BOS", stagione: "1985-86", vinto: true },
    { round: 1, avversario: "BOS", stagione: "1985-86", vinto: true },
  ]);
  assert.deepEqual(serie[0], {
    round: "Round 1", record: "4-1", avversario: "Boston Celtics", stagione: "1985-86",
  });
});

test("il broadcast usa nome vero del round e sette stati gara", () => {
  const data = runScreen.playoffHeaderData({
    round: 2, gara: 4, serieRecord: { noi: 2, loro: 1 },
    storia: [
      { round: 2, vinto: true },
      { round: 2, vinto: false },
      { round: 2, vinto: true },
    ],
  });
  assert.equal(data.round, "Semifinale di Conference");
  assert.deepEqual(data.gare, ["win", "lose", "win", "now", "", "", ""]);
});
