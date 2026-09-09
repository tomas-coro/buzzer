// GENERATO A MANO da data/build_legends.mjs - esegui `node data/build_legends.mjs`
// per rigenerare data/legends.js. Fonti: Basketball-Reference (tabella Totals di
// stagione: games,mp,fg,fga,fg3,fg3a,fg2,fg2a,ft,fta,orb,drb,trb,ast,stl,blk,tov,pts
// - per i giocatori scambiati durante l'anno uso lo split della sola squadra
// pilota, mai l'aggregato multi-team, per non mischiare due squadre in una carta)
// e 2kratings.com (overall NBA 2K e posizione primaria/secondaria per le 57
// squadre "classic" curate).
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


// ============================== Chicago Bulls 1988-89 ==============================
const start5 = cards.length;
const CHI8889 = { season: "1988-89", team: "Chicago Bulls", team_abbr: "CHI" };
cards.push(
  // Esclusi per assenza di totali Basketball-Reference sufficienti: David Wood.
  giocabile("michael-jordan", "Michael Jordan", 97, "SG/SF", [81,3255,966,1795,27,98,939,1697,674,793,149,503,652,650,234,65,290,2633]),
  giocabile("horace-grant", "Horace Grant", 81, "PF/C", [79,2809,405,781,0,5,405,776,140,199,240,441,681,168,86,62,128,950]),
  giocabile("scottie-pippen", "Scottie Pippen", 81, "SF/SG", [73,2413,413,867,21,77,392,790,201,301,138,307,445,256,139,61,199,1048]),
  giocabile("bill-cartwright", "Bill Cartwright", 75, "C/PF", [78,2333,365,768,0,0,365,768,236,308,152,369,521,90,21,41,190,966]),
  giocabile("john-paxson", "John Paxson", 75, "PG/SG", [78,1738,246,513,44,133,202,380,31,36,13,81,94,308,53,6,71,567]),
  giocabile("brad-sellers", "Brad Sellers", 70, "SF/PF", [80,1732,231,476,3,6,228,470,86,101,85,142,227,99,35,69,72,551]),
  giocabile("sam-vincent", "Sam Vincent", 73, "PG/SG", [70,1703,274,566,2,17,272,549,106,129,34,156,190,335,53,10,142,656]),
  giocabile("dave-corzine", "Dave Corzine", 72, "C/PF", [81,1483,203,440,2,8,201,432,71,96,92,223,315,103,29,45,93,479]),
  // Split CHI-only (2TM in totals): stagione divisa PHO/CHI, tenuta la sola quota Chicago Bulls.
  giocabile("craig-hodges", "Craig Hodges", 75, "PG/SG", [49,1112,187,394,71,168,116,226,45,53,21,63,84,138,41,4,52,490]),
  giocabile("charles-davis", "Charles Davis", 70, "PF/SF", [49,545,81,190,4,15,77,175,19,26,47,67,114,31,11,5,22,185]),
  filler("jack-haley", "Jack Haley", [51,289,37,78,0,0,37,78,36,46,21,50,71,10,11,0,26,110]),
  giocabile("will-perdue", "Will Perdue", 68, "C/PF", [30,190,29,72,0,0,29,72,8,14,18,27,45,11,4,6,15,66]),
  // Split CHI-only (2TM in totals): stagione divisa CHI/PHO, tenuta la sola quota Chicago Bulls.
  filler("ed-nealy", "Ed Nealy", [13,94,5,7,0,0,5,7,1,2,4,19,23,6,3,1,1,11]),
  // Split CHI-only (2TM in totals): stagione divisa CHI/DAL, tenuta la sola quota Chicago Bulls.
  filler("anthony-jones", "Anthony Jones", [8,65,5,15,0,1,5,14,2,2,4,4,8,4,2,1,1,12]),
  // Split CHI-only (2TM in totals): stagione divisa WSB/CHI, tenuta la sola quota Chicago Bulls.
  filler("dominic-pressley", "Dominic Pressley", [3,17,1,6,0,2,1,4,0,0,0,1,1,4,0,0,0,2]),
);
for (let i = start5; i < cards.length; i++) Object.assign(cards[i], CHI8889);

// ============================== Detroit Pistons 1988-89 ==============================
const start6 = cards.length;
const DET8889 = { season: "1988-89", team: "Detroit Pistons", team_abbr: "DET" };
cards.push(
  // Esclusi per assenza di totali Basketball-Reference sufficienti: William Bedford.
  giocabile("isiah-thomas", "Isiah Thomas", 92, "PG/SG", [80,2924,569,1227,33,121,536,1106,287,351,49,224,273,663,133,20,298,1458]),
  giocabile("bill-laimbeer", "Bill Laimbeer", 80, "C/PF", [81,2640,449,900,30,86,419,814,178,212,138,638,776,177,51,100,129,1106]),
  giocabile("joe-dumars", "Joe Dumars", 90, "SG/PG", [69,2408,456,903,14,29,442,874,260,306,57,115,172,390,63,5,178,1186]),
  giocabile("dennis-rodman", "Dennis Rodman", 81, "PF/SF", [82,2208,316,531,6,26,310,505,97,155,327,445,772,99,55,76,126,735]),
  giocabile("vinnie-johnson", "Vinnie Johnson", 81, "SG/PG", [82,2073,462,996,13,44,449,952,193,263,109,146,255,242,74,17,105,1130]),
  giocabile("rick-mahorn", "Rick Mahorn", 76, "C/PF", [72,1795,203,393,0,2,203,391,116,155,141,355,496,59,40,66,97,522]),
  giocabile("john-salley", "John Salley", 72, "PF/C", [67,1458,166,333,0,2,166,331,135,195,134,201,335,75,40,72,100,467]),
  // Split DET-only (2TM in totals): stagione divisa DET/DAL, tenuta la sola quota Detroit Pistons.
  filler("adrian-dantley", "Adrian Dantley", [42,1341,258,495,0,0,258,495,256,305,53,111,164,93,23,6,81,772]),
  giocabile("james-edwards", "James Edwards", 76, "C/PF", [76,1254,211,422,0,2,211,420,133,194,68,163,231,49,11,31,72,555]),
  // Split DET-only (2TM in totals): stagione divisa DAL/DET, tenuta la sola quota Detroit Pistons.
  giocabile("mark-aguirre", "Mark Aguirre", 82, "SF/SG", [36,1068,213,441,22,75,191,366,110,149,56,95,151,89,16,7,68,558]),
  giocabile("micheal-williams", "Micheal Williams", 74, "PG", [49,358,47,129,2,9,45,120,31,47,9,18,27,70,13,3,42,127]),
  // Split DET-only (2TM in totals): stagione divisa IND/DET, tenuta la sola quota Detroit Pistons.
  giocabile("john-long", "John Long", 74, "SG/SF", [24,152,19,40,0,0,19,40,11,13,2,9,11,15,0,2,9,49]),
  giocabile("fennis-dembo", "Fennis Dembo", 70, "SF", [31,74,14,42,0,4,14,38,8,10,8,15,23,5,1,0,7,36]),
  filler("darryl-dawkins", "Darryl Dawkins", [14,48,9,19,0,0,9,19,9,18,3,4,7,1,0,1,4,27]),
  // Split DET-only (2TM in totals): stagione divisa DET/ATL, tenuta la sola quota Detroit Pistons.
  filler("pace-mannion", "Pace Mannion", [5,14,2,2,0,0,2,2,0,0,0,3,3,0,1,0,0,4]),
  // Split DET-only (2TM in totals): stagione divisa DET/PHI, tenuta la sola quota Detroit Pistons.
  filler("jim-rowinski", "Jim Rowinski", [6,8,0,2,0,0,0,2,4,4,0,2,2,0,0,0,0,4]),
  filler("steve-harris", "Steve Harris", [3,7,1,4,0,0,1,4,2,2,0,2,2,0,1,0,0,4]),
);
for (let i = start6; i < cards.length; i++) Object.assign(cards[i], DET8889);

// ============================== Cleveland Cavaliers 1989-90 ==============================
const start7 = cards.length;
const CLE8990 = { season: "1989-90", team: "Cleveland Cavaliers", team_abbr: "CLE" };
cards.push(
  giocabile("craig-ehlo", "Craig Ehlo", 79, "SG/SF", [81,2894,436,940,104,248,332,692,126,185,147,292,439,371,126,23,161,1102]),
  giocabile("hot-rod-williams", "Hot Rod Williams", 82, "PF/C", [82,2776,528,1070,0,0,528,1070,325,440,220,443,663,168,86,167,143,1381]),
  giocabile("mark-price", "Mark Price", 89, "PG/SG", [73,2706,489,1066,152,374,337,692,300,338,66,185,251,666,114,5,214,1430]),
  giocabile("larry-nance", "Larry Nance", 86, "SF/PF", [62,2065,412,807,1,1,411,806,186,239,162,354,516,161,54,122,110,1011]),
  giocabile("steve-kerr", "Steve Kerr", 75, "PG/SG", [78,1664,192,432,73,144,119,288,63,73,12,86,98,248,45,7,74,520]),
  giocabile("brad-daugherty", "Brad Daugherty", 85, "C/PF", [41,1438,244,509,0,2,244,507,202,287,77,296,373,130,29,22,110,690]),
  giocabile("chucky-brown", "Chucky Brown", 71, "SF/PF", [75,1339,210,447,0,7,210,440,125,164,83,148,231,50,33,26,69,545]),
  giocabile("winston-bennett", "Winston Bennett", 75, "SF/PF", [55,990,137,286,0,0,137,286,64,96,84,104,188,54,23,10,62,338]),
  // Split CLE-only (2TM in totals): stagione divisa CLE/CHH, tenuta la sola quota Cleveland Cavaliers.
  filler("randolph-keys", "Randolph Keys", [48,892,151,359,2,10,149,349,61,82,52,85,137,39,38,2,47,365]),
  // Split CLE-only (2TM in totals): stagione divisa CLE/NJN, tenuta la sola quota Cleveland Cavaliers.
  filler("chris-dudley", "Chris Dudley", [37,684,79,203,0,0,79,203,26,77,88,115,203,20,19,41,48,184]),
  giocabile("tree-rollins", "Tree Rollins", 68, "C/PF", [48,674,57,125,0,1,57,124,11,16,58,95,153,24,13,53,35,125]),
  // Split CLE-only (3TM in totals): stagione divisa LAC/CLE/SAS, tenuta la sola quota Cleveland Cavaliers.
  filler("reggie-williams", "Reggie Williams", [32,542,91,239,6,27,85,212,30,41,17,43,60,38,22,10,32,218]),
  giocabile("paul-mokeski", "Paul Mokeski", 64, "C/PF", [38,449,63,150,0,1,63,149,25,36,27,72,99,17,8,10,26,151]),
  filler("john-morton", "John Morton", [37,402,48,161,7,30,41,131,43,62,7,25,32,67,18,4,51,146]),
  // Split CLE-only (2TM in totals): stagione divisa CLE/LAC, tenuta la sola quota Cleveland Cavaliers.
  filler("ron-harper", "Ron Harper", [7,262,61,138,1,5,60,133,31,41,19,29,48,49,14,9,18,154]),
  // Split CLE-only (2TM in totals): stagione divisa HOU/CLE, tenuta la sola quota Cleveland Cavaliers.
  filler("derrick-chievous", "Derrick Chievous", [14,99,15,42,0,1,15,41,19,24,7,8,15,4,3,1,5,49]),
  filler("gary-voce", "Gary Voce", [1,4,1,3,0,0,1,3,0,0,2,0,2,0,0,0,0,2]),
);
for (let i = start7; i < cards.length; i++) Object.assign(cards[i], CLE8990);

// ============================== Chicago Bulls 1990-91 ==============================
const start8 = cards.length;
const CHI9091 = { season: "1990-91", team: "Chicago Bulls", team_abbr: "CHI" };
cards.push(
  giocabile("michael-jordan", "Michael Jordan", 97, "SG/SF", [82,3034,990,1837,29,93,961,1744,571,671,118,374,492,453,223,83,202,2580]),
  giocabile("scottie-pippen", "Scottie Pippen", 89, "SF/SG", [82,3014,600,1153,21,68,579,1085,240,340,163,432,595,511,193,93,232,1461]),
  giocabile("horace-grant", "Horace Grant", 82, "PF/C", [78,2641,401,733,1,6,400,727,197,277,266,393,659,178,95,69,92,1000]),
  giocabile("bill-cartwright", "Bill Cartwright", 73, "C/PF", [79,2273,318,649,0,0,318,649,124,178,167,319,486,126,32,15,113,760]),
  giocabile("john-paxson", "John Paxson", 79, "PG/SG", [82,1971,317,578,42,96,275,482,34,41,15,76,91,297,62,3,69,710]),
  giocabile("bj-armstrong", "B.J. Armstrong", 74, "PG/SG", [82,1731,304,632,15,30,289,602,97,111,25,124,149,301,70,4,107,720]),
  giocabile("stacey-king", "Stacey King", 74, "C", [76,1198,156,334,0,2,156,332,107,152,72,136,208,65,24,42,91,419]),
  giocabile("cliff-levingston", "Cliff Levingston", 69, "PF/C", [78,1013,127,282,1,4,126,278,59,91,99,126,225,56,29,43,50,314]),
  giocabile("will-perdue", "Will Perdue", 72, "C/PF", [74,972,116,235,0,3,116,232,75,112,122,214,336,47,23,57,75,307]),
  giocabile("craig-hodges", "Craig Hodges", 72, "PG/SG", [73,843,146,344,44,115,102,229,26,27,10,32,42,97,34,2,35,362]),
  giocabile("dennis-hopson", "Dennis Hopson", 72, "SF/SG", [61,728,104,244,1,5,103,239,55,83,49,60,109,65,25,14,59,264]),
  giocabile("scott-williams", "Scott Williams", 72, "PF/C", [51,337,53,104,1,2,52,102,20,28,42,56,98,16,12,13,23,127]),
);
for (let i = start8; i < cards.length; i++) Object.assign(cards[i], CHI9091);

// ============================== Los Angeles Lakers 1990-91 ==============================
const start9 = cards.length;
const LAL9091 = { season: "1990-91", team: "Los Angeles Lakers", team_abbr: "LAL" };
cards.push(
  giocabile("james-worthy", "James Worthy", 86, "SF/PF", [78,3008,716,1455,26,90,690,1365,212,266,107,249,356,275,104,35,127,1670]),
  giocabile("magic-johnson", "Magic Johnson", 92, "PG/SG", [79,2933,466,976,80,250,386,726,519,573,105,446,551,989,102,17,314,1531]),
  giocabile("byron-scott", "Byron Scott", 76, "SG/PG", [82,2630,501,1051,71,219,430,832,118,148,54,192,246,177,95,21,85,1191]),
  giocabile("sam-perkins", "Sam Perkins", 75, "PF/C", [73,2504,368,744,18,64,350,680,229,279,167,371,538,108,64,78,103,983]),
  giocabile("vlade-divac", "Vlade Divac", 78, "C/PF", [82,2310,360,637,5,14,355,623,196,279,205,461,666,92,106,127,146,921]),
  giocabile("ac-green", "A.C. Green", 76, "PF/C", [82,2164,258,542,11,55,247,487,223,302,201,315,516,71,59,23,99,750]),
  giocabile("terry-teagle", "Terry Teagle", 75, "SG", [82,1498,335,757,0,9,335,748,145,177,82,99,181,82,31,8,83,815]),
  giocabile("mychal-thompson", "Mychal Thompson", 70, "C/PF", [72,1077,113,228,0,2,113,226,62,88,74,154,228,21,23,23,47,288]),
  giocabile("tony-smith", "Tony Smith", 72, "SG", [64,695,97,220,0,7,97,213,40,57,24,47,71,135,28,12,69,234]),
  giocabile("larry-drew", "Larry Drew", 71, "PG/SG", [48,496,54,125,14,33,40,92,17,22,5,29,34,118,15,1,49,139]),
  giocabile("elden-campbell", "Elden Campbell", 69, "C/PF", [52,380,56,123,0,0,56,123,32,49,40,56,96,10,11,38,16,144]),
  giocabile("irving-thomas", "Irving Thomas", 69, "PF", [26,108,17,50,0,0,17,50,12,21,14,17,31,10,4,1,13,46]),
  // Split LAL-only (2TM in totals): stagione divisa LAL/UTA, tenuta la sola quota Los Angeles Lakers.
  filler("tony-brown", "Tony Brown", [7,27,2,3,1,1,1,2,0,0,0,4,4,3,0,0,4,5]),
);
for (let i = start9; i < cards.length; i++) Object.assign(cards[i], LAL9091);

// ============================== Portland Trail Blazers 1990-91 ==============================
const start10 = cards.length;
const POR9091 = { season: "1990-91", team: "Portland Trail Blazers", team_abbr: "POR" };
cards.push(
  giocabile("clyde-drexler", "Clyde Drexler", 90, "SG/SF", [82,2852,645,1338,61,191,584,1147,416,524,212,334,546,493,144,60,232,1767]),
  giocabile("terry-porter", "Terry Porter", 85, "PG/SG", [81,2665,486,944,130,313,356,631,279,339,52,230,282,649,158,12,189,1381]),
  giocabile("buck-williams", "Buck Williams", 79, "PF/C", [80,2582,358,595,0,0,358,595,217,308,227,524,751,97,47,47,137,933]),
  giocabile("kevin-duckworth", "Kevin Duckworth", 76, "C/PF", [81,2511,521,1084,0,2,521,1082,240,311,177,354,531,89,33,34,186,1282]),
  giocabile("jerome-kersey", "Jerome Kersey", 82, "SF/PF", [73,2359,424,887,4,13,420,874,232,327,169,312,481,227,101,76,149,1084]),
  giocabile("clifford-robinson", "Clifford Robinson", 79, "PF/C", [82,1940,373,806,6,19,367,787,205,314,123,226,349,151,78,76,133,957]),
  giocabile("danny-ainge", "Danny Ainge", 79, "SG/PG", [80,1710,337,714,102,251,235,463,114,138,45,160,205,285,63,13,100,890]),
  filler("danny-young", "Danny Young", [75,897,103,271,36,104,67,167,41,45,22,53,75,141,50,7,50,283]),
  giocabile("mark-bryant", "Mark Bryant", 69, "PF/C", [53,781,99,203,0,1,99,202,74,101,65,125,190,27,15,12,33,272]),
  giocabile("wayne-cooper", "Wayne Cooper", 71, "C/PF", [67,746,57,145,0,1,57,144,33,42,54,134,188,22,7,61,22,147]),
  // Split POR-only (2TM in totals): stagione divisa DEN/POR, tenuta la sola quota Portland Trail Blazers.
  giocabile("walter-davis", "Walter Davis", 76, "SG/SF", [32,439,87,195,1,3,86,192,21,23,19,39,58,41,18,0,25,196]),
  giocabile("alaa-abdelnaby", "Alaa Abdelnaby", 74, "PF", [43,290,55,116,0,0,55,116,25,44,27,62,89,12,4,12,22,135]),
  // Split POR-only (2TM in totals): stagione divisa POR/NJN, tenuta la sola quota Portland Trail Blazers.
  filler("drazen-petrovic", "Dražen Petrović", [18,133,32,71,1,6,31,65,15,22,10,8,18,20,6,0,12,80]),
);
for (let i = start10; i < cards.length; i++) Object.assign(cards[i], POR9091);

// ============================== Golden State Warriors 1990-91 ==============================
const start11 = cards.length;
const GSW9091 = { season: "1990-91", team: "Golden State Warriors", team_abbr: "GSW" };
cards.push(
  giocabile("chris-mullin", "Chris Mullin", 88, "SF/SG", [82,3315,777,1449,40,133,737,1316,513,580,141,302,443,329,173,63,245,2107]),
  giocabile("tim-hardaway", "Tim Hardaway", 87, "PG/SG", [82,3215,739,1551,97,252,642,1299,306,381,87,245,332,793,214,12,270,1881]),
  giocabile("mitch-richmond", "Mitch Richmond", 86, "SG/SF", [77,3027,703,1424,40,115,663,1309,394,465,147,305,452,238,126,34,230,1840]),
  giocabile("rod-higgins", "Rod Higgins", 75, "SF/PF", [82,2024,259,559,73,220,186,339,185,226,109,245,354,113,52,37,65,776]),
  giocabile("alton-lister", "Alton Lister", 74, "C/PF", [77,1552,188,393,0,1,188,392,115,202,121,362,483,93,20,90,106,491]),
  giocabile("tom-tolbert", "Tom Tolbert", 68, "PF/C", [62,1371,183,433,7,21,176,412,127,172,87,188,275,76,35,38,80,500]),
  giocabile("tyrone-hill", "Tyrone Hill", 76, "PF", [74,1192,147,299,0,0,147,299,96,152,157,226,383,19,33,30,72,390]),
  giocabile("sarunas-marciulionis", "Sarunas Marciulionis", 79, "SG/PG", [50,987,183,365,1,6,182,359,178,246,51,67,118,85,62,4,75,545]),
  giocabile("jim-petersen", "Jim Petersen", 69, "PF/C", [62,834,114,236,1,4,113,232,50,76,69,131,200,27,13,41,48,279]),
  filler("kevin-pritchard", "Kevin Pritchard", [62,773,88,229,5,31,83,198,62,77,16,49,65,81,30,8,59,243]),
  // Split GSW-only (2TM in totals): stagione divisa PHI/GSW, tenuta la sola quota Golden State Warriors.
  giocabile("mario-elie", "Mario Elie", 74, "SG/SF", [30,624,77,152,3,8,74,144,74,87,46,63,109,44,19,10,27,231]),
  giocabile("paul-mokeski", "Paul Mokeski", 66, "C/PF", [36,257,21,59,3,9,18,50,12,15,20,47,67,9,8,3,7,57]),
  filler("steve-johnson", "Steve Johnson", [24,228,34,63,0,0,34,63,22,37,18,39,57,17,4,4,25,90]),
  // Split GSW-only (2TM in totals): stagione divisa GSW/WSB, tenuta la sola quota Golden State Warriors.
  filler("larry-robinson", "Larry Robinson", [24,170,24,59,0,0,24,59,8,15,15,8,23,11,9,1,16,56]),
  giocabile("les-jepsen", "Les Jepsen", 72, "C/PF", [21,105,11,36,0,1,11,35,6,9,17,20,37,1,1,3,3,28]),
  giocabile("vincent-askew", "Vincent Askew", 69, "SG/SF", [7,85,12,25,0,0,12,25,9,11,7,4,11,13,2,0,6,33]),
  // Split GSW-only (2TM in totals): stagione divisa GSW/LAC, tenuta la sola quota Golden State Warriors.
  filler("mike-smrek", "Mike Smrek", [5,25,6,11,0,0,6,11,2,4,3,4,7,1,2,0,2,14]),
  filler("bart-kofoed", "Bart Kofoed", [5,21,0,3,0,0,0,3,3,6,2,1,3,4,0,0,2,3]),
);
for (let i = start11; i < cards.length; i++) Object.assign(cards[i], GSW9091);

