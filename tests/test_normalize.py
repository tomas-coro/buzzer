import pytest
from data.normalize import slugify_player_id, season_to_edition


def test_slug_base():
    assert slugify_player_id("Stephen Curry") == "stephen-curry"


def test_slug_accenti():
    assert slugify_player_id("Nikola Jokić") == "nikola-jokic"


def test_slug_suffisso_e_spazi():
    assert slugify_player_id("Tim  Hardaway Jr.") == "tim-hardaway-jr"


def test_edizione_valida():
    assert season_to_edition("2015-16") == "2K17"


def test_edizione_sconosciuta_solleva():
    with pytest.raises(ValueError):
        season_to_edition("1999-00")
