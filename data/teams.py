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
