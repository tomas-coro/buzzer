import pytest
from data.teams import team_name


def test_sigla_nota():
    assert team_name("GSW") == "Golden State Warriors"
    assert team_name("DEN") == "Denver Nuggets"


def test_alias_phoenix():
    # alcune fonti usano 'PHO' invece di 'PHX'
    assert team_name("PHO") == "Phoenix Suns"


def test_sigla_sconosciuta_solleva():
    with pytest.raises(ValueError):
        team_name("ZZZ")
