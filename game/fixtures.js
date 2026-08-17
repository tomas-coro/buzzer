// Carta-fixture minima per i test del motore. Override via `over`.
export function card(over = {}) {
  return {
    player_id: over.player_id ?? "test-player",
    name: over.name ?? "Test Player",
    season: over.season ?? "2015-16",
    team: over.team ?? "GSW",
    ovr: over.ovr ?? 80,
    // Reparti al valore mediano: una carta "media" della sua stagione. I test
    // che vogliono un profilo (tiratore, lungo) li passano espliciti.
    reparti: over.reparti ?? { t3: 50, fin: 50, dif: 50, reb: 50, reg: 50 },
    pos: over.pos ?? { primary: "PG", secondary: null },
    // Riga vera di un titolare qualsiasi: serve al box score, che dalle quote
    // di `stats_real` ricava chi segna e chi rimbalza. Sulle carte vere c'è
    // sempre; qui non può mancare, altrimenti i test del run non girano.
    stats_real: over.stats_real ?? {
      pts: 14, reb: 5, ast: 4, stl: 1, blk: 0.5, tov: 2, min: 30,
      fg_pct: 45, tp_pct: 35, ft_pct: 78, gp: 70, plus_minus: 0,
    },
    // Volumi di tiro della stagione: tentativi da tre, da due e liberi. Da qui
    // il punto a punto ricava COME un giocatore fa i suoi punti. Sulle carte
    // vere ci sono quasi sempre; chi non li passa ottiene il mix di lega, che è
    // esattamente il ripiego che `profiloTiro` deve saper gestire.
    stats_vol: over.stats_vol ?? {
      fg3a: 300, fg3: 105, fg2a: 600, fg2: 300, fta: 300, ft: 240,
      orb: 90, drb: 400, min: 2100, gp: 70,
    },
    att: over.att ?? [70, 70, 70, 70, 70, 70, 70],
    // def centrata sulla media di lega (mediaDefW=52): carta realistica.
    def: over.def ?? [52, 52, 52, 52, 52],
  };
}
