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


def build_dataset(rows: list, source_url: str = "") -> dict:
    """Righe CSV -> dataset completo (cards + indici + meta).

    Gli indici contengono id interi che puntano a `cards`, così i dati non sono duplicati.
    """
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
