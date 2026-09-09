"""Costruisce data/estimated-seasons.js: stagioni storiche COMPLETE (30 squadre)
con OVR stimato dai box stats, per estendere il draft oltre le 57 squadre
"classic" curate da 2K (che hanno OVR vero) e oltre le 6 stagioni moderne
2014-15..2019-20 (OVR vero da CSV).

Fonte: tabella "Totals" di ogni stagione su basketball-reference.com, via
data/br_totals_parser.py. Righe 2TM/3TM (giocatore scambiato) scartate: si
tiene solo la quota della singola squadra, mai l'aggregato - stessa regola
delle leggende.

FORMULA OVR STIMATO: hand-tuned (non regressione), normalizzata per epoca -
ogni stat è uno z-score contro la MEDIA DI LEGA VERA di quella stagione (qui
disponibile per davvero: 30 squadre, non solo le curate). Stessa formula e
stessi pesi già validati in data/ovr_stimato_calibrazione.mjs contro i ~2.950
giocatori con OVR 2K vero già nel dataset (MAE 2.3-3.7 punti su tutte le
decadi testate, 1980s incluso). Costanti di calibrazione (SLOPE/INTERCEPT)
ricavate una volta sola dalla distribuzione reale del dataset moderno (OVR
vero: min 62, mediana 75, p95 87, max 98) e riusate identiche qui.

GIOCABILE vs FILLER: sotto una soglia minima di minutaggio i box stats
per-partita diventano rumore (es. 8 punti in 3 minuti su 1 sola partita
gonfia un "32 pt/48min" senza senso). Sotto la soglia la carta resta
"filler" (ovr:0, mai in cards.js, allarga solo il pool per il percentile
reparti) - stessa infrastruttura già usata dalle leggende.

Uso:  python -m data.build_full_seasons
"""
import glob
import json
import re
import unicodedata
from pathlib import Path

from data.br_totals_parser import parse_totals
from data.historical_teams import resolve_team, HISTORICAL_TEAMS, STABLE_ABBR
from data.teams import TEAM_ABBR_TO_NAME

RAW_DIR = Path(__file__).parent / "raw" / "br_totals"
OUTPUT_PATH = Path(__file__).parent / "estimated-seasons.js"
NBA_DATA_PATH = Path(__file__).parent / "nba-data.js"

STAT_KEYS = ["pts", "reb", "ast", "stl", "blk", "tov", "fg_pct", "tp_pct", "ft_pct", "min"]

# Sotto questa soglia la carta è filler (troppo poco campione per un OVR
# affidabile), non giocabile.
MIN_GAMES = 15
MIN_MPG = 10.0

# Calibrazione (vedi docstring): ricavata una volta da data/nba-data.js reale.
INTERCEPT = 75
SLOPE = 2.7177285577960486
COMPOSITE_MEDIAN = -0.17593463185607805


def slugify_player_id(name: str) -> str:
    decomposed = unicodedata.normalize("NFKD", name)
    no_accents = "".join(c for c in decomposed if not unicodedata.combining(c))
    slug = no_accents.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug


def season_label(end_year: int) -> str:
    start = end_year - 1
    return f"{start}-{str(end_year)[2:]}"


def stats_real_from_row(row: dict) -> dict:
    g = row["games"]
    fga, fg = row["fga"], row["fg"]
    fg3a, fg3 = row["fg3a"], row["fg3"]
    fta, ft = row["fta"], row["ft"]
    return {
        "pts": round(row["pts"] / g, 1),
        "reb": round(row["trb"] / g, 1),
        "ast": round(row["ast"] / g, 1),
        "stl": round(row["stl"] / g, 1),
        "blk": round(row["blk"] / g, 1),
        "tov": round(row["tov"] / g, 1),
        "fg_pct": round(100 * fg / fga, 1) if fga > 0 else 0.0,
        "tp_pct": round(100 * fg3 / fg3a, 1) if fg3a > 0 else 0.0,
        "ft_pct": round(100 * ft / fta, 1) if fta > 0 else 0.0,
        "min": round(row["mp"] / g, 1),
        "gp": g,
        "plus_minus": 0,
    }


def load_rows_for_season(end_year: int) -> list:
    """Righe della stagione, UNA per giocatore: chi è stato scambiato appare
    su più squadre nella tabella B-Ref (mai l'aggregato, già filtrato dal
    parser) - qui si tiene solo la squadra dove ha giocato più partite,
    stessa regola già usata a mano sulle leggende (es. John Salley 1995-96),
    perché player_id+stagione deve restare una chiave unica (vedi chiaveCarta
    in prototype/imbattuto/pool.js)."""
    path = RAW_DIR / f"NBA_{end_year}_totals.html"
    rows = parse_totals(path.read_text(encoding="utf-8"))
    season = season_label(end_year)

    best_by_key = {}
    for r in rows:
        # mp=0 capita per voci roster senza minuti mai giocati (es. Alex Scales
        # 2005-06, 1 partita 0 minuti): niente box score possibile, si scarta.
        if r["games"] <= 0 or r["mp"] <= 0:
            continue
        prev = best_by_key.get(r["br_key"])
        if prev is None or r["games"] > prev["games"]:
            best_by_key[r["br_key"]] = r

    out = []
    for r in best_by_key.values():
        team_abbr, team_name = resolve_team(r["team_abbr"], TEAM_ABBR_TO_NAME)
        out.append({
            "player_id_base": slugify_player_id(r["name"]),
            "br_key": r["br_key"],
            "name": r["name"],
            "season": season,
            "team": team_name,
            "team_abbr": team_abbr,
            "pos": r["pos"] or "SF",
            "stats_real": stats_real_from_row(r),
        })
    return out


