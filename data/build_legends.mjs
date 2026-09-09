// GENERATO A MANO da data/build_legends.mjs - esegui `node data/build_legends.mjs`
// per rigenerare data/legends.js. Fonti: Basketball-Reference (tabella Totals di
// stagione: games,mp,fg,fga,fg3,fg3a,fg2,fg2a,ft,fta,orb,drb,trb,ast,stl,blk,tov,pts
// - per i giocatori scambiati durante l'anno uso lo split della sola squadra
// pilota, mai l'aggregato multi-team, per non mischiare due squadre in una carta)
// e 2kratings.com (overall NBA 2K e posizione primaria/secondaria - le uniche
// squadre "classic" con un OVR curato sono queste 5 stagioni pilota).
import { writeFileSync } from "node:fs";

function round1(n) { return Math.round(n * 10) / 10; }

// row = [games, mp, fg, fga, fg3, fg3a, fg2, fg2a, ft, fta, orb, drb, trb, ast, stl, blk, tov, pts]
function daTotali(row) {
  const [games, mp, fg, fga, fg3, fg3a, fg2, fg2a, ft, fta, orb, drb, trb, ast, stl, blk, tov, pts] = row;
  return {
    stats_real: {
      pts: round1(pts / games), reb: round1(trb / games), ast: round1(ast / games),
      stl: round1(stl / games), blk: round1(blk / games), tov: round1(tov / games),
      fg_pct: round1((100 * fg) / fga), tp_pct: fg3a > 0 ? round1((100 * fg3) / fg3a) : 0,
      ft_pct: fta > 0 ? round1((100 * ft) / fta) : 0, min: round1(mp / games),
      gp: games, plus_minus: 0,
    },
    stats_vol_raw: { fg3a, fg3, fg2a, fg2, fta, ft, orb, drb, mp, games },
  };
}

function pos(str) {
  const [primary, secondary] = str.split("/").map((s) => s.trim());
  return { primary, secondary: secondary || null };
}

// Carta giocabile: ha overall 2K e posizione curata da 2kratings.
function giocabile(player_id, name, ovr, posStr, row) {
  return { player_id, name, ovr, pos: pos(posStr), ...daTotali(row) };
}

// Carta filler: allarga il pool percentile della stagione ma non è giocabile
// (niente OVR, mai in cards.js) - vedi build-cards.mjs / game/reparti.js.
function filler(player_id, name, row) {
  return { player_id, name, _filler: true, ...daTotali(row) };
}

const cards = [];

