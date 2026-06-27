# Fase 1 · Step 1 — Dataset OVR multi-stagione · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire, da una sola fonte già pronta e senza scraping, un dataset 2K multi-stagione (OVR + roster + versioni per anno) che la Fase 2 (il gioco) potrà interrogare per *squadra + stagione*.

**Architecture:** Pipeline Python in un solo passaggio: scarica un CSV libero da GitHub → normalizza (slug giocatore, sigla→nome squadra, stagione→edizione) → assembla `cards` + due indici (`byTeamSeason`, `byPlayer`) → verifica con sanity check stampati → scrive `data/nba-data.js` (global `const NBA_DATA`, leggibile dal gioco su `file://`). Funzioni pure separate dall'I/O di rete, così sono testabili senza internet.

**Tech Stack:** Python 3.13 (solo stdlib: `csv`, `urllib`, `json`, `unicodedata`, `re`), pytest 8.2 per i test. Nessuna dipendenza da installare. Output consumato da JS statico.

## Global Constraints

- **Fonte unica (verbatim):** `https://raw.githubusercontent.com/willyiamyu/nba2k_analysis/master/nba_rankings_2014-2020` — CSV, ~340KB, 2412 righe. **Zero scraping, zero login Kaggle.**
- **Colonna OVR:** `rankings` (valori tipo `80.0` → cast a intero). **Colonne lette:** `PLAYER, TEAM, SEASON, GP, MIN, PTS, FG%, 3P%, FT%, REB, AST, TOV, STL, BLK, +/-, rankings`.
- **Stagioni attese (6, verbatim):** `2014-15, 2015-16, 2016-17, 2017-18, 2018-19, 2019-20`.
- **Mappa stagione→edizione (verbatim):** `2014-15→2K16, 2015-16→2K17, 2016-17→2K18, 2017-18→2K19, 2018-19→2K20, 2019-20→2K21`.
- **Etichetta mostrata all'utente = la `SEASON` reale** (non l'edizione).
- **NON in questo Step (YAGNI):** attributi 2K, split ATT/DIF, posizione/ruoli, UI di gioco, leggende, edizioni 2K22-27.
- **Niente fallback silenziosi:** una sigla squadra sconosciuta o un OVR mancante devono **sollevare un errore chiaro**, non essere ignorati.
- **Output:** `data/nba-data.js`, un global `const NBA_DATA = {...};` (JSON dentro). File generato, mai modificato a mano.
- **Git/commit:** il checkpoint a fine task è un **commit locale**. Richiede `git init` (Task 0, scelta di Tomas). **Nessun push** senza ok esplicito. Messaggi in Conventional Commits. Se Tomas non vuole git, si salta lo step "Commit" di ogni task.

---

### Task 0: Setup della pipeline dati

