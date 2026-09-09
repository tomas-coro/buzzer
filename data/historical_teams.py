"""Sigle storiche basketball-reference (2000-2025) -> (team_abbr canonico usato
già nel dataset, nome squadra di quella stagione).

team_abbr canonico = sigla del franchise oggi (stessa convenzione già usata in
data/build_legends.mjs, es. Seattle Supersonics 1995-96 ha team_abbr "OKC"):
serve a raggruppare stagioni della stessa franchigia sotto la stessa chiave,
anche se la squadra ha cambiato città/nome nel frattempo.

Lignaggio Hornets/Pelicans/Bobcats: seguo la ricostruzione ufficiale NBA (2014)
- Charlotte Hornets 1988-2002 è la STESSA franchigia che oggi è New Orleans
Pelicans (NOP); i Charlotte Bobcats 2004-2014 (poi rinominati Hornets nel 2014)
sono un'espansione diversa, oggi CHA.
"""

HISTORICAL_TEAMS = {
    # sigla B-Ref: (team_abbr canonico, nome squadra in quella stagione)
    "SEA": ("OKC", "Seattle SuperSonics"),
    "OKC": ("OKC", "Oklahoma City Thunder"),
    "NJN": ("BKN", "New Jersey Nets"),
    "BRK": ("BKN", "Brooklyn Nets"),
    "CHH": ("NOP", "Charlotte Hornets"),
    "NOH": ("NOP", "New Orleans Hornets"),
    "NOK": ("NOP", "New Orleans/Oklahoma City Hornets"),
    "NOP": ("NOP", "New Orleans Pelicans"),
    "CHA": ("CHA", "Charlotte Bobcats"),
    "CHO": ("CHA", "Charlotte Hornets"),
    "PHO": ("PHX", "Phoenix Suns"),
    "VAN": ("MEM", "Vancouver Grizzlies"),
    "MEM": ("MEM", "Memphis Grizzlies"),
}

# Squadre che non hanno cambiato sigla/nome nel 2000-2025: sigla B-Ref == sigla
# canonica == nome corrente (preso da data/teams.py).
STABLE_ABBR = {
    "ATL", "BOS", "CHI", "CLE", "DAL", "DEN", "DET", "GSW", "HOU", "IND",
    "LAC", "LAL", "MIA", "MIL", "MIN", "NYK", "ORL", "PHI", "POR", "SAC",
    "SAS", "TOR", "UTA", "WAS",
}


def resolve_team(br_abbr: str, current_names: dict) -> tuple:
    """Sigla B-Ref -> (team_abbr canonico, nome squadra della stagione)."""
    br_abbr = br_abbr.strip().upper()
    if br_abbr in HISTORICAL_TEAMS:
        return HISTORICAL_TEAMS[br_abbr]
    if br_abbr in STABLE_ABBR:
        return br_abbr, current_names[br_abbr]
    raise ValueError(f"Sigla B-Ref sconosciuta: {br_abbr!r} (aggiungerla a HISTORICAL_TEAMS)")
