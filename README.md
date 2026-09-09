# buzzer — NBA Draft Game

Gioco di **draft NBA multi-stagione**: costruisci una rosa da dieci giocatori,
scegli il coach e prova a vincere 16 partite senza sconfitte.

> **Stato attuale:** prototipo completo e giocabile, collegato al motore di partita.
> Include 10.564 carte, 40 stagioni dal 1984-85 al 2025-26 e quattro difficoltà.

---

## Struttura del progetto

```
data/                  Pipeline e dataset dei giocatori
game/                  Motore puro di draft, coach e partite
prototype/imbattuto/    App web giocabile
assets/volti/           Foto giocatori, con fallback alle iniziali
mockups/                Esplorazioni di design
```

## Avvio dell'app

```bash
python3 -m http.server 8000
# http://localhost:8000/prototype/imbattuto/
```

## Come partire

Serve **Python 3.10+**. Dopo aver clonato il repo:

```bash
cd buzzer

# (opzionale) ambiente virtuale
python -m venv .venv
source .venv/bin/activate          # su Windows: .venv\Scripts\activate

# installa le dipendenze di test
pip install -r requirements.txt
playwright install chromium

# test del motore e del prototipo
npm test

# test della pipeline dati
python -m pytest -q

# percorso browser completo, desktop e mobile
python tools/smoke_imbattuto.py

# rigenera il dataset da zero (riscarica il CSV se manca)
python -m data.build_step1
```

## Come funziona la pipeline

1. `build_step1.py` scarica il CSV sorgente (con cache locale in `data/raw/`, che è ignorato da git).
2. Ogni riga diventa una **carta**: `player_id`, nome, stagione, edizione 2K, squadra, OVR, statistiche reali.
3. Le carte vengono indicizzate per **squadra+stagione** (`byTeamSeason`) e per **giocatore** (`byPlayer`),
   con id interi che puntano alle carte per non duplicare i dati.
4. `sanity.py` verifica la coerenza; se ci sono errori **non** riscrive `nba-data.js`.
5. Il risultato viene salvato in `data/nba-data.js` come `const NBA_DATA = {...}`,
   così il gioco potrà leggerlo anche aprendo un file `file://` senza server.

Il CSV grezzo **non è versionato di proposito**: è una cache che la pipeline riscarica da sola.
Il dataset generato (`nba-data.js`) è invece committato ed è riproducibile byte-per-byte.

## Dati

L'app usa 10.564 carte distribuite in 804 squadre-stagione, dal 1984-85 al
2025-26. `prototype/imbattuto/cards.js` è generato: per aggiornarlo esegui
`node prototype/imbattuto/build-cards.mjs`.

## Pubblicazione

Il workflow GitHub Pages pubblica `main` su
<https://tomas-coro.github.io/buzzer/>. Il repository deve consentire GitHub
Pages tramite Actions.