// ============================== Chicago Bulls 1992-93 ==============================
const start12 = cards.length;
const CHI9293 = { season: "1992-93", team: "Chicago Bulls", team_abbr: "CHI" };
cards.push(
  giocabile("scottie-pippen", "Scottie Pippen", 92, "SF/SG", [81,3123,628,1327,22,93,606,1234,232,350,203,418,621,507,173,73,246,1510]),
  giocabile("michael-jordan", "Michael Jordan", 99, "SG/SF", [78,3067,992,2003,81,230,911,1773,476,569,135,387,522,428,221,61,207,2541]),
  giocabile("horace-grant", "Horace Grant", 82, "PF/C", [77,2745,421,829,1,5,420,824,174,281,341,388,729,201,89,96,110,1017]),
  giocabile("bj-armstrong", "B.J. Armstrong", 79, "PG/SG", [82,2492,408,818,63,139,345,679,130,151,27,122,149,330,66,6,83,1009]),
  giocabile("scott-williams", "Scott Williams", 73, "PF/C", [71,1369,166,356,0,7,166,349,90,126,168,283,451,68,55,66,73,422]),
  giocabile("bill-cartwright", "Bill Cartwright", 74, "C/PF", [63,1253,141,343,0,0,141,343,72,98,83,150,233,83,20,10,62,354]),
  giocabile("stacey-king", "Stacey King", 73, "C", [76,1059,160,340,2,6,158,334,86,122,105,102,207,71,26,20,70,408]),
  giocabile("john-paxson", "John Paxson", 72, "PG/SG", [59,1030,105,233,19,41,86,192,17,20,9,39,48,136,38,2,31,246]),
  giocabile("rodney-mccray", "Rodney McCray", 75, "SF/PF", [64,1019,92,204,2,5,90,199,36,52,53,105,158,81,12,15,53,222]),
  giocabile("will-perdue", "Will Perdue", 73, "C/PF", [72,998,137,246,0,1,137,245,67,111,103,184,287,74,22,47,74,341]),
  giocabile("trent-tucker", "Trent Tucker", 73, "SG/SF", [69,909,143,295,52,131,91,164,18,22,16,55,71,82,24,6,18,356]),
  // Split CHI-only (2TM in totals): stagione divisa DET/CHI, tenuta la sola quota Chicago Bulls.
  giocabile("darrell-walker", "Darrell Walker", 68, "PG/SG", [28,367,31,77,0,0,31,77,10,20,18,21,39,44,23,2,12,72]),
  filler("corey-williams", "Corey Williams", [35,242,31,85,1,3,30,82,18,22,19,12,31,23,4,2,11,81]),
  // Split CHI-only (2TM in totals): stagione divisa GSW/CHI, tenuta la sola quota Chicago Bulls.
  giocabile("ed-nealy", "Ed Nealy", 66, "PF/SF", [11,79,10,23,1,5,9,18,2,2,4,12,16,2,3,1,2,23]),
  // Split CHI-only (2TM in totals): stagione divisa CHI/GSW, tenuta la sola quota Chicago Bulls.
  filler("joe-courtney", "Joe Courtney", [5,34,4,9,0,0,4,9,3,4,2,0,2,1,2,1,3,11]),
  filler("jo-jo-english", "Jo Jo English", [6,31,3,10,0,3,3,7,0,2,2,4,6,1,3,2,4,6]),
  filler("ricky-blanton", "Ricky Blanton", [2,13,3,7,0,0,3,7,0,0,2,1,3,1,2,0,1,6]),
);
for (let i = start12; i < cards.length; i++) Object.assign(cards[i], CHI9293);

// ============================== Charlotte Hornets 1992-93 ==============================
const start13 = cards.length;
const CHA9293 = { season: "1992-93", team: "Charlotte Hornets", team_abbr: "CHA" };
cards.push(
  giocabile("larry-johnson", "Larry Johnson", 84, "PF/SF", [82,3323,728,1385,18,71,710,1314,336,438,281,583,864,353,53,27,227,1810]),
  giocabile("muggsy-bogues", "Muggsy Bogues", 80, "PG/SG", [81,2833,331,730,6,26,325,704,140,168,51,247,298,711,161,5,154,808]),
  giocabile("alonzo-mourning", "Alonzo Mourning", 86, "C/PF", [78,2644,572,1119,0,3,572,1116,495,634,263,542,805,76,27,271,236,1639]),
  giocabile("kendall-gill", "Kendall Gill", 79, "SG/SF", [69,2430,463,1032,17,62,446,970,224,290,120,220,340,268,98,36,174,1167]),
  giocabile("dell-curry", "Dell Curry", 79, "SG/SF", [80,2094,498,1102,95,237,403,865,136,157,51,235,286,180,87,23,129,1227]),
  giocabile("kenny-gattison", "Kenny Gattison", 77, "PF/C", [75,1475,203,384,0,3,203,381,102,169,108,245,353,68,48,55,64,508]),
  giocabile("johnny-newman", "Johnny Newman", 79, "SF/SG", [64,1471,279,534,12,45,267,489,194,240,72,71,143,117,45,19,90,764]),
  giocabile("david-wingate", "David Wingate", 71, "SG/SF", [72,1471,180,336,1,6,179,330,79,107,49,125,174,183,66,9,89,440]),
  giocabile("tony-bennett", "Tony Bennett", 68, "PG/SG", [75,857,110,260,26,80,84,180,30,41,12,51,63,136,30,0,50,276]),
  giocabile("kevin-lynch", "Kevin Lynch", 65, "SG/SF", [40,324,30,59,0,1,30,58,26,38,12,23,35,25,11,6,24,86]),
  // Split CHH-only (2TM in totals): stagione divisa CHH/SAS, tenuta la sola quota Charlotte Hornets.
  filler("jr-reid", "J.R. Reid", [17,295,42,98,0,1,42,97,43,58,20,50,70,24,11,5,24,127]),
  giocabile("mike-gminski", "Mike Gminski", 74, "C", [34,251,42,83,0,0,42,83,9,10,34,51,85,7,1,9,11,93]),
  // Split CHH-only (2TM in totals): stagione divisa CHH/DEN, tenuta la sola quota Charlotte Hornets.
  filler("tom-hammonds", "Tom Hammonds", [19,142,19,45,0,0,19,45,5,8,5,26,31,8,0,4,3,43]),
  // Split CHH-only (2TM in totals): stagione divisa SAS/CHH, tenuta la sola quota Charlotte Hornets.
  giocabile("sidney-green", "Sidney Green", 72, "PF/C", [24,127,14,40,0,2,14,38,12,16,14,33,47,5,1,2,8,40]),
  // Split CHH-only (3TM in totals): stagione divisa CHH/ORL/BOS, tenuta la sola quota Charlotte Hornets.
  filler("lorenzo-williams", "Lorenzo Williams", [2,18,1,3,0,0,1,3,0,0,3,6,9,0,0,2,2,2]),
);
for (let i = start13; i < cards.length; i++) Object.assign(cards[i], CHA9293);

// ============================== Denver Nuggets 1993-94 ==============================
const start14 = cards.length;
const DEN9394 = { season: "1993-94", team: "Denver Nuggets", team_abbr: "DEN" };
cards.push(
  // Esclusi per assenza di totali Basketball-Reference sufficienti: Alvin Robertson.
  giocabile("bryant-stith", "Bryant Stith", 77, "SG/SF", [82,2853,365,811,2,9,363,802,291,351,119,230,349,199,116,16,131,1023]),
  giocabile("dikembe-mutombo", "Dikembe Mutombo", 83, "C/PF", [82,2853,365,642,0,1,365,641,256,439,286,685,971,127,59,336,206,986]),
  giocabile("laphonso-ellis", "LaPhonso Ellis", 80, "PF/SF", [79,2699,483,963,7,23,476,940,242,359,220,462,682,167,63,80,172,1215]),
  giocabile("reggie-williams", "Reggie Williams", 78, "SF/SG", [82,2654,418,1014,64,230,354,784,165,225,98,294,392,300,117,66,163,1065]),
  giocabile("mahmoud-abdul-rauf", "Mahmoud Abdul-Rauf", 84, "PG/SG", [80,2617,588,1279,42,133,546,1146,219,229,27,141,168,362,82,10,151,1437]),
  filler("bison-dele", "Bison Dele", [80,1507,251,464,0,3,251,461,137,211,138,308,446,50,49,87,104,639]),
  giocabile("rodney-rogers", "Rodney Rogers", 74, "PF/SF", [79,1406,239,545,35,92,204,453,127,189,90,136,226,101,63,48,131,640]),
  giocabile("robert-pack", "Robert Pack", 75, "PG/SG", [66,1382,223,503,6,29,217,474,179,236,25,98,123,356,81,9,204,631]),
  giocabile("tom-hammonds", "Tom Hammonds", 73, "PF/C", [74,877,115,230,0,0,115,230,71,104,62,137,199,34,20,12,41,301]),
  giocabile("darnell-mee", "Darnell Mee", 70, "SG/PG", [38,285,28,88,5,24,23,64,12,27,17,18,35,16,15,13,18,73]),
  giocabile("kevin-brooks", "Kevin Brooks", 70, "C/PF", [34,190,36,99,4,23,32,76,9,10,5,16,21,3,0,2,12,85]),
  filler("mark-randall", "Mark Randall", [28,155,17,50,2,14,15,36,22,28,9,13,22,11,8,3,10,58]),
  // Split DEN-only (2TM in totals): stagione divisa DEN/DET, tenuta la sola quota Denver Nuggets.
  filler("mark-macon", "Mark Macon", [7,126,14,45,0,3,14,42,8,10,3,4,7,11,6,1,14,36]),
  filler("adonis-jordan", "Adonis Jordan", [6,79,6,23,3,10,3,13,0,0,3,3,6,19,0,1,6,15]),
  filler("roy-marble", "Roy Marble", [5,32,2,12,0,0,2,12,0,3,3,5,8,1,0,2,3,4]),
  filler("jim-farmer", "Jim Farmer", [4,29,2,6,0,2,2,4,0,0,0,2,2,4,0,0,5,4]),
  // Split DEN-only (2TM in totals): stagione divisa DEN/DET, tenuta la sola quota Denver Nuggets.
  filler("marcus-liberty", "Marcus Liberty", [3,11,4,7,0,1,4,6,1,2,0,5,5,2,0,0,2,9]),
);
for (let i = start14; i < cards.length; i++) Object.assign(cards[i], DEN9394);

// ============================== Houston Rockets 1993-94 ==============================
const start15 = cards.length;
const HOU9394 = { season: "1993-94", team: "Houston Rockets", team_abbr: "HOU" };
cards.push(
  giocabile("hakeem-olajuwon", "Hakeem Olajuwon", 97, "C/PF", [80,3277,894,1694,8,19,886,1675,388,542,229,726,955,287,128,297,271,2184]),
  giocabile("otis-thorpe", "Otis Thorpe", 80, "PF/C", [82,2909,449,801,0,2,449,799,251,382,271,599,870,189,66,28,185,1149]),
  giocabile("vernon-maxwell", "Vernon Maxwell", 78, "SG/SF", [75,2571,380,976,120,403,260,573,143,191,42,187,229,380,125,20,185,1023]),
  giocabile("robert-horry", "Robert Horry", 77, "SF/PF", [81,2370,322,702,44,136,278,566,115,157,128,312,440,231,119,75,137,803]),
  giocabile("kenny-smith", "Kenny Smith", 78, "PG/SG", [78,2209,341,711,89,220,252,491,135,155,24,114,138,327,59,4,126,906]),
  giocabile("mario-elie", "Mario Elie", 75, "SG/SF", [67,1606,208,466,56,167,152,299,154,179,28,153,181,208,50,8,109,626]),
  giocabile("carl-herrera", "Carl Herrera", 72, "PF/C", [75,1292,142,310,0,0,142,310,69,97,101,184,285,37,32,26,69,353]),
  giocabile("scott-brooks", "Scott Brooks", 70, "PG/SG", [73,1225,142,289,23,61,119,228,74,85,10,92,102,149,51,2,55,381]),
  giocabile("sam-cassell", "Sam Cassell", 74, "PG/SG", [66,1122,162,388,26,88,136,300,90,107,25,109,134,192,59,7,94,440]),
  giocabile("matt-bullard", "Matt Bullard", 69, "PF/C", [65,725,78,226,50,154,28,72,20,26,23,61,84,64,14,6,28,226]),
  giocabile("eric-riley", "Eric Riley", 71, "C", [47,219,34,70,0,1,34,69,20,37,24,35,59,9,5,9,15,88]),
  filler("richard-petruska", "Richard Petruška", [22,92,20,46,7,15,13,31,6,8,9,22,31,1,2,3,15,53]),
  filler("chris-jent", "Chris Jent", [3,78,13,26,4,11,9,15,1,2,4,11,15,7,0,0,5,31]),
  giocabile("larry-robinson", "Larry Robinson", 71, "SG/PG", [6,55,10,20,2,8,8,12,3,8,4,6,10,6,7,0,10,25]),
  giocabile("earl-cureton", "Earl Cureton", 66, "C/PF", [2,30,2,8,0,0,2,8,0,2,4,8,12,0,0,0,1,4]),
);
for (let i = start15; i < cards.length; i++) Object.assign(cards[i], HOU9394);

// ============================== New York Knicks 1994-95 ==============================
const start16 = cards.length;
const NYK9495 = { season: "1994-95", team: "New York Knicks", team_abbr: "NYK" };
cards.push(
  giocabile("patrick-ewing", "Patrick Ewing", 90, "C/PF", [79,2920,730,1452,6,21,724,1431,420,560,157,710,867,212,68,159,256,1886]),
  giocabile("john-starks", "John Starks", 82, "SG/PG", [80,2725,419,1062,217,611,202,451,168,228,34,185,219,411,92,4,160,1223]),
  giocabile("derek-harper", "Derek Harper", 77, "PG/SG", [80,2716,337,756,106,292,231,464,139,192,31,163,194,458,79,10,151,919]),
  giocabile("anthony-mason", "Anthony Mason", 83, "C/PF", [77,2496,287,507,0,1,287,506,191,298,182,468,650,240,69,21,123,765]),
  giocabile("charles-smith", "Charles Smith", 79, "PF/C", [76,2150,352,747,7,31,345,716,255,322,144,180,324,120,49,95,147,966]),
  giocabile("hubert-davis", "Hubert Davis", 77, "SG/SF", [82,1697,296,617,131,288,165,329,97,120,30,80,110,150,35,11,87,820]),
  giocabile("charles-oakley", "Charles Oakley", 80, "PF/C", [50,1567,192,393,3,12,189,381,119,150,155,290,445,126,60,7,103,506]),
  giocabile("anthony-bonner", "Anthony Bonner", 70, "PF/SF", [58,1126,88,193,1,5,87,188,44,67,113,149,262,80,48,23,79,221]),
  giocabile("greg-anthony", "Greg Anthony", 75, "PG/SG", [61,943,128,293,56,155,72,138,60,76,7,57,64,160,50,7,57,372]),
  giocabile("herb-williams", "Herb Williams", 68, "C/PF", [56,743,82,180,0,0,82,180,23,37,23,109,132,27,13,45,40,187]),
  giocabile("monty-williams", "Monty Williams", 68, "SF/PF", [41,503,60,133,0,8,60,125,17,38,42,56,98,49,20,4,41,137]),
  giocabile("doug-christie", "Doug Christie", 70, "SG/SF", [12,79,5,22,1,7,4,15,4,5,3,10,13,8,2,1,13,15]),
  // Split NYK-only (2TM in totals): stagione divisa NYK/SAS, tenuta la sola quota New York Knicks.
  filler("doc-rivers", "Doc Rivers", [3,47,4,13,3,5,1,8,8,11,2,7,9,8,4,0,4,19]),
  giocabile("charlie-ward", "Charlie Ward", 69, "PG", [10,44,4,19,1,10,3,9,7,10,1,5,6,4,2,0,8,16]),
  // Split NYK-only (2TM in totals): stagione divisa NYK/IND, tenuta la sola quota New York Knicks.
  filler("greg-kite", "Greg Kite", [2,16,0,3,0,0,0,3,0,0,2,2,4,0,0,0,1,0]),
  filler("ron-grandison", "Ron Grandison", [2,8,1,4,0,0,1,4,0,0,3,2,5,2,0,0,0,2]),
);
for (let i = start16; i < cards.length; i++) Object.assign(cards[i], NYK9495);

// ============================== Orlando Magic 1994-95 ==============================
const start17 = cards.length;
const ORL9495 = { season: "1994-95", team: "Orlando Magic", team_abbr: "ORL" };
cards.push(
  giocabile("shaquille-oneal", "Shaquille O’Neal", 92, "C/PF", [79,2923,930,1594,0,5,930,1589,455,854,328,573,901,214,73,192,204,2315]),
  giocabile("penny-hardaway", "Penny Hardaway", 84, "PG/SG", [77,2901,585,1142,87,249,498,893,356,463,139,197,336,551,130,26,258,1613]),
  giocabile("horace-grant", "Horace Grant", 83, "PF/C", [74,2693,401,707,0,8,401,699,146,211,223,492,715,173,76,88,85,948]),
  giocabile("nick-anderson", "Nick Anderson", 83, "SG/SF", [76,2588,439,923,179,431,260,492,143,203,85,250,335,314,125,22,141,1200]),
  giocabile("donald-royal", "Donald Royal", 74, "SF/SG", [70,1841,206,434,0,4,206,430,223,299,83,196,279,198,45,16,125,635]),
  giocabile("brian-shaw", "Brian Shaw", 75, "PG/SG", [78,1836,192,494,48,184,144,310,70,95,52,189,241,406,73,18,184,502]),
  giocabile("dennis-scott", "Dennis Scott", 80, "SF/SG", [62,1499,283,645,150,352,133,293,86,114,25,121,146,131,45,14,57,802]),
  giocabile("anthony-bowie", "Anthony Bowie", 71, "SG/SF", [77,1261,177,369,12,40,165,329,61,73,54,85,139,159,47,21,86,427]),
  giocabile("anthony-avent", "Anthony Avent", 71, "PF/C", [71,1066,105,244,0,0,105,244,48,75,97,196,293,41,28,50,53,258]),
  giocabile("jeff-turner", "Jeff Turner", 71, "SF/PF", [49,576,73,178,27,75,46,103,26,29,23,74,97,38,12,3,22,199]),
  giocabile("tree-rollins", "Tree Rollins", 69, "C/PF", [51,478,20,42,0,0,20,42,21,31,31,64,95,9,7,36,23,61]),
  filler("brooks-thompson", "Brooks Thompson", [38,246,45,114,18,58,27,56,8,12,7,16,23,43,10,2,27,116]),
  giocabile("darrell-armstrong", "Darrell Armstrong", 72, "PG", [3,8,3,8,2,6,1,2,2,2,1,0,1,3,1,0,1,10]),
  giocabile("geert-hammink", "Geert Hammink", 70, "PF", [1,7,1,3,0,0,1,3,2,2,0,2,2,1,0,0,0,4]),
  filler("keith-tower", "Keith Tower", [3,7,0,2,0,0,0,2,1,2,1,2,3,0,0,0,1,1]),
);
for (let i = start17; i < cards.length; i++) Object.assign(cards[i], ORL9495);

// ============================== Chicago Bulls 1995-96 ==============================
const start18 = cards.length;
const CHI9596 = { season: "1995-96", team: "Chicago Bulls", team_abbr: "CHI" };
cards.push(
  giocabile("michael-jordan", "Michael Jordan", 99, "SG/SF", [82,3090,916,1850,111,260,805,1590,548,657,148,395,543,352,180,42,197,2491]),
  giocabile("scottie-pippen", "Scottie Pippen", 96, "SF/SG", [77,2825,563,1216,150,401,413,815,220,324,152,344,496,452,133,57,207,1496]),
  giocabile("toni-kukoc", "Toni Kukoc", 83, "SF/PF", [81,2103,386,787,87,216,299,571,206,267,115,208,323,287,64,28,114,1065]),
  giocabile("dennis-rodman", "Dennis Rodman", 87, "PF/SF", [64,2088,146,304,3,27,143,277,56,106,356,596,952,160,36,27,138,351]),
  giocabile("steve-kerr", "Steve Kerr", 78, "PG/SG", [82,1919,244,482,122,237,122,245,78,84,25,85,110,192,63,2,42,688]),
  giocabile("ron-harper", "Ron Harper", 82, "PG/SG", [80,1886,234,501,28,104,206,397,98,139,74,139,213,208,105,32,73,594]),
  giocabile("luc-longley", "Luc Longley", 76, "C/PF", [62,1641,242,502,0,0,242,502,80,103,104,214,318,119,22,84,114,564]),
  giocabile("bill-wennington", "Bill Wennington", 67, "C/PF", [71,1065,169,343,1,1,168,342,37,43,58,116,174,46,21,16,37,376]),
  giocabile("jud-buechler", "Jud Buechler", 70, "SF/SG", [74,740,112,242,40,90,72,152,14,22,45,66,111,56,34,7,39,278]),
  giocabile("dickey-simpkins", "Dickey Simpkins", 69, "PF/C", [60,685,77,160,1,1,76,159,61,97,66,90,156,38,9,8,56,216]),
  giocabile("randy-brown", "Randy Brown", 74, "PG", [68,671,78,192,1,11,77,181,28,46,17,49,66,73,57,12,31,185]),
  giocabile("jason-caffey", "Jason Caffey", 72, "PF", [57,545,71,162,0,1,71,161,40,68,51,60,111,24,12,7,48,182]),
  giocabile("james-edwards", "James Edwards", 66, "C/PF", [28,274,41,110,0,0,41,110,16,26,15,25,40,11,1,8,21,98]),
  // Split CHI-only (2TM in totals): stagione divisa TOR/CHI, tenuta la sola quota Chicago Bulls.
  giocabile("john-salley", "John Salley", 69, "PF/C", [17,191,12,35,0,0,12,35,12,20,20,23,43,15,8,15,16,36]),
  filler("jack-haley", "Jack Haley", [1,7,2,6,0,0,2,6,1,2,1,1,2,0,0,0,1,5]),
);
for (let i = start18; i < cards.length; i++) Object.assign(cards[i], CHI9596);

