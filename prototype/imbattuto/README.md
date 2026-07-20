# Prototipo L'IMBATTUTO

Prototipo cliccabile della modalità, collegato al motore `game/*.js`.

## Avvio

Gli import ES dal motore non funzionano da `file://`. Servi il repo e apri l'URL:

```bash
# dalla root del repo buzzer
python3 -m http.server 8000
# poi apri: http://localhost:8000/prototype/imbattuto/
```

## Test dei moduli puri

```bash
node --test prototype/imbattuto/*.test.js
```

## Dati carta

`cards.js` è generato da `build-cards.mjs` (blend dati buzzer + nba-sim). Per rigenerarlo:

```bash
node prototype/imbattuto/build-cards.mjs
```

Le carte con `estimated:true` hanno attributi derivati (provvisori) e sono marcate a schermo.
