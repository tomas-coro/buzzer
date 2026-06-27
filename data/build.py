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
