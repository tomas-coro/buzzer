import csv
from pathlib import Path
from data.build import build_dataset
from data.sanity import run_sanity


def _data():
    csv_path = Path(__file__).parent / "fixtures" / "sample_rows.csv"
    with csv_path.open(encoding="utf-8") as f:
        return build_dataset(list(csv.DictReader(f)))


def test_fixture_ha_3_stagioni_attese():
    report, errors = run_sanity(_data(), expected_seasons=3)
    assert errors == []
    assert any("Carte totali: 6" in line for line in report)


def test_numero_stagioni_sbagliato_e_errore():
    _, errors = run_sanity(_data(), expected_seasons=6)
    assert any("stagioni" in e for e in errors)


def test_ovr_fuori_range_e_errore():
    data = _data()
    data["cards"][0]["ovr"] = 150
    _, errors = run_sanity(data, expected_seasons=3)
    assert any("OVR fuori" in e for e in errors)


def test_collisione_player_id_e_errore():
    data = _data()
    # forzo due nomi diversi sullo stesso player_id
    data["cards"][0]["player_id"] = "stephen-curry"
    data["cards"][0]["name"] = "Steph Curry"
    data["cards"][1]["player_id"] = "stephen-curry"
    data["byPlayer"]["stephen-curry"] = [0, 1]
    _, errors = run_sanity(data, expected_seasons=3)
    assert any("nomi diversi" in e for e in errors)
