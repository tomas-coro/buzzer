#!/usr/bin/env python3
"""Genera data/positions-pbp.json: ruolo primario + secondario REALI per giocatore-stagione,
dalle stime posizione (% minuti nei 5 ruoli) della pagina play-by-play di Basketball-Reference.

primary = ruolo con % minuti piu alta; secondary = 2° ruolo se >= SOGLIA (25%), sennò null.
Chiave = "nome-normalizzato|stagione". Copre le stagioni del dataset (2014-15 .. 2019-20).

Uso:  python3 tools/build-positions.py
Scarica le pagine BR se non gia in cache (/tmp/br<anno>.html), poi scrive il JSON.
Fonte: https://www.basketball-reference.com/leagues/NBA_<anno>_play-by-play.html
"""
import re, json, unicodedata, os, sys, time, urllib.request
from pathlib import Path

SOGLIA = 20  # % minuti minima perche il 2° ruolo diventi secondario (cattura i tweener icona: Draymond PF/C, LeBron SF/PF)
SEASONS = {2015: "2014-15", 2016: "2015-16", 2017: "2016-17",
           2018: "2017-18", 2019: "2018-19", 2020: "2019-20"}
POS = ["PG", "SG", "SF", "PF", "C"]
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "v"}

ROOT = Path(__file__).resolve().parent.parent


def normalize(name):
    d = unicodedata.normalize("NFKD", name)
    a = "".join(c for c in d if not unicodedata.combining(c))
    a = a.lower().replace(".", " ").replace("-", " ").replace("'", "")
    return " ".join(t for t in a.split() if t not in SUFFIXES)


def fetch(year):
    cache = Path(f"/tmp/br{year}.html")
    if cache.exists() and cache.stat().st_size > 100000:
        return cache.read_text(encoding="utf-8")
    url = f"https://www.basketball-reference.com/leagues/NBA_{year}_play-by-play.html"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
    cache.write_text(html, encoding="utf-8")
    time.sleep(3)  # gentile con BR
    return html


def cell(row, stat):
    m = re.search(r'data-stat="%s"[^>]*>(.*?)</td>' % stat, row, re.S)
    return re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else ""


def pct(row, stat):
    v = cell(row, stat).replace("%", "").strip()
    return int(v) if v.lstrip("-").isdigit() else 0


def parse(html):
    """name-normalizzato -> lista pct[5], tenendo la riga con piu minuti (giocatori scambiati)."""
    tbl = re.search(r'<table[^>]*id="pbp_stats".*?</table>', html, re.S).group(0)
    best = {}
    for r in re.findall(r"<tr[^>]*>.*?</tr>", tbl, re.S):
        name = cell(r, "name_display")
        if not name:
            continue
        mp = cell(r, "mp").replace(",", "")
        mp = int(mp) if mp.isdigit() else 0
        pcts = [pct(r, f"pct_{i}") for i in range(1, 6)]
        key = normalize(name)
        if key not in best or mp > best[key][0]:
            best[key] = (mp, pcts)
    return best


def roles(pcts):
    order = sorted(range(5), key=lambda i: -pcts[i])
    p1, p2 = order[0], order[1]
    if pcts[p1] == 0:
        return None
    primary = POS[p1]
    secondary = POS[p2] if pcts[p2] >= SOGLIA else None
    return primary, secondary


def main():
    out = {}
    stats = {"tot": 0, "dual": 0}
    for year, season in SEASONS.items():
        html = fetch(year)
        for key, (mp, pcts) in parse(html).items():
            r = roles(pcts)
            if not r:
                continue
            primary, secondary = r
            out[f"{key}|{season}"] = {"primary": primary, "secondary": secondary}
            stats["tot"] += 1
            if secondary:
                stats["dual"] += 1
    dest = ROOT / "data" / "positions-pbp.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"positions-pbp.json scritto: {stats['tot']} voci, "
          f"{stats['dual']} con secondario ({100 * stats['dual'] // stats['tot']}%), soglia {SOGLIA}%")


if __name__ == "__main__":
    main()
