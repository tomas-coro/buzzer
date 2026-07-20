# buzzer — NBA Draft Game

Gioco di **draft NBA multi-stagione**, ispirato al gioco "38-0-0": si costruisce un quintetto
scegliendo tra carte giocatore-stagione tratte da più annate (edizioni 2K dal 2K16 al 2K21).

> **Stato attuale — Fase 1 (Dati): completata.**
> Il repo contiene la *pipeline che genera il dataset* e i *mockup di design* dell'interfaccia.
> Il gioco vero e proprio (**Fase 2**) non è ancora implementato.

---

## Struttura del progetto

```
data/            Pipeline Python che costruisce il dataset dei giocatori
  teams.py         sigla squadra -> nome completo (es. "GSW" -> "Golden State Warriors")
  normalize.py     normalizzazioni pure (id giocatore, stagione -> edizione 2K)
  build.py         una riga CSV -> "carta" giocatore-stagione; assembla cards + indici
  sanity.py        controlli di coerenza sul dataset (conteggi, OVR, collisioni)
  build_step1.py   entry point: scarica il CSV, costruisce, verifica, scrive nba-data.js
  nba-data.js      DATASET GENERATO (non modificare a mano) — lo userà il gioco
tests/           Suite pytest (usa fixture in tests/fixtures/, non i dati grezzi)
mockups/         Esplorazioni di design in HTML (direzioni estetiche, flussi, animazioni)
docs/            Specifiche e piani di lavoro
```

## Come partire

Serve **Python 3.10+**. Dopo aver clonato il repo:

```bash
cd buzzer

# (opzionale) ambiente virtuale
python -m venv .venv
source .venv/bin/activate          # su Windows: .venv\Scripts\activate

# installa le dipendenze (solo pytest, per i test)
pip install -r requirements.txt

# lancia i test — devono dare "20 passed"
python -m pytest -q

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

- **Fonte:** [`willyiamyu/nba2k_analysis`](https://github.com/willyiamyu/nba2k_analysis) — file `nba_rankings_2014-2020`.
- **Stagioni:** dal 2014-15 al 2019-20, mappate alle edizioni **2K16 → 2K21**.