// ============================== Milwaukee Bucks 1984-85 ==============================
// Ricopiate identiche (verificate contro Basketball-Reference) da
// scratchpad/add-bucks8485.mjs, sessione precedente. Unica correzione: player_id
// "mike-dunleavy" -> "mike-dunleavy-sr" per la collisione con Dunleavy Jr. già
// presente in data/nba-data.js (stagione 2019-20).
const MIL8485 = { season: "1984-85", team: "Milwaukee Bucks", team_abbr: "MIL" };
cards.push(
  { player_id: "sidney-moncrief", name: "Sidney Moncrief", ovr: 90, pos: pos("SG/PG"),
    stats_real: { pts: 21.7, reb: 5.4, ast: 5.2, stl: 1.6, blk: 0.5, tov: 2.5, fg_pct: 48.3, tp_pct: 27.3, ft_pct: 82.8, min: 37.5, gp: 73, plus_minus: 0 },
    stats_vol_raw: { fg3a: 33, fg3: 9, fg2a: 1129, fg2: 552, fta: 548, ft: 454, orb: 149, drb: 242, mp: 2734, games: 73 } },
  { player_id: "terry-cummings", name: "Terry Cummings", ovr: 88, pos: pos("PF/C"),
    stats_real: { pts: 23.6, reb: 9.1, ast: 2.9, stl: 1.5, blk: 0.8, tov: 2.4, fg_pct: 49.5, tp_pct: 0, ft_pct: 74.1, min: 34.5, gp: 79, plus_minus: 0 },
    stats_vol_raw: { fg3a: 1, fg3: 0, fg2a: 1531, fg2: 759, fta: 463, ft: 343, orb: 244, drb: 472, mp: 2722, games: 79 } },
  { player_id: "paul-pressey", name: "Paul Pressey", ovr: 85, pos: pos("SG/SF"),
    stats_real: { pts: 16.1, reb: 5.4, ast: 6.8, stl: 1.6, blk: 0.7, tov: 3.1, fg_pct: 51.7, tp_pct: 35.0, ft_pct: 75.8, min: 36.0, gp: 80, plus_minus: 0 },
    stats_vol_raw: { fg3a: 20, fg3: 7, fg2a: 908, fg2: 473, fta: 418, ft: 317, orb: 149, drb: 280, mp: 2876, games: 80 } },
  { player_id: "alton-lister", name: "Alton Lister", ovr: 79, pos: pos("C/PF"),
    stats_real: { pts: 9.9, reb: 8.0, ast: 1.6, stl: 0.6, blk: 2.1, tov: 2.3, fg_pct: 53.8, tp_pct: 0, ft_pct: 58.8, min: 25.8, gp: 81, plus_minus: 0 },
    stats_vol_raw: { fg3a: 1, fg3: 0, fg2a: 597, fg2: 322, fta: 262, ft: 154, orb: 219, drb: 428, mp: 2091, games: 81 } },
  { player_id: "ricky-pierce", name: "Ricky Pierce", ovr: 76, pos: pos("SF/SG"),
    stats_real: { pts: 9.8, reb: 2.7, ast: 2.1, stl: 0.8, blk: 0.1, tov: 1.4, fg_pct: 53.7, tp_pct: 25.0, ft_pct: 82.3, min: 20.0, gp: 44, plus_minus: 0 },
    stats_vol_raw: { fg3a: 4, fg3: 1, fg2a: 303, fg2: 164, fta: 124, ft: 102, orb: 49, drb: 68, mp: 882, games: 44 } },
  { player_id: "mike-dunleavy-sr", name: "Mike Dunleavy", ovr: 74, pos: pos("PG/SG"),
    stats_real: { pts: 8.9, reb: 1.6, ast: 4.5, stl: 0.8, blk: 0.2, tov: 2.1, fg_pct: 47.4, tp_pct: 34.0, ft_pct: 86.2, min: 22.8, gp: 19, plus_minus: 0 },
    stats_vol_raw: { fg3a: 47, fg3: 16, fg2a: 88, fg2: 48, fta: 29, ft: 25, orb: 6, drb: 25, mp: 433, games: 19 } },
  { player_id: "randy-breuer", name: "Randy Breuer", ovr: 73, pos: pos("C/PF"),
    stats_real: { pts: 5.3, reb: 3.3, ast: 0.5, stl: 0.3, blk: 1.1, tov: 0.8, fg_pct: 51.1, tp_pct: 0, ft_pct: 70.1, min: 13.9, gp: 78, plus_minus: 0 },
    stats_vol_raw: { fg3a: 0, fg3: 0, fg2a: 317, fg2: 162, fta: 127, ft: 89, orb: 92, drb: 164, mp: 1083, games: 78 } },
  { player_id: "charles-davis", name: "Charles Davis", ovr: 73, pos: pos("SF/PF"),
    stats_real: { pts: 6.2, reb: 2.6, ast: 0.9, stl: 0.4, blk: 0.1, tov: 0.9, fg_pct: 43.6, tp_pct: 10.0, ft_pct: 82.8, min: 13.1, gp: 57, plus_minus: 0 },
    stats_vol_raw: { fg3a: 10, fg3: 1, fg2a: 336, fg2: 150, fta: 58, ft: 48, orb: 57, drb: 92, mp: 746, games: 57 } },
  { player_id: "kevin-grevey", name: "Kevin Grevey", ovr: 73, pos: pos("SF/SG"),
    stats_real: { pts: 6.1, reb: 1.3, ast: 1.2, stl: 0.4, blk: 0.0, tov: 0.7, fg_pct: 44.8, tp_pct: 24.2, ft_pct: 82.2, min: 15.2, gp: 78, plus_minus: 0 },
    stats_vol_raw: { fg3a: 33, fg3: 8, fg2a: 391, fg2: 182, fta: 107, ft: 88, orb: 27, drb: 76, mp: 1182, games: 78 } },
  { player_id: "craig-hodges", name: "Craig Hodges", ovr: 73, pos: pos("PG/SG"),
    stats_real: { pts: 10.6, reb: 2.3, ast: 4.3, stl: 1.2, blk: 0.0, tov: 1.6, fg_pct: 49.0, tp_pct: 34.8, ft_pct: 81.5, min: 30.4, gp: 82, plus_minus: 0 },
    stats_vol_raw: { fg3a: 135, fg3: 47, fg2a: 597, fg2: 312, fta: 130, ft: 106, orb: 74, drb: 112, mp: 2496, games: 82 } },
  { player_id: "chris-engler", name: "Chris Engler", ovr: 70, pos: pos("C/PF"),
    stats_real: { pts: 0.0, reb: 1.0, ast: 0.0, stl: 0.0, blk: 1.0, tov: 0.0, fg_pct: 0.0, tp_pct: 0, ft_pct: 0.0, min: 3.0, gp: 1, plus_minus: 0 },
    stats_vol_raw: { fg3a: 0, fg3: 0, fg2a: 2, fg2: 0, fta: 0, ft: 0, orb: 1, drb: 0, mp: 3, games: 1 } },
  { player_id: "kenny-fields", name: "Kenny Fields", ovr: 70, pos: { primary: "SF", secondary: null },
    stats_real: { pts: 3.8, reb: 1.6, ast: 0.7, stl: 0.2, blk: 0.2, tov: 0.6, fg_pct: 44.0, tp_pct: 0, ft_pct: 75.0, min: 10.5, gp: 51, plus_minus: 0 },
    stats_vol_raw: { fg3a: 0, fg3: 0, fg2a: 191, fg2: 84, fta: 36, ft: 27, orb: 41, drb: 43, mp: 535, games: 51 } },
  { player_id: "paul-mokeski", name: "Paul Mokeski", ovr: 65, pos: pos("C/PF"),
    stats_real: { pts: 6.2, reb: 5.2, ast: 1.3, stl: 0.4, blk: 0.4, tov: 1.1, fg_pct: 47.8, tp_pct: 0, ft_pct: 69.8, min: 20.1, gp: 79, plus_minus: 0 },
    stats_vol_raw: { fg3a: 2, fg3: 0, fg2a: 427, fg2: 205, fta: 116, ft: 81, orb: 107, drb: 303, mp: 1586, games: 79 } },
);
for (const c of cards) Object.assign(c, MIL8485);