**Files:**
- Create: `data/__init__.py`
- Create: `conftest.py` (vuoto — fa sì che pytest aggiunga la root al path d'import)
- Create: `tests/__init__.py`
- Create: `tests/fixtures/sample_rows.csv`
- Create: `tests/test_smoke.py`

**Interfaces:**
- Consumes: niente.
- Produces: la struttura di cartelle e la fixture `tests/fixtures/sample_rows.csv` (6 righe reali ridotte) che tutti i task seguenti useranno.

- [ ] **Step 1: (opzionale, scelta di Tomas) inizializzare git**

Solo se Tomas dà l'ok a versionare il progetto:
```bash
cd "C:/Users/TomasCoro/Desktop/PERSONAL/siti-app/nba-draft-game"
git init
printf "__pycache__/\n*.pyc\n.pytest_cache/\ndata/raw/\n" > .gitignore
```
Se Tomas non vuole git, saltare questo step e tutti gli step "Commit".

- [ ] **Step 2: creare la struttura di cartelle e i file vuoti**

```bash
mkdir -p data tests/fixtures data/raw
touch data/__init__.py tests/__init__.py conftest.py
```

- [ ] **Step 3: creare la fixture `tests/fixtures/sample_rows.csv`**

Contiene un giocatore con accento (Jokić), lo stesso giocatore in due stagioni (Curry), due squadre e due stagioni — abbastanza per testare normalizzazione, raggruppamento e indici.

```csv
,PLAYER,TEAM,SEASON,GP,MIN,PTS,FG%,3P%,FT%,REB,AST,TOV,STL,BLK,+/-,rankings
0,Stephen Curry,GSW,2015-16,79,34.2,30.1,50.4,45.4,90.8,5.4,6.7,3.3,2.1,0.2,11.9,94.0
1,Stephen Curry,GSW,2016-17,79,33.4,25.3,46.8,41.1,89.8,4.5,6.6,3.0,1.8,0.2,9.0,93.0
2,Nikola Jokić,DEN,2017-18,75,32.6,18.5,49.9,39.6,85.0,10.7,6.1,2.8,1.2,0.8,3.6,87.0
3,Draymond Green,GSW,2015-16,81,34.7,14.0,49.0,38.8,69.6,9.5,7.4,3.2,1.5,1.4,13.2,86.0
4,Jamal Murray,DEN,2017-18,82,31.0,16.7,45.1,37.8,90.5,3.7,3.4,2.1,1.0,0.3,1.6,79.0
5,Kevin Durant,GSW,2016-17,62,33.4,25.1,53.7,37.5,87.5,8.3,4.8,2.2,1.1,1.6,12.6,93.0
```

- [ ] **Step 4: scrivere un test smoke**

`tests/test_smoke.py`:
```python
from pathlib import Path

def test_fixture_esiste_e_ha_intestazione():
    csv_path = Path(__file__).parent / "fixtures" / "sample_rows.csv"
    header = csv_path.read_text(encoding="utf-8").splitlines()[0]
    assert "rankings" in header
    assert "PLAYER" in header
```

- [ ] **Step 5: eseguire pytest (deve passare)**

Run: `python -m pytest tests/test_smoke.py -v`
Expected: PASS (1 passed).

- [ ] **Step 6: Commit (se git inizializzato)**

```bash
git add -A
git commit -m "chore: scaffold pipeline dati Fase 1 Step 1 + fixture di test"
```

---

### Task 1: Normalizzazione — slug giocatore e stagione→edizione

**Files:**
- Create: `data/normalize.py`
- Test: `tests/test_normalize.py`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `slugify_player_id(name: str) -> str` (es. `"Stephen Curry"`→`"stephen-curry"`, `"Nikola Jokić"`→`"nikola-jokic"`).
  - `SEASON_TO_EDITION: dict[str, str]` e `season_to_edition(season: str) -> str` (solleva `ValueError` se la stagione non è mappata).

- [ ] **Step 1: scrivere i test (devono fallire)**

`tests/test_normalize.py`:
```python
import pytest
from data.normalize import slugify_player_id, season_to_edition

def test_slug_base():
    assert slugify_player_id("Stephen Curry") == "stephen-curry"

def test_slug_accenti():
    assert slugify_player_id("Nikola Jokić") == "nikola-jokic"

def test_slug_suffisso_e_spazi():
    assert slugify_player_id("Tim  Hardaway Jr.") == "tim-hardaway-jr"

def test_edizione_valida():
    assert season_to_edition("2015-16") == "2K17"

def test_edizione_sconosciuta_solleva():
    with pytest.raises(ValueError):
        season_to_edition("1999-00")
```

- [ ] **Step 2: eseguire i test e verificare che falliscano**

Run: `python -m pytest tests/test_normalize.py -v`
Expected: FAIL (ModuleNotFoundError: No module named 'data.normalize').

- [ ] **Step 3: implementare `data/normalize.py`**

```python
"""Funzioni pure di normalizzazione per la pipeline dati Fase 1."""
import re
import unicodedata

SEASON_TO_EDITION = {
    "2014-15": "2K16",
    "2015-16": "2K17",
    "2016-17": "2K18",
    "2017-18": "2K19",
    "2018-19": "2K20",
    "2019-20": "2K21",
}


def slugify_player_id(name: str) -> str:
    """'Stephen Curry' -> 'stephen-curry'. Rimuove accenti, minuscolo, separatore '-'."""
    decomposed = unicodedata.normalize("NFKD", name)
    no_accents = "".join(c for c in decomposed if not unicodedata.combining(c))
    slug = no_accents.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)   # tutto ciò che non è lettera/numero -> '-'
    slug = re.sub(r"-+", "-", slug).strip("-")  # niente '-' doppi o ai bordi
    return slug


def season_to_edition(season: str) -> str:
    """'2015-16' -> '2K17'. Solleva ValueError se la stagione non è nel range coperto."""
    try:
        return SEASON_TO_EDITION[season]
    except KeyError:
        raise ValueError(f"Stagione non mappata a un'edizione 2K: {season!r}")
```

- [ ] **Step 4: eseguire i test e verificare che passino**

Run: `python -m pytest tests/test_normalize.py -v`
Expected: PASS (5 passed).

- [ ] **Step 5: Commit**

```bash
git add data/normalize.py tests/test_normalize.py
git commit -m "feat: normalizzazione slug giocatore e mappa stagione->edizione"
```

---

### Task 2: Mappa sigla squadra → nome completo

**Files:**
- Create: `data/teams.py`
- Test: `tests/test_teams.py`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `TEAM_ABBR_TO_NAME: dict[str, str]` (30 squadre + alias comuni).
  - `team_name(abbr: str) -> str` (solleva `ValueError` su sigla sconosciuta — niente fallback silenzioso).

- [ ] **Step 1: scrivere i test (devono fallire)**

`tests/test_teams.py`:
```python
import pytest
from data.teams import team_name

def test_sigla_nota():
    assert team_name("GSW") == "Golden State Warriors"
    assert team_name("DEN") == "Denver Nuggets"

def test_alias_phoenix():
    # alcune fonti usano 'PHO' invece di 'PHX'
    assert team_name("PHO") == "Phoenix Suns"

def test_sigla_sconosciuta_solleva():
    with pytest.raises(ValueError):
        team_name("ZZZ")
```

- [ ] **Step 2: eseguire i test e verificare che falliscano**

Run: `python -m pytest tests/test_teams.py -v`
Expected: FAIL (ModuleNotFoundError: No module named 'data.teams').

- [ ] **Step 3: implementare `data/teams.py`**

```python
"""Mappa sigla squadra (stats.nba/hoopshype) -> nome completo, era 2014-2020."""

TEAM_ABBR_TO_NAME = {
    "ATL": "Atlanta Hawks",
    "BOS": "Boston Celtics",
    "BKN": "Brooklyn Nets",
    "CHA": "Charlotte Hornets",
    "CHI": "Chicago Bulls",
    "CLE": "Cleveland Cavaliers",
    "DAL": "Dallas Mavericks",
    "DEN": "Denver Nuggets",
    "DET": "Detroit Pistons",
    "GSW": "Golden State Warriors",
    "HOU": "Houston Rockets",
    "IND": "Indiana Pacers",
    "LAC": "Los Angeles Clippers",
    "LAL": "Los Angeles Lakers",
    "MEM": "Memphis Grizzlies",
    "MIA": "Miami Heat",
    "MIL": "Milwaukee Bucks",
    "MIN": "Minnesota Timberwolves",
    "NOP": "New Orleans Pelicans",
    "NYK": "New York Knicks",
    "OKC": "Oklahoma City Thunder",
    "ORL": "Orlando Magic",
    "PHI": "Philadelphia 76ers",
    "PHX": "Phoenix Suns",
    "POR": "Portland Trail Blazers",
    "SAC": "Sacramento Kings",
    "SAS": "San Antonio Spurs",
    "TOR": "Toronto Raptors",
    "UTA": "Utah Jazz",
    "WAS": "Washington Wizards",
    # alias comuni di altre fonti (basketball-reference ecc.)
    "BRK": "Brooklyn Nets",
    "PHO": "Phoenix Suns",
    "CHO": "Charlotte Hornets",
}


def team_name(abbr: str) -> str:
    """Sigla -> nome completo. Solleva ValueError se la sigla non è nota."""
    try:
        return TEAM_ABBR_TO_NAME[abbr.strip().upper()]
    except KeyError:
        raise ValueError(f"Sigla squadra sconosciuta: {abbr!r} (aggiungerla a TEAM_ABBR_TO_NAME)")
```

- [ ] **Step 4: eseguire i test e verificare che passino**

Run: `python -m pytest tests/test_teams.py -v`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add data/teams.py tests/test_teams.py
git commit -m "feat: mappa sigla squadra -> nome completo con alias"
```

---

### Task 3: Parsing di una riga CSV → carta giocatore

**Files:**
- Create: `data/build.py`
- Test: `tests/test_parse_row.py`

**Interfaces:**
- Consumes: `slugify_player_id`, `season_to_edition` (Task 1); `team_name` (Task 2).
- Produces:
  - `STAT_FIELDS: dict[str, str]` (colonna CSV → chiave output).
  - `parse_row(row: dict) -> dict` → carta con chiavi: `player_id, name, season, edition, team, team_abbr, ovr (int), stats_real (dict)`. Solleva `ValueError` se `rankings` è vuoto.
  - `build_cards(rows: list[dict]) -> list[dict]`.

- [ ] **Step 1: scrivere i test (devono fallire)**

`tests/test_parse_row.py`:
```python
import csv
from pathlib import Path
import pytest
from data.build import parse_row, build_cards

def _rows():
    csv_path = Path(__file__).parent / "fixtures" / "sample_rows.csv"
    with csv_path.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))

