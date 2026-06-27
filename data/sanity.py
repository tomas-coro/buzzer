"""Controlli di coerenza sul dataset costruito. Stampa un report e segnala errori bloccanti."""
from collections import defaultdict


def run_sanity(data: dict, expected_seasons: int = 6):
    cards = data["cards"]
    report: list = []
    errors: list = []

    seasons = sorted({c["season"] for c in cards})
    report.append(f"Carte totali: {len(cards)}")
    report.append(f"Giocatori unici: {data['meta']['n_players']}")
    report.append(f"Stagioni ({len(seasons)}): {', '.join(seasons)}")
    if len(seasons) != expected_seasons:
        errors.append(f"Attese {expected_seasons} stagioni, trovate {len(seasons)}")

    # squadre per stagione (~30 attese sul dataset reale)
    for s in seasons:
        teams = {c["team"] for c in cards if c["season"] == s}
        report.append(f"  {s}: {len(teams)} squadre")

    # OVR nel range plausibile
    fuori = [c for c in cards if not (40 <= c["ovr"] <= 99)]
    if fuori:
        errors.append(
            f"{len(fuori)} carte con OVR fuori [40,99] (es. {fuori[0]['name']} {fuori[0]['ovr']})"
        )

    # top-5 OVR per stagione (controllo a occhio della plausibilità)
    for s in seasons:
        top = sorted((c for c in cards if c["season"] == s), key=lambda c: -c["ovr"])[:5]
        report.append("  TOP " + s + ": " + ", ".join(f"{c['name']}({c['ovr']})" for c in top))

    # collisioni: stesso player_id con nomi diversi
    names_by_id = defaultdict(set)
    for c in cards:
        names_by_id[c["player_id"]].add(c["name"])
    collisioni = {k: v for k, v in names_by_id.items() if len(v) > 1}
    if collisioni:
        esempio = next(iter(collisioni.items()))
        errors.append(
            f"{len(collisioni)} player_id con nomi diversi (es. {esempio[0]}: {sorted(esempio[1])})"
        )

    return report, errors
