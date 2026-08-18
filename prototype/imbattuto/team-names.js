// Nomi per esteso delle franchigie - SOLO presentazione, come team-colors.js.
// Le carte del motore portano solo `team_abbr` ("MIA"), che in tabella va bene
// ma a schermo grande è muto: "Miami Heat 2014-15" dice a chi stai giocando
// contro, "MIA" no. Nessun impatto sul gioco.
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
