from pathlib import Path


def test_fixture_esiste_e_ha_intestazione():
    csv_path = Path(__file__).parent / "fixtures" / "sample_rows.csv"
    header = csv_path.read_text(encoding="utf-8").splitlines()[0]
    assert "rankings" in header
    assert "PLAYER" in header