// ============================== Seattle Supersonics 1995-96 ==============================
const start19 = cards.length;
const OKC9596 = { season: "1995-96", team: "Seattle Supersonics", team_abbr: "OKC" };
cards.push(
  giocabile("gary-payton", "Gary Payton", 92, "PG/SG", [81,3162,618,1276,98,299,520,977,229,306,104,235,339,608,231,19,260,1563]),
  giocabile("hersey-hawkins", "Hersey Hawkins", 78, "SG/PG", [82,2823,443,936,146,380,297,556,249,285,86,211,297,218,149,14,164,1281]),
  giocabile("shawn-kemp", "Shawn Kemp", 89, "PF/C", [79,2631,526,937,5,12,521,925,493,664,276,628,904,173,93,127,315,1550]),
  giocabile("detlef-schrempf", "Detlef Schrempf", 83, "SF/PF", [63,2200,360,740,73,179,287,561,287,370,73,255,328,276,56,8,146,1080]),
  giocabile("sam-perkins", "Sam Perkins", 78, "PF/C", [82,2169,325,797,129,363,196,434,191,241,101,266,367,120,83,48,82,970]),
  giocabile("vincent-askew", "Vincent Askew", 71, "SG/SF", [69,1725,215,436,29,86,186,350,123,161,65,153,218,163,47,15,96,582]),
  giocabile("ervin-johnson", "Ervin Johnson", 75, "C/PF", [81,1519,180,352,1,3,179,349,85,127,129,304,433,48,40,129,98,446]),
  giocabile("nate-mcmillan", "Nate McMillan", 78, "PG/SG", [55,1261,100,238,46,121,54,117,29,41,41,169,210,197,95,18,75,275]),
  giocabile("frank-brickowski", "Frank Brickowski", 69, "PF/C", [63,986,123,252,32,79,91,173,61,86,26,125,151,58,26,8,78,339]),
  giocabile("david-wingate", "David Wingate", 71, "SG/SF", [60,695,88,212,15,34,73,178,32,41,17,39,56,58,20,4,42,223]),
  giocabile("eric-snow", "Eric Snow", 71, "PG", [43,389,42,100,2,10,40,90,29,49,9,34,43,73,28,0,38,115]),
  filler("steve-scheffler", "Steve Scheffler", [35,181,24,45,1,5,23,40,9,19,15,18,33,2,6,2,8,58]),
  giocabile("sherell-ford", "Sherell Ford", 70, "PF/C", [28,139,30,80,4,25,26,55,26,34,12,12,24,5,8,1,6,90]),
);
for (let i = start19; i < cards.length; i++) Object.assign(cards[i], OKC9596);

// ============================== Miami Heat 1996-97 ==============================
const start20 = cards.length;
const MIA9697 = { season: "1996-97", team: "Miami Heat", team_abbr: "MIA" };
cards.push(
  // Esclusi per assenza di totali Basketball-Reference sufficienti: Matt Fish, Bruce Bowen.
  giocabile("tim-hardaway", "Tim Hardaway", 88, "PG/SG", [81,3136,575,1384,203,590,372,794,291,364,49,228,277,695,151,9,230,1644]),
  giocabile("pj-brown", "P.J. Brown", 84, "C", [80,2592,300,656,0,2,300,654,161,220,239,431,670,92,85,98,113,761]),
  giocabile("alonzo-mourning", "Alonzo Mourning", 93, "C/PF", [66,2320,473,885,1,9,472,876,363,565,189,467,656,104,56,189,226,1310]),
  filler("voshon-lenard", "Voshon Lenard", [73,2111,314,684,183,442,131,242,86,105,38,179,217,161,50,18,109,897]),
  giocabile("isaac-austin", "Isaac Austin", 78, "PF/C", [82,1881,321,639,0,3,321,636,150,226,136,342,478,101,45,43,161,792]),
  giocabile("keith-askins", "Keith Askins", 74, "SF/SG", [78,1773,138,319,69,172,69,147,39,58,86,185,271,75,53,19,59,384]),
  // Split MIA-only (2TM in totals): stagione divisa MIA/DAL, tenuta la sola quota Miami Heat.
  filler("sasha-danilovic", "Sasha Danilović", [43,1351,175,396,63,176,112,220,73,94,21,81,102,77,39,8,94,486]),
  giocabile("dan-majerle", "Dan Majerle", 78, "SG/SF", [36,1264,141,347,68,201,73,146,40,59,45,117,162,116,54,14,50,390]),
  // Split MIA-only (2TM in totals): stagione divisa DAL/MIA, tenuta la sola quota Miami Heat.
  giocabile("jamal-mashburn", "Jamal Mashburn", 79, "SF/PF", [32,1189,146,367,48,146,98,221,88,117,41,138,179,111,43,7,57,428]),
  giocabile("john-crotty", "John Crotty", 72, "PG/SG", [48,659,79,154,20,49,59,105,54,64,15,32,47,102,18,0,42,232]),
  filler("kurt-thomas", "Kurt Thomas", [18,374,39,105,0,1,39,104,35,46,31,76,107,9,12,9,25,113]),
  giocabile("gary-grant", "Gary Grant", 68, "PG", [28,365,39,110,14,46,25,64,18,22,8,30,38,45,16,0,27,110]),
  giocabile("willie-anderson", "Willie Anderson", 73, "SF/SG", [28,303,29,64,8,19,21,45,17,20,15,27,42,34,14,4,19,83]),
  giocabile("ed-pinckney", "Ed Pinckney", 72, "PF", [27,273,23,43,0,0,23,43,20,25,25,40,65,6,8,9,19,66]),
  giocabile("mark-strickland", "Mark Strickland", 70, "PF/SF", [31,153,25,60,0,1,25,59,12,21,16,21,37,1,4,10,15,62]),
  filler("james-scott", "James Scott", [8,32,0,8,0,4,0,4,1,2,1,5,6,3,2,0,2,1]),
  // Split MIA-only (2TM in totals): stagione divisa MIA/DAL, tenuta la sola quota Miami Heat.
  filler("martin-muursepp", "Martin Müürsepp", [10,27,5,14,1,4,4,10,6,14,2,3,5,3,0,1,3,17]),
);
for (let i = start20; i < cards.length; i++) Object.assign(cards[i], MIA9697);

// ============================== Chicago Bulls 1997-98 ==============================
const start21 = cards.length;
const CHI9798 = { season: "1997-98", team: "Chicago Bulls", team_abbr: "CHI" };
cards.push(
  giocabile("michael-jordan", "Michael Jordan", 98, "SG/SF", [82,3181,881,1893,30,126,851,1767,565,721,130,345,475,283,141,45,185,2357]),
  giocabile("dennis-rodman", "Dennis Rodman", 83, "PF/C", [80,2856,155,360,4,23,151,337,61,111,421,780,1201,230,47,18,147,375]),
  giocabile("ron-harper", "Ron Harper", 80, "PG/SG", [82,2284,293,665,16,84,277,581,162,216,107,183,290,241,108,48,91,764]),
  giocabile("toni-kukoc", "Toni Kukoc", 83, "SF/PF", [74,2235,383,841,63,174,320,667,155,219,121,206,327,314,76,37,154,984]),
  giocabile("luc-longley", "Luc Longley", 78, "C/PF", [58,1703,277,609,0,0,277,609,109,148,113,228,341,161,34,62,130,663]),
  giocabile("scottie-pippen", "Scottie Pippen", 88, "SF/SG", [44,1652,315,704,61,192,254,512,150,193,53,174,227,254,79,43,109,841]),
  giocabile("randy-brown", "Randy Brown", 74, "PG", [71,1147,116,302,0,5,116,297,56,78,34,60,94,151,71,12,63,288]),
  giocabile("steve-kerr", "Steve Kerr", 74, "PG/SG", [50,1119,137,302,57,130,80,172,45,49,14,63,77,96,26,5,27,376]),
  giocabile("scott-burrell", "Scott Burrell", 74, "SF/SG", [80,1096,159,375,51,144,108,231,47,64,80,118,198,65,64,37,50,416]),
  // Split CHI-only (2TM in totals): stagione divisa CHI/GSW, tenuta la sola quota Chicago Bulls.
  filler("jason-caffey", "Jason Caffey", [51,710,100,199,0,1,100,198,68,103,76,97,173,36,13,17,48,268]),
  giocabile("jud-buechler", "Jud Buechler", 68, "SF/SG", [74,608,85,176,25,65,60,111,3,6,24,53,77,49,22,15,21,198]),
  giocabile("bill-wennington", "Bill Wennington", 66, "C/PF", [48,467,75,172,0,0,75,172,17,21,32,48,80,19,4,5,16,167]),
  giocabile("joe-kleine", "Joe Kleine", 73, "C/PF", [46,397,39,106,0,0,39,106,15,18,27,50,77,30,4,5,28,93]),
  // Split CHI-only (2TM in totals): stagione divisa GSW/CHI, tenuta la sola quota Chicago Bulls.
  giocabile("dickey-simpkins", "Dickey Simpkins", 69, "PF/C", [21,237,26,41,0,1,26,40,26,44,8,23,31,17,4,3,13,78]),
  giocabile("rusty-larue", "Rusty LaRue", 70, "PG/SG", [14,140,20,49,4,16,16,33,5,8,1,7,8,5,3,1,6,49]),
  giocabile("keith-booth", "Keith Booth", 70, "SF/PF", [6,17,2,6,0,1,2,5,6,6,2,2,4,1,0,0,3,10]),
  // Split CHI-only (3TM in totals): stagione divisa GSW/CHI/NJN, tenuta la sola quota Chicago Bulls.
  filler("david-vaughn", "David Vaughn", [3,6,1,1,0,0,1,1,2,4,0,1,1,0,0,0,0,4]),
);
for (let i = start21; i < cards.length; i++) Object.assign(cards[i], CHI9798);

// ============================== Utah Jazz 1997-98 ==============================
const start22 = cards.length;
const UTA9798 = { season: "1997-98", team: "Utah Jazz", team_abbr: "UTA" };
cards.push(
  giocabile("karl-malone", "Karl Malone", 96, "PF/C", [81,3030,780,1472,2,6,778,1466,628,825,189,645,834,316,96,70,247,2190]),
  giocabile("jeff-hornacek", "Jeff Hornacek", 82, "SG/PG", [80,2460,399,828,56,127,343,701,285,322,65,205,270,349,109,15,132,1139]),
  giocabile("bryon-russell", "Bryon Russell", 76, "SF/SG", [82,2219,226,525,73,214,153,311,213,278,78,248,326,101,90,31,81,738]),
  giocabile("adam-keefe", "Adam Keefe", 76, "C/PF", [80,2047,229,424,0,0,229,424,162,200,179,259,438,89,52,24,71,620]),
  giocabile("john-stockton", "John Stockton", 93, "PG/SG", [64,1858,270,511,39,91,231,420,191,231,35,131,166,543,89,10,161,770]),
  giocabile("howard-eisley", "Howard Eisley", 75, "PG/SG", [82,1726,229,519,48,118,181,401,127,149,25,141,166,346,54,13,160,633]),
  giocabile("shandon-anderson", "Shandon Anderson", 75, "SF/SG", [82,1602,269,500,7,32,262,468,136,185,86,141,227,89,66,18,91,681]),
  giocabile("greg-foster", "Greg Foster", 69, "PF/C", [78,1446,186,418,2,9,184,409,67,87,85,188,273,51,15,28,68,441]),
  giocabile("greg-ostertag", "Greg Ostertag", 70, "C/PF", [63,1288,115,239,0,0,115,239,67,140,134,240,374,25,28,132,74,297]),
  giocabile("antoine-carr", "Antoine Carr", 70, "PF/C", [66,1086,151,325,0,0,151,325,76,98,42,89,131,48,11,53,48,378]),
  giocabile("chris-morris", "Chris Morris", 72, "SF/SG", [54,538,85,207,19,62,66,145,44,61,35,79,114,24,25,17,33,233]),
  giocabile("jacque-vaughn", "Jacque Vaughn", 69, "PG/SG", [45,419,44,122,3,8,41,114,48,68,4,34,38,84,9,1,56,139]),
  // Split UTA-only (2TM in totals): stagione divisa UTA/PHI, tenuta la sola quota Utah Jazz.
  filler("william-cunningham", "William Cunningham", [6,38,4,9,0,0,4,9,0,0,4,4,8,1,2,0,0,8]),
  filler("troy-hudson", "Troy Hudson", [8,23,6,14,0,3,6,11,0,0,1,1,2,4,2,0,1,12]),
);
for (let i = start22; i < cards.length; i++) Object.assign(cards[i], UTA9798);

// ============================== Los Angeles Lakers 1997-98 ==============================
const start23 = cards.length;
const LAL9798 = { season: "1997-98", team: "Los Angeles Lakers", team_abbr: "LAL" };
cards.push(
  giocabile("eddie-jones", "Eddie Jones", 83, "SG/SF", [80,2910,486,1005,143,368,343,637,234,306,85,217,302,246,160,55,146,1349]),
  giocabile("rick-fox", "Rick Fox", 81, "SF/SG", [82,2709,363,771,86,265,277,506,171,230,78,280,358,276,100,48,201,983]),
  giocabile("robert-horry", "Robert Horry", 74, "PF/SF", [72,2192,200,420,19,93,181,327,117,169,186,356,542,163,112,94,99,536]),
  giocabile("shaquille-oneal", "Shaquille O’Neal", 93, "C/PF", [60,2175,670,1147,0,0,670,1147,359,681,208,473,681,142,39,144,175,1699]),
  giocabile("kobe-bryant", "Kobe Bryant", 83, "SG/SF", [79,2056,391,913,75,220,316,693,363,457,79,163,242,199,74,40,157,1220]),
  giocabile("nick-van-exel", "Nick Van Exel", 82, "PG/SG", [64,2053,311,743,123,316,188,427,136,172,31,163,194,442,64,6,104,881]),
  giocabile("elden-campbell", "Elden Campbell", 76, "C/PF", [81,1784,289,624,1,2,288,622,237,342,143,312,455,78,35,102,115,816]),
  giocabile("derek-fisher", "Derek Fisher", 75, "PG/SG", [82,1760,164,378,31,81,133,297,115,152,38,155,193,333,75,5,119,474]),
  giocabile("corie-blount", "Corie Blount", 70, "PF/C", [70,1029,107,187,0,4,107,183,39,78,114,184,298,37,29,25,51,253]),
  giocabile("sean-rooks", "Sean Rooks", 73, "C/PF", [41,425,46,101,0,0,46,101,47,79,46,72,118,24,2,23,19,139]),
  giocabile("jon-barry", "Jon Barry", 70, "SG/PG", [49,374,38,104,18,61,20,43,27,29,8,29,37,51,24,3,22,121]),
  filler("mario-bennett", "Mario Bennett", [45,354,80,135,1,2,79,133,16,44,60,66,126,18,19,11,21,177]),
  filler("shea-seals", "Shea Seals", [4,9,1,8,0,3,1,5,2,4,3,1,4,0,1,0,0,4]),
);
for (let i = start23; i < cards.length; i++) Object.assign(cards[i], LAL9798);

// ============================== San Antonio Spurs 1997-98 ==============================
const start24 = cards.length;
const SAS9798 = { season: "1997-98", team: "San Antonio Spurs", team_abbr: "SAS" };
cards.push(
  giocabile("tim-duncan", "Tim Duncan", 87, "PF/C", [82,3204,706,1287,0,10,706,1277,319,482,274,703,977,224,55,206,279,1731]),
  giocabile("avery-johnson", "Avery Johnson", 79, "PG/SG", [75,2674,321,671,2,13,319,658,122,168,30,120,150,591,84,18,165,766]),
  giocabile("david-robinson", "David Robinson", 90, "C/PF", [73,2457,544,1065,1,4,543,1061,485,660,239,536,775,199,64,192,202,1574]),
  giocabile("jaren-jackson", "Jaren Jackson", 71, "SG/SF", [82,2226,258,654,112,297,146,357,94,118,55,155,210,156,60,8,104,722]),
  giocabile("vinny-del-negro", "Vinny Del Negro", 75, "SG/PG", [54,1721,211,479,17,39,194,440,74,93,13,139,152,183,39,6,53,513]),
  giocabile("will-perdue", "Will Perdue", 70, "C/PF", [79,1491,162,295,0,1,162,294,70,133,177,358,535,57,22,50,81,394]),
  giocabile("chuck-person", "Chuck Person", 71, "SF/PF", [61,1455,143,398,95,276,48,122,28,37,17,187,204,86,29,10,67,409]),
  giocabile("monty-williams", "Monty Williams", 70, "SF/PF", [72,1314,165,368,1,2,164,366,122,182,67,112,179,89,34,24,82,453]),
  giocabile("sean-elliott", "Sean Elliott", 78, "SF/SG", [36,1012,122,303,34,90,88,213,56,78,16,108,124,62,24,14,57,334]),
  giocabile("reggie-geary", "Reggie Geary", 70, "PG/SG", [62,685,56,169,12,40,44,129,28,56,19,48,67,74,37,12,42,152]),
  giocabile("carl-herrera", "Carl Herrera", 72, "PF/C", [58,516,76,175,0,1,76,174,18,44,24,67,91,22,19,12,38,170]),
  // Split SAS-only (2TM in totals): stagione divisa SAS/DEN, tenuta la sola quota San Antonio Spurs.
  filler("cory-alexander", "Cory Alexander", [37,501,60,145,20,64,40,81,25,37,7,40,47,71,25,5,47,165]),
  giocabile("malik-rose", "Malik Rose", 76, "SF/PF", [53,429,59,136,1,3,58,133,39,61,40,50,90,19,21,7,44,158]),
  filler("brad-lohaus", "Brad Lohaus", [9,102,7,21,4,14,3,7,1,3,3,9,12,5,1,2,3,19]),
  giocabile("willie-burton", "Willie Burton", 73, "SF", [13,43,8,21,3,9,5,12,8,12,3,6,9,1,2,2,1,27]),
);
for (let i = start24; i < cards.length; i++) Object.assign(cards[i], SAS9798);

// ============================== New York Knicks 1998-99 ==============================
const start25 = cards.length;
const NYK9899 = { season: "1998-99", team: "New York Knicks", team_abbr: "NYK" };
cards.push(
  giocabile("allan-houston", "Allan Houston", 83, "SG/SF", [50,1815,294,703,57,140,237,563,168,195,20,132,152,137,35,9,130,813]),
  giocabile("larry-johnson", "Larry Johnson", 81, "PF/SF", [49,1639,210,458,33,92,177,366,134,164,91,193,284,119,34,10,89,587]),
  giocabile("charlie-ward", "Charlie Ward", 76, "PG", [50,1556,135,334,53,149,82,185,55,78,23,149,172,271,103,8,131,378]),
  giocabile("patrick-ewing", "Patrick Ewing", 85, "C/PF", [38,1300,247,568,0,2,247,566,163,231,74,303,377,43,30,100,99,657]),
  giocabile("chris-childs", "Chris Childs", 71, "PG/SG", [48,1297,114,267,36,94,78,173,64,78,18,115,133,193,44,1,85,328]),
  giocabile("latrell-sprewell", "Latrell Sprewell", 84, "SF", [37,1233,215,518,21,77,194,441,155,191,41,115,156,91,46,2,79,606]),
  giocabile("kurt-thomas", "Kurt Thomas", 75, "PF/C", [50,1182,170,368,0,1,170,367,66,108,82,204,286,55,45,17,73,406]),
  giocabile("marcus-camby", "Marcus Camby", 78, "C", [46,945,136,261,0,0,136,261,57,103,102,151,253,12,29,74,39,329]),
  giocabile("chris-dudley", "Chris Dudley", 69, "C", [46,685,48,109,0,0,48,109,19,40,79,114,193,7,13,38,24,115]),
  // Split NYK-only (2TM in totals): stagione divisa NYK/MIN, tenuta la sola quota New York Knicks.
  filler("dennis-scott", "Dennis Scott", [15,206,17,56,8,29,9,27,1,4,3,17,20,8,3,1,5,43]),
  giocabile("rick-brunson", "Rick Brunson", 71, "PG/SG", [17,95,6,21,0,5,6,16,5,18,3,7,10,19,9,0,12,17]),
  giocabile("david-wingate", "David Wingate", 68, "SG/SF", [20,92,7,16,0,0,7,16,0,0,3,5,8,5,4,0,6,14]),
  giocabile("herb-williams", "Herb Williams", 67, "C/PF", [6,34,4,8,0,0,4,8,2,2,3,3,6,0,0,2,2,10]),
  filler("ben-davis", "Ben Davis", [8,21,7,17,0,0,7,17,3,6,9,2,11,3,0,0,1,17]),
);
for (let i = start25; i < cards.length; i++) Object.assign(cards[i], NYK9899);