def test_parse_row_curry():
    row = _rows()[0]  # Stephen Curry 2015-16
    card = parse_row(row)
    assert card["player_id"] == "stephen-curry"
    assert card["name"] == "Stephen Curry"
    assert card["season"] == "2015-16"
    assert card["edition"] == "2K17"
    assert card["team"] == "Golden State Warriors"
    assert card["team_abbr"] == "GSW"
    assert card["ovr"] == 94
    assert card["stats_real"]["pts"] == 30.1
    assert card["stats_real"]["ast"] == 6.7

def test_parse_row_ovr_mancante_solleva():
    row = dict(_rows()[0])
    row["rankings"] = ""
    with pytest.raises(ValueError):
        parse_row(row)

def test_build_cards_conta_tutte_le_righe():
    cards = build_cards(_rows())
    assert len(cards) == 6
```

- [ ] **Step 2: eseguire i test e verificare che falliscano**

Run: `python -m pytest tests/test_parse_row.py -v`
Expected: FAIL (ImportError: cannot import name 'parse_row').

- [ ] **Step 3: implementare `parse_row` / `build_cards` in `data/build.py`**

```python
"""Costruzione del dataset multi-stagione a partire dalle righe CSV."""
from data.normalize import slugify_player_id, season_to_edition
from data.teams import team_name

