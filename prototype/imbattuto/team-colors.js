// Colori franchigia — SOLO presentazione (segnaposto faccia: gradiente + iniziali).
// Il motore non conosce i colori: le carte hanno solo `team_abbr`. Qui mappo le 30
// franchigie NBA moderne (le uniche presenti nelle carte) su una coppia
// primario/scuro per il gradiente del segnaposto. Nessun impatto sul gioco.
//
// c1 = tinta primaria (medio-scura, così le iniziali bianche restano leggibili)
// c2 = versione più cupa per il fondo del gradiente (profondità)

export const TEAM_COLORS = {
  ATL: { c1: "#e03a3e", c2: "#6d1214" }, // Hawks
  BKN: { c1: "#3a3a3a", c2: "#101010" }, // Nets
  BOS: { c1: "#007a33", c2: "#00401b" }, // Celtics
  CHA: { c1: "#00788c", c2: "#003b45" }, // Hornets
  CHI: { c1: "#ce1141", c2: "#6d0a22" }, // Bulls
  CLE: { c1: "#860038", c2: "#42001c" }, // Cavaliers
  DAL: { c1: "#0053bc", c2: "#00285f" }, // Mavericks
  DEN: { c1: "#255aa8", c2: "#0e2240" }, // Nuggets
  DET: { c1: "#c8102e", c2: "#5f0816" }, // Pistons
  GSW: { c1: "#1d428a", c2: "#0f2350" }, // Warriors
  HOU: { c1: "#ce1141", c2: "#6d0a22" }, // Rockets
  IND: { c1: "#0a4d9c", c2: "#002d62" }, // Pacers
  LAC: { c1: "#c8102e", c2: "#0f2350" }, // Clippers
  LAL: { c1: "#552583", c2: "#2f1447" }, // Lakers
  MEM: { c1: "#5d76a9", c2: "#232f4f" }, // Grizzlies
  MIA: { c1: "#98002e", c2: "#4d0017" }, // Heat
  MIL: { c1: "#00711c", c2: "#002510" }, // Bucks
  MIN: { c1: "#236192", c2: "#0c2340" }, // Timberwolves
  NOP: { c1: "#1a3d6d", c2: "#0c2340" }, // Pelicans
  NYK: { c1: "#006bb6", c2: "#003a63" }, // Knicks
  OKC: { c1: "#007ac1", c2: "#003b5c" }, // Thunder
  ORL: { c1: "#0077c0", c2: "#003b5e" }, // Magic
  PHI: { c1: "#006bb6", c2: "#003a63" }, // 76ers
  PHX: { c1: "#3b2b8f", c2: "#1d1160" }, // Suns
  POR: { c1: "#e03a3e", c2: "#3a1213" }, // Trail Blazers
  SAC: { c1: "#5a2d81", c2: "#2d1640" }, // Kings
  SAS: { c1: "#565656", c2: "#161616" }, // Spurs
  TOR: { c1: "#ce1141", c2: "#6d0a22" }, // Raptors
  UTA: { c1: "#0a2d5c", c2: "#00152e" }, // Jazz
  WAS: { c1: "#12335e", c2: "#00152e" }, // Wizards
};

// Fallback neutro Cabina 90s per abbr non mappati (mai, in teoria, ma niente crash muto).
const FALLBACK = { c1: "#3a2d5e", c2: "#211636" };

export function teamColors(abbr) {
  return TEAM_COLORS[abbr] ?? FALLBACK;
}

// Iniziali dal nome: prime lettere dei primi due token alfabetici.
// "Anthony Davis" -> "AD"; "James Ennis III" -> "JE"; "Al-Farouq Aminu" -> "AA".
export function initials(name) {
  const parts = String(name)
    .replace(/[.]/g, " ")
    .split(/\s+/)
    .filter((w) => /[a-zA-Z]/.test(w));
  if (parts.length === 0) return "?";
  const a = parts[0][0];
  const b = parts.length > 1 ? parts[1][0] : (parts[0][1] ?? "");
  return (a + b).toUpperCase();
}