// ============================== Toronto Raptors 1999-00 ==============================
const start26 = cards.length;
const TOR9900 = { season: "1999-00", team: "Toronto Raptors", team_abbr: "TOR" };
cards.push(
  giocabile("vince-carter", "Vince Carter", 94, "SG/SF", [82,3126,788,1696,95,236,693,1460,436,551,150,326,476,322,110,92,178,2107]),
  giocabile("antonio-davis", "Antonio Davis", 78, "C/PF", [79,2479,313,712,0,0,313,712,284,371,235,461,696,105,38,100,121,910]),
  giocabile("tracy-mcgrady", "Tracy McGrady", 83, "SF/SG", [79,2462,459,1018,18,65,441,953,277,392,188,313,501,263,90,151,160,1213]),
  giocabile("charles-oakley", "Charles Oakley", 76, "PF/C", [80,2431,234,560,14,41,220,519,66,85,117,423,540,253,102,45,154,548]),
  giocabile("doug-christie", "Doug Christie", 80, "SG/SF", [73,2264,311,764,99,275,212,489,182,216,63,222,285,321,102,43,144,903]),
  giocabile("muggsy-bogues", "Muggsy Bogues", 74, "PG/SG", [80,1731,157,358,17,51,140,307,79,87,25,110,135,299,65,4,59,410]),
  giocabile("kevin-willis", "Kevin Willis", 75, "PF/C", [79,1679,236,569,1,3,235,566,131,164,201,281,482,49,36,48,98,604]),
  giocabile("dell-curry", "Dell Curry", 73, "SG/SF", [67,1095,194,454,95,242,99,212,24,32,11,89,100,89,32,9,40,507]),
  giocabile("alvin-williams", "Alvin Williams", 76, "PG", [55,779,114,287,16,55,98,232,48,65,27,58,85,126,34,11,47,292]),
  giocabile("dee-brown", "Dee Brown", 72, "PG/SG", [38,673,93,258,67,187,26,71,11,16,9,45,54,86,24,5,39,264]),
  giocabile("john-thomas", "John Thomas", 67, "C/PF", [55,477,49,107,0,1,49,106,16,41,37,38,75,9,12,14,14,114]),
  giocabile("michael-stewart", "Michael Stewart", 71, "C/PF", [42,389,20,53,0,0,20,53,18,32,33,61,94,6,5,19,17,58]),
  // Split TOR-only (2TM in totals): stagione divisa MIL/TOR, tenuta la sola quota Toronto Raptors.
  giocabile("haywoode-workman", "Haywoode Workman", 70, "PG", [13,102,8,28,3,14,5,14,1,2,0,9,9,17,9,0,4,20]),
  // Split TOR-only (2TM in totals): stagione divisa TOR/PHI, tenuta la sola quota Toronto Raptors.
  filler("antonio-lang", "Antonio Lang", [7,32,0,5,0,0,0,5,3,4,0,5,5,1,4,1,2,3]),
  filler("aleksandar-radojevic", "Aleksandar Radojević", [3,24,2,7,0,0,2,7,3,6,2,6,8,1,2,1,5,7]),
  filler("sean-marks", "Sean Marks", [5,12,2,6,0,1,2,5,4,4,0,2,2,0,1,1,3,8]),
);
for (let i = start26; i < cards.length; i++) Object.assign(cards[i], TOR9900);

// ============================== Portland Trail Blazers 1999-00 ==============================
const start27 = cards.length;
const POR9900 = { season: "1999-00", team: "Portland Trail Blazers", team_abbr: "POR" };
cards.push(
  filler("rasheed-wallace", "Rasheed Wallace", [81,2845,542,1045,8,50,534,995,233,331,129,437,566,142,87,107,157,1325]),
  giocabile("scottie-pippen", "Scottie Pippen", 85, "SF/SG", [82,2749,388,860,86,263,302,597,160,223,114,399,513,406,117,41,208,1022]),
  giocabile("steve-smith", "Steve Smith", 82, "SG/SF", [82,2689,420,900,96,241,324,659,289,340,123,190,313,209,71,31,117,1225]),
  giocabile("damon-stoudamire", "Damon Stoudamire", 82, "PG", [78,2372,386,894,80,212,306,682,122,145,61,182,243,405,77,1,149,974]),
  giocabile("arvydas-sabonis", "Arvydas Sabonis", 86, "C/PF", [66,1688,302,598,7,19,295,579,167,198,97,416,513,118,43,78,97,778]),
  giocabile("detlef-schrempf", "Detlef Schrempf", 77, "PF/SF", [77,1662,187,433,21,52,166,381,179,215,79,253,332,197,37,17,100,574]),
  giocabile("greg-anthony", "Greg Anthony", 75, "PG/SG", [82,1548,169,416,88,233,81,183,88,114,17,116,133,208,59,9,85,514]),
  giocabile("brian-grant", "Brian Grant", 76, "PF/SF", [63,1322,173,352,1,2,172,350,112,166,121,223,344,64,32,28,84,459]),
  giocabile("bonzi-wells", "Bonzi Wells", 76, "SF/SG", [66,1162,236,480,20,53,216,427,88,129,78,104,182,97,69,12,97,580]),
  giocabile("jermaine-oneal", "Jermaine O’Neal", 76, "C/PF", [70,859,108,222,0,1,108,221,57,98,97,132,229,18,11,55,47,273]),
  giocabile("stacey-augmon", "Stacey Augmon", 76, "SG/SF", [59,692,83,175,0,2,83,173,37,55,42,74,116,53,27,11,38,203]),
  giocabile("antonio-harvey", "Antonio Harvey", 70, "PF/C", [19,137,17,30,0,0,17,30,7,12,8,25,33,5,1,6,12,41]),
  giocabile("joe-kleine", "Joe Kleine", 73, "C/PF", [7,31,4,11,0,0,4,11,3,3,0,6,6,2,1,0,2,11]),
  giocabile("gary-grant", "Gary Grant", 67, "PG", [3,24,6,14,0,0,6,14,0,0,0,3,3,1,1,0,2,12]),
);
for (let i = start27; i < cards.length; i++) Object.assign(cards[i], POR9900);

// ============================== Philadelphia 76ers 2000-01 ==============================
const start28 = cards.length;
const PHI0001 = { season: "2000-01", team: "Philadelphia 76ers", team_abbr: "PHI" };
cards.push(
  // Esclusi per assenza di totali Basketball-Reference sufficienti: Speedy Claxton, Anthony Miller.
  giocabile("allen-iverson", "Allen Iverson", 93, "SG/PG", [71,2979,762,1813,98,306,664,1507,585,719,50,223,273,325,178,20,237,2207]),
  giocabile("george-lynch", "George Lynch", 75, "SF/PF", [82,2649,274,616,15,57,259,559,123,171,200,390,590,139,99,30,109,686]),
  giocabile("aaron-mckie", "Aaron McKie", 79, "SG/PG", [76,2394,338,714,53,170,285,544,149,194,33,278,311,377,106,8,203,878]),
  giocabile("tyrone-hill", "Tyrone Hill", 76, "PF", [76,2363,278,587,0,1,278,586,172,273,239,448,687,48,37,27,127,728]),
  filler("theo-ratliff", "Theo Ratliff", [50,1800,228,457,0,0,228,457,165,217,125,288,413,58,30,187,126,621]),
  giocabile("eric-snow", "Eric Snow", 80, "PG", [50,1740,182,435,5,19,177,416,122,154,27,139,166,369,77,7,124,491]),
  // Split PHI-only (2TM in totals): stagione divisa PHI/ATL, tenuta la sola quota Philadelphia 76ers.
  filler("toni-kukoc", "Toni Kukoč", [48,979,151,330,32,78,119,252,52,88,47,115,162,93,35,6,60,386]),
  // Split PHI-only (2TM in totals): stagione divisa ATL/PHI, tenuta la sola quota Philadelphia 76ers.
  giocabile("dikembe-mutombo", "Dikembe Mutombo", 81, "C", [26,875,100,202,0,0,100,202,104,137,119,203,322,22,9,66,52,304]),
  giocabile("jumaine-jones", "Jumaine Jones", 71, "SF", [65,866,122,275,20,60,102,215,40,53,63,126,189,32,30,15,39,304]),
  // Split PHI-only (2TM in totals): stagione divisa NJN/PHI, tenuta la sola quota Philadelphia 76ers.
  giocabile("kevin-ollie", "Kevin Ollie", 72, "PG/SG", [51,764,71,165,1,3,70,162,51,70,13,59,72,121,25,1,40,194]),
  giocabile("todd-macculloch", "Todd MacCulloch", 68, "C", [63,597,109,185,0,0,109,185,42,66,69,99,168,10,7,19,27,260]),
  giocabile("rodney-buford", "Rodney Buford", 71, "SF/SG", [47,573,104,241,16,38,88,203,24,29,16,58,74,17,17,6,29,248]),
  giocabile("matt-geiger", "Matt Geiger", 69, "C", [35,542,88,224,0,2,88,222,37,54,50,89,139,14,12,8,25,213]),
  // Split PHI-only (2TM in totals): stagione divisa PHI/DAL, tenuta la sola quota Philadelphia 76ers.
  filler("vernon-maxwell", "Vernon Maxwell", [24,375,42,125,21,64,21,61,15,22,3,34,37,29,12,0,18,120]),
  // Split PHI-only (2TM in totals): stagione divisa PHI/ATL, tenuta la sola quota Philadelphia 76ers.
  filler("nazr-mohammed", "Nazr Mohammed", [30,196,41,88,0,0,41,88,14,28,18,37,55,2,6,7,9,96]),
  // Split PHI-only (2TM in totals): stagione divisa ATL/PHI, tenuta la sola quota Philadelphia 76ers.
  giocabile("pepe-sanchez", "Pepe Sanchez", 71, "PG/SG", [24,116,9,21,0,1,9,20,2,2,2,12,14,36,9,1,3,20]),
  giocabile("raja-bell", "Raja Bell", 68, "SG/SF", [5,30,2,7,1,3,1,4,0,0,0,1,1,0,1,0,2,5]),
  // Split PHI-only (2TM in totals): stagione divisa ATL/PHI, tenuta la sola quota Philadelphia 76ers.
  giocabile("roshown-mcleod", "Roshown McLeod", 69, "SF", [1,15,1,2,0,1,1,1,0,0,1,1,2,0,0,0,1,2]),
);
for (let i = start28; i < cards.length; i++) Object.assign(cards[i], PHI0001);

// ============================== Los Angeles Lakers 2000-01 ==============================
const start29 = cards.length;
const LAL0001 = { season: "2000-01", team: "Los Angeles Lakers", team_abbr: "LAL" };
cards.push(
  giocabile("shaquille-oneal", "Shaquille O’Neal", 97, "C/PF", [74,2924,813,1422,0,2,813,1420,499,972,291,649,940,277,47,204,218,2125]),
  giocabile("kobe-bryant", "Kobe Bryant", 98, "SG/SF", [68,2783,701,1510,61,200,640,1310,475,557,104,295,399,338,114,43,220,1938]),
  giocabile("horace-grant", "Horace Grant", 80, "PF/C", [77,2390,263,569,0,3,263,566,131,169,220,325,545,121,51,61,48,657]),
  giocabile("rick-fox", "Rick Fox", 80, "SF/SG", [82,2291,287,646,118,300,169,346,95,122,80,245,325,262,70,29,136,787]),
  giocabile("brian-shaw", "Brian Shaw", 72, "SG/PG", [80,1833,164,411,42,135,122,276,51,64,48,256,304,258,49,27,97,421]),
  giocabile("robert-horry", "Robert Horry", 75, "PF/SF", [79,1587,147,380,54,156,93,224,59,83,93,203,296,128,54,54,79,407]),
  giocabile("isaiah-rider", "Isaiah Rider", 75, "SG", [67,1206,201,472,34,92,167,380,71,83,44,112,156,111,27,7,98,507]),
  giocabile("ron-harper", "Ron Harper", 74, "PG/SG", [47,1139,127,271,19,72,108,199,34,48,46,120,166,113,39,25,62,307]),
  giocabile("mike-penberthy", "Mike Penberthy", 73, "PG/SG", [53,851,92,222,55,139,37,83,28,31,10,53,63,71,22,2,34,267]),
  giocabile("derek-fisher", "Derek Fisher", 77, "PG/SG", [20,709,77,187,25,63,52,124,50,62,5,54,59,87,39,2,29,229]),
  giocabile("mark-madsen", "Mark Madsen", 73, "PF/C", [70,641,55,113,1,1,54,112,26,37,74,78,152,24,8,8,27,137]),
  giocabile("devean-george", "Devean George", 71, "SF", [59,593,64,207,15,68,49,139,39,55,35,75,110,19,15,15,34,182]),
  giocabile("tyronn-lue", "Tyronn Lue", 72, "PG/SG", [38,468,50,117,11,34,39,83,19,24,5,27,32,45,19,0,27,130]),
  giocabile("greg-foster", "Greg Foster", 69, "C/PF", [62,451,56,133,3,9,53,124,10,14,29,83,112,32,9,12,25,125]),
  giocabile("stanislav-medvedenko", "Stanislav Medvedenko", 70, "PF/C", [7,39,12,25,1,1,11,24,7,12,1,8,9,2,1,1,3,32]),
);
for (let i = start29; i < cards.length; i++) Object.assign(cards[i], LAL0001);

// ============================== Sacramento Kings 2001-02 ==============================
const start30 = cards.length;
const SAC0102 = { season: "2001-02", team: "Sacramento Kings", team_abbr: "SAC" };
cards.push(
  giocabile("doug-christie", "Doug Christie", 83, "SG/SF", [81,2798,338,735,90,256,248,479,206,242,74,300,374,340,160,25,164,972]),
  giocabile("mike-bibby", "Mike Bibby", 82, "PG", [80,2659,446,985,51,138,395,847,155,193,37,185,222,403,87,15,134,1098]),
  giocabile("peja-stojakovic", "Peja Stojakovic", 86, "SF/SG", [71,2649,547,1130,129,310,418,820,283,323,72,301,373,175,81,14,140,1506]),
  giocabile("vlade-divac", "Vlade Divac", 86, "C/PF", [80,2420,338,716,3,13,335,703,209,340,205,466,671,297,79,94,158,888]),
  giocabile("chris-webber", "Chris Webber", 89, "PF/C", [54,2071,532,1075,5,19,527,1056,253,338,150,396,546,258,90,76,158,1322]),
  giocabile("hedo-turkoglu", "Hedo Turkoglu", 76, "SF/PF", [80,1970,290,687,63,171,227,516,167,230,63,300,363,163,57,31,81,810]),
  giocabile("scot-pollard", "Scot Pollard", 77, "C/PF", [80,1881,197,358,0,0,197,358,115,166,188,377,565,53,70,76,68,509]),
  giocabile("bobby-jackson", "Bobby Jackson", 77, "PG", [81,1750,334,754,79,219,255,535,149,184,82,169,251,164,73,11,93,896]),
  giocabile("lawrence-funderburke", "Lawrence Funderburke", 75, "PF", [56,722,115,245,0,3,115,242,34,56,76,122,198,32,11,18,33,264]),
  giocabile("gerald-wallace", "Gerald Wallace", 75, "SF/PF", [54,430,75,175,0,7,75,168,23,46,49,40,89,27,19,6,22,173]),
  giocabile("mateen-cleaves", "Mateen Cleaves", 71, "PG", [32,153,30,68,2,8,28,60,8,9,1,7,8,25,7,0,27,70]),
  giocabile("chucky-brown", "Chucky Brown", 70, "PF", [18,92,10,27,0,0,10,27,1,2,10,23,33,6,2,4,5,21]),
  giocabile("brent-price", "Brent Price", 71, "PG/SG", [20,89,9,27,4,15,5,12,9,13,4,4,8,9,3,1,10,31]),
  // Split SAC-only (2TM in totals): stagione divisa SAC/PHI, tenuta la sola quota Sacramento Kings.
  filler("jabari-smith", "Jabari Smith", [12,71,6,21,0,1,6,20,6,12,2,12,14,6,2,4,2,18]),
);
for (let i = start30; i < cards.length; i++) Object.assign(cards[i], SAC0102);

// ============================== New Jersey Nets 2001-02 ==============================
const start31 = cards.length;
const BKN0102 = { season: "2001-02", team: "New Jersey Nets", team_abbr: "BKN" };
cards.push(
  // Esclusi per assenza di totali Basketball-Reference sufficienti: Jamie Feick.
  giocabile("jason-kidd", "Jason Kidd", 92, "PG/SG", [82,3056,445,1138,117,364,328,774,201,247,130,465,595,808,175,20,286,1208]),
  giocabile("kerry-kittles", "Kerry Kittles", 81, "SG/SF", [82,2601,438,940,98,242,340,698,128,172,68,207,275,216,130,31,109,1102]),
  giocabile("kenyon-martin", "Kenyon Martin", 82, "PF/C", [73,2504,445,962,15,67,430,895,181,267,113,275,388,192,90,121,172,1086]),
  giocabile("keith-van-horn", "Keith Van Horn", 82, "SF/PF", [81,2465,471,1089,101,293,370,796,156,195,137,472,609,164,63,42,146,1199]),
  giocabile("richard-jefferson", "Richard Jefferson", 78, "SF/SG", [79,1917,270,591,13,56,257,535,189,265,85,208,293,140,64,48,107,742]),
  filler("lucious-harris", "Lucious Harris", [74,1553,249,537,44,118,205,419,133,158,49,158,207,116,53,6,61,675]),
  giocabile("aaron-williams", "Aaron Williams", 72, "C/PF", [82,1546,231,439,0,2,231,437,130,186,115,224,339,77,29,76,79,592]),
  giocabile("todd-macculloch", "Todd MacCulloch", 71, "C", [62,1502,247,465,0,0,247,465,110,164,157,221,378,78,24,89,66,604]),
  giocabile("jason-collins", "Jason Collins", 71, "C", [77,1407,117,278,1,2,116,276,115,164,132,169,301,81,29,47,72,350]),
  giocabile("anthony-johnson", "Anthony Johnson", 74, "PG/SG", [34,366,37,90,4,12,33,78,16,25,10,19,29,48,31,1,20,94]),
  giocabile("brian-scalabrine", "Brian Scalabrine", 72, "PF/SF", [28,290,23,67,3,10,20,57,11,15,12,39,51,21,9,2,24,60]),
  // Split NJN-only (2TM in totals): stagione divisa NJN/TOR, tenuta la sola quota New Jersey Nets.
  filler("derrick-dial", "Derrick Dial", [25,249,30,94,0,7,30,87,13,18,12,33,45,31,8,4,13,73]),
  giocabile("brandon-armstrong", "Brandon Armstrong", 72, "SG/SF", [35,196,27,85,5,17,22,68,5,10,10,6,16,8,7,1,8,64]),
  filler("donny-marshall", "Donny Marshall", [20,118,8,29,2,4,6,25,12,18,8,13,21,5,3,0,2,30]),
  filler("steve-goodrich", "Steve Goodrich", [9,50,2,10,0,0,2,10,1,2,1,4,5,5,1,2,3,5]),
  // Split NJN-only (2TM in totals): stagione divisa NJN/ATL, tenuta la sola quota New Jersey Nets.
  filler("reggie-slater", "Reggie Slater", [4,10,2,2,0,0,2,2,1,1,0,2,2,0,0,0,1,5]),
);
for (let i = start31; i < cards.length; i++) Object.assign(cards[i], BKN0102);

// ============================== Dallas Mavericks 2002-03 ==============================
const start32 = cards.length;
const DAL0203 = { season: "2002-03", team: "Dallas Mavericks", team_abbr: "DAL" };
cards.push(
  giocabile("dirk-nowitzki", "Dirk Nowitzki", 92, "PF/C", [80,3117,690,1489,148,390,542,1099,483,548,81,710,791,239,111,82,152,2011]),
  giocabile("steve-nash", "Steve Nash", 87, "PG", [82,2711,518,1114,111,269,407,845,308,339,63,171,234,598,85,6,192,1455]),
  giocabile("michael-finley", "Michael Finley", 81, "SF/SG", [69,2642,507,1193,119,322,388,871,198,230,107,295,402,205,76,21,114,1331]),
  giocabile("nick-van-exel", "Nick Van Exel", 81, "SG/PG", [73,2026,342,831,118,312,224,519,110,144,35,173,208,312,42,4,123,912]),
  giocabile("shawn-bradley", "Shawn Bradley", 75, "C", [81,1731,201,375,0,1,201,374,141,175,151,325,476,54,65,170,67,543]),
  giocabile("raef-lafrentz", "Raef LaFrentz", 79, "C/PF", [69,1611,266,514,47,116,219,398,60,88,125,205,330,54,35,91,46,639]),
  giocabile("adrian-griffin", "Adrian Griffin", 72, "SG", [74,1373,146,337,6,24,140,313,27,32,88,176,264,105,77,6,47,325]),
  giocabile("raja-bell", "Raja Bell", 69, "SG/SF", [75,1173,93,211,21,51,72,160,23,34,47,98,145,57,52,8,43,230]),
  giocabile("walt-williams", "Walt Williams", 74, "SF/SG", [66,1161,134,341,64,171,70,170,31,50,53,154,207,59,42,26,35,363]),
  giocabile("eduardo-najera", "Eduardo Najera", 75, "PF/SF", [48,1103,129,231,0,1,129,230,62,91,90,133,223,47,40,22,23,320]),
  giocabile("avery-johnson", "Avery Johnson", 71, "PG/SG", [48,430,63,150,0,2,63,148,30,39,10,21,31,64,15,1,29,156]),
  giocabile("popeye-jones", "Popeye Jones", 67, "PF", [26,222,24,62,0,0,24,62,5,11,29,30,59,8,5,1,15,53]),
  giocabile("tariq-abdul-wahad", "Tariq Abdul-Wahad", 73, "SF/SG", [14,204,27,58,0,1,27,57,3,6,14,26,40,21,6,3,7,57]),
  giocabile("evan-eschmeyer", "Evan Eschmeyer", 68, "C", [17,135,7,19,0,0,7,19,3,4,10,19,29,6,10,7,6,17]),
  giocabile("antoine-rigaudeau", "Antoine Rigaudeau", 70, "SG/SF", [11,91,8,35,1,5,7,30,0,0,4,4,8,6,3,0,6,17]),
  // Split DAL-only (2TM in totals): stagione divisa DAL/DEN, tenuta la sola quota Dallas Mavericks.
  filler("adam-harrington", "Adam Harrington", [13,37,4,17,1,3,3,14,2,2,0,2,2,2,1,1,2,11]),
  filler("mark-strickland", "Mark Strickland", [4,13,2,5,0,0,2,5,0,0,5,2,7,0,0,0,1,4]),
);
for (let i = start32; i < cards.length; i++) Object.assign(cards[i], DAL0203);

