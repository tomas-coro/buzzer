# Step 2 — Attributi + ruoli derivati dalle statistiche — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Arricchire ogni carta giocatore-stagione di `data/nba-data.js` con 12 attributi (7 off + 5 def), posizione primaria/secondaria, e maschera misurato/stimato, derivandoli dalle statistiche reali (CSV box-score già in cache + tabella "Advanced" di basketball-reference).

**Architecture:** Pipeline Python a moduli puri, nello stile dello Step 1. Si fetcha/parsa una pagina "Advanced" per stagione (6 pagine), si re-legge il CSV grezzo per i volumi di tiro, si calibra ogni attributo via *shrinkage → percentile-per-stagione → curva 0-99*, si splitta il DBPM in difesa perimetrale/interna per forma+posizione, si fa il join su `(player_id, season)` con le carte dello Step 1, si validano i risultati e si riscrive `nba-data.js`. Infine si rifittano le costanti del modello ATT/DIF di squadra sul nuovo dataset.

**Tech Stack:** Python 3 (stdlib: `urllib`, `re`, `csv`, `json`, `statistics`, `unicodedata`), pytest. Nessuna dipendenza nuova. Output `nba-data.js` come global `const NBA_DATA`.

## Global Constraints

- **Niente fallback silenzioso** (regola utente + spec §11): mai zero/finto in silenzio; ciò che non si misura si stima **e si marca** (`estimated:true`); ciò che non si matcha finisce in una **lista a report**; errori veri = eccezione, non clamp.
- **Solo fonti già a portata:** CSV `data/raw/nba_rankings_2014-2020.csv` (in cache) + 6 pagine bbref `NBA_<year>_advanced.html`. **Nessuno** scraping di attributi 2K.
- **Range voti:** ogni attributo è un intero in **[0,99]**; l'OVR resta invariato dallo Step 1.
- **Ordine attributi (fisso, da `mockups/59-players-data.js`):**
  `OFF = [Tiro 3, Tiro medio, Finalizzazione, Tiro libero, Palleggio, Playmaking, Senza palla]`;
  `DEF = [Dif. perimetro, Dif. interna, Palle rubate, Stoppate, Rimbalzi]`.
- **Stimati (sempre questi 4):** Tiro medio, Finalizzazione, Palleggio, Senza palla.
- **Chiave di join:** `slugify_player_id(name)` (riuso da `data/normalize.py`) + `season`. Si prende la riga bbref combinata `2TM`/`3TM` se presente.
- **User-Agent bbref obbligatorio** (senza, 403): `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36`.
- **Nomi `data-stat` reali bbref** (verificati con spike 2026-06-29, tabella `id="advanced"`, HTML diretto):
  `name_display, age, team_name_abbr, pos, games, games_started, mp, per, ts_pct, fg3a_per_fga_pct, fta_per_fga_pct, orb_pct, drb_pct, trb_pct, ast_pct, stl_pct, blk_pct, tov_pct, usg_pct, ows, dws, ws, ws_per_48, obpm, dbpm, bpm, vorp`.
