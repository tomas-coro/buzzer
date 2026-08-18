// Nomi per esteso delle franchigie: sigla -> "Miami Heat".
//
// Sta in game/ e non fra i file di presentazione perché la cronaca la scrive il
// motore (`partita.js` riceve `nome` e lo mette nel testo), quindi il nome deve
// essere disponibile qui dentro. Resta comunque un fatto di sola lettura: la
// sigla continua a essere l'IDENTITÀ dell'avversario (`chiaveAvversario`,
// storia, colori), il nome per esteso è solo come lo si legge a schermo.
export const TEAM_NAMES = {
  ATL: "Atlanta Hawks",
  BKN: "Brooklyn Nets",
  BOS: "Boston Celtics",
  CHA: "Charlotte Hornets",
  CHI: "Chicago Bulls",
  CLE: "Cleveland Cavaliers",
  DAL: "Dallas Mavericks",
  DEN: "Denver Nuggets",
  DET: "Detroit Pistons",
  GSW: "Golden State Warriors",
  HOU: "Houston Rockets",
  IND: "Indiana Pacers",
  LAC: "Los Angeles Clippers",
  LAL: "Los Angeles Lakers",
  MEM: "Memphis Grizzlies",
  MIA: "Miami Heat",
  MIL: "Milwaukee Bucks",
  MIN: "Minnesota Timberwolves",
  NOP: "New Orleans Pelicans",
  NYK: "New York Knicks",
  OKC: "Oklahoma City Thunder",
  ORL: "Orlando Magic",
  PHI: "Philadelphia 76ers",
  PHX: "Phoenix Suns",
  POR: "Portland Trail Blazers",
  SAC: "Sacramento Kings",
  SAS: "San Antonio Spurs",
  TOR: "Toronto Raptors",
  UTA: "Utah Jazz",
  WAS: "Washington Wizards",
};

// Sigla non mappata: torna la sigla, così a schermo si legge comunque qualcosa
// invece di "undefined". Le trenta di sopra coprono tutte le carte del pool.
export function teamName(abbr) {
  return TEAM_NAMES[abbr] ?? abbr;
}
