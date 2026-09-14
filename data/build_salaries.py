"""Genera i salari 2014-20 da snapshot Basketball-Reference.

Uso: python3 -m data.build_salaries
"""
import csv
import io
import json
import re
import ssl
import urllib.request
from collections import defaultdict
from pathlib import Path

from data.normalize import slugify_player_id

COMMIT = "f09b34004b3dbd885c4252775d739527a5baec7b"
SOURCE = f"https://raw.githubusercontent.com/awx1/stat410-final/{COMMIT}/salary/format"
ROOT = Path(__file__).parent
RAW = ROOT / "raw" / "salaries"
CARDS = ROOT / "nba-data.js"
OUTPUT = ROOT.parent / "game" / "salary-data.js"
REPORT = ROOT / "salary-report.md"
SEASONS = tuple(f"{year}-{str(year + 1)[-2:]}" for year in range(2014, 2020))
SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "v"}


def canonical_player_id(player_id: str) -> str:
    parts = player_id.split("-")
    if parts[-1] in SUFFIXES:
        parts.pop()
    return "".join(parts)


def read_source(season: str) -> list[dict]:
    compact = season.replace("-", "")
    path = RAW / f"salaries-{compact}.csv"
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        url = f"{SOURCE}/salaries-{compact}.csv"
        print(f"Scarico {url}")
        request = urllib.request.Request(url, headers={"User-Agent": "buzzer-data-import/1.0"})
        context = ssl.create_default_context(cafile="/etc/ssl/cert.pem") if Path("/etc/ssl/cert.pem").exists() else None
        path.write_bytes(urllib.request.urlopen(request, context=context).read())
    return list(csv.DictReader(io.StringIO(path.read_text(encoding="latin-1"))))


def seasonal_salary(rows: list[dict]) -> int:
    """Somma le componenti distinte per squadra e prende il totale maggiore.

    Gli snapshot possono avere più pagamenti per giocatore (trade, tagli, 10-day):
    non sommiamo squadre diverse, così dead money e doppi cap charge non diventano
    un finto salario unico.
    """
    by_team = defaultdict(int)
    seen = set()
    for row in rows:
        item = (row["Tm"], row["Money"])
        if item not in seen:
            seen.add(item)
            by_team[row["Tm"]] += int(row["Money"])
    return max(by_team.values())


def load_cards() -> list[dict]:
    text = CARDS.read_text(encoding="utf-8")
    match = re.search(r"const NBA_DATA = (.*);\s*$", text, re.S)
    if not match:
        raise ValueError(f"Formato inatteso: {CARDS}")
    return json.loads(match.group(1))["cards"]


def main() -> None:
    source_rows = {}
    for season in SEASONS:
        grouped = defaultdict(list)
        for row in read_source(season):
            grouped[canonical_player_id(slugify_player_id(row["Player"]))].append(row)
        source_rows.update({f"{player}|{season}": seasonal_salary(rows) for player, rows in grouped.items()})

    cards = load_cards()
    salaries = {}
    for card in cards:
        source_key = f"{canonical_player_id(card['player_id'])}|{card['season']}"
        if source_key in source_rows:
            salaries[f"{card['player_id']}|{card['season']}"] = source_rows[source_key]
    OUTPUT.write_text(
        "// GENERATO da data/build_salaries.py — salario stagionale nominale Basketball-Reference\n"
        f"export const SALARI_STORICI = {json.dumps(salaries, separators=(',', ':'), sort_keys=True)};\n",
        encoding="utf-8",
    )

    lines = [
        "# Copertura salari Basketball-Reference", "",
        f"Fonte: snapshot di `basketball-reference.com/contracts/players.html` archiviati nel dataset "
        f"[`awx1/stat410-final`](https://github.com/awx1/stat410-final/tree/{COMMIT}/salary) (commit `{COMMIT}`).",
        "", "I valori sono nominali, senza rivalutazione; bonus, dead money, cap hold e luxury-tax charge non vengono aggiunti.",
        "Le carte fuori dal dataset base 2014-20 e i valori mancanti usano nel gioco un fallback esplicitamente mostrato come **Costo draft**.",
        "", "| Stagione | Carte | Con salario | Copertura |", "|---|---:|---:|---:|",
    ]
    missing = []
    for season in SEASONS:
        current = [c for c in cards if c["season"] == season]
        found = [c for c in current if f"{c['player_id']}|{season}" in salaries]
        lines.append(f"| {season} | {len(current)} | {len(found)} | {len(found) / len(current):.1%} |")
        missing.extend(c for c in current if f"{c['player_id']}|{season}" not in salaries)
    lines += ["", f"**Totale:** {len(salaries)}/{len(cards)} ({len(salaries) / len(cards):.1%}); mancanti: {len(missing)}.",
              "", "## Mancanti", ""]
    lines += [f"- `{c['player_id']}|{c['season']}` — {c['name']} ({c['team_abbr']})" for c in missing]
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")

    assert salaries["lebron-james|2014-15"] == 20_644_400
    assert not set(salaries).difference(f"{c['player_id']}|{c['season']}" for c in cards)
    print(f"Salari: {len(salaries)}/{len(cards)}; mancanti: {len(missing)}")
    print(f"Scritti {OUTPUT} e {REPORT}")


if __name__ == "__main__":
    main()