# colonna CSV -> chiave nello stats_real di output
STAT_FIELDS = {
    "PTS": "pts", "REB": "reb", "AST": "ast", "STL": "stl", "BLK": "blk",
    "TOV": "tov", "FG%": "fg_pct", "3P%": "tp_pct", "FT%": "ft_pct",
    "MIN": "min", "GP": "gp", "+/-": "plus_minus",
}


def _to_float(value: str):
    value = (value or "").strip()
    if value in ("", "nan", "NaN"):
        return None
    return float(value)


def parse_row(row: dict) -> dict:
    """Una riga del CSV -> una carta giocatore-stagione."""
    name = row["PLAYER"].strip()
    season = row["SEASON"].strip()
    abbr = row["TEAM"].strip()

    ovr_raw = (row.get("rankings") or "").strip()
    if ovr_raw in ("", "nan", "NaN"):
        raise ValueError(f"OVR (rankings) mancante per {name} {season}")
    ovr = int(round(float(ovr_raw)))

    stats_real = {key: _to_float(row.get(col, "")) for col, key in STAT_FIELDS.items()}

    return {
        "player_id": slugify_player_id(name),
        "name": name,
        "season": season,
        "edition": season_to_edition(season),
        "team": team_name(abbr),
        "team_abbr": abbr.upper(),
        "ovr": ovr,
        "stats_real": stats_real,
    }


def build_cards(rows: list) -> list:
    """Tutte le righe -> lista di carte."""
    return [parse_row(r) for r in rows]
```

- [ ] **Step 4: eseguire i test e verificare che passino**

Run: `python -m pytest tests/test_parse_row.py -v`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add data/build.py tests/test_parse_row.py
git commit -m "feat: parsing riga CSV -> carta giocatore-stagione"
```

---

### Task 4: Assemblaggio dataset — cards + indici per squadra/stagione e per giocatore

**Files:**
- Modify: `data/build.py` (aggiungi `build_dataset`)
- Test: `tests/test_build_dataset.py`

**Interfaces:**
- Consumes: `build_cards` (Task 3).
- Produces:
  - `build_dataset(rows: list[dict], source_url: str = "") -> dict` con forma:
    ```
    {
      "meta": {"source_url": str, "seasons": [str], "n_cards": int, "n_players": int},
      "cards": [ {"id": int, ...campi della carta...}, ... ],
      "byTeamSeason": { "<team>|<season>": [int, ...] },   # id ordinati per OVR desc
      "byPlayer":     { "<player_id>": [int, ...] },        # id ordinati per stagione
    }
    ```
  Gli indici contengono **id interi** che puntano a `cards` (niente duplicazione dati).

