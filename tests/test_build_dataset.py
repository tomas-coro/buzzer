import csv
from pathlib import Path
from data.build import build_dataset


def _rows():
    csv_path = Path(__file__).parent / "fixtures" / "sample_rows.csv"
    with csv_path.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def test_meta_conta_carte_e_giocatori():
    data = build_dataset(_rows())
    assert data["meta"]["n_cards"] == 6
    # Curry compare 2 volte -> 5 giocatori unici
    assert data["meta"]["n_players"] == 5
    assert data["meta"]["seasons"] == ["2015-16", "2016-17", "2017-18"]


def test_by_player_raggruppa_versioni_in_ordine_di_stagione():
    data = build_dataset(_rows())
    ids = data["byPlayer"]["stephen-curry"]
    seasons = [data["cards"][i]["season"] for i in ids]
    assert seasons == ["2015-16", "2016-17"]


def test_by_team_season_ordina_per_ovr_desc():
    data = build_dataset(_rows())
    ids = data["byTeamSeason"]["Golden State Warriors|2015-16"]
    cards = [data["cards"][i] for i in ids]
    # Curry (94) prima di Draymond (86)
    assert [c["name"] for c in cards] == ["Stephen Curry", "Draymond Green"]


def test_ogni_carta_ha_id_coerente_con_la_posizione():
    data = build_dataset(_rows())
    for i, card in enumerate(data["cards"]):
        assert card["id"] == i
