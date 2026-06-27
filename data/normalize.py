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
    slug = re.sub(r"[^a-z0-9]+", "-", slug)      # tutto ciò che non è lettera/numero -> '-'
    slug = re.sub(r"-+", "-", slug).strip("-")   # niente '-' doppi o ai bordi
    return slug


def season_to_edition(season: str) -> str:
    """'2015-16' -> '2K17'. Solleva ValueError se la stagione non è nel range coperto."""
    try:
        return SEASON_TO_EDITION[season]
    except KeyError:
        raise ValueError(f"Stagione non mappata a un'edizione 2K: {season!r}")