- [ ] **Step 1: scrivere i test (devono fallire)**

`tests/test_build_dataset.py`:
```python
import csv
from pathlib import Path
from data.build import build_dataset

def _rows():
    csv_path = Path(__file__).parent / "fixtures" / "sample_rows.csv"
    with csv_path.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))

def test_meta_conta_carte_e_giocatori():
    data = build_dataset(_rows())
    assert data["meta"]["n_cards"] == 6
    # Curry compare 2 volte -> 5 giocatori unici
    assert data["meta"]["n_players"] == 5
    assert data["meta"]["seasons"] == ["2015-16", "2016-17", "2017-18"]

def test_by_player_raggruppa_versioni_in_ordine_di_stagione():
    data = build_dataset(_rows())
    ids = data["byPlayer"]["stephen-curry"]
    seasons = [data["cards"][i]["season"] for i in ids]
    assert seasons == ["2015-16", "2016-17"]

def test_by_team_season_ordina_per_ovr_desc():
    data = build_dataset(_rows())
    ids = data["byTeamSeason"]["Golden State Warriors|2015-16"]
    cards = [data["cards"][i] for i in ids]
    # Curry (94) prima di Draymond (86)
    assert [c["name"] for c in cards] == ["Stephen Curry", "Draymond Green"]

def test_ogni_carta_ha_id_coerente_con_la_posizione():
    data = build_dataset(_rows())
    for i, card in enumerate(data["cards"]):
        assert card["id"] == i
```

- [ ] **Step 2: eseguire i test e verificare che falliscano**

Run: `python -m pytest tests/test_build_dataset.py -v`
Expected: FAIL (ImportError: cannot import name 'build_dataset').

- [ ] **Step 3: aggiungere `build_dataset` in `data/build.py`**

Aggiungi in fondo al file:
```python
def build_dataset(rows: list, source_url: str = "") -> dict:
    """Righe CSV -> dataset completo (cards + indici + meta)."""
    cards = build_cards(rows)
    for i, card in enumerate(cards):
        card["id"] = i

    by_team_season: dict = {}
    by_player: dict = {}
    for card in cards:
        ts_key = f"{card['team']}|{card['season']}"
        by_team_season.setdefault(ts_key, []).append(card["id"])
        by_player.setdefault(card["player_id"], []).append(card["id"])

    # ordina: roster per OVR desc (poi nome); versioni giocatore per stagione
    for ids in by_team_season.values():
        ids.sort(key=lambda i: (-cards[i]["ovr"], cards[i]["name"]))
    for ids in by_player.values():
        ids.sort(key=lambda i: cards[i]["season"])

    seasons = sorted({c["season"] for c in cards})
    meta = {
        "source_url": source_url,
        "seasons": seasons,
        "n_cards": len(cards),
        "n_players": len(by_player),
    }
    return {"meta": meta, "cards": cards, "byTeamSeason": by_team_season, "byPlayer": by_player}
```

- [ ] **Step 4: eseguire i test e verificare che passino**

Run: `python -m pytest tests/test_build_dataset.py -v`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add data/build.py tests/test_build_dataset.py
git commit -m "feat: assemblaggio dataset con indici byTeamSeason e byPlayer"
```

---

### Task 5: Sanity check del dataset

**Files:**
- Create: `data/sanity.py`
- Test: `tests/test_sanity.py`

**Interfaces:**
- Consumes: l'output di `build_dataset` (Task 4).
- Produces:
  - `run_sanity(data: dict, expected_seasons: int = 6) -> tuple[list[str], list[str]]` → `(report, errors)`. `report` = righe da stampare; `errors` = problemi bloccanti (lista vuota = tutto ok).

- [ ] **Step 1: scrivere i test (devono fallire)**

`tests/test_sanity.py`:
```python
import csv
from pathlib import Path
from data.build import build_dataset
from data.sanity import run_sanity

def _data():
    csv_path = Path(__file__).parent / "fixtures" / "sample_rows.csv"
    with csv_path.open(encoding="utf-8") as f:
        return build_dataset(list(csv.DictReader(f)))