// ============================== Phoenix Suns 2002-03 ==============================
const start33 = cards.length;
const PHX0203 = { season: "2002-03", team: "Phoenix Suns", team_abbr: "PHX" };
cards.push(
  giocabile("shawn-marion", "Shawn Marion", 86, "SF/PF", [81,3373,662,1466,141,364,521,1102,251,295,199,574,773,198,185,95,157,1716]),
  giocabile("stephon-marbury", "Stephon Marbury", 84, "PG", [81,3240,671,1530,89,296,582,1234,375,467,53,210,263,654,108,20,263,1806]),
  giocabile("amare-stoudemire", "Amar’e Stoudemire", 80, "PF/C", [82,2570,392,830,2,10,390,820,320,484,250,471,721,78,62,87,189,1106]),
  giocabile("joe-johnson", "Joe Johnson", 72, "SG/SF", [82,2255,316,796,75,205,241,591,96,124,57,207,264,210,62,19,108,803]),
  giocabile("bo-outlaw", "Bo Outlaw", 75, "PF/SF", [80,1800,153,278,0,2,153,276,72,116,134,234,368,112,50,71,76,378]),
  giocabile("penny-hardaway", "Penny Hardaway", 78, "PG/SG", [58,1777,256,573,26,73,230,500,77,97,66,192,258,235,66,26,145,615]),
  giocabile("casey-jacobsen", "Casey Jacobsen", 71, "SF/SG", [72,1147,122,327,52,165,70,162,72,105,29,54,83,73,35,6,55,368]),
  giocabile("jake-voskuhl", "Jake Voskuhl", 73, "C/PF", [65,947,92,163,0,0,92,163,64,96,97,128,225,36,18,29,48,248]),
  giocabile("scott-williams", "Scott Williams", 71, "PF/C", [69,872,120,292,0,2,120,290,33,42,72,121,193,22,27,21,32,273]),
  giocabile("jake-tsakalidis", "Jake Tsakalidis", 73, "C", [33,543,61,135,0,0,61,135,39,58,45,77,122,13,6,17,26,161]),
  filler("dan-langhi", "Dan Langhi", [60,541,81,202,9,31,72,171,12,20,19,68,87,21,15,6,16,183]),
  giocabile("tom-gugliotta", "Tom Gugliotta", 75, "PF/SF", [27,447,60,132,0,1,60,131,9,9,25,75,100,31,14,5,31,129]),
  giocabile("randy-brown", "Randy Brown", 70, "PG", [32,262,16,43,0,0,16,43,9,12,3,23,26,35,17,2,17,41]),
  filler("alton-ford", "Alton Ford", [11,31,3,9,0,0,3,9,1,3,0,6,6,1,0,0,2,7]),
);
for (let i = start33; i < cards.length; i++) Object.assign(cards[i], PHX0203);

// ============================== Los Angeles Lakers 2003-04 ==============================
const start34 = cards.length;
const LAL0304 = { season: "2003-04", team: "Los Angeles Lakers", team_abbr: "LAL" };
cards.push(
  giocabile("gary-payton", "Gary Payton", 83, "PG/SG", [82,2825,482,1024,55,165,427,859,180,252,72,270,342,449,96,19,151,1199]),
  giocabile("shaquille-oneal", "Shaquille O’Neal", 94, "C/PF", [67,2464,554,948,0,0,554,948,331,676,246,523,769,196,34,166,195,1439]),
  giocabile("kobe-bryant", "Kobe Bryant", 96, "SG/SF", [65,2447,516,1178,71,217,445,961,454,533,103,256,359,330,112,28,171,1557]),
  giocabile("devean-george", "Devean George", 75, "SF", [82,1951,233,571,65,186,168,385,73,96,87,245,332,112,81,38,88,604]),
  giocabile("derek-fisher", "Derek Fisher", 73, "PG/SG", [82,1769,203,576,52,179,151,397,122,153,30,122,152,187,103,4,79,580]),
  giocabile("stanislav-medvedenko", "Stanislav Medvedenko", 70, "PF/C", [68,1442,237,537,0,3,237,534,89,116,148,195,343,57,38,18,59,563]),
  giocabile("karl-malone", "Karl Malone", 83, "PF/C", [42,1373,193,400,0,1,193,399,168,225,61,306,367,163,50,20,103,554]),
  giocabile("kareem-rush", "Kareem Rush", 70, "SG/PG", [72,1244,190,432,48,138,142,294,31,52,20,77,97,59,33,20,48,459]),
  giocabile("horace-grant", "Horace Grant", 74, "PF/C", [55,1106,92,224,0,1,92,223,39,54,79,154,233,71,24,21,29,223]),
  giocabile("bryon-russell", "Bryon Russell", 74, "SF/SG", [72,945,98,244,43,112,55,132,50,65,32,114,146,71,32,12,37,289]),
  giocabile("rick-fox", "Rick Fox", 74, "SF/SG", [38,846,73,186,15,61,58,125,22,30,29,73,102,98,29,4,48,183]),
  giocabile("luke-walton", "Luke Walton", 72, "PF", [72,730,65,153,13,39,52,114,31,44,39,88,127,113,28,8,44,174]),
  giocabile("brian-cook", "Brian Cook", 74, "PF/C", [35,442,67,141,0,5,67,136,21,28,31,70,101,20,16,16,17,155]),
  giocabile("jamal-sampson", "Jamal Sampson", 68, "PF/C", [10,130,11,23,0,0,11,23,7,12,23,29,52,7,2,4,6,29]),
  // Split LAL-only (3TM in totals): stagione divisa LAL/TOR/CHI, tenuta la sola quota Los Angeles Lakers.
  filler("jannero-pargo", "Jannero Pargo", [13,63,6,16,2,4,4,12,0,0,0,6,6,11,2,0,12,14]),
  // Split LAL-only (2TM in totals): stagione divisa LAL/NOH, tenuta la sola quota Los Angeles Lakers.
  filler("maurice-carter", "Maurice Carter", [4,50,5,14,1,3,4,11,11,12,0,3,3,2,0,0,6,22]),
  giocabile("ime-udoka", "Ime Udoka", 71, "SF/SG", [4,28,3,9,0,1,3,8,2,4,1,4,5,2,2,1,3,8]),
);
for (let i = start34; i < cards.length; i++) Object.assign(cards[i], LAL0304);

// ============================== Detroit Pistons 2003-04 ==============================
const start35 = cards.length;
const DET0304 = { season: "2003-04", team: "Detroit Pistons", team_abbr: "DET" };
cards.push(
  giocabile("ben-wallace", "Ben Wallace", 87, "C/PF", [81,3050,315,748,1,8,314,740,142,290,324,682,1006,138,143,246,123,773]),
  giocabile("richard-hamilton", "Richard Hamilton", 88, "SG/SF", [78,2772,530,1166,18,68,512,1098,297,342,78,201,279,310,103,17,210,1375]),
  giocabile("chauncey-billups", "Chauncey Billups", 89, "PG/SG", [78,2758,392,996,130,335,262,661,404,460,35,241,276,446,84,8,189,1318]),
  filler("tayshaun-prince", "Tayshaun Prince", [82,2701,338,723,57,157,281,566,108,141,93,297,390,191,63,69,119,841]),
  giocabile("mehmet-okur", "Mehmet Okur", 76, "C/PF", [71,1580,251,542,18,48,233,494,162,209,160,261,421,69,36,63,101,682]),
  giocabile("corliss-williamson", "Corliss Williamson", 76, "SF/PF", [79,1574,304,602,0,0,304,602,144,197,88,168,256,57,30,20,113,752]),
  giocabile("elden-campbell", "Elden Campbell", 71, "C/PF", [65,892,138,314,0,0,138,314,85,124,52,157,209,45,21,50,63,361]),
  // Split DET-only (2TM in totals): stagione divisa DET/BOS, tenuta la sola quota Detroit Pistons.
  filler("chucky-atkins", "Chucky Atkins", [40,751,88,235,42,130,46,105,31,43,6,42,48,95,19,1,48,249]),
  // Split DET-only (2TM in totals): stagione divisa DET/ATL, tenuta la sola quota Detroit Pistons.
  filler("bob-sura", "Bob Sura", [53,707,71,173,9,36,62,137,48,69,30,73,103,89,37,9,39,199]),
  // Split DET-only (3TM in totals): stagione divisa POR/ATL/DET, tenuta la sola quota Detroit Pistons.
  filler("rasheed-wallace", "Rasheed Wallace", [22,673,121,281,22,69,99,212,38,54,32,123,155,40,24,45,29,302]),
  giocabile("lindsey-hunter", "Lindsey Hunter", 69, "PG/SG", [33,661,49,143,14,50,35,93,5,8,13,54,67,85,39,6,34,117]),
  // Split DET-only (2TM in totals): stagione divisa BOS/DET, tenuta la sola quota Detroit Pistons.
  giocabile("mike-james", "Mike James", 73, "PG", [26,512,59,147,20,55,39,92,27,32,8,50,58,95,26,1,41,165]),
  giocabile("darvin-ham", "Darvin Ham", 72, "SF/SG", [54,484,37,75,1,2,36,73,21,35,47,46,93,16,13,8,31,96]),
  giocabile("tremaine-fowlkes", "Tremaine Fowlkes", 71, "SF", [36,261,15,48,1,8,14,40,13,18,18,35,53,14,9,3,12,44]),
  // Split DET-only (2TM in totals): stagione divisa DET/ATL, tenuta la sola quota Detroit Pistons.
  filler("zeljko-rebraca", "Željko Rebrača", [21,222,22,54,0,0,22,54,22,28,19,30,49,4,5,9,13,66]),
  giocabile("darko-milicic", "Darko Milicic", 71, "C/PF", [34,159,17,65,0,1,17,64,14,24,11,32,43,7,7,15,13,48]),
  // Split DET-only (2TM in totals): stagione divisa DET/NJN, tenuta la sola quota Detroit Pistons.
  filler("hubert-davis", "Hubert Davis", [3,23,0,2,0,1,0,1,0,0,0,0,0,1,0,0,1,0]),
);
for (let i = start35; i < cards.length; i++) Object.assign(cards[i], DET0304);

// ============================== Minnesota Timberwolves 2003-04 ==============================
const start36 = cards.length;
const MIN0304 = { season: "2003-04", team: "Minnesota Timberwolves", team_abbr: "MIN" };
cards.push(
  giocabile("kevin-garnett", "Kevin Garnett", 96, "PF/C", [82,3231,804,1611,11,43,793,1568,368,465,245,894,1139,409,120,178,212,1987]),
  giocabile("latrell-sprewell", "Latrell Sprewell", 82, "SF", [82,3100,518,1266,99,299,419,967,240,295,56,254,310,286,88,21,158,1375]),
  giocabile("sam-cassell", "Sam Cassell", 88, "PG/SG", [81,2838,620,1270,74,186,546,1084,289,331,44,227,271,592,102,18,220,1603]),
  giocabile("trenton-hassell", "Trenton Hassell", 71, "SG/SF", [81,2264,177,381,4,13,173,368,48,61,68,189,257,133,36,54,46,406]),
  giocabile("fred-hoiberg", "Fred Hoiberg", 73, "SG", [79,1804,178,383,76,172,102,211,98,116,21,247,268,109,66,10,44,530]),
  giocabile("mark-madsen", "Mark Madsen", 72, "PF/C", [72,1246,101,204,0,6,101,198,57,118,134,138,272,28,33,18,47,259]),
  giocabile("gary-trent", "Gary Trent", 70, "C/PF", [68,1025,155,328,0,6,155,322,69,91,83,133,216,49,12,17,54,379]),
  giocabile("ervin-johnson", "Ervin Johnson", 69, "C/PF", [66,965,55,103,0,1,55,102,17,28,61,171,232,24,27,43,30,127]),
  giocabile("michael-olowokandi", "Michael Olowokandi", 72, "C", [43,925,121,285,0,0,121,285,36,61,78,167,245,24,16,68,54,278]),
  giocabile("wally-szczerbiak", "Wally Szczerbiak", 78, "SF/SG", [28,622,106,236,20,46,86,190,53,64,24,64,88,33,12,1,28,285]),
  giocabile("oliver-miller", "Oliver Miller", 70, "C/PF", [48,506,53,100,0,1,53,99,15,23,46,84,130,36,19,26,33,121]),
  giocabile("troy-hudson", "Troy Hudson", 79, "PG/SG", [29,503,80,207,31,77,49,130,27,33,4,31,35,70,7,0,34,218]),
  filler("keith-mcleod", "Keith McLeod", [33,391,27,82,1,10,26,72,33,43,5,29,34,59,16,1,29,88]),
  giocabile("darrick-martin", "Darrick Martin", 70, "PG/SG", [16,172,20,67,6,26,14,41,9,9,2,5,7,23,2,1,7,55]),
  // Split MIN-only (2TM in totals): stagione divisa MIN/NJN, tenuta la sola quota Minnesota Timberwolves.
  filler("anthony-goldwire", "Anthony Goldwire", [5,66,5,14,2,6,3,8,1,1,1,5,6,10,3,0,2,13]),
  filler("quincy-lewis", "Quincy Lewis", [14,65,7,20,2,5,5,15,0,0,1,6,7,2,2,2,3,16]),
  giocabile("ndudi-ebi", "Ndudi Ebi", 69, "SG/SF", [17,32,6,14,0,0,6,14,1,4,2,1,3,3,0,4,3,13]),
);
for (let i = start36; i < cards.length; i++) Object.assign(cards[i], MIN0304);

// ============================== San Antonio Spurs 2004-05 ==============================
const start37 = cards.length;
const SAS0405 = { season: "2004-05", team: "San Antonio Spurs", team_abbr: "SAS" };
cards.push(
  giocabile("tony-parker", "Tony Parker", 89, "PG", [80,2735,539,1118,43,156,496,962,210,323,47,251,298,491,98,4,215,1331]),
  giocabile("bruce-bowen", "Bruce Bowen", 83, "SF/SG", [82,2627,251,598,102,253,149,345,71,112,50,235,285,126,55,39,57,675]),
  giocabile("tim-duncan", "Tim Duncan", 98, "PF/C", [66,2203,517,1042,3,9,514,1033,305,455,202,530,732,179,45,174,127,1342]),
  giocabile("manu-ginobili", "Manu Ginobili", 86, "SG/SF", [74,2193,367,780,97,258,270,522,355,442,75,254,329,288,119,27,172,1186]),
  giocabile("rasho-nesterovic", "Rasho Nesterovic", 75, "C", [70,1785,198,430,0,0,198,430,14,30,184,275,459,71,31,117,73,410]),
  giocabile("brent-barry", "Brent Barry", 77, "SF/SG", [81,1742,194,459,100,280,94,179,113,135,29,161,190,178,39,20,64,601]),
  giocabile("robert-horry", "Robert Horry", 77, "PF/SF", [75,1396,157,375,51,138,106,237,86,109,91,177,268,80,67,60,69,451]),
  giocabile("devin-brown", "Devin Brown", 72, "SG", [67,1238,173,409,45,121,128,288,103,130,37,139,176,92,39,12,53,494]),
  giocabile("beno-udrih", "Beno Udrih", 73, "PG", [80,1149,173,390,58,142,115,248,67,89,16,67,83,150,41,10,77,471]),
  // Split SAS-only (2TM in totals): stagione divisa SAS/NYK, tenuta la sola quota San Antonio Spurs.
  filler("malik-rose", "Malik Rose", [50,862,124,267,0,4,124,263,69,99,95,132,227,41,31,9,56,317]),
  giocabile("tony-massenburg", "Tony Massenburg", 67, "PF/C", [61,699,74,182,0,0,74,182,48,63,54,109,163,14,18,20,40,196]),
  // Split SAS-only (2TM in totals): stagione divisa NYK/SAS, tenuta la sola quota San Antonio Spurs.
  giocabile("nazr-mohammed", "Nazr Mohammed", 77, "C", [23,414,55,142,0,0,55,142,32,56,78,69,147,8,5,33,27,142]),
  giocabile("mike-wilks", "Mike Wilks", 70, "PG/SG", [48,278,32,77,5,16,27,61,12,16,4,21,25,33,14,1,14,81]),
  filler("sean-marks", "Sean Marks", [23,244,27,80,0,3,27,77,22,28,18,38,56,8,3,11,14,76]),
  giocabile("glenn-robinson", "Glenn Robinson", 76, "SF/PF", [9,157,34,77,2,6,32,71,20,23,4,20,24,8,4,3,7,90]),
  filler("dion-glover", "Dion Glover", [7,68,8,22,1,8,7,14,8,10,3,8,11,4,3,3,2,25]),
  giocabile("linton-johnson", "Linton Johnson", 70, "SF/PF", [2,15,0,2,0,1,0,1,0,0,0,3,3,0,1,0,1,0]),
);
for (let i = start37; i < cards.length; i++) Object.assign(cards[i], SAS0405);

// ============================== Phoenix Suns 2004-05 ==============================
const start38 = cards.length;
const PHX0405 = { season: "2004-05", team: "Phoenix Suns", team_abbr: "PHX" };
cards.push(
  giocabile("joe-johnson", "Joe Johnson", 80, "SF/SG", [82,3240,544,1179,177,370,367,809,135,180,120,302,422,291,79,24,148,1400]),
  giocabile("shawn-marion", "Shawn Marion", 86, "PF/SF", [81,3146,613,1289,114,341,499,948,229,275,235,680,915,154,163,119,125,1569]),
  giocabile("amare-stoudemire", "Amar’e Stoudemire", 88, "C/PF", [80,2889,747,1336,3,16,744,1320,583,795,219,494,713,131,77,130,189,2080]),
  giocabile("quentin-richardson", "Quentin Richardson", 77, "SG/SF", [79,2839,407,1045,226,631,181,414,136,184,91,388,479,158,96,27,102,1176]),
  giocabile("steve-nash", "Steve Nash", 95, "PG", [75,2573,430,857,94,218,336,639,211,238,57,192,249,861,74,6,245,1165]),
  giocabile("leandro-barbosa", "Leandro Barbosa", 74, "PG/SG", [63,1087,168,354,51,139,117,215,55,69,32,98,130,126,30,7,87,442]),
  giocabile("steven-hunter", "Steven Hunter", 73, "C/PF", [76,1046,135,220,0,1,135,219,78,163,98,129,227,13,4,102,44,348]),
  // Split PHO-only (2TM in totals): stagione divisa HOU/PHO, tenuta la sola quota Phoenix Suns.
  giocabile("jim-jackson", "Jim Jackson", 70, "SG", [40,997,130,299,68,148,62,151,24,25,23,131,154,97,12,4,59,352]),
  // Split PHO-only (2TM in totals): stagione divisa PHO/NOH, tenuta la sola quota Phoenix Suns.
  filler("casey-jacobsen", "Casey Jacobsen", [40,768,65,157,34,89,31,68,48,62,17,50,67,37,11,1,27,212]),
  giocabile("jake-voskuhl", "Jake Voskuhl", 73, "C/PF", [38,360,27,59,0,0,27,59,26,38,30,62,92,17,4,11,20,80]),
  // Split PHO-only (2TM in totals): stagione divisa BOS/PHO, tenuta la sola quota Phoenix Suns.
  giocabile("walter-mccarty", "Walter McCarty", 69, "PF/C", [28,353,33,85,25,65,8,20,7,14,8,53,61,11,10,6,19,98]),
  giocabile("bo-outlaw", "Bo Outlaw", 70, "PF/SF", [39,214,12,34,0,0,12,34,5,9,16,37,53,13,6,12,8,29]),
  // Split PHO-only (2TM in totals): stagione divisa PHO/NOH, tenuta la sola quota Phoenix Suns.
  filler("maciej-lampe", "Maciej Lampe", [16,119,17,49,2,3,15,46,8,12,9,23,32,1,1,2,10,44]),
  // Split PHO-only (2TM in totals): stagione divisa PHO/NOH, tenuta la sola quota Phoenix Suns.
  filler("jackson-vroman", "Jackson Vroman", [10,57,6,16,0,0,6,16,4,7,5,8,13,7,3,2,7,16]),
  // Split PHO-only (2TM in totals): stagione divisa DET/PHO, tenuta la sola quota Phoenix Suns.
  filler("smush-parker", "Smush Parker", [5,34,7,15,1,4,6,11,0,0,2,1,3,4,2,0,9,15]),
  filler("paul-shirley", "Paul Shirley", [9,30,5,11,0,0,5,11,2,4,1,1,2,3,0,0,1,12]),
  filler("yuta-tabuse", "Yuta Tabuse", [4,17,1,6,1,1,0,5,4,4,2,2,4,3,0,0,1,7]),
  // Split PHO-only (2TM in totals): stagione divisa PHO/GSW, tenuta la sola quota Phoenix Suns.
  filler("zarko-cabarkapa", "Žarko Čabarkapa", [3,11,4,7,0,0,4,7,1,1,2,1,3,0,0,0,0,9]),
);
for (let i = start38; i < cards.length; i++) Object.assign(cards[i], PHX0405);