def cohort_stats(cards: list) -> dict:
    """Media/std VERE di lega per stagione (30 squadre): normalizzazione per epoca."""
    by_season = {}
    for c in cards:
        by_season.setdefault(c["season"], []).append(c)
    out = {}
    for season, lst in by_season.items():
        stat = {}
        for k in STAT_KEYS:
            vals = [c["stats_real"][k] for c in lst]
            mean = sum(vals) / len(vals)
            var = sum((v - mean) ** 2 for v in vals) / len(vals)
            std = max(var ** 0.5, 0.5)
            stat[k] = (mean, std)
        out[season] = stat
    return out


def composite(card: dict, cohort: dict) -> float:
    def z(key):
        mean, std = cohort[card["season"]][key]
        return (card["stats_real"][key] - mean) / std

    return (
        0.95 * z("pts") + 0.55 * z("fg_pct") + 0.30 * z("tp_pct") + 0.20 * z("ft_pct")
        + 0.55 * z("reb") + 0.55 * z("ast") + 0.40 * z("stl") + 0.40 * z("blk")
        - 0.35 * z("tov") + 0.30 * z("min")
    )


def ovr_stimato(card: dict, cohort: dict) -> int:
    raw = INTERCEPT + SLOPE * (composite(card, cohort) - COMPOSITE_MEDIAN)
    return max(25, min(99, round(raw)))


def dedupe_ids(cards: list) -> None:
    """player_id univoco per persona: stesso br_key -> stesso id in tutte le sue
    stagioni; br_key diverso con lo stesso slug del nome -> id con suffisso
    -2, -3... assegnato in ordine di prima apparizione (stagione più vecchia)."""
    order = sorted(cards, key=lambda c: (c["season"], c["br_key"]))
    key_to_id = {}
    base_taken = {}
    for c in order:
        base = c["player_id_base"]
        if c["br_key"] in key_to_id:
            c["player_id"] = key_to_id[c["br_key"]]
            continue
        n = base_taken.get(base, 0)
        pid = base if n == 0 else f"{base}-{n + 1}"
        base_taken[base] = n + 1
        key_to_id[c["br_key"]] = pid
        c["player_id"] = pid
    for c in cards:
        del c["player_id_base"]


def pos_obj(pos_str: str) -> dict:
    return {"primary": pos_str, "secondary": None}


def main():
    seasons_needed = list(range(2001, 2015)) + list(range(2021, 2027))
    all_rows = []
    for y in seasons_needed:
        all_rows.extend(load_rows_for_season(y))

    dedupe_ids(all_rows)
    cohort = cohort_stats(all_rows)

    giocabili, filler = [], []
    for c in all_rows:
        card = {
            "player_id": c["player_id"],
            "name": c["name"],
            "season": c["season"],
            "team": c["team"],
            "team_abbr": c["team_abbr"],
            "stats_real": c["stats_real"],
        }
        is_giocabile = c["stats_real"]["gp"] >= MIN_GAMES and c["stats_real"]["min"] >= MIN_MPG
        if is_giocabile:
            card["ovr"] = ovr_stimato(c, cohort)
            card["pos"] = pos_obj(c["pos"])
            # NON "estimated" (quel campo in build-cards.mjs vuol dire "posizione
            # dedotta", non "ovr stimato" - vedi toCard()): campo dedicato per non
            # confondere le due cose, letto dalla UI per l'etichetta "OVR stimato".
            card["ovr_stimato"] = True
            giocabili.append(card)
        else:
            card["ovr"] = 0
            card["pos"] = pos_obj("SF")
            card["ovr_stimato"] = True
            card["_filler"] = True
            filler.append(card)

    payload = giocabili + filler
    OUTPUT_PATH.write_text(
        "// GENERATO da data/build_full_seasons.py - non modificare a mano\n"
        "// OVR stimato dai box stats (non e' un rating 2K vero): vedi docstring\n"
        "// del generatore per formula e calibrazione.\n"
        f"export const ESTIMATED_SEASON_CARDS = {json.dumps(payload, ensure_ascii=False, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    n_seasons = len({c['season'] for c in all_rows})
    print(f"estimated-seasons.js scritto: {len(payload)} carte "
          f"({len(giocabili)} giocabili, {len(filler)} filler), {n_seasons} stagioni.")


if __name__ == "__main__":
    main()