def test_fixture_ha_3_stagioni_attese():
    report, errors = run_sanity(_data(), expected_seasons=3)
    assert errors == []
    assert any("Carte totali: 6" in line for line in report)

def test_numero_stagioni_sbagliato_e_errore():
    _, errors = run_sanity(_data(), expected_seasons=6)
    assert any("stagioni" in e for e in errors)

def test_ovr_fuori_range_e_errore():
    data = _data()
    data["cards"][0]["ovr"] = 150
    _, errors = run_sanity(data, expected_seasons=3)
    assert any("OVR fuori" in e for e in errors)

def test_collisione_player_id_e_errore():
    data = _data()
    # forzo due nomi diversi sullo stesso player_id
    data["cards"][0]["player_id"] = "stephen-curry"
    data["cards"][0]["name"] = "Steph Curry"
    data["cards"][1]["player_id"] = "stephen-curry"
    data["byPlayer"]["stephen-curry"] = [0, 1]
    _, errors = run_sanity(data, expected_seasons=3)
    assert any("nomi diversi" in e for e in errors)
```

- [ ] **Step 2: eseguire i test e verificare che falliscano**

Run: `python -m pytest tests/test_sanity.py -v`
Expected: FAIL (ModuleNotFoundError: No module named 'data.sanity').

- [ ] **Step 3: implementare `data/sanity.py`**

```python
"""Controlli di coerenza sul dataset costruito. Stampa un report e segnala errori bloccanti."""
from collections import defaultdict


def run_sanity(data: dict, expected_seasons: int = 6):
    cards = data["cards"]
    report: list = []
    errors: list = []

    seasons = sorted({c["season"] for c in cards})
    report.append(f"Carte totali: {len(cards)}")
    report.append(f"Giocatori unici: {data['meta']['n_players']}")
    report.append(f"Stagioni ({len(seasons)}): {', '.join(seasons)}")
    if len(seasons) != expected_seasons:
        errors.append(f"Attese {expected_seasons} stagioni, trovate {len(seasons)}")

    # squadre per stagione (~30 attese sul dataset reale)
    for s in seasons:
        teams = {c["team"] for c in cards if c["season"] == s}
        report.append(f"  {s}: {len(teams)} squadre")

    # OVR nel range plausibile
    fuori = [c for c in cards if not (40 <= c["ovr"] <= 99)]
    if fuori:
        errors.append(f"{len(fuori)} carte con OVR fuori [40,99] (es. {fuori[0]['name']} {fuori[0]['ovr']})")

    # top-5 OVR per stagione (controllo a occhio della plausibilità)
    for s in seasons:
        top = sorted((c for c in cards if c["season"] == s), key=lambda c: -c["ovr"])[:5]
        report.append("  TOP " + s + ": " + ", ".join(f"{c['name']}({c['ovr']})" for c in top))

    # collisioni: stesso player_id con nomi diversi
    names_by_id = defaultdict(set)
    for c in cards:
        names_by_id[c["player_id"]].add(c["name"])
    collisioni = {k: v for k, v in names_by_id.items() if len(v) > 1}
    if collisioni:
        esempio = next(iter(collisioni.items()))
        errors.append(f"{len(collisioni)} player_id con nomi diversi (es. {esempio[0]}: {sorted(esempio[1])})")

    return report, errors
```

- [ ] **Step 4: eseguire i test e verificare che passino**

Run: `python -m pytest tests/test_sanity.py -v`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add data/sanity.py tests/test_sanity.py
git commit -m "feat: sanity check del dataset (conteggi, OVR, top per stagione, collisioni)"
```

---

### Task 6: Orchestratore — scarica, costruisce, verifica, scrive `nba-data.js` (run reale)

**Files:**
- Create: `data/build_step1.py`
- Test: verifica **manuale sul dato reale** (è I/O di rete: non un unit test) + l'intera suite pytest deve restare verde.

**Interfaces:**
- Consumes: `build_dataset` (Task 4), `run_sanity` (Task 5).
- Produces: lo script eseguibile `python -m data.build_step1` che genera `data/nba-data.js` e stampa il report. **Deliverable finale = il file `data/nba-data.js` + il report sanity mostrato a Tomas.**

- [ ] **Step 1: implementare `data/build_step1.py`**

