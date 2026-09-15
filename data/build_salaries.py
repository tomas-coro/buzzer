"""Genera i salari reali per le carte del gioco.

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

from data.br_totals_parser import parse_totals
from data.normalize import slugify_player_id

ROOT = Path(__file__).parent
RAW = ROOT / "raw" / "salaries"
CARDS = ROOT.parent / "prototype" / "imbattuto" / "cards.js"
OUTPUT = ROOT.parent / "game" / "salary-data.js"
REPORT = ROOT / "salary-report.md"
SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "v"}

AWX_COMMIT = "f09b34004b3dbd885c4252775d739527a5baec7b"
AWX_SOURCE = f"https://raw.githubusercontent.com/awx1/stat410-final/{AWX_COMMIT}/salary/format"
AWX_SEASONS = tuple(f"{year}-{str(year + 1)[-2:]}" for year in range(2014, 2020))

BREF_COMMIT = "44653cdb0b639de084ea2471de4740ea18e44c5e"
BREF_SOURCE = (
    "https://raw.githubusercontent.com/garysutton/statisticsplaybook/"
    f"{BREF_COMMIT}/salaries_1985to2018.csv"
)
LEGACY_COMMIT = "5caa66c66dfaed39344f440bb651b07fd7e6ae34"
LEGACY_SOURCE = (
    "https://raw.githubusercontent.com/edwinjeon/NBA-Salary-Prediction/"
    f"{LEGACY_COMMIT}/data/NBA%20Player%20Salaries_2000-2025.csv"
)
CURRENT_COMMIT = "1d800af535496a501e708db3658c9499add5802b"
CURRENT_SOURCE = (
    "https://huggingface.co/datasets/Mr-Bridge/nba-salary-cap-contracts-2016-2026/"
    f"resolve/{CURRENT_COMMIT}/player_salaries.csv"
)


def canonical_name(name: str) -> str:
    parts = slugify_player_id(name).split("-")
    if parts[-1] in SUFFIXES:
        parts.pop()
    return "".join(parts)


def download(url: str, filename: str, encoding: str = "utf-8") -> list[dict]:
    path = RAW / filename
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        print(f"Scarico {url}")
        request = urllib.request.Request(url, headers={"User-Agent": "buzzer-data-import/1.0"})
        context = ssl.create_default_context(cafile="/etc/ssl/cert.pem") if Path("/etc/ssl/cert.pem").exists() else None
        path.write_bytes(urllib.request.urlopen(request, context=context).read())
    return list(csv.DictReader(io.StringIO(path.read_text(encoding=encoding))))


def seasonal_salary(rows: list[dict]) -> int:
    """Somma componenti distinte per squadra e prende il totale maggiore."""
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
    match = re.search(r"export const ALL_CARDS = (\[.*\]);\s*$", text, re.S)
    if not match:
        raise ValueError(f"Formato inatteso: {CARDS}")
    return json.loads(match.group(1))


def source_salaries() -> dict[str, int]:
    salaries = {}

    # HoopsHype 1999-00..2024-25. In questa fonte Season è l'anno finale.
    for row in download(LEGACY_SOURCE, "hoopshype-2000-2025.csv"):
        end = int(row["Season"])
        season = f"{end - 1}-{str(end)[-2:]}"
        salaries[f"{canonical_name(row['Player'])}|{season}"] = int(row["Salary"])

    # Dataset storico Basketball-Reference: usa gli id B-Ref per colmare il
    # periodo 2000-14. Le pagine Totals sono già la cache sorgente delle carte.
    bref = {}
    for row in download(BREF_SOURCE, "basketball-reference-1985-2018.csv"):
        bref[f"{row['player_id']}|{row['season']}"] = int(row["salary"])
    for end in range(2001, 2015):
        season = f"{end - 1}-{str(end)[-2:]}"
        path = ROOT / "raw" / "br_totals" / f"NBA_{end}_totals.html"
        for row in parse_totals(path.read_text(encoding="utf-8")):
            salary = bref.get(f"{row['br_key']}|{season}")
            if salary is not None:
                salaries[f"{canonical_name(row['name'])}|{season}"] = salary

    # Gli snapshot Basketball-Reference già usati dal gioco hanno priorità nel
    # periodo 2014-20; coprono anche pagamenti multipli e giocatori scambiati.
    for season in AWX_SEASONS:
        compact = season.replace("-", "")
        grouped = defaultdict(list)
        for row in download(f"{AWX_SOURCE}/salaries-{compact}.csv", f"salaries-{compact}.csv", "latin-1"):
            grouped[canonical_name(row["Player"])].append(row)
        salaries.update({f"{player}|{season}": seasonal_salary(rows) for player, rows in grouped.items()})

    # Il dataset aggiornato HoopsHype aggiunge la stagione corrente 2025-26.
    current = defaultdict(list)
    for row in download(CURRENT_SOURCE, "hoopshype-2025-26.csv"):
        if row["season"] == "2025-26":
            current[canonical_name(row["player"])].append(int(row["salary"]))
    salaries.update({f"{player}|2025-26": max(values) for player, values in current.items()})
    return salaries


def main() -> None:
    cards = load_cards()
    source = source_salaries()
    salaries = {}
    for card in cards:
        salary = source.get(f"{canonical_name(card['name'])}|{card['season']}")
        if salary is not None:
            salaries[f"{card['player_id']}|{card['season']}"] = salary

    OUTPUT.write_text(
        "// GENERATO da data/build_salaries.py — salario stagionale nominale reale\n"
        f"export const SALARI_STORICI = {json.dumps(salaries, separators=(',', ':'), sort_keys=True)};\n",
        encoding="utf-8",
    )

    seasons = sorted({c["season"] for c in cards})
    lines = [
        "# Copertura salari reali", "",
        f"Fonti: [Basketball-Reference](https://www.basketball-reference.com/about/salary.html) "
        f"(2000-20) e [HoopsHype](https://hoopshype.com/salaries/players/) (1999-2000, 2020-26).",
        "I valori sono nominali per la stagione indicata. Dove manca il dato il gioco usa il **Costo draft** calcolato dall'OVR visibile, senza rumore.",
        "", "| Stagione | Carte | Con salario | Copertura |", "|---|---:|---:|---:|",
    ]
    missing = []
    for season in seasons:
        current = [c for c in cards if c["season"] == season]
        found = [c for c in current if f"{c['player_id']}|{season}" in salaries]
        lines.append(f"| {season} | {len(current)} | {len(found)} | {len(found) / len(current):.1%} |")
        missing.extend(c for c in current if f"{c['player_id']}|{season}" not in salaries)
    found_total = len(cards) - len(missing)
    lines += ["", f"**Totale:** {found_total}/{len(cards)} ({found_total / len(cards):.1%}); mancanti: {len(missing)}."]
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")

    assert salaries["lebron-james|2014-15"] == 20_644_400
    assert salaries["desmond-bane|2025-26"] == 36_725_670
    assert salaries["jalen-suggs|2025-26"] == 35_000_000
    assert not set(salaries).difference(f"{c['player_id']}|{c['season']}" for c in cards)
    print(f"Salari: {len(salaries)} chiavi, {found_total}/{len(cards)} carte; mancanti: {len(missing)}")
    print(f"Scritti {OUTPUT} e {REPORT}")


if __name__ == "__main__":
    main()
