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

# Tetto salariale NBA per stagione (Basketball-Reference, salary-cap-history.html,
# scaricato il 2026-09-15). Serve per NORMALIZZARE i contratti: un salario nominale
# del 2003 non è confrontabile con uno del 2025 perché il tetto è cresciuto molto
# più dell'inflazione (nuovi accordi TV, nuovi CBA). Deciso con Tomas il 2026-09-15:
# ogni contratto si esprime "come se fosse firmato oggi", cioè alla stessa QUOTA del
# tetto che aveva nel suo anno. Garnett 2003-04 prendeva il 63,6% del tetto 2003-04;
# oggi quella stessa quota vale ~98M. Le anomalie vere restano: un rookie sottopagato
# (quota bassa nel suo anno) resta un affare anche dopo la normalizzazione.
CAP_STORICO = {
    "1984-85": 3_600_000, "1985-86": 4_233_000, "1986-87": 4_945_000,
    "1987-88": 6_164_000, "1988-89": 7_232_000, "1989-90": 9_802_000,
    "1990-91": 11_871_000, "1991-92": 12_500_000, "1992-93": 14_000_000,
    "1993-94": 15_175_000, "1994-95": 15_964_000, "1995-96": 23_000_000,
    "1996-97": 24_363_000, "1997-98": 26_900_000, "1998-99": 30_000_000,
    "1999-00": 34_000_000, "2000-01": 35_500_000, "2001-02": 42_500_000,
    "2002-03": 40_271_000, "2003-04": 43_840_000, "2004-05": 43_870_000,
    "2005-06": 49_500_000, "2006-07": 53_135_000, "2007-08": 55_630_000,
    "2008-09": 58_680_000, "2009-10": 57_700_000, "2010-11": 58_044_000,
    "2011-12": 58_044_000, "2012-13": 58_044_000, "2013-14": 58_679_000,
    "2014-15": 63_065_000, "2015-16": 70_000_000, "2016-17": 94_143_000,
    "2017-18": 99_093_000, "2018-19": 101_869_000, "2019-20": 109_140_000,
    "2020-21": 109_140_000, "2021-22": 112_414_000, "2022-23": 123_655_000,
    "2023-24": 136_021_000, "2024-25": 140_588_000, "2025-26": 154_647_000,
}
CAP_OGGI = CAP_STORICO["2025-26"]


def normalizza(salario: int, season: str) -> int:
    """Il salario come se fosse firmato oggi: stessa quota del tetto, scala di oggi.

    Non arrotonda: il 2025-26 (ratio 1) deve restare il dollaro esatto della fonte,
    come lo era prima della normalizzazione.
    """
    cap = CAP_STORICO.get(season)
    if cap is None:
        raise ValueError(f"CAP_STORICO non copre la stagione {season}: aggiungila prima di generare i salari")
    return round(salario * CAP_OGGI / cap)


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
            salaries[f"{card['player_id']}|{card['season']}"] = normalizza(salary, card["season"])

    OUTPUT.write_text(
        "// GENERATO da data/build_salaries.py - salario stagionale nominale reale\n"
        f"export const SALARI_STORICI = {json.dumps(salaries, separators=(',', ':'), sort_keys=True)};\n",
        encoding="utf-8",
    )

    seasons = sorted({c["season"] for c in cards})
    lines = [
        "# Copertura salari reali", "",
        f"Fonti: [Basketball-Reference](https://www.basketball-reference.com/about/salary.html) "
        f"(2000-20) e [HoopsHype](https://hoopshype.com/salaries/players/) (1999-2000, 2020-26).",
        "I valori sono normalizzati alla quota del tetto salariale che il contratto valeva nel suo anno, "
        "espressa in dollari 2025-26 (fonte tetti: [Basketball-Reference](https://www.basketball-reference.com/contracts/salary-cap-history.html)). "
        "Dove manca il dato il gioco usa il **Costo draft** calcolato dall'OVR visibile, senza rumore.",
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

    assert salaries["lebron-james|2014-15"] == 50_623_873  # 20.6M nominali -> quota 2025-26
    assert salaries["desmond-bane|2025-26"] == 36_725_670
    assert salaries["jalen-suggs|2025-26"] == 35_000_000
    assert not set(salaries).difference(f"{c['player_id']}|{c['season']}" for c in cards)
    print(f"Salari: {len(salaries)} chiavi, {found_total}/{len(cards)} carte; mancanti: {len(missing)}")
    print(f"Scritti {OUTPUT} e {REPORT}")


if __name__ == "__main__":
    main()
