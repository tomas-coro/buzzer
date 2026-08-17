#!/usr/bin/env python3
"""Genera data/shooting-br.json: volumi di tiro e rimbalzi divisi, per giocatore-stagione.

Perche serve: il box score del dataset 2K ha solo le PERCENTUALI (fg%, 3p%, ft%) e i
rimbalzi totali. Senza i TENTATIVI, un centro che ha infilato tre triple in tutta la
stagione sembra un tiratore migliore di Klay Thompson, e la difesa non si distingue
dai rimbalzi. Qui prendo da Basketball-Reference i totali veri: tentativi da tre,
tiri dal campo, tiri liberi, rimbalzi offensivi e difensivi separati.

Chiave = "nome-normalizzato|stagione" (stessa normalizzazione di build-positions.py,
cosi le due mappe si agganciano allo stesso giocatore).

Uso:  python3 tools/build-shooting.py
Scarica le pagine BR se non gia in cache (/tmp/br_tot<anno>.html), poi scrive il JSON.
Fonte: https://www.basketball-reference.com/leagues/NBA_<anno>_totals.html
"""
import re, json, subprocess, unicodedata, time
from pathlib import Path

SEASONS = {2015: "2014-15", 2016: "2015-16", 2017: "2016-17",
           2018: "2017-18", 2019: "2018-19", 2020: "2019-20"}
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120 Safari/537.36")
SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "v"}
# Campi presi dalla tabella (nomi data-stat di BR).
CAMPI = ["mp", "games", "fga", "fg", "fg3a", "fg3", "fg2a", "fg2", "fta", "ft", "orb", "drb"]

ROOT = Path(__file__).resolve().parent.parent


def normalize(name):
    d = unicodedata.normalize("NFKD", name)
    a = "".join(c for c in d if not unicodedata.combining(c))
    a = a.lower().replace(".", " ").replace("-", " ").replace("'", "")
    return " ".join(t for t in a.split() if t not in SUFFIXES)


def fetch(year):
    cache = Path(f"/tmp/br_tot{year}.html")
    if cache.exists() and cache.stat().st_size > 100000:
        return cache.read_text(encoding="utf-8")
    url = f"https://www.basketball-reference.com/leagues/NBA_{year}_totals.html"
    # curl e non urllib: il Python di sistema qui non ha i certificati installati e
    # urlopen muore con CERTIFICATE_VERIFY_FAILED. Meglio uno strumento che funziona
    # che una catena SSL da sistemare a mano.
    res = subprocess.run(["curl", "-sS", "--fail", "-A", UA, url],
                         capture_output=True, text=True, timeout=60)
    if res.returncode != 0 or len(res.stdout) < 100000:
        raise RuntimeError(f"scarico fallito per {year}: {res.stderr.strip() or 'pagina troppo corta'}")
    cache.write_text(res.stdout, encoding="utf-8")
    time.sleep(3)  # gentile con BR
    return res.stdout


def cell(row, stat):
    m = re.search(r'data-stat="%s"[^>]*>(.*?)</td>' % stat, row, re.S)
    return re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else ""


def num(row, stat):
    v = cell(row, stat).replace(",", "").strip()
    try:
        return float(v)
    except ValueError:
        return 0.0


def parse(html):
    """nome-normalizzato -> dict dei campi. Per i giocatori scambiati BR mette una riga
    per squadra piu una riga totale: tengo quella con piu minuti, cioe il totale."""
    tbl = re.search(r'<table[^>]*id="totals_stats".*?</table>', html, re.S).group(0)
    best = {}
    for r in re.findall(r"<tr[^>]*>.*?</tr>", tbl, re.S):
        name = cell(r, "name_display")
        if not name:
            continue
        row = {c: num(r, c) for c in CAMPI}
        key = normalize(name)
        if key not in best or row["mp"] > best[key]["mp"]:
            best[key] = row
    return best


def main():
    out = {}
    tiratori = 0
    for year, season in SEASONS.items():
        html = fetch(year)
        righe = parse(html)
        for key, row in righe.items():
            if row["mp"] <= 0:
                continue  # riga vuota: niente voce, meglio assente che a zero
            out[f"{key}|{season}"] = {k: (int(v) if v.is_integer() else v) for k, v in row.items()}
            if row["fg3a"] >= 100:
                tiratori += 1
        print(f"  {season}: {len(righe)} giocatori")
    dest = ROOT / "data" / "shooting-br.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"shooting-br.json scritto: {len(out)} voci, "
          f"{tiratori} con almeno 100 tentativi da tre")


if __name__ == "__main__":
    main()
