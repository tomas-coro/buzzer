"""Pipeline Fase 1 Step 1: scarica il CSV, costruisce il dataset, verifica, scrive nba-data.js.

Uso:  python -m data.build_step1
"""
import csv
import io
import json
import sys
import urllib.request
from pathlib import Path

from data.build import build_dataset
from data.sanity import run_sanity

SOURCE_URL = "https://raw.githubusercontent.com/willyiamyu/nba2k_analysis/master/nba_rankings_2014-2020"
RAW_PATH = Path(__file__).parent / "raw" / "nba_rankings_2014-2020.csv"
OUTPUT_PATH = Path(__file__).parent / "nba-data.js"


def download_csv(url: str, dest: Path) -> str:
    """Scarica il CSV (con cache locale in dest) e ne restituisce il testo."""
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        print(f"Scarico {url} ...")
        urllib.request.urlretrieve(url, dest)
    return dest.read_text(encoding="utf-8")


def write_js(data: dict, path: Path) -> None:
    """Scrive il dataset come global JS leggibile dal gioco su file://."""
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    path.write_text(
        "// GENERATO da data/build_step1.py — non modificare a mano\n"
        f"const NBA_DATA = {payload};\n",
        encoding="utf-8",
    )


def main() -> int:
    text = download_csv(SOURCE_URL, RAW_PATH)
    rows = list(csv.DictReader(io.StringIO(text)))
    data = build_dataset(rows, source_url=SOURCE_URL)

    report, errors = run_sanity(data, expected_seasons=6)
    print("\n=== SANITY REPORT ===")
    for line in report:
        print(line)

    if errors:
        print("\n=== ERRORI (bloccanti) ===")
        for e in errors:
            print("  X " + e)
        print("\nNON scrivo nba-data.js finché gli errori non sono risolti.")
        return 1

    write_js(data, OUTPUT_PATH)
    print(f"\nOK: scritto {OUTPUT_PATH} ({OUTPUT_PATH.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
