// Carta-fixture minima per i test del motore. Override via `over`.
export function card(over = {}) {
  return {
    player_id: over.player_id ?? "test-player",
    name: over.name ?? "Test Player",
    season: over.season ?? "2015-16",
    team: over.team ?? "GSW",
    ovr: over.ovr ?? 80,
    pos: over.pos ?? { primary: "PG", secondary: null },
    att: over.att ?? [70, 70, 70, 70, 70, 70, 70],
    // def centrata sulla media di lega (mediaDefW=52): carta realistica.
    def: over.def ?? [52, 52, 52, 52, 52],
  };
}