// ============================== Memphis Grizzlies 2005-06 ==============================
const start39 = cards.length;
const MEM0506 = { season: "2005-06", team: "Memphis Grizzlies", team_abbr: "MEM" };
cards.push(
  giocabile("pau-gasol", "Pau Gasol", 91, "C/PF", [80,3135,600,1194,3,12,597,1182,425,617,191,522,713,371,46,153,235,1628]),
  giocabile("shane-battier", "Shane Battier", 82, "SF/PF", [81,2839,303,621,65,165,238,456,147,208,164,265,429,136,92,114,90,818]),
  giocabile("eddie-jones", "Eddie Jones", 79, "SG/SF", [75,2437,292,722,133,374,159,348,168,215,35,244,279,177,131,27,93,885]),
  giocabile("mike-miller", "Mike Miller", 80, "SG/SF", [74,2268,354,760,138,339,216,421,168,210,42,355,397,200,52,27,140,1014]),
  giocabile("bobby-jackson", "Bobby Jackson", 74, "PG", [71,1775,286,748,129,332,157,416,107,146,44,179,223,195,61,1,101,808]),
  giocabile("lorenzen-wright", "Lorenzen Wright", 75, "C", [78,1689,194,406,0,2,194,404,66,117,142,253,395,48,52,46,67,454]),
  // Split MEM-only (2TM in totals): stagione divisa WAS/MEM, tenuta la sola quota Memphis Grizzlies.
  giocabile("chucky-atkins", "Chucky Atkins", 75, "PG/SG", [43,1161,160,399,64,182,96,217,107,132,11,64,75,129,29,2,57,491]),
  giocabile("dahntay-jones", "Dahntay Jones", 72, "SF/SG", [71,967,109,263,3,21,106,242,60,93,20,84,104,39,38,15,50,281]),
  giocabile("damon-stoudamire", "Damon Stoudamire", 76, "PG", [27,862,114,287,36,104,78,183,53,62,23,72,95,128,19,1,55,317]),
  giocabile("jake-tsakalidis", "Jake Tsakalidis", 71, "C", [51,732,100,165,0,0,100,165,57,87,78,134,212,13,14,32,39,257]),
  giocabile("hakim-warrick", "Hakim Warrick", 74, "PF/C", [68,724,101,228,0,0,101,228,76,115,43,101,144,30,14,21,56,278]),
  giocabile("antonio-burks", "Antonio Burks", 70, "PG", [57,570,51,144,1,6,50,138,10,23,4,33,37,76,20,0,36,113]),
  giocabile("brian-cardinal", "Brian Cardinal", 71, "PF/C", [36,402,46,111,13,29,33,82,19,27,11,44,55,33,23,0,27,124]),
  giocabile("lawrence-roberts", "Lawrence Roberts", 71, "PF/C", [33,181,20,44,0,2,20,42,11,23,26,23,49,5,8,2,5,51]),
  giocabile("anthony-roberson", "Anthony Roberson", 71, "PG/SG", [16,88,14,31,5,10,9,21,2,2,0,6,6,5,1,0,3,35]),
  // Split MEM-only (3TM in totals): stagione divisa MEM/ATL/NJN, tenuta la sola quota Memphis Grizzlies.
  filler("john-thomas", "John Thomas", [3,25,2,2,0,0,2,2,0,0,0,0,0,1,0,1,2,4]),
);
for (let i = start39; i < cards.length; i++) Object.assign(cards[i], MEM0506);

// ============================== Miami Heat 2005-06 ==============================
const start40 = cards.length;
const MIA0506 = { season: "2005-06", team: "Miami Heat", team_abbr: "MIA" };
cards.push(
  giocabile("dwyane-wade", "Dwyane Wade", 95, "SG/PG", [75,2892,699,1413,13,76,686,1337,629,803,107,323,430,503,146,58,268,2040]),
  giocabile("udonis-haslem", "Udonis Haslem", 76, "PF/C", [81,2491,300,591,0,2,300,589,157,199,167,467,634,95,50,17,80,757]),
  giocabile("gary-payton", "Gary Payton", 77, "PG/SG", [81,2305,230,547,66,230,164,317,100,126,34,199,233,257,71,10,102,626]),
  giocabile("antoine-walker", "Antoine Walker", 80, "SF/PF", [82,2199,391,898,137,383,254,515,81,129,103,318,421,166,47,30,150,1000]),
  giocabile("james-posey", "James Posey", 75, "SF/PF", [67,1914,159,395,117,290,42,105,48,61,33,286,319,89,54,20,58,483]),
  giocabile("jason-williams", "Jason Williams", 78, "PG", [59,1874,268,606,107,288,161,318,85,98,6,133,139,287,53,5,100,728]),
  giocabile("shaquille-oneal", "Shaquille O’Neal", 89, "C", [59,1806,480,800,0,0,480,800,221,471,172,369,541,113,23,104,168,1181]),
  giocabile("alonzo-mourning", "Alonzo Mourning", 75, "C/PF", [65,1302,188,315,0,1,188,314,133,224,125,234,359,11,13,173,79,509]),
  giocabile("jason-kapono", "Jason Kapono", 73, "PF/SF", [51,665,79,177,21,53,58,124,28,33,12,59,71,37,7,3,20,207]),
  giocabile("shandon-anderson", "Shandon Anderson", 71, "SG", [48,638,54,126,5,19,49,107,13,18,18,63,81,30,17,6,24,126]),
  // Split MIA-only (2TM in totals): stagione divisa HOU/MIA, tenuta la sola quota Miami Heat.
  giocabile("derek-anderson", "Derek Anderson", 67, "SG/PG", [23,465,40,130,21,67,19,63,32,38,9,51,60,48,8,2,17,133]),
  giocabile("wayne-simien", "Wayne Simien", 72, "PF/C", [43,414,58,120,0,0,58,120,30,34,38,50,88,7,13,1,24,146]),
  giocabile("michael-doleac", "Michael Doleac", 71, "C", [31,371,37,88,0,0,37,88,24,30,23,62,85,8,10,7,14,98]),
  filler("gerald-fitch", "Gerald Fitch", [18,239,30,89,7,26,23,63,17,23,7,23,30,33,7,5,15,84]),
  giocabile("dorell-wright", "Dorell Wright", 68, "SF", [20,132,20,43,3,6,17,37,15,17,2,30,32,8,3,1,14,58]),
  giocabile("earl-barron", "Earl Barron", 70, "C", [8,45,5,16,0,0,5,16,3,4,2,8,10,0,0,0,5,13]),
  filler("matt-walsh", "Matt Walsh", [2,3,1,1,0,0,1,1,0,2,0,0,0,0,0,0,1,2]),
);
for (let i = start40; i < cards.length; i++) Object.assign(cards[i], MIA0506);

// ============================== Cleveland Cavaliers 2006-07 ==============================
const start41 = cards.length;
const CLE0607 = { season: "2006-07", team: "Cleveland Cavaliers", team_abbr: "CLE" };
cards.push(
  giocabile("lebron-james", "LeBron James", 96, "SF", [78,3190,772,1621,99,310,673,1311,489,701,83,443,526,470,125,55,250,2132]),
  giocabile("larry-hughes", "Larry Hughes", 80, "SG/PG", [70,2596,381,953,74,222,307,731,209,309,41,226,267,256,89,26,154,1045]),
  giocabile("drew-gooden", "Drew Gooden", 76, "PF/C", [80,2238,371,784,1,6,370,778,142,199,263,418,681,88,70,28,115,885]),
  giocabile("zydrunas-ilgauskas", "Zydrunas Ilgauskas", 81, "C", [78,2130,385,793,0,1,385,792,155,192,242,357,599,123,48,98,141,925]),
  giocabile("anderson-varejao", "Anderson Varejao", 76, "C/PF", [81,1932,191,401,0,9,191,392,165,268,191,354,545,75,76,52,67,547]),
  giocabile("eric-snow", "Eric Snow", 73, "PG", [82,1929,135,324,0,4,135,320,72,113,35,153,188,330,55,16,111,342]),
  giocabile("sasha-pavlovic", "Sasha Pavlovic", 74, "SG/SF", [67,1534,222,490,60,148,162,342,100,126,23,135,158,105,55,17,102,604]),
  giocabile("donyell-marshall", "Donyell Marshall", 77, "PF/SF", [81,1360,209,493,95,271,114,222,53,80,86,237,323,46,39,43,67,566]),
  giocabile("damon-jones", "Damon Jones", 74, "PG/SG", [60,1173,137,355,89,231,48,124,30,44,9,57,66,94,16,2,36,393]),
  giocabile("daniel-gibson", "Daniel Gibson", 74, "PG/SG", [60,988,98,231,52,124,46,107,28,39,28,64,92,69,23,8,44,276]),
  giocabile("david-wesley", "David Wesley", 70, "SG", [35,352,22,75,9,38,13,37,20,28,3,32,35,37,12,4,17,73]),
  giocabile("shannon-brown", "Shannon Brown", 66, "SG", [23,202,28,74,7,25,21,49,10,14,6,15,21,10,7,3,14,73]),
  giocabile("ira-newble", "Ira Newble", 72, "SF/SG", [15,129,16,37,8,15,8,22,6,10,13,17,30,2,6,0,3,46]),
  giocabile("scot-pollard", "Scot Pollard", 73, "C", [24,109,11,26,0,0,11,26,2,4,15,16,31,3,4,1,4,24]),
  filler("dwayne-jones", "Dwayne Jones", [4,18,0,1,0,0,0,1,3,6,1,5,6,0,0,0,2,3]),
);
for (let i = start41; i < cards.length; i++) Object.assign(cards[i], CLE0607);

// ============================== Golden State Warriors 2006-07 ==============================
const start42 = cards.length;
const GSW0607 = { season: "2006-07", team: "Golden State Warriors", team_abbr: "GSW" };
cards.push(
  // Esclusi per assenza di totali Basketball-Reference sufficienti: Žarko Čabarkapa.
  giocabile("monta-ellis", "Monta Ellis", 81, "SG/PG", [77,2638,480,1010,39,143,441,867,273,358,62,181,243,319,132,21,221,1272]),
  filler("andris-biedrins", "Andris Biedriņš", [82,2382,348,581,0,0,348,581,87,167,251,511,762,88,67,136,119,783]),
  giocabile("baron-davis", "Baron Davis", 88, "PG", [63,2221,452,1030,85,280,367,750,275,369,51,225,276,509,135,29,193,1264]),
  giocabile("mickael-pietrus", "Mickael Pietrus", 77, "SF/SG", [72,1937,286,586,93,240,193,346,136,210,81,246,327,62,48,55,105,801]),
  giocabile("matt-barnes", "Matt Barnes", 76, "SF/PF", [76,1813,275,628,106,290,169,338,90,123,91,259,350,156,73,41,105,746]),
  giocabile("jason-richardson", "Jason Richardson", 81, "SG/SF", [51,1675,306,734,110,301,196,433,92,140,71,188,259,172,54,32,82,814]),
  // Split GSW-only (2TM in totals): stagione divisa IND/GSW, tenuta la sola quota Golden State Warriors.
  giocabile("al-harrington", "Al Harrington", 83, "PF/C", [42,1355,272,596,73,175,199,421,96,141,80,190,270,98,40,14,78,713]),
  // Split GSW-only (2TM in totals): stagione divisa IND/GSW, tenuta la sola quota Golden State Warriors.
  giocabile("stephen-jackson", "Stephen Jackson", 80, "SF/PF", [38,1293,229,514,59,173,170,341,123,153,44,83,127,173,51,14,102,640]),
  // Split GSW-only (2TM in totals): stagione divisa GSW/IND, tenuta la sola quota Golden State Warriors.
  filler("mike-dunleavy", "Mike Dunleavy", [39,1051,166,370,36,104,130,266,78,101,40,147,187,117,38,12,71,446]),
  giocabile("kelenna-azubuike", "Kelenna Azubuike", 73, "SG/SF", [41,669,98,220,34,79,64,141,61,78,26,68,94,28,22,10,39,291]),
  // Split GSW-only (2TM in totals): stagione divisa GSW/IND, tenuta la sola quota Golden State Warriors.
  filler("troy-murphy", "Troy Murphy", [26,667,81,180,22,59,59,121,47,66,37,120,157,60,21,17,29,231]),
  giocabile("adonal-foyle", "Adonal Foyle", 77, "C", [48,475,48,85,0,0,48,85,11,25,51,75,126,19,11,50,23,107]),
  // Split GSW-only (2TM in totals): stagione divisa GSW/IND, tenuta la sola quota Golden State Warriors.
  filler("keith-mcleod", "Keith McLeod", [26,379,41,105,9,23,32,82,47,53,3,18,21,45,17,3,23,138]),
  // Split GSW-only (2TM in totals): stagione divisa IND/GSW, tenuta la sola quota Golden State Warriors.
  filler("sarunas-jasikevicius", "Šarūnas Jasikevičius", [26,309,37,101,12,44,25,57,27,31,5,16,21,61,13,1,31,113]),
  // Split GSW-only (2TM in totals): stagione divisa IND/GSW, tenuta la sola quota Golden State Warriors.
  giocabile("josh-powell", "Josh Powell", 70, "PF/C", [30,289,41,78,0,0,41,78,22,30,17,52,69,18,5,12,24,104]),
  filler("anthony-roberson", "Anthony Roberson", [20,227,44,104,21,55,23,49,2,3,2,19,21,10,12,0,13,111]),
  // Split GSW-only (2TM in totals): stagione divisa GSW/IND, tenuta la sola quota Golden State Warriors.
  filler("ike-diogu", "Ike Diogu", [17,222,44,83,0,0,44,83,35,44,21,42,63,5,3,11,18,123]),
  giocabile("patrick-obryant", "Patrick O’Bryant", 69, "C", [16,119,10,32,0,0,10,32,11,17,7,14,21,9,6,8,8,31]),
  filler("renaldo-major", "Renaldo Major", [1,27,2,10,0,0,2,10,1,2,0,2,2,0,2,0,1,5]),
  filler("dajuan-wagner", "Dajuan Wagner", [1,7,1,1,1,1,0,0,1,2,0,0,0,1,0,0,1,4]),
);
for (let i = start42; i < cards.length; i++) Object.assign(cards[i], GSW0607);

// ============================== Washington Wizards 2006-07 ==============================
const start43 = cards.length;
const WAS0607 = { season: "2006-07", team: "Washington Wizards", team_abbr: "WAS" };
cards.push(
  giocabile("gilbert-arenas", "Gilbert Arenas", 91, "PG/SG", [74,2942,647,1548,205,584,442,964,606,718,61,277,338,443,139,13,236,2105]),
  giocabile("antawn-jamison", "Antawn Jamison", 86, "PF/C", [70,2662,512,1139,138,379,374,760,226,307,134,428,562,136,80,36,104,1388]),
  giocabile("caron-butler", "Caron Butler", 86, "SF", [63,2474,451,975,18,72,433,903,283,328,147,320,467,233,134,17,181,1203]),
  giocabile("deshawn-stevenson", "DeShawn Stevenson", 74, "SG/SF", [82,2419,347,753,74,183,273,570,152,216,55,161,216,218,65,19,119,920]),
  giocabile("antonio-daniels", "Antonio Daniels", 78, "SG/PG", [80,1761,172,389,19,63,153,326,208,250,18,133,151,290,39,9,69,571]),
  giocabile("brendan-haywood", "Brendan Haywood", 78, "C", [77,1740,198,355,0,0,198,355,115,210,195,282,477,47,34,88,90,511]),
  giocabile("jarvis-hayes", "Jarvis Hayes", 71, "SF/PF", [81,1626,224,546,66,183,158,363,71,84,42,168,210,80,48,13,56,585]),
  giocabile("etan-thomas", "Etan Thomas", 77, "C", [65,1246,159,277,0,0,159,277,77,138,136,241,377,29,22,89,71,395]),
  giocabile("darius-songaila", "Darius Songaila", 76, "PF/SF", [37,700,118,225,0,2,118,223,46,54,44,90,134,38,17,10,43,282]),
  giocabile("andray-blatche", "Andray Blatche", 75, "PF/SF", [56,682,86,197,4,27,82,170,30,49,77,114,191,39,17,32,49,206]),
  giocabile("roger-mason", "Roger Mason", 70, "SG", [62,492,59,179,33,102,26,77,14,16,7,38,45,35,13,6,19,165]),
  giocabile("calvin-booth", "Calvin Booth", 72, "C", [44,380,31,66,1,2,30,64,6,10,27,54,81,18,4,29,9,69]),
  filler("donell-taylor", "Donell Taylor", [47,369,56,140,3,17,53,123,11,21,14,39,53,45,17,3,25,126]),
  giocabile("michael-ruffin", "Michael Ruffin", 71, "PF/C", [30,271,5,18,0,0,5,18,7,19,35,27,62,6,6,8,12,17]),
  filler("james-lang", "James Lang", [11,55,4,9,0,0,4,9,3,5,5,6,11,2,0,3,2,11]),
  filler("mike-hall", "Mike Hall", [2,13,1,4,0,0,1,4,0,0,1,1,2,1,0,0,0,2]),
);
for (let i = start43; i < cards.length; i++) Object.assign(cards[i], WAS0607);

// ============================== Boston Celtics 2007-08 ==============================
const start44 = cards.length;
const BOS0708 = { season: "2007-08", team: "Boston Celtics", team_abbr: "BOS" };
cards.push(
  giocabile("paul-pierce", "Paul Pierce", 92, "SF/PF", [80,2874,509,1098,143,365,366,733,409,485,53,358,411,363,101,36,221,1570]),
  giocabile("ray-allen", "Ray Allen", 88, "SG/SF", [73,2624,439,986,180,452,259,534,215,237,75,193,268,225,65,16,127,1273]),
  giocabile("kevin-garnett", "Kevin Garnett", 93, "PF/C", [71,2328,534,990,0,11,534,979,269,336,135,520,655,244,100,89,138,1337]),
  giocabile("rajon-rondo", "Rajon Rondo", 85, "PG", [77,2306,351,713,5,19,346,694,107,175,78,244,322,393,129,13,147,814]),
  giocabile("kendrick-perkins", "Kendrick Perkins", 76, "C", [78,1912,214,348,0,1,214,347,114,183,145,329,474,84,31,114,125,542]),
  giocabile("james-posey", "James Posey", 76, "SF/PF", [74,1821,173,414,106,279,67,135,93,115,30,292,322,114,72,19,65,545]),
  giocabile("eddie-house", "Eddie House", 74, "PG/SG", [78,1480,217,531,117,298,100,233,33,36,19,148,167,152,59,10,76,584]),
  giocabile("tony-allen", "Tony Allen", 75, "SG", [75,1373,169,389,18,57,151,332,138,181,34,134,168,114,62,21,109,494]),
  giocabile("glen-davis", "Glen Davis", 75, "PF/C", [69,940,107,221,0,0,107,221,99,150,95,113,208,28,31,20,65,313]),
  giocabile("leon-powe", "Leon Powe", 75, "C/PF", [56,809,154,269,0,1,154,268,137,193,95,132,227,15,15,16,43,445]),
  giocabile("brian-scalabrine", "Brian Scalabrine", 74, "PF/SF", [48,512,29,94,15,46,14,48,15,20,22,57,79,40,9,8,26,88]),
  // Split BOS-only (2TM in totals): stagione divisa LAC/BOS, tenuta la sola quota Boston Celtics.
  giocabile("sam-cassell", "Sam Cassell", 75, "PG/SG", [17,299,50,130,9,22,41,108,21,25,5,26,31,35,9,3,19,130]),
  giocabile("pj-brown", "P.J. Brown", 75, "C", [18,209,14,41,0,1,14,40,11,16,29,39,68,10,5,8,10,39]),
  giocabile("scot-pollard", "Scot Pollard", 71, "C", [22,173,12,23,0,0,12,23,15,22,14,23,37,3,3,6,5,39]),
  giocabile("gabe-pruitt", "Gabe Pruitt", 70, "PG/SG", [15,95,14,39,3,12,11,27,1,2,1,7,8,13,5,0,5,32]),
);
for (let i = start44; i < cards.length; i++) Object.assign(cards[i], BOS0708);

// ============================== Denver Nuggets 2007-08 ==============================
const start45 = cards.length;
const DEN0708 = { season: "2007-08", team: "Denver Nuggets", team_abbr: "DEN" };
cards.push(
  giocabile("allen-iverson", "Allen Iverson", 88, "SG/PG", [82,3424,712,1556,95,275,617,1281,645,797,47,196,243,586,160,12,245,2164]),
  giocabile("carmelo-anthony", "Carmelo Anthony", 93, "SF/PF", [77,2806,728,1481,58,164,670,1317,464,590,178,393,571,259,98,39,253,1978]),
  giocabile("marcus-camby", "Marcus Camby", 87, "C", [79,2758,286,635,6,20,280,615,143,202,230,807,1037,259,85,285,118,721]),
  giocabile("kenyon-martin", "Kenyon Martin", 79, "PF/C", [71,2159,376,699,2,11,374,688,123,212,105,356,461,90,88,85,91,877]),
  giocabile("anthony-carter", "Anthony Carter", 75, "PG", [70,1960,218,476,45,129,173,347,64,85,27,173,200,388,107,28,124,545]),
  filler("linas-kleiza", "Linas Kleiza", [79,1889,311,659,94,277,217,382,164,213,92,241,333,95,44,19,89,880]),
  giocabile("eduardo-najera", "Eduardo Najera", 73, "PF/SF", [78,1664,174,368,53,147,121,221,63,89,113,224,337,95,69,40,59,464]),
  giocabile("jr-smith", "J.R. Smith", 80, "SG/SF", [74,1421,311,674,157,390,154,284,128,178,43,109,152,128,62,12,112,907]),
  giocabile("yakhouba-diawara", "Yakhouba Diawara", 70, "SG/SF", [54,542,55,134,21,66,34,68,22,31,23,39,62,37,8,3,16,153]),
  giocabile("chucky-atkins", "Chucky Atkins", 74, "PG/SG", [24,352,42,122,25,79,17,43,4,9,3,28,31,47,9,1,10,113]),
  giocabile("nene", "Nene", 77, "C/PF", [16,266,29,71,0,1,29,70,27,49,30,57,87,15,9,14,21,85]),
  // Split DEN-only (5TM in totals): stagione divisa DEN/MEM/HOU/MIA/SAS, tenuta la sola quota Denver Nuggets.
  giocabile("bobby-jones", "Bobby Jones", 70, "SF/SG", [25,222,26,64,9,23,17,41,23,28,11,27,38,11,5,1,14,84]),
  // Split DEN-only (3TM in totals): stagione divisa DEN/WAS/SEA, tenuta la sola quota Denver Nuggets.
  filler("mike-wilks", "Mike Wilks", [8,122,10,23,2,5,8,18,2,2,4,8,12,6,5,0,5,24]),
  giocabile("steven-hunter", "Steven Hunter", 74, "C/PF", [19,120,15,28,0,0,15,28,9,20,10,19,29,0,0,6,7,39]),
  // Split DEN-only (2TM in totals): stagione divisa DEN/POR, tenuta la sola quota Denver Nuggets.
  filler("von-wafer", "Von Wafer", [21,90,10,38,1,15,9,23,6,8,1,9,10,5,2,1,11,27]),
  filler("jelani-mccoy", "Jelani McCoy", [6,33,1,1,0,0,1,1,1,2,1,6,7,0,0,5,4,3]),
  // Split DEN-only (2TM in totals): stagione divisa POR/DEN, tenuta la sola quota Denver Nuggets.
  filler("taurean-green", "Taurean Green", [9,30,3,9,1,3,2,6,3,4,0,6,6,3,1,0,2,10]),
);
for (let i = start45; i < cards.length; i++) Object.assign(cards[i], DEN0708);

