import csv
from pathlib import Path
import pytest
from data.build import parse_row, build_cards


def _rows():
    csv_path = Path(__file__).parent / "fixtures" / "sample_rows.csv"
    with csv_path.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def test_parse_row_curry():
    row = _rows()[0]  # Stephen Curry 2015-16
    card = parse_row(row)
    assert card["player_id"] == "stephen-curry"
    assert card["name"] == "Stephen Curry"
    assert card["season"] == "2015-16"
    assert card["edition"] == "2K17"
    assert card["team"] == "Golden State Warriors"
    assert card["team_abbr"] == "GSW"
    assert card["ovr"] == 94
    assert card["stats_real"]["pts"] == 30.1
    assert card["stats_real"]["ast"] == 6.7


def test_parse_row_ovr_mancante_solleva():
    row = dict(_rows()[0])
    row["rankings"] = ""
    with pytest.raises(ValueError):
        parse_row(row)


def test_build_cards_conta_tutte_le_righe():
    cards = build_cards(_rows())
    assert len(cards) == 6
