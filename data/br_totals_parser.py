"""Parser della tabella 'Totals' di una stagione da basketball-reference.com.

Fonte: https://www.basketball-reference.com/leagues/NBA_{year}_totals.html
(year = anno di fine stagione, es. 2020 per la 2019-20).

Riga per riga: games, mp, fg, fga, fg3, fg3a, ft, fta, orb, drb, trb, ast, stl,
blk, tov, pts - stesso schema già usato in data/build_legends.mjs (colonna
'row' della funzione daTotali), qui letto dal sito invece che trascritto a
mano.

Righe 2TM/3TM/4TM (giocatore scambiato, riga aggregata multi-squadra) vengono
scartate SEMPRE: si tengono solo le righe della singola squadra, mai
l'aggregato - stessa regola già applicata a mano sulle leggende.
"""
from html.parser import HTMLParser


NUM_FIELDS = [
    "games", "games_started", "mp", "fg", "fga", "fg3", "fg3a", "ft", "fta",
    "orb", "drb", "trb", "ast", "stl", "blk", "tov", "pts",
]
MULTI_TEAM_ABBR = {"2TM", "3TM", "4TM", "5TM", "TOT"}


class _RowParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_totals_table = False
        self.table_depth = 0
        self.rows = []
        self.cur_row = None
        self.cur_stat = None
        self.cur_text = []
        self.in_a = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "table" and attrs.get("id") == "totals_stats":
            self.in_totals_table = True
            self.table_depth = 1
            return
        if not self.in_totals_table:
            return
        if tag == "table":
            self.table_depth += 1
        if tag == "tr":
            self.cur_row = {}
        if tag in ("td", "th") and self.cur_row is not None:
            self.cur_stat = attrs.get("data-stat")
            self.cur_text = []
            if self.cur_stat == "name_display" and attrs.get("data-append-csv"):
                # id univoco B-Ref del giocatore (es. "hardeja01"): serve a
                # distinguere due persone diverse con lo stesso nome.
                self.cur_row["br_key"] = attrs["data-append-csv"]
        if tag == "a":
            self.in_a = True

    def handle_endtag(self, tag):
        if not self.in_totals_table:
            return
        if tag == "table":
            self.table_depth -= 1
            if self.table_depth == 0:
                self.in_totals_table = False
            return
        if tag in ("td", "th") and self.cur_row is not None and self.cur_stat:
            text = "".join(self.cur_text).strip()
            self.cur_row[self.cur_stat] = text
            self.cur_stat = None
        if tag == "tr" and self.cur_row is not None:
            # ogni ~20 righe B-Ref ripete l'header dentro il tbody (stesso
            # data-stat, valore testuale tipo 'G' invece di un numero): la
            # riga vera ha sempre un ranker numerico.
            if self.cur_row.get("name_display") and self.cur_row.get("ranker", "").isdigit():
                self.rows.append(self.cur_row)
            self.cur_row = None
        if tag == "a":
            self.in_a = False

    def handle_data(self, data):
        if self.cur_stat is not None:
            self.cur_text.append(data)


def _to_int(v):
    v = (v or "").strip()
    if v in ("", "-"):
        return 0
    return int(float(v))


def parse_totals(html: str) -> list:
    """HTML della pagina stagione -> righe per-squadra (niente aggregati multi-team)."""
    p = _RowParser()
    p.feed(html)
    out = []
    for r in p.rows:
        team = (r.get("team_name_abbr") or "").strip().upper()
        if team in MULTI_TEAM_ABBR or not team:
            continue
        row = {
            "name": r.get("name_display", "").strip(),
            "br_key": r.get("br_key", "").strip(),
            "team_abbr": team,
            "pos": r.get("pos", "").strip(),
        }
        for f in NUM_FIELDS:
            row[f] = _to_int(r.get(f, "0"))
        out.append(row)
    return out