// ============================== Atlanta Hawks 1985-86 ==============================
const start1 = cards.length;
const ATL = { season: "1985-86", team: "Atlanta Hawks", team_abbr: "ATL" };
cards.push(
  giocabile("dominique-wilkins", "Dominique Wilkins", 90, "SF/SG", [78, 3049, 888, 1897, 13, 70, 875, 1827, 577, 705, 261, 357, 618, 206, 138, 49, 251, 2366]),
  giocabile("doc-rivers", "Doc Rivers", 84, "PG/SG", [53, 1571, 220, 464, 0, 16, 220, 448, 172, 283, 49, 113, 162, 443, 120, 13, 141, 612]),
  giocabile("kevin-willis", "Kevin Willis", 79, "PF/C", [82, 2300, 419, 811, 0, 6, 419, 805, 172, 263, 243, 461, 704, 45, 66, 44, 177, 1010]),
  giocabile("tree-rollins", "Tree Rollins", 77, "C/PF", [74, 1781, 173, 347, 0, 1, 173, 346, 69, 90, 131, 327, 458, 41, 38, 167, 91, 415]),
  giocabile("spud-webb", "Spud Webb", 77, "PG/SG", [79, 1229, 199, 412, 2, 11, 197, 401, 216, 275, 27, 96, 123, 337, 82, 5, 159, 616]),
  giocabile("randy-wittman", "Randy Wittman", 77, "SG/SF", [81, 2760, 467, 881, 5, 16, 462, 865, 104, 135, 51, 119, 170, 306, 81, 14, 114, 1043]),
  giocabile("jon-koncak", "Jon Koncak", 76, "C/PF", [82, 1695, 263, 519, 0, 1, 263, 518, 156, 257, 171, 296, 467, 55, 37, 69, 111, 682]),
  giocabile("cliff-levingston", "Cliff Levingston", 76, "PF/SF", [81, 1945, 294, 551, 0, 1, 294, 550, 164, 242, 193, 341, 534, 72, 76, 39, 113, 752]),
  // Split ATL-only (2TM in totals): stagione divisa CLE/ATL, tenuta la sola quota Hawks.
  giocabile("johnny-davis", "Johnny Davis", 73, "PG/SG", [27, 402, 46, 107, 1, 2, 45, 105, 51, 59, 2, 17, 19, 112, 13, 0, 38, 144]),
  giocabile("john-battle", "John Battle", 72, "SG/SF", [64, 639, 101, 222, 0, 7, 101, 215, 75, 103, 12, 50, 62, 74, 23, 3, 47, 277]),
  giocabile("antoine-carr", "Antoine Carr", 69, "PF/C", [17, 258, 49, 93, 0, 0, 49, 93, 18, 27, 16, 36, 52, 14, 7, 15, 14, 116]),
  giocabile("scott-hastings", "Scott Hastings", 68, "PF/C", [62, 650, 65, 159, 3, 4, 62, 155, 60, 70, 44, 80, 124, 26, 14, 8, 40, 193]),
  filler("lorenzo-charles", "Lorenzo Charles", [36, 273, 49, 88, 0, 0, 49, 88, 24, 36, 13, 26, 39, 8, 2, 6, 18, 122]),
);
for (let i = start1; i < cards.length; i++) Object.assign(cards[i], ATL);