// ============================== Houston Rockets 2007-08 ==============================
const start46 = cards.length;
const HOU0708 = { season: "2007-08", team: "Houston Rockets", team_abbr: "HOU" };
cards.push(
  giocabile("shane-battier", "Shane Battier", 79, "SF/PF", [80,2907,265,619,139,369,126,250,75,101,131,276,407,155,77,90,78,744]),
  giocabile("rafer-alston", "Rafer Alston", 79, "PG/SG", [74,2526,364,924,143,407,221,517,98,137,28,232,260,392,98,18,160,969]),
  giocabile("tracy-mcgrady", "Tracy McGrady", 92, "SG/SF", [66,2440,548,1307,86,295,462,1012,245,358,42,297,339,387,68,30,160,1427]),
  giocabile("yao-ming", "Yao Ming", 88, "C", [55,2044,432,852,0,2,432,850,345,406,172,422,594,129,25,111,183,1209]),
  giocabile("luis-scola", "Luis Scola", 76, "PF/C", [82,2024,345,670,0,3,345,667,157,235,174,351,525,106,60,19,105,847]),
  giocabile("chuck-hayes", "Chuck Hayes", 72, "PF/C", [79,1575,113,221,0,3,113,218,11,24,132,295,427,91,85,43,62,237]),
  giocabile("luther-head", "Luther Head", 73, "PG/SG", [73,1379,206,477,79,225,127,252,66,81,18,117,135,138,44,9,70,557]),
  // Split HOU-only (2TM in totals): stagione divisa HOU/NOH, tenuta la sola quota Houston Rockets.
  filler("bonzi-wells", "Bonzi Wells", [51,1124,175,412,8,38,167,374,111,174,63,197,260,80,51,24,76,469]),
  giocabile("carl-landry", "Carl Landry", 77, "PF", [42,711,135,219,0,1,135,218,72,109,96,111,207,21,17,7,26,342]),
  giocabile("dikembe-mutombo", "Dikembe Mutombo", 75, "C", [39,619,43,80,0,0,43,80,32,45,68,131,199,5,11,48,17,118]),
  giocabile("aaron-brooks", "Aaron Brooks", 75, "PG", [51,608,93,225,36,109,57,116,42,49,13,43,56,87,13,5,44,264]),
  // Split HOU-only (2TM in totals): stagione divisa HOU/NOH, tenuta la sola quota Houston Rockets.
  filler("mike-james", "Mike James", [33,537,79,226,24,74,55,152,33,42,11,41,52,54,17,2,29,215]),
  // Split HOU-only (2TM in totals): stagione divisa NOH/HOU, tenuta la sola quota Houston Rockets.
  giocabile("bobby-jackson", "Bobby Jackson", 74, "PG", [26,498,88,210,28,82,60,128,24,32,10,61,71,63,13,2,28,228]),
  giocabile("steve-novak", "Steve Novak", 71, "SF", [35,264,49,102,34,71,15,31,3,4,4,31,35,6,2,3,4,135]),
  giocabile("steve-francis", "Steve Francis", 73, "PG/SG", [10,199,19,57,4,17,15,40,13,23,8,15,23,30,9,5,14,55]),
  giocabile("mike-harris", "Mike Harris", 70, "PF/SF", [17,159,27,54,0,2,27,52,8,13,24,30,54,3,6,3,9,62]),
  // Split HOU-only (2TM in totals): stagione divisa HOU/MIN, tenuta la sola quota Houston Rockets.
  filler("kirk-snyder", "Kirk Snyder", [9,81,13,28,2,9,11,19,6,11,5,7,12,8,1,1,4,34]),
  giocabile("loren-woods", "Loren Woods", 72, "C", [7,17,3,5,0,0,3,5,0,0,0,1,1,2,0,0,0,6]),
  // Split HOU-only (5TM in totals): stagione divisa DEN/MEM/HOU/MIA/SAS, tenuta la sola quota Houston Rockets.
  filler("bobby-jones", "Bobby Jones", [4,9,2,4,0,0,2,4,0,0,0,1,1,0,1,0,1,4]),
  // Split HOU-only (2TM in totals): stagione divisa SAC/HOU, tenuta la sola quota Houston Rockets.
  filler("justin-williams", "Justin Williams", [1,6,1,3,0,0,1,3,1,4,1,0,1,0,0,0,1,3]),
  // Split HOU-only (2TM in totals): stagione divisa MIN/HOU, tenuta la sola quota Houston Rockets.
  filler("gerald-green", "Gerald Green", [1,4,3,3,0,0,3,3,0,0,2,0,2,0,0,0,0,6]),
);
for (let i = start46; i < cards.length; i++) Object.assign(cards[i], HOU0708);

// ============================== Portland Trail Blazers 2009-10 ==============================
const start47 = cards.length;
const POR0910 = { season: "2009-10", team: "Portland Trail Blazers", team_abbr: "POR" };
cards.push(
  // Jeff Ayres è lo stesso giocatore indicato da 2K anche come Jeff Pendegraph/Pendergraph.
  giocabile("lamarcus-aldridge", "LaMarcus Aldridge", 85, "PF/C", [78,2922,579,1169,5,16,574,1153,230,304,192,435,627,160,67,48,104,1393]),
  giocabile("andre-miller", "Andre Miller", 82, "PG", [82,2500,404,908,16,80,388,828,322,392,81,185,266,445,93,9,173,1146]),
  giocabile("brandon-roy", "Brandon Roy", 89, "SG/SF", [65,2419,491,1038,73,221,418,817,343,440,73,212,285,305,61,16,129,1398]),
  filler("martell-webster", "Martell Webster", [82,2005,259,639,124,332,135,307,126,155,47,221,268,62,45,40,60,768]),
  giocabile("juwan-howard", "Juwan Howard", 75, "PF/C", [73,1632,191,375,0,1,191,374,55,70,108,227,335,61,27,10,72,437]),
  giocabile("rudy-fernandez", "Rudy Fernandez", 75, "SG/SF", [62,1441,160,423,98,266,62,157,85,98,35,129,164,127,62,11,72,503]),
  // Split POR-only (2TM in totals): stagione divisa POR/LAC, tenuta la sola quota Portland Trail Blazers.
  filler("steve-blake", "Steve Blake", [51,1397,143,355,78,207,65,148,24,32,15,103,118,203,37,2,65,388]),
  filler("jerryd-bayless", "Jerryd Bayless", [74,1304,200,483,29,92,171,391,201,242,18,102,120,172,26,5,94,630]),
  giocabile("nicolas-batum", "Nicolas Batum", 83, "SF/SG", [37,918,139,268,54,132,85,136,43,51,32,109,141,44,24,25,27,375]),
  // Split POR-only (2TM in totals): stagione divisa LAC/POR, tenuta la sola quota Portland Trail Blazers.
  giocabile("marcus-camby", "Marcus Camby", 80, "C", [23,718,72,145,0,1,72,144,18,31,83,172,255,35,26,47,27,162]),
  giocabile("dante-cunningham", "Dante Cunningham", 73, "PF/C", [63,707,106,214,0,2,106,212,31,48,54,106,160,14,24,22,15,243]),
  giocabile("joel-przybilla", "Joel Przybilla", 72, "C", [30,681,45,86,0,0,45,86,33,51,72,166,238,8,8,43,39,123]),
  giocabile("greg-oden", "Greg Oden", 83, "C", [21,502,92,152,0,0,92,152,49,64,64,114,178,19,8,48,39,233]),
  giocabile("jeff-pendergraph", "Jeff Pendergraph", 71, "C/PF", [39,405,43,65,0,0,43,65,18,20,25,73,98,1,7,16,12,104]),
  // Split POR-only (2TM in totals): stagione divisa POR/LAC, tenuta la sola quota Portland Trail Blazers.
  filler("travis-outlaw", "Travis Outlaw", [11,231,38,101,12,31,26,70,21,24,13,25,38,8,7,8,12,109]),
  giocabile("patty-mills", "Patty Mills", 75, "PG", [10,38,10,24,2,4,8,20,4,7,1,1,2,5,0,0,4,26]),
  // Split POR-only (2TM in totals): stagione divisa IND/POR, tenuta la sola quota Portland Trail Blazers.
  giocabile("travis-diener", "Travis Diener", 72, "PG/SG", [5,26,1,4,0,2,1,2,1,2,0,1,1,4,1,0,0,3]),
  // Split POR-only (2TM in totals): stagione divisa MIA/POR, tenuta la sola quota Portland Trail Blazers.
  filler("shavlik-randolph", "Shavlik Randolph", [3,6,1,3,0,0,1,3,2,2,0,1,1,1,0,0,1,4]),
  // Split POR-only (2TM in totals): stagione divisa POR/GSW, tenuta la sola quota Portland Trail Blazers.
  filler("anthony-tolliver", "Anthony Tolliver", [2,4,0,1,0,1,0,0,0,0,0,1,1,0,0,0,0,0]),
);
for (let i = start47; i < cards.length; i++) Object.assign(cards[i], POR0910);

// ============================== Chicago Bulls 2010-11 ==============================
const start48 = cards.length;
const CHI1011 = { season: "2010-11", team: "Chicago Bulls", team_abbr: "CHI" };
cards.push(
  // Esclusi per assenza di totali Basketball-Reference sufficienti: Jannero Pargo.
  giocabile("luol-deng", "Luol Deng", 83, "SF/PF", [82,3208,531,1155,115,333,416,822,253,336,116,360,476,230,78,48,156,1430]),
  giocabile("derrick-rose", "Derrick Rose", 94, "PG", [81,3026,711,1597,128,385,583,1212,476,555,81,249,330,623,85,51,278,2026]),
  giocabile("carlos-boozer", "Carlos Boozer", 85, "PF", [59,1882,431,845,0,0,431,845,171,244,130,435,565,145,45,18,149,1033]),
  giocabile("ronnie-brewer", "Ronnie Brewer", 77, "SF/SG", [81,1781,205,427,6,27,199,400,87,133,55,207,262,140,106,22,55,503]),
  giocabile("taj-gibson", "Taj Gibson", 78, "PF/SF", [80,1742,234,502,1,8,233,494,100,148,162,296,458,58,39,106,71,569]),
  giocabile("kyle-korver", "Kyle Korver", 76, "SG/SF", [82,1649,242,557,120,289,122,268,77,87,12,138,150,124,35,20,60,681]),
  giocabile("joakim-noah", "Joakim Noah", 86, "C", [48,1576,211,402,0,1,211,401,139,188,182,316,498,107,48,72,90,561]),
  giocabile("keith-bogans", "Keith Bogans", 73, "SG/SF", [82,1461,124,307,90,237,34,70,21,32,19,129,148,101,38,9,41,359]),
  giocabile("kurt-thomas", "Kurt Thomas", 72, "PF/C", [52,1178,95,186,1,1,94,185,20,32,75,226,301,60,32,42,42,211]),
  giocabile("cj-watson", "C.J. Watson", 75, "PG", [82,1091,146,394,44,112,102,282,69,93,16,78,94,186,55,11,73,405]),
  giocabile("omer-asik", "Omer Asik", 73, "C", [82,989,78,141,0,0,78,141,73,145,112,194,306,32,20,56,64,229]),
  // Split CHI-only (2TM in totals): stagione divisa CHI/TOR, tenuta la sola quota Chicago Bulls.
  filler("james-johnson", "James Johnson", [13,123,17,41,2,9,15,32,6,13,6,18,24,14,8,9,18,42]),
  giocabile("brian-scalabrine", "Brian Scalabrine", 70, "PF/SF", [18,88,10,19,0,5,10,14,0,0,1,7,8,6,3,4,5,20]),
  // Split CHI-only (2TM in totals): stagione divisa LAC/CHI, tenuta la sola quota Chicago Bulls.
  giocabile("rasual-butler", "Rasual Butler", 72, "SG/SF", [6,26,6,11,4,7,2,4,0,0,0,1,1,0,0,0,2,16]),
  giocabile("john-lucas-iii", "John Lucas III", 70, "PG", [2,10,1,3,0,1,1,2,0,2,0,0,0,1,0,0,0,2]),
);
for (let i = start48; i < cards.length; i++) Object.assign(cards[i], CHI1011);

// ============================== Dallas Mavericks 2010-11 ==============================
const start49 = cards.length;
const DAL1011 = { season: "2010-11", team: "Dallas Mavericks", team_abbr: "DAL" };
cards.push(
  giocabile("jason-kidd", "Jason Kidd", 81, "PG/SG", [80,2653,215,596,133,391,82,205,67,77,35,316,351,655,134,29,179,630]),
  giocabile("jason-terry", "Jason Terry", 83, "SG/PG", [82,2564,492,1091,127,351,365,740,182,214,24,129,153,334,93,13,167,1293]),
  giocabile("dirk-nowitzki", "Dirk Nowitzki", 96, "PF/C", [73,2504,610,1179,66,168,544,1011,395,443,50,463,513,190,38,47,137,1681]),
  giocabile("shawn-marion", "Shawn Marion", 82, "SF/PF", [80,2253,434,834,5,33,429,801,126,164,168,383,551,110,68,50,130,999]),
  giocabile("tyson-chandler", "Tyson Chandler", 83, "C", [74,2059,266,407,0,0,266,407,216,295,206,486,692,32,36,80,88,748]),
  giocabile("jj-barea", "J.J. Barea", 77, "PG", [81,1669,285,649,66,189,219,460,133,157,29,130,159,317,30,1,136,769]),
  giocabile("brendan-haywood", "Brendan Haywood", 74, "C", [72,1331,128,223,0,1,128,222,64,177,129,247,376,19,16,74,51,320]),
  giocabile("deshawn-stevenson", "DeShawn Stevenson", 78, "SG/SF", [72,1158,128,330,94,249,34,81,33,43,20,86,106,77,21,5,44,383]),
  giocabile("caron-butler", "Caron Butler", 80, "SF", [29,867,170,378,28,65,142,313,68,88,22,96,118,46,28,8,49,436]),
  giocabile("brian-cardinal", "Brian Cardinal", 70, "PF", [56,618,43,100,42,87,1,13,17,18,10,49,59,40,24,7,17,145]),
  // Split DAL-only (3TM in totals): stagione divisa NOH/TOR/DAL, tenuta la sola quota Dallas Mavericks.
  giocabile("peja-stojakovic", "Peja Stojakovic", 75, "SF/SG", [25,506,79,184,42,105,37,79,15,16,14,52,66,22,11,2,11,215]),
  filler("rodrigue-beaubois", "Rodrigue Beaubois", [28,496,94,223,25,83,69,140,23,30,7,45,52,64,20,8,47,236]),
  giocabile("ian-mahinmi", "Ian Mahinmi", 72, "C", [56,488,55,98,0,2,55,96,63,82,43,77,120,8,14,15,25,173]),
  // Split DAL-only (3TM in totals): stagione divisa DAL/NOH/BOS, tenuta la sola quota Dallas Mavericks.
  filler("sasha-pavlovic", "Sasha Pavlović", [10,163,15,35,7,16,8,19,4,5,0,12,12,7,5,3,5,41]),
  // Split DAL-only (2TM in totals): stagione divisa MIN/DAL, tenuta la sola quota Dallas Mavericks.
  giocabile("corey-brewer", "Corey Brewer", 76, "SF/SG", [13,148,25,51,4,13,21,38,15,21,12,11,23,12,11,2,10,69]),
  giocabile("dominique-jones", "Dominique Jones", 72, "SG/SF", [18,135,14,45,0,4,14,41,14,17,6,19,25,19,5,3,10,42]),
  // Split DAL-only (2TM in totals): stagione divisa DAL/TOR, tenuta la sola quota Dallas Mavericks.
  filler("alexis-ajinca", "Alexis Ajinça", [10,75,12,32,3,7,9,25,2,3,5,12,17,2,3,5,1,29]),
  // Split DAL-only (2TM in totals): stagione divisa DAL/SAS, tenuta la sola quota Dallas Mavericks.
  filler("steve-novak", "Steve Novak", [7,18,4,8,3,4,1,4,0,0,0,5,5,0,0,0,0,11]),
);
for (let i = start49; i < cards.length; i++) Object.assign(cards[i], DAL1011);

// ============================== New York Knicks 2011-12 ==============================
const start50 = cards.length;
const NYK1112 = { season: "2011-12", team: "New York Knicks", team_abbr: "NYK" };
cards.push(
  giocabile("tyson-chandler", "Tyson Chandler", 84, "C", [62,2061,241,355,0,2,241,353,217,315,212,400,612,56,56,89,102,699]),
  giocabile("landry-fields", "Landry Fields", 75, "SF", [66,1894,236,513,31,121,205,392,77,137,59,219,278,169,79,17,102,580]),
  giocabile("carmelo-anthony", "Carmelo Anthony", 91, "SF/PF", [55,1876,441,1025,68,203,373,822,295,367,88,256,344,200,62,24,144,1245]),
  giocabile("iman-shumpert", "Iman Shumpert", 74, "SG/SF", [59,1705,214,534,48,157,166,377,87,109,42,144,186,164,101,8,111,563]),
  giocabile("amare-stoudemire", "Amar’e Stoudemire", 86, "PF/C", [47,1543,316,654,5,21,311,633,186,243,106,261,367,52,38,45,112,823]),
  giocabile("steve-novak", "Steve Novak", 75, "PF/SF", [54,1020,161,337,133,282,28,55,22,26,9,95,104,12,16,9,21,477]),
  giocabile("jr-smith", "J.R. Smith", 79, "SG/SF", [35,967,165,405,67,193,98,212,39,55,29,107,136,84,54,6,46,436]),
  giocabile("jeremy-lin", "Jeremy Lin", 84, "PG/SG", [35,940,171,383,24,75,147,308,146,183,18,89,107,216,55,9,126,512]),
  giocabile("jared-jeffries", "Jared Jeffries", 74, "PF/SF", [39,729,59,144,3,16,56,128,49,72,69,83,152,26,29,25,29,170]),
  filler("toney-douglas", "Toney Douglas", [38,656,94,290,27,117,67,173,22,26,16,56,72,77,29,1,56,237]),
  filler("henry-walker", "Henry Walker", [32,620,68,171,36,113,32,58,17,20,9,71,80,37,19,7,35,189]),
  giocabile("baron-davis", "Baron Davis", 73, "PG", [29,595,68,184,26,85,42,99,16,24,13,43,56,135,34,3,76,178]),
  giocabile("mike-bibby", "Mike Bibby", 72, "PG", [39,557,35,124,27,85,8,39,6,8,5,54,59,80,21,3,20,103]),
  filler("josh-harrellson", "Josh Harrellson", [37,540,63,149,20,59,43,90,16,26,47,97,144,11,23,20,20,162]),
  filler("renaldo-balkman", "Renaldo Balkman", [14,115,16,32,2,9,14,23,8,11,6,20,26,5,4,3,6,42]),
  giocabile("jerome-jordan", "Jerome Jordan", 72, "C", [21,108,17,33,0,0,17,33,8,10,14,13,27,4,1,6,2,42]),
  giocabile("dan-gadzuric", "Dan Gadzuric", 71, "C", [2,13,0,2,0,0,0,2,0,2,1,4,5,0,1,1,1,0]),
);
for (let i = start50; i < cards.length; i++) Object.assign(cards[i], NYK1112);

// ============================== Oklahoma City Thunder 2011-12 ==============================
const start51 = cards.length;
const OKC1112 = { season: "2011-12", team: "Oklahoma City Thunder", team_abbr: "OKC" };
cards.push(
  giocabile("kevin-durant", "Kevin Durant", 96, "SF/PF", [66,2546,643,1297,133,344,510,953,431,501,40,487,527,231,88,77,248,1850]),
  giocabile("russell-westbrook", "Russell Westbrook", 88, "PG", [66,2331,578,1266,62,196,516,1070,340,413,96,205,301,362,112,21,239,1558]),
  giocabile("james-harden", "James Harden", 87, "SG", [62,1946,309,629,114,292,195,337,312,369,30,222,252,229,62,15,137,1044]),
  giocabile("serge-ibaka", "Serge Ibaka", 87, "PF/C", [66,1792,262,490,1,3,261,487,78,118,193,305,498,28,33,241,79,603]),
  giocabile("kendrick-perkins", "Kendrick Perkins", 77, "C", [65,1744,128,262,0,0,128,262,73,112,120,306,426,78,25,73,118,329]),
  giocabile("nick-collison", "Nick Collison", 75, "PF", [63,1307,120,201,0,1,120,200,44,62,119,155,274,82,33,28,61,284]),
  giocabile("daequan-cook", "Daequan Cook", 73, "SG", [57,989,109,296,79,228,30,68,14,22,12,110,122,15,22,11,16,311]),
  giocabile("thabo-sefolosha", "Thabo Sefolosha", 76, "SF", [42,914,67,155,31,71,36,84,38,43,21,107,128,47,37,17,40,203]),
  giocabile("nazr-mohammed", "Nazr Mohammed", 71, "C", [63,692,79,169,0,1,79,168,13,23,59,111,170,14,20,37,26,171]),
  giocabile("reggie-jackson", "Reggie Jackson", 70, "PG", [45,501,51,159,13,62,38,97,25,29,14,39,53,71,25,1,36,140]),
  // Split OKC-only (2TM in totals): stagione divisa LAL/OKC, tenuta la sola quota Oklahoma City Thunder.
  giocabile("derek-fisher", "Derek Fisher", 72, "PG/SG", [20,407,37,108,11,35,26,73,13,14,2,27,29,28,11,1,15,98]),
  giocabile("royal-ivey", "Royal Ivey", 69, "SG/PG", [34,354,26,73,18,53,8,20,1,8,1,23,24,10,14,0,9,71]),
  giocabile("cole-aldrich", "Cole Aldrich", 71, "C", [26,173,22,42,0,0,22,42,13,14,13,35,48,3,8,16,9,57]),
  giocabile("lazar-hayward", "Lazar Hayward", 71, "SF/SG", [26,141,13,38,4,14,9,24,7,12,2,14,16,4,3,1,9,37]),
  giocabile("eric-maynor", "Eric Maynor", 69, "PG/SG", [9,137,14,39,6,17,8,22,4,4,3,10,13,22,5,0,11,38]),
  filler("ryan-reid", "Ryan Reid", [5,17,4,5,0,0,4,5,0,0,1,1,2,0,0,0,1,8]),
);
for (let i = start51; i < cards.length; i++) Object.assign(cards[i], OKC1112);