- **Colonne CSV per i volumi di tiro** (per shrinkage + 2P%): `FGM, FGA, 3PM, 3PA, FTM, FTA` (oltre a quelle già usate).
- **Mappa stagione → anno-URL bbref:** `ending_year = int(season[:4]) + 1` (es. `2015-16 → 2016 → NBA_2016_advanced.html`).
- **Commit frequenti**, Conventional Commits, sul branch corrente. (Il commit lo lancia l'utente: chiedere conferma prima di committare se in dubbio.)

---

## File Structure

- **Create** `data/advanced_fetch.py` — fetch (cache locale) + parser puro della tabella Advanced bbref.
- **Create** `data/calibrate.py` — primitive di calibrazione: shrinkage, percentili, curva 0-99.
- **Create** `data/attributes.py` — derivazione dei 12 attributi: misurati, stimati, split DBPM, posizione.
- **Create** `data/enrich.py` — batch per-stagione + join con le carte Step 1 → carte arricchite.
- **Create** `data/sanity_step2.py` — controlli di coerenza Step 2 (Kawhi/PG/Jrue, Curry tiro, copertura…).
- **Create** `data/build_step2.py` — orchestratore: carica Step 1, fetcha/parsa, arricchisce, valida, riscrive `nba-data.js`.
- **Create** `data/team_refit.py` — rifit costanti `AO/BO/mediaDefW` del modello ATT/DIF sul nuovo dataset.
- **Create** `tests/fixtures/sample_advanced.html` — frammento tabella bbref (3-4 righe) per i test del parser.
- **Create** `tests/test_advanced_fetch.py`, `tests/test_calibrate.py`, `tests/test_attributes.py`, `tests/test_enrich.py`, `tests/test_sanity_step2.py`, `tests/test_team_refit.py`.
- **Modify** `data/build.py` — esporre i volumi di tiro grezzi necessari (vedi Task 5).

---

## Task 1: Parser + fetch della tabella "Advanced" bbref

**Files:**
- Create: `data/advanced_fetch.py`
- Create: `tests/fixtures/sample_advanced.html`
- Test: `tests/test_advanced_fetch.py`

**Interfaces:**
- Produces:
  - `parse_advanced_html(html: str) -> list[dict]` — righe con chiavi `data-stat` reali + `_combined: bool`.
  - `season_url(season: str) -> str`
  - `fetch_season_advanced(season: str, cache_dir: Path) -> str` (rete, con cache).
  - `advanced_rows_by_player_season(rows: list[dict], season: str) -> dict[(player_id, season) -> dict]` (preferisce la riga combinata).

- [ ] **Step 1: Crea la fixture HTML** `tests/fixtures/sample_advanced.html`

```html
<table id="advanced"><thead><tr>
<th data-stat="ranker">Rk</th><th data-stat="name_display">Player</th><th data-stat="pos">Pos</th>
<th data-stat="team_name_abbr">Team</th><th data-stat="games">G</th><th data-stat="mp">MP</th>
<th data-stat="ts_pct">TS%</th><th data-stat="fg3a_per_fga_pct">3PAr</th><th data-stat="fta_per_fga_pct">FTr</th>
<th data-stat="orb_pct">ORB%</th><th data-stat="drb_pct">DRB%</th><th data-stat="trb_pct">TRB%</th>
<th data-stat="ast_pct">AST%</th><th data-stat="stl_pct">STL%</th><th data-stat="blk_pct">BLK%</th>
<th data-stat="tov_pct">TOV%</th><th data-stat="usg_pct">USG%</th><th data-stat="obpm">OBPM</th><th data-stat="dbpm">DBPM</th>
</tr></thead><tbody>
<tr><th data-stat="ranker">1</th><td data-stat="name_display"><a href="/x">Stephen Curry</a></td><td data-stat="pos">PG</td>
<td data-stat="team_name_abbr">GSW</td><td data-stat="games">79</td><td data-stat="mp">2700</td>
<td data-stat="ts_pct">.669</td><td data-stat="fg3a_per_fga_pct">.554</td><td data-stat="fta_per_fga_pct">.250</td>
<td data-stat="orb_pct">2.0</td><td data-stat="drb_pct">13.0</td><td data-stat="trb_pct">8.6</td>
<td data-stat="ast_pct">33.7</td><td data-stat="stl_pct">3.0</td><td data-stat="blk_pct">0.4</td>
<td data-stat="tov_pct">14.0</td><td data-stat="usg_pct">32.6</td><td data-stat="obpm">10.3</td><td data-stat="dbpm">1.6</td></tr>
<tr><th data-stat="ranker">2</th><td data-stat="name_display"><a href="/y">Rudy Gobert</a></td><td data-stat="pos">C</td>
<td data-stat="team_name_abbr">UTA</td><td data-stat="games">61</td><td data-stat="mp">2000</td>
<td data-stat="ts_pct">.600</td><td data-stat="fg3a_per_fga_pct">.000</td><td data-stat="fta_per_fga_pct">.500</td>
<td data-stat="orb_pct">12.0</td><td data-stat="drb_pct">28.0</td><td data-stat="trb_pct">20.0</td>
<td data-stat="ast_pct">5.0</td><td data-stat="stl_pct">1.0</td><td data-stat="blk_pct">6.0</td>
<td data-stat="tov_pct">15.0</td><td data-stat="usg_pct">15.0</td><td data-stat="obpm">0.5</td><td data-stat="dbpm">4.5</td></tr>
<tr><th data-stat="ranker">3</th><td data-stat="name_display"><a href="/z">Joe Johnson</a></td><td data-stat="pos">SF</td>
<td data-stat="team_name_abbr">2TM</td><td data-stat="games">81</td><td data-stat="mp">2400</td>
<td data-stat="ts_pct">.520</td><td data-stat="fg3a_per_fga_pct">.300</td><td data-stat="fta_per_fga_pct">.150</td>
<td data-stat="orb_pct">2.0</td><td data-stat="drb_pct">10.0</td><td data-stat="trb_pct">6.0</td>
<td data-stat="ast_pct">15.0</td><td data-stat="stl_pct">1.0</td><td data-stat="blk_pct">0.3</td>
<td data-stat="tov_pct">10.0</td><td data-stat="usg_pct">20.0</td><td data-stat="obpm">-1.0</td><td data-stat="dbpm">-1.3</td></tr>
<tr><th data-stat="ranker">3</th><td data-stat="name_display"><a href="/z">Joe Johnson</a></td><td data-stat="pos">SF</td>
<td data-stat="team_name_abbr">MIA</td><td data-stat="games">24</td><td data-stat="mp">700</td>
<td data-stat="ts_pct">.540</td><td data-stat="fg3a_per_fga_pct">.310</td><td data-stat="fta_per_fga_pct">.160</td>
<td data-stat="orb_pct">2.0</td><td data-stat="drb_pct">10.0</td><td data-stat="trb_pct">6.0</td>
<td data-stat="ast_pct">15.0</td><td data-stat="stl_pct">1.0</td><td data-stat="blk_pct">0.3</td>
<td data-stat="tov_pct">10.0</td><td data-stat="usg_pct">20.0</td><td data-stat="obpm">-0.8</td><td data-stat="dbpm">-1.0</td></tr>
</tbody></table>
```

- [ ] **Step 2: Scrivi il test (fallisce)** `tests/test_advanced_fetch.py`

```python
from pathlib import Path
from data.advanced_fetch import (
    parse_advanced_html, season_url, advanced_rows_by_player_season,
)

def _html():
    return (Path(__file__).parent / "fixtures" / "sample_advanced.html").read_text(encoding="utf-8")

def test_parse_estrae_tutte_le_righe():
    rows = parse_advanced_html(_html())
    assert len(rows) == 4  # Curry, Gobert, Joe Johnson 2TM, Joe Johnson MIA
    curry = next(r for r in rows if r["name_display"] == "Stephen Curry")
    assert curry["pos"] == "PG"
    assert curry["dbpm"] == "1.6"
    assert curry["ts_pct"] == ".669"

def test_combined_flag_su_2tm():
    rows = parse_advanced_html(_html())
    jj = [r for r in rows if r["name_display"] == "Joe Johnson"]
    assert any(r["_combined"] for r in jj)        # la riga 2TM
    assert any(not r["_combined"] for r in jj)    # la riga per-squadra

def test_season_url():
    assert season_url("2015-16").endswith("/NBA_2016_advanced.html")
    assert season_url("2014-15").endswith("/NBA_2015_advanced.html")
    assert season_url("2019-20").endswith("/NBA_2020_advanced.html")

def test_index_preferisce_riga_combinata():
    rows = parse_advanced_html(_html())
    idx = advanced_rows_by_player_season(rows, "2015-16")
    jj = idx[("joe-johnson", "2015-16")]
    assert jj["_combined"] is True
    assert jj["games"] == "81"   # totale stagionale, non i 24 di MIA
```

- [ ] **Step 3: Lancia il test, deve fallire**

Run: `python -m pytest tests/test_advanced_fetch.py -v`
Expected: FAIL con `ModuleNotFoundError: No module named 'data.advanced_fetch'`

- [ ] **Step 4: Implementa** `data/advanced_fetch.py`

```python
"""Fetch (con cache) e parsing della tabella 'Advanced' di basketball-reference."""
import re
import urllib.request
from pathlib import Path

from data.normalize import slugify_player_id

BASE = "https://www.basketball-reference.com/leagues"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")
COMBINED_ABBR = re.compile(r"^\d+TM$")  # 2TM, 3TM, ...


def season_url(season: str) -> str:
    ending_year = int(season[:4]) + 1
    return f"{BASE}/NBA_{ending_year}_advanced.html"


def parse_advanced_html(html: str) -> list:
    """Tabella id='advanced' -> lista di dict (chiavi = data-stat) + '_combined'."""
    mt = re.search(r'<table[^>]*\bid="advanced"[^>]*>(.*?)</table>', html, re.DOTALL)
    if not mt:
        raise ValueError("Tabella id='advanced' non trovata nell'HTML")
    tbody = re.search(r"<tbody>(.*?)</tbody>", mt.group(1), re.DOTALL).group(1)
    out = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", tbody, re.DOTALL):
        if 'data-stat="name_display"' not in tr:
            continue
        cells = {}
        for m in re.finditer(r'data-stat="([a-z0-9_%]+)"[^>]*>(.*?)</t[hd]>', tr, re.DOTALL):
            cells[m.group(1)] = re.sub(r"<[^>]+>", "", m.group(2)).strip()
        cells["_combined"] = bool(COMBINED_ABBR.match(cells.get("team_name_abbr", "")))
        out.append(cells)
    return out


def advanced_rows_by_player_season(rows: list, season: str) -> dict:
    """Indicizza per (player_id, season). Per i ceduti tiene la riga combinata NTM."""
    index = {}
    for r in rows:
        pid = slugify_player_id(r["name_display"])
        key = (pid, season)
        cur = index.get(key)
        # preferisci la riga combinata; altrimenti la prima vista
        if cur is None or (r["_combined"] and not cur["_combined"]):
            index[key] = r
    return index


def fetch_season_advanced(season: str, cache_dir: Path) -> str:
    """Scarica (con cache su disco) l'HTML della pagina Advanced della stagione."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    dest = cache_dir / f"NBA_{int(season[:4]) + 1}_advanced.html"
    if not dest.exists():
        req = urllib.request.Request(season_url(season), headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status != 200:
                raise RuntimeError(f"bbref {season}: HTTP {resp.status}")
            dest.write_text(resp.read().decode("utf-8", "replace"), encoding="utf-8")
    return dest.read_text(encoding="utf-8")
```

- [ ] **Step 5: Lancia i test, devono passare**

Run: `python -m pytest tests/test_advanced_fetch.py -v`
Expected: PASS (4 test)

- [ ] **Step 6: Commit**

```bash
git add data/advanced_fetch.py tests/test_advanced_fetch.py tests/fixtures/sample_advanced.html
git commit -m "feat(step2): parser e fetch della tabella Advanced bbref"
```

---

## Task 2: Primitive di calibrazione (shrinkage, percentili, curva)

**Files:**
- Create: `data/calibrate.py`
- Test: `tests/test_calibrate.py`

**Interfaces:**
- Produces:
  - `shrink(rate: float, n: float, prior: float, k: float) -> float`
  - `to_percentiles(values: list[float]) -> list[float]` — rank-based, ties mediati, in [0,1].
  - `curve(pct: float, lo: float = 20.0, hi: float = 99.0, gamma: float = 1.0) -> int`

- [ ] **Step 1: Scrivi il test (fallisce)** `tests/test_calibrate.py`

```python
import pytest
from data.calibrate import shrink, to_percentiles, curve

def test_shrink_campione_piccolo_va_verso_il_prior():
    # 1 solo tentativo a rate 1.0, prior 0.35, k=100 -> quasi tutto prior
    assert shrink(1.0, 1, 0.35, 100) == pytest.approx((1*1.0 + 100*0.35) / 101, abs=1e-6)

def test_shrink_campione_grande_resta_vicino_al_rate():
    assert shrink(0.45, 500, 0.35, 100) == pytest.approx((500*0.45 + 100*0.35) / 600, abs=1e-6)

def test_percentili_ordinamento_e_bordi():
    p = to_percentiles([10, 20, 30, 40, 50])
    assert p[0] == 0.0 and p[-1] == 1.0
    assert p[2] == pytest.approx(0.5)
    assert all(0.0 <= x <= 1.0 for x in p)

def test_percentili_gestisce_pareggi():
    p = to_percentiles([5, 5, 5])
    assert p == [0.5, 0.5, 0.5]  # tutti pari -> percentile medio

def test_curve_monotona_e_nei_bordi():
    assert curve(0.0) == 20
    assert curve(1.0) == 99
    assert curve(0.0) <= curve(0.5) <= curve(1.0)
    assert 0 <= curve(0.5) <= 99
```

- [ ] **Step 2: Lancia il test, deve fallire**

Run: `python -m pytest tests/test_calibrate.py -v`
Expected: FAIL con `ModuleNotFoundError: No module named 'data.calibrate'`

- [ ] **Step 3: Implementa** `data/calibrate.py`

```python
"""Primitive di calibrazione: shrinkage bayesiano, percentili, curva 0-99.

I default (k, lo, hi, gamma) sono punti di partenza ragionevoli, da tarare a
occhio nel banco (vedi spec §3, §14). NON sono valori "finali".
"""


def shrink(rate: float, n: float, prior: float, k: float) -> float:
    """Media pesata fra il rate osservato (peso n) e il prior (peso k).
    Campione piccolo -> tirato verso il prior; campione grande -> resta sul rate."""
    return (n * rate + k * prior) / (n + k)


def to_percentiles(values: list) -> list:
    """Percentile rank in [0,1], pareggi mediati. Lista di 1 elemento -> [0.5]."""
    n = len(values)
    if n == 1:
        return [0.5]
    order = sorted(range(n), key=lambda i: values[i])
    # rank medio per i pareggi
    ranks = [0.0] * n
    i = 0
    while i < n:
        j = i
        while j + 1 < n and values[order[j + 1]] == values[order[i]]:
            j += 1
        avg_rank = (i + j) / 2.0
        for t in range(i, j + 1):
            ranks[order[t]] = avg_rank
        i = j + 1
    return [r / (n - 1) for r in ranks]


def curve(pct: float, lo: float = 20.0, hi: float = 99.0, gamma: float = 1.0) -> int:
    """Percentile [0,1] -> voto intero [0,99] via curva potenza (gamma<1 alza il centro)."""
    pct = max(0.0, min(1.0, pct))
    return int(round(lo + (hi - lo) * (pct ** gamma)))
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `python -m pytest tests/test_calibrate.py -v`
Expected: PASS (5 test)

- [ ] **Step 5: Commit**

```bash
git add data/calibrate.py tests/test_calibrate.py
git commit -m "feat(step2): primitive di calibrazione (shrinkage, percentili, curva)"
```

---

## Task 3: Split difensivo DBPM + posizione primaria/secondaria

**Files:**
- Create: `data/attributes.py` (prima parte)
- Test: `tests/test_attributes.py` (prima parte)

**Interfaces:**
- Produces:
  - `POS_PERIM_WEIGHT: dict[str, float]` (PG..C).
  - `split_defense(def_ceiling: int, stl_z: float, blk_z: float, drb_z: float, pos: str) -> tuple[int, int]` → (Dif. perimetro, Dif. interna).
  - `parse_position(pos_str: str, lean: float) -> dict` → `{"primary": str, "secondary": str | None}`. `lean` ∈ [-1,+1]: −1 = profilo da guardia (verso PG), +1 = profilo da lungo (verso C).

- [ ] **Step 1: Scrivi il test (fallisce)** `tests/test_attributes.py`

```python
from data.attributes import split_defense, parse_position

def test_split_difesa_centro_domina_interno():
    # forte difensore (ceiling alto), poche palle rubate, tante stoppate/rimbalzi, centro
    perim, inter = split_defense(95, stl_z=-0.5, blk_z=2.0, drb_z=1.5, pos="C")
    assert inter > perim

def test_split_difesa_ala_domina_perimetro():
    # forte difensore, tante palle rubate, stoppate medie, ala
    perim, inter = split_defense(92, stl_z=2.0, blk_z=0.2, drb_z=0.0, pos="SF")
    assert perim > inter

def test_split_difesa_scarso_difensore_entrambe_basse():
    perim, inter = split_defense(25, stl_z=0.0, blk_z=0.0, drb_z=0.0, pos="PG")
    assert perim < 45 and inter < 45

def test_posizione_combinata_usa_secondo_token():
    p = parse_position("SG-PG", lean=0.0)
    assert p == {"primary": "SG", "secondary": "PG"}

def test_posizione_pura_con_lean_verso_centro():
    p = parse_position("PF", lean=1.0)
    assert p["primary"] == "PF" and p["secondary"] == "C"

def test_posizione_pura_senza_lean_niente_secondaria():
    p = parse_position("SF", lean=0.0)
    assert p["primary"] == "SF" and p["secondary"] is None
```

- [ ] **Step 2: Lancia il test, deve fallire**

Run: `python -m pytest tests/test_attributes.py -v`
Expected: FAIL con `ModuleNotFoundError` o `ImportError`

- [ ] **Step 3: Implementa la prima parte di** `data/attributes.py`

```python
"""Derivazione dei 12 attributi (7 off + 5 def), split difensivo e posizione.

Costanti (pesi, nudge, ancore) = default tarabili nel banco, NON valori finali.
"""

POS_ORDER = ["PG", "SG", "SF", "PF", "C"]
# quanto la difesa di una posizione "pesa" verso il perimetro (0=interno puro, 1=perimetro puro)
POS_PERIM_WEIGHT = {"PG": 0.95, "SG": 0.85, "SF": 0.60, "PF": 0.30, "C": 0.12}


def _clamp(v: float) -> int:
    return int(round(max(0.0, min(99.0, v))))


def split_defense(def_ceiling: int, stl_z: float, blk_z: float, drb_z: float, pos: str) -> tuple:
    """Distribuisce il livello difensivo (def_ceiling 0-99) tra perimetro e interno.

    Il LIVELLO viene dal DBPM (passato come def_ceiling). La FORMA viene da:
    posizione (POS_PERIM_WEIGHT) + segnali standardizzati (z) di steal/block/rimbalzo.
    Ogni lato resta legato al livello (floor 0.6*ceiling) e si alza con la sua enfasi.
    """
    base = POS_PERIM_WEIGHT.get(pos.split("-")[0], 0.5)
    perim_emph = base + 0.12 * stl_z
    inter_emph = (1.0 - base) + 0.10 * blk_z + 0.06 * drb_z
    # normalizza in [0,1]
    perim_frac = max(0.0, min(1.0, perim_emph))
    inter_frac = max(0.0, min(1.0, inter_emph))
    perim = def_ceiling * (0.60 + 0.40 * perim_frac)
    inter = def_ceiling * (0.60 + 0.40 * inter_frac)
    return _clamp(perim), _clamp(inter)


def parse_position(pos_str: str, lean: float) -> dict:
    """'SG-PG' -> primaria+secondaria. Posizione pura -> vicino sulla retta secondo `lean`."""
    parts = [p.strip() for p in pos_str.split("-") if p.strip()]
    primary = parts[0]
    if len(parts) > 1:
        return {"primary": primary, "secondary": parts[1]}
    if primary not in POS_ORDER:
        return {"primary": primary, "secondary": None}
    idx = POS_ORDER.index(primary)
    if lean >= 0.5 and idx < len(POS_ORDER) - 1:
        return {"primary": primary, "secondary": POS_ORDER[idx + 1]}
    if lean <= -0.5 and idx > 0:
        return {"primary": primary, "secondary": POS_ORDER[idx - 1]}
    return {"primary": primary, "secondary": None}
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `python -m pytest tests/test_attributes.py -v`
Expected: PASS (6 test)

- [ ] **Step 5: Commit**

```bash
git add data/attributes.py tests/test_attributes.py
git commit -m "feat(step2): split difensivo DBPM e posizione primaria/secondaria"
```

---

## Task 4: Assemblaggio dei 12 attributi per un giocatore-stagione

**Files:**
- Modify: `data/attributes.py` (seconda parte)
- Test: `tests/test_attributes.py` (aggiunte)

**Interfaces:**
- Consumes: `split_defense`, `parse_position`, `data.calibrate.curve`.
- Produces:
  - `OFF_LABELS`, `DEF_LABELS`, `ESTIMATED_OFF_IDX = {1, 2, 4, 6}`, `ESTIMATED_DEF_IDX = set()`.
  - `build_attributes(pcts: dict, ctx: dict) -> dict` → `{"att": [7 int], "def": [5 int], "estimated": {"att":[7 bool],"def":[5 bool]}, "pos": {...}}`.
    - `pcts`: percentili-per-stagione già calcolati (chiavi: `tiro3, tiro_libero, playmaking, rubate, stoppate, rimbalzi, dbpm, ts, finitura, palleggio, off_eff`).
    - `ctx`: dati del singolo giocatore (`ovr, pos, stl_z, blk_z, drb_z, lean, missing: set[str]`).

- [ ] **Step 1: Scrivi i test (falliscono)** — aggiungi a `tests/test_attributes.py`

```python
from data.attributes import build_attributes, OFF_LABELS, DEF_LABELS

def _pcts(**over):
    base = {k: 0.5 for k in
            ["tiro3", "tiro_libero", "playmaking", "rubate", "stoppate", "rimbalzi",
             "dbpm", "ts", "finitura", "palleggio", "off_eff"]}
    base.update(over)
    return base

def _ctx(**over):
    base = {"ovr": 80, "pos": "SG", "stl_z": 0.0, "blk_z": 0.0, "drb_z": 0.0,
            "lean": 0.0, "missing": set()}
    base.update(over)
    return base

def test_dodici_attributi_in_range():
    r = build_attributes(_pcts(), _ctx())
    assert len(r["att"]) == 7 and len(r["def"]) == 5
    assert all(0 <= v <= 99 for v in r["att"] + r["def"])

def test_i_quattro_stimati_sono_marcati():
    r = build_attributes(_pcts(), _ctx())
    # indici stimati: Tiro medio(1), Finalizzazione(2), Palleggio(4), Senza palla(6)
    assert r["estimated"]["att"] == [False, True, True, False, True, False, True]
    assert r["estimated"]["def"] == [False, False, False, False, False]

def test_tiratore_elite_ha_tiro3_alto():
    r = build_attributes(_pcts(tiro3=0.99), _ctx(pos="PG"))
    assert r["att"][0] >= 90

def test_non_tiratore_ha_tiro3_basso():
    r = build_attributes(_pcts(tiro3=0.02), _ctx(pos="C"))
    assert r["att"][0] <= 35

def test_stat_advanced_mancante_marca_quella_cella_stimata():
    r = build_attributes(_pcts(), _ctx(missing={"dbpm"}))
    # senza DBPM, le due difese composite diventano stimate
    assert r["estimated"]["def"][0] is True and r["estimated"]["def"][1] is True
```

- [ ] **Step 2: Lancia i test, devono fallire**

Run: `python -m pytest tests/test_attributes.py -v`
Expected: FAIL con `ImportError: cannot import name 'build_attributes'`

- [ ] **Step 3: Implementa la seconda parte di** `data/attributes.py` (appendi in fondo)

```python
from data.calibrate import curve

OFF_LABELS = ["Tiro 3", "Tiro medio", "Finalizzazione", "Tiro libero",
              "Palleggio", "Playmaking", "Senza palla"]
DEF_LABELS = ["Dif. perimetro", "Dif. interna", "Palle rubate", "Stoppate", "Rimbalzi"]
ESTIMATED_OFF_IDX = {1, 2, 4, 6}   # Tiro medio, Finalizzazione, Palleggio, Senza palla
ESTIMATED_DEF_IDX = set()

# ancora degli stimati: parte dall'OVR (riportato sulla scala attributi) + spinta dal proxy
_EST_NUDGE = 18.0   # ampiezza max della spinta del proxy (punti), tarabile


def _ovr_anchor(ovr: int, pos: str) -> float:
    """Base di un attributo stimato: l'OVR è già in banda 2K; lo si usa come ancora morbida."""
    return float(ovr)


def _estimate(ovr: int, pos: str, proxy_pct: float) -> int:
    """Stima = ancora OVR + spinta centrata sul proxy (pct 0.5 = nessuna spinta)."""
    return _clamp(_ovr_anchor(ovr, pos) + _EST_NUDGE * (proxy_pct - 0.5) * 2)


def build_attributes(pcts: dict, ctx: dict) -> dict:
    ovr, pos, missing = ctx["ovr"], ctx["pos"], ctx["missing"]
    est_def = [False] * 5

    # --- OFFENSIVI ---
    att = [0] * 7
    att[0] = curve(pcts["tiro3"])                         # Tiro 3 (misurato)
    att[3] = curve(pcts["tiro_libero"])                   # Tiro libero (misurato)
    att[5] = curve(pcts["playmaking"])                    # Playmaking (misurato)
    att[1] = _estimate(ovr, pos, pcts["ts"])              # Tiro medio (stimato: tocco)
    att[2] = _estimate(ovr, pos, pcts["finitura"])        # Finalizzazione (stimato: 2P%+FTr)
    att[4] = _estimate(ovr, pos, pcts["palleggio"])       # Palleggio (stimato: USG-TOV)
    att[6] = _estimate(ovr, pos, pcts["off_eff"])         # Senza palla (stimato: eff. a basso uso)

    # --- DIFENSIVI ---
    dfn = [0] * 5
    dfn[2] = curve(pcts["rubate"])                        # Palle rubate (misurato)
    dfn[3] = curve(pcts["stoppate"])                      # Stoppate (misurato)
    dfn[4] = curve(pcts["rimbalzi"])                      # Rimbalzi (misurato)
    if "dbpm" in missing:
        # senza DBPM non possiamo misurare il livello difensivo: stima da OVR + marca
        dfn[0] = _estimate(ovr, pos, pcts["rubate"])
        dfn[1] = _estimate(ovr, pos, pcts["stoppate"])
        est_def[0] = est_def[1] = True
    else:
        ceiling = curve(pcts["dbpm"])
        dfn[0], dfn[1] = split_defense(ceiling, ctx["stl_z"], ctx["blk_z"], ctx["drb_z"], pos)

    est_att = [i in ESTIMATED_OFF_IDX for i in range(7)]
    return {
        "att": att, "def": dfn,
        "estimated": {"att": est_att, "def": est_def},
        "pos": parse_position(pos, ctx["lean"]),
    }
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `python -m pytest tests/test_attributes.py -v`
Expected: PASS (11 test totali in questo file)

- [ ] **Step 5: Commit**

```bash
git add data/attributes.py tests/test_attributes.py
git commit -m "feat(step2): assemblaggio dei 12 attributi per giocatore-stagione"
```

---

## Task 5: Esporre i volumi di tiro grezzi dal CSV

**Files:**
- Modify: `data/build.py:6-10` (dict `STAT_FIELDS`) e `data/build.py:31` (estrazione)
- Test: `tests/test_build_dataset.py` (aggiunta)

**Interfaces:**
- Produces: ogni carta Step 1 ha in `stats_real` anche `fgm, fga, tpm, tpa, ftm, fta` (volumi grezzi), necessari a shrinkage e 2P%.

- [ ] **Step 1: Scrivi il test (fallisce)** — aggiungi a `tests/test_build_dataset.py`

```python
def test_stats_real_include_i_volumi_di_tiro():
    from data.build import parse_row
    import csv
    from pathlib import Path
    rows = list(csv.DictReader((Path(__file__).parent / "fixtures" / "sample_rows.csv").open(encoding="utf-8")))
    card = parse_row(rows[0])  # Stephen Curry
    for k in ["fgm", "fga", "tpm", "tpa", "ftm", "fta"]:
        assert k in card["stats_real"]
```

- [ ] **Step 2: Lancia il test, deve fallire**

Run: `python -m pytest tests/test_build_dataset.py::test_stats_real_include_i_volumi_di_tiro -v`
Expected: FAIL con `KeyError`/`assert`

- [ ] **Step 3: Estendi `STAT_FIELDS` in** `data/build.py`

```python
# colonna CSV -> chiave nello stats_real di output
STAT_FIELDS = {
    "PTS": "pts", "REB": "reb", "AST": "ast", "STL": "stl", "BLK": "blk",
    "TOV": "tov", "FG%": "fg_pct", "3P%": "tp_pct", "FT%": "ft_pct",
    "MIN": "min", "GP": "gp", "+/-": "plus_minus",
    "FGM": "fgm", "FGA": "fga", "3PM": "tpm", "3PA": "tpa", "FTM": "ftm", "FTA": "fta",
}
```

- [ ] **Step 4: Lancia i test, devono passare** (e i 20 esistenti restano verdi)

Run: `python -m pytest tests/ -q`
Expected: PASS (21+)

- [ ] **Step 5: Commit**

```bash
git add data/build.py tests/test_build_dataset.py
git commit -m "feat(step2): esporta volumi di tiro grezzi (FGM/FGA/3PM/3PA/FTM/FTA)"
```

---

## Task 6: Batch per-stagione + join con le carte Step 1

**Files:**
- Create: `data/enrich.py`
- Test: `tests/test_enrich.py`

**Interfaces:**
- Consumes: `data.attributes.build_attributes`, `data.calibrate.{shrink,to_percentiles}`, `data.advanced_fetch.advanced_rows_by_player_season`, `slugify_player_id`.
- Produces:
  - `season_percentiles(players: list[dict]) -> dict[player_id -> dict]` — costruisce le metriche e i percentili-per-stagione per tutti i giocatori della stagione.
  - `enrich_cards(cards: list[dict], adv_index_by_season: dict) -> tuple[list[dict], list[dict]]` → (carte arricchite *in place*, lista non-matchate per il report).

I dettagli delle metriche (con default tarabili):
- `tiro3` = `shrink(tp_pct, tpa, prior=media 3P% stagione, k=100)`
- `tiro_libero` = `shrink(ft_pct, fta, prior=media FT% stagione, k=50)`
- `playmaking` = `ast_pct` (rate già stabile)
- `rubate`/`stoppate`/`rimbalzi` = `stl_pct`/`blk_pct`/`trb_pct`
- `dbpm` = `dbpm`
- `ts` = `ts_pct`; `finitura` = `(2P% + fta_per_fga_pct)`; `palleggio` = `usg_pct - tov_pct`; `off_eff` = `ts_pct` a USG basso (`ts_pct * (1 - usg_pct/100)`)
- `stl_z/blk_z/drb_z` = z-score di stl_pct/blk_pct/drb_pct nella stagione
- `lean` = segno normalizzato di `(trb_pct_z + blk_pct_z) - (ast_pct_z)` (verso C se rimbalzi/stoppate, verso PG se assist)

- [ ] **Step 1: Scrivi i test (falliscono)** `tests/test_enrich.py`

```python
from data.enrich import enrich_cards

def _card(pid, name, season, ovr):
    return {"player_id": pid, "name": name, "season": season, "ovr": ovr,
            "team": "X", "team_abbr": "X",
            "stats_real": {"tp_pct": 0.40, "tpa": 300, "ft_pct": 0.90, "fta": 200,
                           "fgm": 400, "fga": 800, "tpm": 120}}

def _adv(pos="SG", **o):
    base = {"pos": pos, "ts_pct": ".600", "fg3a_per_fga_pct": ".400",
            "fta_per_fga_pct": ".250", "orb_pct": "2.0", "drb_pct": "12.0",
            "trb_pct": "8.0", "ast_pct": "20.0", "stl_pct": "1.5", "blk_pct": "0.5",
            "tov_pct": "10.0", "usg_pct": "25.0", "dbpm": "1.0", "_combined": False}
    base.update(o)
    return base

def test_carta_matchata_riceve_dodici_attributi_e_posizione():
    cards = [_card("a-uno", "A Uno", "2015-16", 85),
             _card("b-due", "B Due", "2015-16", 78)]
    adv = {"2015-16": {("a-uno", "2015-16"): _adv("PG"),
                       ("b-due", "2015-16"): _adv("C", dbpm="4.0", blk_pct="6.0", trb_pct="20.0", stl_pct="0.8")}}
    enriched, missing = enrich_cards(cards, adv)
    a = next(c for c in enriched if c["player_id"] == "a-uno")
    assert len(a["att"]) == 7 and len(a["def"]) == 5
    assert a["pos"]["primary"] == "PG"
    assert a["enrich"]["advanced_matched"] is True
    assert missing == []

def test_centro_ha_difesa_interna_maggiore_del_perimetro():
    cards = [_card("c-tre", "C Tre", "2015-16", 84),
             _card("g-uno", "G Uno", "2015-16", 84)]
    adv = {"2015-16": {
        ("c-tre", "2015-16"): _adv("C", dbpm="4.0", blk_pct="6.0", trb_pct="22.0", stl_pct="0.6"),
        ("g-uno", "2015-16"): _adv("PG", dbpm="2.0", blk_pct="0.4", trb_pct="6.0", stl_pct="3.0")}}
    enriched, _ = enrich_cards(cards, adv)
    c = next(x for x in enriched if x["player_id"] == "c-tre")
    assert c["def"][1] > c["def"][0]   # interna > perimetro

def test_non_matchato_resta_visibile_e_flaggato():
    cards = [_card("solo-csv", "Solo Csv", "2015-16", 75)]
    adv = {"2015-16": {}}   # nessuna riga advanced
    enriched, missing = enrich_cards(cards, adv)
    e = enriched[0]
    assert e["enrich"]["advanced_matched"] is False
    assert all(e["estimated"]["def"])          # tutta la difesa stimata
    assert len(e["att"]) == 7 and len(e["def"]) == 5
    assert missing and missing[0]["player_id"] == "solo-csv"
```

- [ ] **Step 2: Lancia i test, devono fallire**

Run: `python -m pytest tests/test_enrich.py -v`
Expected: FAIL con `ModuleNotFoundError: No module named 'data.enrich'`

- [ ] **Step 3: Implementa** `data/enrich.py`

```python
"""Batch per-stagione: calcola percentili e attributi, poi join con le carte Step 1."""
from statistics import mean, pstdev

from data.attributes import build_attributes
from data.calibrate import shrink, to_percentiles

ADV_KEYS = ["pos", "ts_pct", "fg3a_per_fga_pct", "fta_per_fga_pct", "orb_pct", "drb_pct",
            "trb_pct", "ast_pct", "stl_pct", "blk_pct", "tov_pct", "usg_pct", "dbpm", "obpm"]


def _f(s, default=0.0):
    s = (s or "").strip()
    if s in ("", "nan", "NaN"):
        return None
    return float(s)


def _z(values):
    m = mean(values) if values else 0.0
    sd = pstdev(values) if len(values) > 1 else 0.0
    return [(0.0 if sd == 0 else (v - m) / sd) for v in values]


def season_percentiles(rows: list) -> dict:
    """rows: lista di {'player_id', 'card', 'adv'(dict|None)}. Ritorna {player_id: pcts+ctx}."""
    n = len(rows)
    # raccogli metriche grezze (None se manca il dato)
    def adv(r, k):
        a = r["adv"]
        return _f(a.get(k)) if a else None

    prior_3p = mean([r["card"]["stats_real"].get("tp_pct") or 0.0 for r in rows]) if n else 0.35
    prior_ft = mean([r["card"]["stats_real"].get("ft_pct") or 0.0 for r in rows]) if n else 0.75

    metrics = {}
    for r in rows:
        sr = r["card"]["stats_real"]
        fga, tpa = sr.get("fga") or 0.0, sr.get("tpa") or 0.0
        fgm, tpm = sr.get("fgm") or 0.0, sr.get("tpm") or 0.0
        two_pa, two_pm = max(fga - tpa, 0.0), max(fgm - tpm, 0.0)
        two_pct = (two_pm / two_pa) if two_pa > 0 else 0.0
        ftr = adv(r, "fta_per_fga_pct") or 0.0
        usg = adv(r, "usg_pct") or 0.0
        tov = adv(r, "tov_pct") or 0.0
        ts = adv(r, "ts_pct") or 0.0
        metrics[r["player_id"]] = {
            "tiro3": shrink(sr.get("tp_pct") or 0.0, tpa, prior_3p, 100),
            "tiro_libero": shrink(sr.get("ft_pct") or 0.0, sr.get("fta") or 0.0, prior_ft, 50),
            "playmaking": adv(r, "ast_pct") or 0.0,
            "rubate": adv(r, "stl_pct") or 0.0,
            "stoppate": adv(r, "blk_pct") or 0.0,
            "rimbalzi": adv(r, "trb_pct") or 0.0,
            "dbpm": adv(r, "dbpm"),  # può essere None
            "ts": ts, "finitura": two_pct + ftr, "palleggio": usg - tov,
            "off_eff": ts * (1.0 - usg / 100.0),
            "drb": adv(r, "drb_pct") or 0.0,
        }
    # percentili per ciascuna metrica (i None del dbpm -> trattati a parte)
    pkeys = ["tiro3", "tiro_libero", "playmaking", "rubate", "stoppate", "rimbalzi",
             "ts", "finitura", "palleggio", "off_eff"]
    ids = list(metrics)
    pct = {pid: {} for pid in ids}
    for k in pkeys:
        vals = to_percentiles([metrics[pid][k] for pid in ids])
        for pid, v in zip(ids, vals):
            pct[pid][k] = v
    # dbpm: percentile solo sui presenti; ai mancanti 0.5 (poi marcati a monte)
    present = [pid for pid in ids if metrics[pid]["dbpm"] is not None]
    if present:
        dvals = to_percentiles([metrics[pid]["dbpm"] for pid in present])
        for pid, v in zip(present, dvals):
            pct[pid]["dbpm"] = v
    for pid in ids:
        pct[pid].setdefault("dbpm", 0.5)
    # z-score per lo split difensivo e il lean
    stl_z = dict(zip(ids, _z([metrics[p]["rubate"] for p in ids])))
    blk_z = dict(zip(ids, _z([metrics[p]["stoppate"] for p in ids])))
    drb_z = dict(zip(ids, _z([metrics[p]["drb"] for p in ids])))
    return {"metrics": metrics, "pct": pct, "stl_z": stl_z, "blk_z": blk_z,
            "drb_z": drb_z, "ids": ids}


def enrich_cards(cards: list, adv_index_by_season: dict) -> tuple:
    missing = []
    by_season = {}
    for c in cards:
        by_season.setdefault(c["season"], []).append(c)

    for season, season_cards in by_season.items():
        adv_idx = adv_index_by_season.get(season, {})
        rows = []
        for c in season_cards:
            adv = adv_idx.get((c["player_id"], season))
            rows.append({"player_id": c["player_id"], "card": c, "adv": adv})
        sp = season_percentiles(rows)
        for r in rows:
            c, adv = r["card"], r["adv"]
            pid = c["player_id"]
            matched = adv is not None
            missing_stats = set() if matched else {"dbpm"}
            if matched and _f(adv.get("dbpm")) is None:
                missing_stats.add("dbpm")
            ctx = {
                "ovr": c["ovr"], "pos": (adv.get("pos") if matched else _pos_fallback(c)),
                "stl_z": sp["stl_z"][pid], "blk_z": sp["blk_z"][pid], "drb_z": sp["drb_z"][pid],
                "lean": _lean(sp, pid), "missing": missing_stats,
            }
            built = build_attributes(sp["pct"][pid], ctx)
            c.update(built)
            c["stats_adv"] = ({k: _f(adv.get(k)) for k in ADV_KEYS if k != "pos"} if matched else {})
            c["enrich"] = {"advanced_matched": matched,
                           "match": "exact" if matched else "none"}
            if not matched:
                missing.append({"player_id": pid, "name": c["name"], "season": season})
    return cards, missing


def _pos_fallback(card: dict) -> str:
    """Senza advanced non abbiamo la posizione: ripiego prudente su SF (centro campo)."""
    return "SF"


def _lean(sp: dict, pid: str) -> float:
    m = sp["metrics"][pid]
    score = sp["blk_z"][pid] - 0.0  # bigs (block) verso C
    # assist alti -> verso PG
    return max(-1.0, min(1.0, sp["blk_z"][pid] * 0.6 - (m["playmaking"] / 50.0)))
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `python -m pytest tests/test_enrich.py -v`
Expected: PASS (3 test)

- [ ] **Step 5: Commit**

```bash
git add data/enrich.py tests/test_enrich.py
git commit -m "feat(step2): batch per-stagione e join advanced<->carte Step 1"
```

---

## Task 7: Sanity check Step 2

**Files:**
- Create: `data/sanity_step2.py`
- Test: `tests/test_sanity_step2.py`

**Interfaces:**
- Consumes: il dataset arricchito (`cards` con `att/def/estimated/enrich`) + la lista `missing`.
- Produces: `run_sanity_step2(cards: list, missing: list) -> tuple[list[str], list[str]]` → (report, errori bloccanti).

Controlli (spec §9): difesa perimetrale dei perimetrali d'élite (Kawhi 2016-17, Paul George, Jrue Holiday) ≥ mediana centri; Curry 2015-16 Tiro 3 alto; range/NaN; copertura + lista non-matchati; nessun attributo collassato a valore unico.

- [ ] **Step 1: Scrivi i test (falliscono)** `tests/test_sanity_step2.py`

```python
from data.sanity_step2 import run_sanity_step2

def _ec(pid, att=None, dfn=None, matched=True):
    att = att or [70, 70, 70, 70, 70, 70, 70]
    dfn = dfn or [70, 70, 70, 70, 70]
    return {"player_id": pid, "name": pid, "season": "2015-16", "ovr": 80,
            "att": att, "def": dfn,
            "estimated": {"att": [False]*7, "def": [False]*5},
            "enrich": {"advanced_matched": matched, "match": "exact" if matched else "none"}}

def test_errore_se_attributo_fuori_range():
    cards = [_ec("x", att=[120, 70, 70, 70, 70, 70, 70])]
    report, errors = run_sanity_step2(cards, [])
    assert any("fuori" in e.lower() for e in errors)

def test_report_riporta_copertura_e_non_matchati():
    cards = [_ec("a"), _ec("b", matched=False)]
    report, errors = run_sanity_step2(cards, [{"player_id": "b", "name": "b", "season": "2015-16"}])
    assert any("non-matchat" in r.lower() or "copertura" in r.lower() for r in report)

def test_errore_se_attributo_collassato():
    cards = [_ec(str(i), att=[70, 70, 70, 70, 70, 70, 70]) for i in range(10)]
    report, errors = run_sanity_step2(cards, [])
    assert any("collass" in e.lower() or "varianza" in e.lower() for e in errors)
```

- [ ] **Step 2: Lancia i test, devono fallire**

Run: `python -m pytest tests/test_sanity_step2.py -v`
Expected: FAIL con `ModuleNotFoundError`

- [ ] **Step 3: Implementa** `data/sanity_step2.py`

```python
"""Controlli di coerenza Step 2: stampa report, segnala errori bloccanti."""
from statistics import median, pstdev

from data.attributes import OFF_LABELS, DEF_LABELS


def run_sanity_step2(cards: list, missing: list) -> tuple:
    report, errors = [], []
    n = len(cards)
    report.append(f"Carte arricchite: {n}")

    # range / NaN
    fuori = [c for c in cards
             for v in (c["att"] + c["def"])
             if v is None or not (0 <= v <= 99)]
    if fuori:
        errors.append(f"{len(fuori)} attributi fuori [0,99] o NaN (es. {fuori[0]['name']})")

    # collasso: ogni colonna deve avere varianza > 0 sul dataset
    for label, getter in ([(l, ("att", i)) for i, l in enumerate(OFF_LABELS)] +
                          [(l, ("def", i)) for i, l in enumerate(DEF_LABELS)]):
        col = [c[getter[0]][getter[1]] for c in cards]
        if n >= 5 and pstdev(col) == 0:
            errors.append(f"Attributo '{label}' collassato a un valore unico (varianza 0)")

    # copertura + non-matchati (sempre visibili)
    matched = sum(1 for c in cards if c["enrich"]["advanced_matched"])
    report.append(f"Copertura advanced: {matched}/{n} ({100*matched//max(n,1)}%)")
    report.append(f"Carte NON-matchate (stimate da OVR): {len(missing)}")
    for m in missing[:20]:
        report.append(f"  - {m['name']} {m['season']}")

    # difesa perimetrale dei perimetrali d'elite vs mediana centri (check a occhio)
    perim_targets = [("kawhi-leonard", "2016-17"), ("paul-george", None), ("jrue-holiday", None)]
    centers = [c["def"][1] for c in cards if c.get("pos", {}).get("primary") == "C"]
    if centers:
        med_c = median(centers)
        for pid, season in perim_targets:
            hits = [c for c in cards if c["player_id"] == pid and (season is None or c["season"] == season)]
            for c in hits:
                ok = "OK" if c["def"][0] >= med_c else "DA GUARDARE"
                report.append(f"  [{ok}] {c['name']} {c['season']} Dif.perimetro={c['def'][0]} (mediana C interna={med_c})")

    return report, errors
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `python -m pytest tests/test_sanity_step2.py -v`
Expected: PASS (3 test)

- [ ] **Step 5: Commit**

```bash
git add data/sanity_step2.py tests/test_sanity_step2.py
git commit -m "feat(step2): sanity check (range, collasso, copertura, difesa perimetrale)"
```

---

## Task 8: Orchestratore — fetch, arricchimento, riscrittura nba-data.js

**Files:**
- Create: `data/build_step2.py`
- (nessun test unitario nuovo: è orchestrazione; si verifica con la run reale)

**Interfaces:**
- Consumes: tutto sopra + `data.build_step1.download_csv/write_js`, `data.build.build_dataset`.
- Produces: `nba-data.js` riscritto con le carte arricchite; report a video.

- [ ] **Step 1: Implementa** `data/build_step2.py`

```python
"""Pipeline Fase 1 Step 2: arricchisce le carte con attributi+posizione e riscrive nba-data.js.

Uso:  python -m data.build_step2
"""
import csv
import io
import sys
from pathlib import Path

from data.advanced_fetch import fetch_season_advanced, parse_advanced_html, advanced_rows_by_player_season
from data.build import build_dataset
from data.build_step1 import SOURCE_URL, RAW_PATH, OUTPUT_PATH, download_csv, write_js
from data.enrich import enrich_cards
from data.sanity_step2 import run_sanity_step2

ADV_CACHE = Path(__file__).parent / "raw" / "advanced"


def main() -> int:
    # 1) ricostruisci le carte Step 1 (dal CSV in cache)
    text = download_csv(SOURCE_URL, RAW_PATH)
    rows = list(csv.DictReader(io.StringIO(text)))
    data = build_dataset(rows, source_url=SOURCE_URL)
    cards = data["cards"]
    seasons = data["meta"]["seasons"]

    # 2) fetch+parse 6 pagine Advanced -> indice per (player_id, season)
    adv_index = {}
    for s in seasons:
        html = fetch_season_advanced(s, ADV_CACHE)
        adv_index[s] = advanced_rows_by_player_season(parse_advanced_html(html), s)
        print(f"Advanced {s}: {len(adv_index[s])} righe")

    # 3) arricchisci in place
    cards, missing = enrich_cards(cards, adv_index)

    # 4) sanity
    report, errors = run_sanity_step2(cards, missing)
    print("\n=== SANITY STEP 2 ===")
    for line in report:
        print(line)
    if errors:
        print("\n=== ERRORI (bloccanti) ===")
        for e in errors:
            print("  X " + e)
        print("\nNON riscrivo nba-data.js finché gli errori non sono risolti.")
        return 1

    # 5) riscrivi nba-data.js (stessa struttura, carte ora arricchite)
    write_js(data, OUTPUT_PATH)
    print(f"\nOK: riscritto {OUTPUT_PATH} ({OUTPUT_PATH.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Esegui la pipeline reale**

Run: `python -m data.build_step2`
Expected: stampa "Advanced 2014-15: ~600 righe" ×6, sanity report con copertura alta (>90%), lista non-matchati, e "OK: riscritto …/nba-data.js". Nessun errore bloccante.

- [ ] **Step 3: Ispeziona a occhio l'output** (verifica reale, non "fidati")

Run: `python -c "import json,re; t=open('data/nba-data.js',encoding='utf-8').read(); d=json.loads(re.search(r'=(.*);',t,re.S).group(1)); c=[x for x in d['cards'] if x['player_id']=='stephen-curry' and x['season']=='2015-16'][0]; print(c['pos'], c['att'], c['def'], c['estimated'])"`
Expected: Curry PG, Tiro 3 ~95+, Dif. perimetro bassa, maschera estimated coerente (4 off stimati).

- [ ] **Step 4: Commit**

```bash
git add data/build_step2.py data/nba-data.js
git commit -m "feat(step2): orchestratore pipeline e riscrittura nba-data.js arricchito"
```

---

## Task 9: Rifit delle costanti del modello ATT/DIF di squadra

**Files:**
- Create: `data/team_refit.py`
- Test: `tests/test_team_refit.py`

**Interfaces:**
- Consumes: le carte arricchite (`att`, `def`, `ovr`).
- Produces:
  - `fit_constants(cards: list) -> dict` → `{"AO": float, "BO": float, "mediaDefW": float}`.
  - `offW(att: list) -> float`, `defW(dfn: list) -> float` (pesi interni dal modello esistente, vedi memory `formula-squadra-dati`).

Pesi (dal modello esistente): `WOFF = [3pt 1.4, mid 1.1, fin 1.2, ft 0.7, bh 0.8, pm 0.9, obm 0.9]`,
`WDEF = [perim 1.3, inter 1.3, rub 1.1, stop 1.1, reb 0.7]`.

- [ ] **Step 1: Scrivi i test (falliscono)** `tests/test_team_refit.py`

```python
from data.team_refit import offW, defW, fit_constants

def test_offW_media_pesata_nota():
    att = [99, 0, 0, 0, 0, 0, 0]  # solo tiro da 3
    # peso 1.4 su 1 attributo, somma pesi 1.4+1.1+1.2+0.7+0.8+0.9+0.9 = 7.0
    assert abs(offW(att) - (99 * 1.4 / 7.0)) < 1e-6

def test_fit_constants_chiavi():
    cards = [{"ovr": 70 + i, "att": [60+i]*7, "def": [55+i]*5} for i in range(20)]
    k = fit_constants(cards)
    assert set(k) == {"AO", "BO", "mediaDefW"}
    assert isinstance(k["BO"], float)
```

- [ ] **Step 2: Lancia i test, devono fallire**

Run: `python -m pytest tests/test_team_refit.py -v`
Expected: FAIL con `ModuleNotFoundError`

- [ ] **Step 3: Implementa** `data/team_refit.py`

```python
"""Rifit delle costanti del modello ATT/DIF di squadra (asimmetrico) sul dataset arricchito.

Modello (memory formula-squadra-dati): ATT = OVR + A*(offW - E[offW|OVR]),
DIF = DB + SD*(defW - mediaDefW). Qui si rifittano E[offW|OVR] (regressione AO+BO*OVR)
e mediaDefW. A, DB, SD restano manopole del banco.
"""
WOFF = [1.4, 1.1, 1.2, 0.7, 0.8, 0.9, 0.9]
WDEF = [1.3, 1.3, 1.1, 1.1, 0.7]


def _wmean(values: list, weights: list) -> float:
    return sum(v * w for v, w in zip(values, weights)) / sum(weights)


def offW(att: list) -> float:
    return _wmean(att, WOFF)


def defW(dfn: list) -> float:
    return _wmean(dfn, WDEF)


def fit_constants(cards: list) -> dict:
    """Regressione lineare offW ~ OVR (minimi quadrati) + media di defW."""
    xs = [c["ovr"] for c in cards]
    ys = [offW(c["att"]) for c in cards]
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    BO = sxy / sxx if sxx else 0.0
    AO = my - BO * mx
    mediaDefW = sum(defW(c["def"]) for c in cards) / n
    return {"AO": AO, "BO": BO, "mediaDefW": mediaDefW}
```

- [ ] **Step 4: Lancia i test, devono passare**

Run: `python -m pytest tests/test_team_refit.py -v`
Expected: PASS (2 test)

- [ ] **Step 5: Stampa le costanti reali dal dataset arricchito** (per aggiornare il banco)

Run: `python -c "import json,re; from data.team_refit import fit_constants; t=open('data/nba-data.js',encoding='utf-8').read(); d=json.loads(re.search(r'=(.*);',t,re.S).group(1)); print(fit_constants(d['cards']))"`
Expected: stampa `{'AO': ~13-15, 'BO': ~0.5-0.7, 'mediaDefW': ~50-55}`. Annotare i valori per il banco `mockups/59-formula-squadra.html`.

- [ ] **Step 6: Commit**

```bash
git add data/team_refit.py tests/test_team_refit.py
git commit -m "feat(step2): rifit costanti modello ATT/DIF di squadra sul dataset arricchito"
```

---

## Verifica finale (tutta la suite)

- [ ] Run: `python -m pytest tests/ -q` → tutti verdi (20 Step 1 + nuovi Step 2).
- [ ] Run: `python -m data.build_step2` → sanity senza errori, copertura alta, lista non-matchati mostrata.
- [ ] Ispezione a occhio: Curry tiro alto, Gobert rimbalzi/interna alti, un perimetrale d'élite con Dif. perimetro ≥ mediana centri.

---

## Self-Review (eseguito in fase di scrittura)

- **Copertura spec:** §2 fonti→Task 1+5; §3 motore→Task 2; §4 mappa 12→Task 4+6; §5 split DBPM→Task 3; §6 posizione→Task 3; §7 schema output→Task 6; §8 modello squadra→Task 9; §9 validazione→Task 7; §10 TDD→ogni task; §11 errori→Task 1/6/7 (eccezioni, flag, lista). ✔
- **Placeholder:** nessuno. I numeri di calibrazione (k, gamma, pesi, nudge) sono **default tarabili** per design (spec §14), non TODO. `_lean`/`_pos_fallback` sono euristiche dichiarate, isolate e facili da rivedere.
- **Coerenza tipi:** `build_attributes(pcts, ctx)` consumato da `enrich_cards` con le stesse chiavi; `OFF_LABELS/DEF_LABELS` riusati in sanity; `fit_constants` usa `att/def/ovr` prodotti da Task 6. ✔

## Rischi noti per l'esecutore

- I default di calibrazione daranno voti "circa giusti": l'ultimo miglio (curve, pesi) è **taratura a occhio** nel banco — non è un bug se al primo giro qualche voto va limato.
- Il `lean` per la posizione secondaria è euristico e grezzo; se le secondarie risultano poco sensate, è la prima cosa da rivedere (è isolato in `_lean`).
- Rispetto gentile di bbref: il fetch è **cache-first** (una volta sola per stagione); non ri-scaricare in loop.