// ============================== Boston Celtics 1985-86 ==============================
const start2 = cards.length;
const BOS = { season: "1985-86", team: "Boston Celtics", team_abbr: "BOS" };
cards.push(
  giocabile("larry-bird", "Larry Bird", 98, "SF/PF", [82, 3113, 796, 1606, 82, 194, 714, 1412, 441, 492, 190, 615, 805, 557, 166, 51, 266, 2115]),
  giocabile("kevin-mchale", "Kevin McHale", 91, "PF/C", [68, 2397, 561, 978, 0, 0, 561, 978, 326, 420, 171, 380, 551, 181, 29, 134, 149, 1448]),
  giocabile("dennis-johnson", "Dennis Johnson", 85, "PG/SG", [78, 2732, 482, 1060, 6, 42, 476, 1018, 243, 297, 69, 199, 268, 456, 110, 35, 173, 1213]),
  giocabile("robert-parish", "Robert Parish", 85, "C/PF", [81, 2567, 530, 966, 0, 0, 530, 966, 245, 335, 246, 524, 770, 145, 65, 116, 187, 1305]),
  giocabile("bill-walton", "Bill Walton", 81, "C/PF", [80, 1546, 231, 411, 0, 0, 231, 411, 144, 202, 136, 408, 544, 165, 38, 106, 151, 606]),
  giocabile("danny-ainge", "Danny Ainge", 78, "SG/PG", [80, 2407, 353, 701, 26, 73, 327, 628, 123, 136, 47, 188, 235, 405, 94, 7, 129, 855]),
  giocabile("scott-wedman", "Scott Wedman", 76, "SF/SG", [79, 1402, 286, 605, 17, 48, 269, 557, 45, 68, 66, 126, 192, 83, 38, 22, 54, 634]),
  giocabile("jerry-sichting", "Jerry Sichting", 75, "PG/SG", [82, 1596, 235, 412, 6, 16, 229, 396, 61, 66, 27, 77, 104, 188, 50, 0, 73, 537]),
  giocabile("sam-vincent", "Sam Vincent", 69, "PG/SG", [57, 432, 59, 162, 1, 4, 58, 158, 65, 70, 11, 37, 48, 69, 17, 4, 49, 184]),
  giocabile("greg-kite", "Greg Kite", 68, "C", [64, 464, 34, 91, 0, 1, 34, 90, 15, 39, 35, 93, 128, 17, 3, 28, 32, 83]),
  filler("rick-carlisle", "Rick Carlisle", [77, 760, 92, 189, 0, 10, 92, 179, 15, 23, 22, 55, 77, 104, 19, 4, 50, 199]),
  filler("david-thirdkill", "David Thirdkill", [49, 385, 54, 110, 0, 1, 54, 109, 55, 88, 27, 43, 70, 15, 11, 3, 19, 163]),
  filler("sly-williams", "Sly Williams", [6, 54, 5, 21, 0, 4, 5, 17, 7, 12, 7, 8, 15, 2, 1, 1, 7, 17]),
);
for (let i = start2; i < cards.length; i++) Object.assign(cards[i], BOS);