// ============================== Memphis Grizzlies 2012-13 ==============================
const start52 = cards.length;
const MEM1213 = { season: "2012-13", team: "Memphis Grizzlies", team_abbr: "MEM" };
cards.push(
  // Esclusi per assenza di totali Basketball-Reference sufficienti: Donte Greene, Willie Reed.
  giocabile("marc-gasol", "Marc Gasol", 88, "C", [80,2796,429,869,1,14,428,855,268,316,184,438,622,318,80,139,157,1127]),
  giocabile("mike-conley", "Mike Conley", 86, "PG", [80,2757,414,940,106,293,308,647,234,282,43,182,225,487,174,24,189,1168]),
  giocabile("zach-randolph", "Zach Randolph", 85, "PF/C", [76,2607,471,1024,2,23,469,1001,225,300,310,544,854,108,61,31,150,1169]),
  giocabile("tony-allen", "Tony Allen", 78, "SF/SG", [79,2109,284,638,3,24,281,614,134,187,121,242,363,98,119,44,94,705]),
  filler("jerryd-bayless", "Jerryd Bayless", [80,1765,260,621,71,201,189,420,102,122,22,154,176,264,59,17,120,693]),
  // Split MEM-only (2TM in totals): stagione divisa MEM/TOR, tenuta la sola quota Memphis Grizzlies.
  filler("rudy-gay", "Rudy Gay", [42,1541,281,688,40,129,241,559,121,156,56,193,249,108,56,31,104,723]),
  giocabile("quincy-pondexter", "Quincy Pondexter", 75, "SF/SG", [59,1243,128,299,60,152,68,147,59,75,43,89,132,61,35,6,42,375]),
  // Split MEM-only (2TM in totals): stagione divisa DET/MEM, tenuta la sola quota Memphis Grizzlies.
  filler("tayshaun-prince", "Tayshaun Prince", [37,1174,144,336,15,41,129,295,22,37,29,126,155,85,27,12,35,325]),
  giocabile("darrell-arthur", "Darrell Arthur", 75, "PF/SF", [59,970,162,359,5,18,157,341,33,46,68,101,169,33,24,33,43,362]),
  // Split MEM-only (2TM in totals): stagione divisa MEM/CLE, tenuta la sola quota Memphis Grizzlies.
  filler("wayne-ellington", "Wayne Ellington", [40,676,81,199,41,97,40,102,15,16,5,47,52,42,16,1,24,218]),
  // Split MEM-only (2TM in totals): stagione divisa MEM/CLE, tenuta la sola quota Memphis Grizzlies.
  filler("marreese-speights", "Marreese Speights", [40,579,106,247,2,5,104,242,48,67,76,113,189,18,10,27,35,262]),
  // Split MEM-only (2TM in totals): stagione divisa TOR/MEM, tenuta la sola quota Memphis Grizzlies.
  giocabile("ed-davis", "Ed Davis", 77, "C/PF", [36,544,74,143,0,0,74,143,37,65,57,103,160,8,13,47,18,185]),
  // Split MEM-only (2TM in totals): stagione divisa DET/MEM, tenuta la sola quota Memphis Grizzlies.
  giocabile("austin-daye", "Austin Daye", 70, "PF/C", [31,328,47,111,20,58,27,53,11,16,6,54,60,21,9,14,16,125]),
  giocabile("tony-wroten", "Tony Wroten", 70, "PG/SG", [35,272,33,86,4,16,29,70,21,29,13,15,28,43,8,4,29,91]),
  filler("chris-johnson", "Chris Johnson", [8,102,11,25,6,18,5,7,1,2,5,6,11,2,4,0,3,29]),
  // Split MEM-only (2TM in totals): stagione divisa CLE/MEM, tenuta la sola quota Memphis Grizzlies.
  giocabile("jon-leuer", "Jon Leuer", 72, "PF/C", [19,96,15,24,0,0,15,24,4,7,8,16,24,3,4,0,3,34]),
  // Split MEM-only (2TM in totals): stagione divisa MEM/PHO, tenuta la sola quota Memphis Grizzlies.
  filler("hamed-haddadi", "Hamed Haddadi", [13,87,7,21,0,0,7,21,1,2,10,14,24,4,1,6,4,15]),
  giocabile("keyon-dooling", "Keyon Dooling", 72, "PG/SG", [7,82,10,21,5,12,5,9,6,7,0,1,1,8,1,0,5,31]),
  filler("josh-selby", "Josh Selby", [10,59,6,22,1,6,5,16,7,11,0,5,5,4,2,0,7,20]),
  // Split MEM-only (2TM in totals): stagione divisa MIA/MEM, tenuta la sola quota Memphis Grizzlies.
  filler("dexter-pittman", "Dexter Pittman", [7,20,1,6,0,0,1,6,0,3,3,2,5,0,0,0,1,2]),
);
for (let i = start52; i < cards.length; i++) Object.assign(cards[i], MEM1213);

// ============================== Miami Heat 2012-13 ==============================
const start53 = cards.length;
const MIA1213 = { season: "2012-13", team: "Miami Heat", team_abbr: "MIA" };
cards.push(
  giocabile("lebron-james", "LeBron James", 99, "SF/PF", [76,2877,765,1354,103,254,662,1100,403,535,97,513,610,551,129,67,226,2036]),
  giocabile("chris-bosh", "Chris Bosh", 85, "C/PF", [74,2454,485,907,21,74,464,833,241,302,131,370,501,123,66,101,128,1232]),
  giocabile("dwyane-wade", "Dwyane Wade", 91, "SG", [69,2391,569,1093,17,66,552,1027,308,425,86,258,344,352,128,56,194,1463]),
  giocabile("mario-chalmers", "Mario Chalmers", 75, "PG", [77,2068,227,529,123,301,104,228,89,112,19,152,171,273,118,12,119,666]),
  giocabile("ray-allen", "Ray Allen", 77, "SG/SF", [79,2035,292,651,139,332,153,319,140,158,40,177,217,135,67,15,103,863]),
  giocabile("shane-battier", "Shane Battier", 76, "PF/SF", [72,1786,152,362,136,316,16,46,32,38,37,128,165,72,41,55,34,472]),
  filler("norris-cole", "Norris Cole", [80,1590,179,425,35,98,144,327,52,80,18,112,130,164,57,7,104,445]),
  giocabile("udonis-haslem", "Udonis Haslem", 72, "PF/C", [75,1414,129,251,0,0,129,251,32,45,97,307,404,38,30,15,45,290]),
  giocabile("mike-miller", "Mike Miller", 75, "SF/SG", [59,900,100,231,73,175,27,56,8,11,18,139,157,99,21,4,35,281]),
  giocabile("rashard-lewis", "Rashard Lewis", 73, "PF/SF", [55,792,103,249,51,131,52,118,28,45,19,102,121,30,21,14,33,285]),
  giocabile("chris-andersen", "Chris Andersen", 79, "C/PF", [42,624,71,123,2,3,69,120,63,93,57,115,172,17,16,44,24,207]),
  giocabile("joel-anthony", "Joel Anthony", 74, "C", [62,566,35,68,0,0,35,68,17,28,45,70,115,13,13,42,22,87]),
  giocabile("james-jones", "James Jones", 74, "SF/SG", [38,221,21,61,16,53,5,8,2,4,0,22,22,13,2,6,3,60]),
  giocabile("juwan-howard", "Juwan Howard", 72, "PF/C", [7,51,10,19,0,0,10,19,1,1,0,8,8,6,0,0,4,21]),
  // Split MIA-only (2TM in totals): stagione divisa BOS/MIA, tenuta la sola quota Miami Heat.
  filler("jarvis-varnado", "Jarvis Varnado", [8,40,1,3,0,0,1,3,0,0,1,5,6,2,0,2,5,2]),
  filler("josh-harrellson", "Josh Harrellson", [6,31,4,9,1,5,3,4,1,2,3,4,7,0,1,1,3,10]),
  // Split MIA-only (2TM in totals): stagione divisa MIA/NOH, tenuta la sola quota Miami Heat.
  filler("terrel-harris", "Terrel Harris", [7,29,2,8,0,1,2,7,6,8,4,5,9,2,0,0,4,10]),
  // Split MIA-only (2TM in totals): stagione divisa MIA/MEM, tenuta la sola quota Miami Heat.
  filler("dexter-pittman", "Dexter Pittman", [4,12,3,5,0,0,3,5,0,0,4,3,7,0,0,0,2,6]),
);
for (let i = start53; i < cards.length; i++) Object.assign(cards[i], MIA1213);

// ============================== Los Angeles Clippers 2013-14 ==============================
const start54 = cards.length;
const LAC1314 = { season: "2013-14", team: "Los Angeles Clippers", team_abbr: "LAC" };
cards.push(
  giocabile("deandre-jordan", "DeAndre Jordan", 87, "C", [82,2870,348,515,0,0,348,515,160,374,331,783,1114,74,80,203,123,856]),
  giocabile("blake-griffin", "Blake Griffin", 90, "PF/C", [80,2863,718,1359,12,44,706,1315,482,674,192,565,757,309,92,51,224,1930]),
  giocabile("chris-paul", "Chris Paul", 93, "PG", [62,2171,406,870,78,212,328,658,295,345,38,230,268,663,154,4,145,1185]),
  giocabile("jamal-crawford", "Jamal Crawford", 81, "SG/SF", [69,2094,421,1011,161,446,260,565,279,322,34,124,158,223,59,12,135,1282]),
  giocabile("darren-collison", "Darren Collison", 78, "PG", [80,2069,324,694,71,189,253,505,192,224,47,141,188,297,93,15,132,911]),
  giocabile("matt-barnes", "Matt Barnes", 76, "SF/PF", [63,1735,231,527,97,283,134,244,66,90,60,232,292,125,56,28,85,625]),
  giocabile("jared-dudley", "Jared Dudley", 76, "PF", [74,1729,196,447,81,225,115,222,38,58,36,124,160,104,41,10,56,511]),
  giocabile("jj-redick", "JJ Redick", 82, "SG", [35,987,181,398,73,185,108,213,97,106,9,65,74,78,28,3,42,532]),
  filler("willie-green", "Willie Green", [55,869,102,271,41,121,61,150,28,34,12,66,78,50,22,11,34,273]),
  giocabile("ryan-hollins", "Ryan Hollins", 75, "C", [61,482,53,72,0,0,53,72,35,56,31,59,90,8,9,31,29,141]),
  giocabile("reggie-bullock", "Reggie Bullock", 70, "SG/SF", [43,395,43,121,22,73,21,48,7,9,11,43,54,12,9,1,13,115]),
  giocabile("hedo-turkoglu", "Hedo Turkoglu", 75, "SF/PF", [38,392,42,109,22,50,20,59,9,18,11,78,89,33,19,10,16,115]),
  // Split LAC-only (2TM in totals): stagione divisa ORL/LAC, tenuta la sola quota Los Angeles Clippers.
  giocabile("glen-davis", "Glen Davis", 73, "PF/C", [23,308,39,81,0,1,39,80,18,23,21,48,69,7,12,7,17,96]),
  filler("antawn-jamison", "Antawn Jamison", [22,248,29,92,8,41,21,51,18,25,9,46,55,7,9,3,7,84]),
  // Split LAC-only (2TM in totals): stagione divisa IND/LAC, tenuta la sola quota Los Angeles Clippers.
  giocabile("danny-granger", "Danny Granger", 75, "SF/PF", [12,194,36,84,12,34,24,50,12,14,7,21,28,8,3,4,10,96]),
  // Split LAC-only (2TM in totals): stagione divisa LAC/PHI, tenuta la sola quota Los Angeles Clippers.
  filler("byron-mullens", "Byron Mullens", [27,167,26,64,13,39,13,25,2,6,7,25,32,6,6,3,13,67]),
  filler("stephen-jackson", "Stephen Jackson", [9,107,6,26,1,14,5,12,2,4,2,8,10,5,6,1,6,15]),
  // Split LAC-only (3TM in totals): stagione divisa PHI/LAC/MEM, tenuta la sola quota Los Angeles Clippers.
  filler("darius-morris", "Darius Morris", [10,54,4,13,0,7,4,6,1,2,0,5,5,5,2,0,2,9]),
  filler("sasha-vujacic", "Sasha Vujačić", [2,10,2,5,1,2,1,3,0,0,0,3,3,0,1,0,3,5]),
  filler("maalik-wayns", "Maalik Wayns", [2,9,1,2,0,0,1,2,0,0,0,2,2,2,2,0,0,2]),
);
for (let i = start54; i < cards.length; i++) Object.assign(cards[i], LAC1314);

// ============================== Indiana Pacers 2013-14 ==============================
const start55 = cards.length;
const IND1314 = { season: "2013-14", team: "Indiana Pacers", team_abbr: "IND" };
cards.push(
  giocabile("paul-george", "Paul George", 92, "SF/SG", [80,2898,577,1362,182,500,395,862,401,464,64,478,542,283,151,22,224,1737]),
  filler("lance-stephenson", "Lance Stephenson", [78,2752,427,870,86,244,341,626,140,197,95,463,558,359,54,7,210,1080]),
  giocabile("david-west", "David West", 81, "PF/SF", [80,2472,458,939,4,15,454,924,198,251,120,422,542,223,61,74,133,1118]),
  giocabile("george-hill", "George Hill", 79, "PG", [76,2434,272,616,95,260,177,356,142,176,53,230,283,265,75,23,92,781]),
  giocabile("roy-hibbert", "Roy Hibbert", 83, "C", [81,2409,331,754,2,5,329,749,207,269,202,336,538,91,29,182,148,871]),
  giocabile("luis-scola", "Luis Scola", 74, "PF/C", [82,1399,263,560,1,7,262,553,99,136,86,305,391,81,26,16,108,626]),
  giocabile("ian-mahinmi", "Ian Mahinmi", 70, "C", [77,1248,91,189,0,1,91,188,90,145,107,150,257,24,41,72,58,272]),
  giocabile("cj-watson", "C.J. Watson", 75, "PG", [63,1193,146,334,53,145,93,189,69,88,19,82,101,107,60,8,60,414]),
  // Split IND-only (2TM in totals): stagione divisa IND/LAC, tenuta la sola quota Indiana Pacers.
  filler("danny-granger", "Danny Granger", [29,653,80,223,31,94,49,129,51,53,24,81,105,33,9,13,36,242]),
  // Split IND-only (2TM in totals): stagione divisa PHI/IND, tenuta la sola quota Indiana Pacers.
  giocabile("evan-turner", "Evan Turner", 75, "SF/PG", [27,571,78,190,12,24,66,166,24,34,12,74,86,64,11,2,34,192]),
  giocabile("donald-sloan", "Donald Sloan", 72, "SG/SF", [48,392,44,117,10,42,34,75,12,20,4,40,44,50,10,1,22,110]),
  giocabile("rasual-butler", "Rasual Butler", 71, "SG/SF", [50,378,51,110,26,62,25,48,8,14,6,35,41,17,7,9,11,136]),
  // Split IND-only (2TM in totals): stagione divisa IND/SAC, tenuta la sola quota Indiana Pacers.
  filler("orlando-johnson", "Orlando Johnson", [38,342,33,96,8,41,25,55,17,22,7,44,51,16,6,1,14,91]),
  giocabile("chris-copeland", "Chris Copeland", 73, "SF/PF", [41,265,55,117,33,79,22,38,10,14,7,25,32,18,3,7,14,153]),
  giocabile("solomon-hill", "Solomon Hill", 73, "SF/SG", [28,226,17,40,7,23,10,17,6,7,9,32,41,12,5,2,13,47]),
  // Split IND-only (2TM in totals): stagione divisa PHI/IND, tenuta la sola quota Indiana Pacers.
  giocabile("lavoy-allen", "Lavoy Allen", 72, "PF/C", [14,112,17,34,0,0,17,34,6,10,13,21,34,6,2,6,4,40]),
  // Split IND-only (2TM in totals): stagione divisa CLE/IND, tenuta la sola quota Indiana Pacers.
  filler("andrew-bynum", "Andrew Bynum", [2,36,9,22,0,0,9,22,5,7,6,13,19,2,0,1,4,23]),
);
for (let i = start55; i < cards.length; i++) Object.assign(cards[i], IND1314);

// ============================== San Antonio Spurs 2013-14 ==============================
const start56 = cards.length;
const SAS1314 = { season: "2013-14", team: "San Antonio Spurs", team_abbr: "SAS" };
cards.push(
  giocabile("tim-duncan", "Tim Duncan", 92, "PF/C", [74,2158,444,906,0,5,444,901,231,316,158,563,721,220,43,139,159,1119]),
  filler("marco-belinelli", "Marco Belinelli", [80,2016,337,695,126,293,211,402,111,131,18,208,226,179,50,7,95,911]),
  giocabile("tony-parker", "Tony Parker", 85, "PG", [68,1997,456,914,25,67,431,847,197,243,17,138,155,388,36,9,151,1134]),
  giocabile("boris-diaw", "Boris Diaw", 76, "PF/C", [79,1974,302,580,45,112,257,468,68,92,74,252,326,222,44,32,121,717]),
  giocabile("kawhi-leonard", "Kawhi Leonard", 92, "SF/PF", [66,1923,337,645,69,182,268,463,101,126,76,336,412,133,114,50,80,844]),
  giocabile("danny-green", "Danny Green", 81, "SG/SF", [68,1651,218,505,132,318,86,187,50,63,25,204,229,104,65,61,76,618]),
  giocabile("manu-ginobili", "Manu Ginobili", 83, "SG/SF", [68,1550,294,627,90,258,204,369,160,188,30,172,202,293,70,17,139,838]),
  giocabile("patty-mills", "Patty Mills", 77, "PG", [81,1527,309,666,135,318,174,348,73,82,34,135,169,149,68,9,63,826]),
  giocabile("tiago-splitter", "Tiago Splitter", 78, "C", [59,1271,181,346,0,3,181,343,121,173,123,240,363,90,29,31,75,483]),
  giocabile("jeff-ayres", "Jeff Ayres", 71, "C/PF", [73,952,101,174,0,0,101,174,38,55,89,169,258,60,13,25,63,240]),
  giocabile("cory-joseph", "Cory Joseph", 76, "PG/SG", [68,936,126,265,12,38,114,227,79,96,32,75,107,114,35,14,43,343]),
  giocabile("matt-bonner", "Matt Bonner", 73, "PF/C", [61,690,73,164,42,98,31,66,9,12,16,114,130,31,15,11,16,197]),
  giocabile("aron-baynes", "Aron Baynes", 72, "C", [53,491,71,163,0,0,71,163,19,21,57,88,145,34,2,5,36,161]),
  // Split SAS-only (2TM in totals): stagione divisa SAS/TOR, tenuta la sola quota San Antonio Spurs.
  filler("nando-de-colo", "Nando De Colo", [26,301,42,93,10,31,32,62,18,22,6,39,45,32,15,3,21,112]),
  // Split SAS-only (2TM in totals): stagione divisa TOR/SAS, tenuta la sola quota San Antonio Spurs.
  giocabile("austin-daye", "Austin Daye", 72, "PF/C", [14,115,21,55,12,29,9,26,4,7,3,17,20,6,4,4,5,58]),
  // Split SAS-only (2TM in totals): stagione divisa SAS/NYK, tenuta la sola quota San Antonio Spurs.
  filler("shannon-brown", "Shannon Brown", [10,103,8,28,0,2,8,26,7,9,1,12,13,5,1,0,8,23]),
  filler("damion-james", "Damion James", [5,50,2,9,0,2,2,7,2,2,1,11,12,3,0,1,1,6]),
  // Split SAS-only (2TM in totals): stagione divisa SAS/MIN, tenuta la sola quota San Antonio Spurs.
  filler("othyus-jeffers", "Othyus Jeffers", [4,34,3,5,0,1,3,4,1,2,1,5,6,1,0,0,0,7]),
  // Split SAS-only (2TM in totals): stagione divisa SAS/UTA, tenuta la sola quota San Antonio Spurs.
  filler("malcolm-thomas", "Malcolm Thomas", [1,15,1,4,0,0,1,4,0,2,1,8,9,0,0,2,1,2]),
);
for (let i = start56; i < cards.length; i++) Object.assign(cards[i], SAS1314);

const out =
  "// GENERATO da data/build_legends.mjs - non modificare a mano\n" +
  `export const LEGEND_CARDS = ${JSON.stringify(cards)};\n`;
writeFileSync(new URL("legends.js", import.meta.url), out);
const nPlayable = cards.filter((c) => !c._filler).length;
const nFiller = cards.filter((c) => c._filler).length;
const nTeams = new Set(cards.map((c) => `${c.team_abbr}|${c.season}`)).size;
console.log(`data/legends.js scritto: ${cards.length} carte (${nPlayable} giocabili, ${nFiller} filler), ${nTeams} squadre.`);
