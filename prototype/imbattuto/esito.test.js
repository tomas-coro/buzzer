import { test } from "node:test";
import assert from "node:assert/strict";
import { testoCondivisione } from "./screens/esito.js";

test("il risultato condiviso include record, difficoltà e rosa", () => {
  const state = {
    esito: "sconfitta", vittorie: 7, difficolta: "difficile",
    rosa: {
      titolari: { PG: { name: "Stephen Curry" }, SG: { name: "Michael Jordan" } },
      panca: { 6: null },
    },
  };
  assert.equal(
    testoCondivisione(state),
    "L'IMBATTUTO — 7-1 · Difficile\nRosa: Stephen Curry, Michael Jordan",
  );
});