// ============================== Chicago Bulls 1985-86 ==============================
const start3 = cards.length;
const CHI = { season: "1985-86", team: "Chicago Bulls", team_abbr: "CHI" };
cards.push(
  // Rookie year di Jordan: 18 partite giocate (infortunio al piede), volumi bassi ma reali.
  giocabile("michael-jordan", "Michael Jordan", 90, "SG/SF", [18, 451, 150, 328, 3, 18, 147, 310, 105, 125, 23, 41, 64, 53, 37, 21, 45, 408]),
  giocabile("george-gervin", "George Gervin", 82, "SF/SG", [82, 2065, 519, 1100, 4, 19, 515, 1081, 283, 322, 78, 137, 215, 144, 49, 23, 161, 1325]),
  giocabile("charles-oakley", "Charles Oakley", 81, "PF/C", [77, 1772, 281, 541, 0, 3, 281, 538, 178, 269, 255, 409, 664, 133, 68, 30, 175, 740]),
  giocabile("sidney-green", "Sidney Green", 79, "PF/C", [80, 2307, 407, 875, 0, 8, 407, 867, 262, 335, 208, 450, 658, 139, 70, 37, 220, 1076]),
  giocabile("quintin-dailey", "Quintin Dailey", 78, "PG/SG", [35, 723, 203, 470, 0, 8, 203, 462, 163, 198, 20, 48, 68, 67, 22, 5, 67, 569]),
  giocabile("gene-banks", "Gene Banks", 75, "SF", [82, 2139, 356, 688, 0, 19, 356, 669, 183, 255, 178, 182, 360, 251, 81, 10, 139, 895]),
  giocabile("kyle-macy", "Kyle Macy", 72, "PG/SG", [82, 2426, 286, 592, 58, 141, 228, 451, 73, 90, 41, 137, 178, 446, 81, 11, 117, 703]),
  giocabile("mike-smrek", "Mike Smrek", 72, "C", [38, 408, 46, 122, 0, 2, 46, 120, 16, 29, 46, 64, 110, 19, 6, 23, 29, 108]),
  // Split CHI-only (2TM in totals): stagione divisa PHO/CHI, tenuta la sola quota Bulls.
  giocabile("michael-holton", "Mike Holton", 71, "PG/SG", [24, 447, 73, 155, 1, 10, 72, 145, 24, 38, 10, 20, 30, 48, 23, 0, 23, 171]),
  giocabile("john-paxson", "John Paxson", 70, "PG/SG", [75, 1570, 153, 328, 15, 50, 138, 278, 74, 92, 18, 76, 94, 274, 55, 2, 63, 395]),
  giocabile("dave-corzine", "Dave Corzine", 69, "C/PF", [67, 1709, 255, 519, 3, 12, 252, 507, 127, 171, 132, 301, 433, 150, 28, 53, 104, 640]),
  filler("orlando-woolridge", "Orlando Woolridge", [70, 2248, 540, 1090, 4, 23, 536, 1067, 364, 462, 150, 200, 350, 213, 49, 47, 174, 1448]),
  filler("jawann-oldham", "Jawann Oldham", [52, 1276, 167, 323, 0, 1, 167, 322, 53, 91, 112, 194, 306, 37, 28, 134, 86, 387]),
  filler("tony-brown", "Tony Brown", [10, 132, 18, 41, 0, 2, 18, 39, 9, 13, 5, 11, 16, 14, 5, 1, 4, 45]),
  filler("billy-mckinney", "Billy McKinney", [9, 83, 10, 23, 0, 0, 10, 23, 2, 2, 1, 4, 5, 13, 3, 0, 2, 22]),
  filler("ron-brewer", "Ron Brewer", [44, 570, 86, 224, 5, 17, 81, 207, 34, 38, 14, 39, 53, 40, 17, 6, 23, 211]),
  filler("rod-higgins", "Rod Higgins", [30, 332, 39, 106, 1, 9, 38, 97, 19, 27, 14, 37, 51, 24, 9, 11, 13, 98]),
);
for (let i = start3; i < cards.length; i++) Object.assign(cards[i], CHI);