```python
"""Pipeline Fase 1 Step 1: scarica il CSV, costruisce il dataset, verifica, scrive nba-data.js.

Uso:  python -m data.build_step1
"""
import csv
import io
import json
import sys
import urllib.request
from pathlib import Path

from data.build import build_dataset
from data.sanity import run_sanity

SOURCE_URL = "https://raw.githubusercontent.com/willyiamyu/nba2k_analysis/master/nba_rankings_2014-2020"
RAW_PATH = Path(__file__).parent / "raw" / "nba_rankings_2014-2020.csv"
OUTPUT_PATH = Path(__file__).parent / "nba-data.js"


def download_csv(url: str, dest: Path) -> str:
    """Scarica il CSV (con cache locale in dest) e ne restituisce il testo."""
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        print(f"Scarico {url} ...")
        urllib.request.urlretrieve(url, dest)
    return dest.read_text(encoding="utf-8")


def write_js(data: dict, path: Path) -> None:
    """Scrive il dataset come global JS leggibile dal gioco su file://."""
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    path.write_text(
        "// GENERATO da data/build_step1.py — non modificare a mano\n"
        f"const NBA_DATA = {payload};\n",
        encoding="utf-8",
    )


def main() -> int:
    text = download_csv(SOURCE_URL, RAW_PATH)
    rows = list(csv.DictReader(io.StringIO(text)))
    data = build_dataset(rows, source_url=SOURCE_URL)

    report, errors = run_sanity(data, expected_seasons=6)
    print("\n=== SANITY REPORT ===")
    for line in report:
        print(line)

    if errors:
        print("\n=== ERRORI (bloccanti) ===")
        for e in errors:
            print("  X " + e)
        print("\nNON scrivo nba-data.js finché gli errori non sono risolti.")
        return 1

    write_js(data, OUTPUT_PATH)
    print(f"\nOK: scritto {OUTPUT_PATH} ({OUTPUT_PATH.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: eseguire la pipeline sul dato reale**

Run: `python -m data.build_step1`
Expected: stampa il SANITY REPORT con ~2400 carte, 6 stagioni, ~30 squadre per stagione, top-OVR plausibili (es. *2015-16: Stephen Curry, LeBron James, …*), **nessun errore**, e infine `OK: scritto .../nba-data.js`.

- [ ] **Step 3: confermare a Tomas i numeri reali (verifica, non "fidati")**

Mostrare a Tomas l'output del report. Se compaiono errori (es. una sigla squadra sconosciuta → `ValueError` durante il parsing, oppure una collisione di `player_id`), **fermarsi e risolvere** (aggiungere la sigla in `data/teams.py`, o gestire la collisione) prima di proseguire. Niente file scritto finché il report non è pulito.

- [ ] **Step 4: eseguire l'intera suite di test (deve restare verde)**

Run: `python -m pytest -v`
Expected: PASS (tutti i test dei Task 0-5).

- [ ] **Step 5: Commit**

```bash
git add data/build_step1.py data/nba-data.js
git commit -m "feat: pipeline Step 1 completa + dataset nba-data.js generato"
```

---

## Self-Review (eseguita in fase di scrittura)

- **Copertura spec:** fonte/colonne/stagioni (Task 0,3,6) · modello dati carta §3.3 (Task 3) · indici per player_id e (team,season) §3.3 (Task 4) · convenzioni stagione/edizione §3.5 (Task 1) · sigla→nome (Task 2) · sanity §3.6 (Task 5) · output `nba-data.js` + run reale §3.7 (Task 6). `pos`/attributi esclusi come da §3.8. ✔
- **Niente placeholder:** ogni step ha codice/comando reale e output atteso. ✔
- **Coerenza tipi/nomi:** `slugify_player_id`, `season_to_edition`, `team_name`, `STAT_FIELDS`, `parse_row`, `build_cards`, `build_dataset`, `run_sanity` usati con la stessa firma in test e implementazione; gli indici usano id interi verso `cards` ovunque. ✔

## Note di rischio note (dal vivo, in Task 6)
- **Sigle squadra inattese** nel CSV reale (es. `PHO`/`BRK`/`CHO`): già in mappa come alias; qualsiasi altra → `ValueError` chiaro → si aggiunge e si rilancia.
- **Collisioni `player_id`** (due persone diverse con lo stesso slug): il sanity le segnala; se capita, disambiguare (es. suffisso) prima di scrivere il file.
- **Top-OVR implausibili** in una stagione = segnale che la colonna `rankings` non è l'OVR atteso → da indagare prima di dichiarare fatto.
