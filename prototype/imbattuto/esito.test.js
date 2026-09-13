import { test } from "node:test";
import assert from "node:assert/strict";
import { testoCondivisione } from "./screens/esito.js";

test("il risultato condiviso include record, difficoltà e rosa", () => {
  const state = {
    formato: "imbattuto", esito: "sconfitta", vittorie: 7, difficolta: "difficile",
    rosa: {
      titolari: { PG: { name: "Stephen Curry" }, SG: { name: "Michael Jordan" } },
      panca: { 6: null },
    },
  };
  assert.equal(
    testoCondivisione(state),
    "L'IMBATTUTO - 7-1 · Difficile\nRosa: Stephen Curry, Michael Jordan",
  );
});

test("il titolo playoff condivide le quattro serie vinte", () => {
  const state = {
    formato: "playoff", esito: "campione", vittorie: 4, difficolta: "normale",
    rosa: { titolari: { PG: { name: "Stephen Curry" } }, panca: {} },
  };
  assert.match(testoCondivisione(state), /^CAMPIONE - 4 serie vinte · Normale/);
});

test("una serie playoff persa a metà corsa conta le sconfitte dalla storia, non 0/1", () => {
  const state = {
    formato: "playoff", esito: "sconfitta", vittorie: 1, difficolta: "normale",
    storia: [
      { vinto: true }, { vinto: true }, { vinto: true },
      { vinto: false }, { vinto: false }, { vinto: false }, { vinto: false },
    ],
    rosa: { titolari: { PG: { name: "Stephen Curry" } }, panca: {} },
  };
  assert.equal(
    testoCondivisione(state),
    "SERIE PLAYOFF - 1-4 · Normale\nRosa: Stephen Curry",
  );
});