// ============================== Los Angeles Lakers 1986-87 ==============================
const start4 = cards.length;
const LAL = { season: "1986-87", team: "Los Angeles Lakers", team_abbr: "LAL" };
cards.push(
  giocabile("magic-johnson", "Magic Johnson", 96, "PG/SG", [80, 2904, 683, 1308, 8, 39, 675, 1269, 535, 631, 122, 382, 504, 977, 138, 36, 300, 1909]),
  giocabile("kareem-abdul-jabbar", "Kareem Abdul-Jabbar", 94, "C/PF", [78, 2441, 560, 993, 1, 3, 559, 990, 245, 343, 152, 371, 523, 203, 49, 97, 186, 1366]),
  giocabile("michael-cooper", "Michael Cooper", 85, "SG/PG", [82, 2253, 322, 736, 89, 231, 233, 505, 126, 148, 58, 196, 254, 373, 78, 43, 102, 859]),
  giocabile("james-worthy", "James Worthy", 85, "SF/PF", [82, 2819, 651, 1207, 0, 13, 651, 1194, 292, 389, 158, 308, 466, 226, 108, 83, 168, 1594]),
  giocabile("a-c-green", "A.C. Green", 82, "PF/C", [79, 2240, 316, 587, 0, 5, 316, 582, 220, 282, 210, 405, 615, 84, 70, 80, 102, 852]),
  giocabile("byron-scott", "Byron Scott", 82, "SG/PG", [82, 2729, 554, 1134, 65, 149, 489, 985, 224, 251, 63, 223, 286, 281, 125, 18, 144, 1397]),
  // Split LAL-only (2TM in totals): stagione divisa SAS/LAL, tenuta la sola quota Lakers.
  giocabile("mychal-thompson", "Mychal Thompson", 79, "C/PF", [33, 680, 129, 269, 0, 1, 129, 268, 75, 101, 47, 89, 136, 28, 14, 30, 57, 333]),
  giocabile("kurt-rambis", "Kurt Rambis", 75, "PF/C", [78, 1514, 163, 313, 0, 0, 163, 313, 120, 157, 159, 294, 453, 63, 74, 41, 104, 446]),
  giocabile("wes-matthews", "Wes Matthews", 74, "PG/SG", [50, 532, 89, 187, 1, 3, 88, 184, 29, 36, 13, 34, 47, 100, 23, 4, 51, 208]),
  giocabile("mike-smrek", "Mike Smrek", 72, "C", [35, 233, 30, 60, 0, 0, 30, 60, 16, 25, 13, 24, 37, 5, 4, 13, 19, 76]),
  giocabile("billy-thompson", "Billy Thompson", 71, "SF/PF", [59, 762, 142, 261, 0, 1, 142, 260, 48, 74, 69, 102, 171, 60, 15, 30, 61, 332]),
  filler("adrian-branch", "Adrian Branch", [32, 219, 48, 96, 0, 2, 48, 94, 42, 54, 23, 30, 53, 16, 16, 3, 24, 138]),
);
for (let i = start4; i < cards.length; i++) Object.assign(cards[i], LAL);

const out =
  "// GENERATO da data/build_legends.mjs - non modificare a mano\n" +
  `export const LEGEND_CARDS = ${JSON.stringify(cards)};\n`;
writeFileSync(new URL("legends.js", import.meta.url), out);
const nPlayable = cards.filter((c) => !c._filler).length;
const nFiller = cards.filter((c) => c._filler).length;
console.log(`data/legends.js scritto: ${cards.length} carte (${nPlayable} giocabili, ${nFiller} filler), 5 squadre pilota.`);
