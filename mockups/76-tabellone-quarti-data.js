// Dati VERI dal motore (tools/dati-tabellone.mjs): box score e cronaca non sono
// inventati, sono quelli che game/partita.js produce davvero.
window.PARTITE = [
 {
  "seme": 3,
  "round": 1,
  "tuoNome": "Il tuo quintetto",
  "coach": "Joe Mazzulla",
  "tattica": "Tiro da tre o niente",
  "votoTuo": 90,
  "votoLoro": 76,
  "avv": "ATL 2019-20",
  "mio": [
   {
    "nome": "Kyle Lowry",
    "ruolo": "PG",
    "team": "TOR",
    "stagione": "2018-19",
    "voto": 85,
    "ovr2k": 85
   },
   {
    "nome": "Luke Kennard",
    "ruolo": "SG",
    "team": "DET",
    "stagione": "2019-20",
    "voto": 69,
    "ovr2k": 78
   },
   {
    "nome": "Kevin Durant",
    "ruolo": "SF",
    "team": "OKC",
    "stagione": "2015-16",
    "voto": 98,
    "ovr2k": 93
   },
   {
    "nome": "LeBron James",
    "ruolo": "PF",
    "team": "CLE",
    "stagione": "2016-17",
    "voto": 95,
    "ovr2k": 97
   },
   {
    "nome": "Anthony Davis",
    "ruolo": "C",
    "team": "NOP",
    "stagione": "2018-19",
    "voto": 96,
    "ovr2k": 94
   }
  ],
  "loro": [
   {
    "nome": "Trae Young",
    "ruolo": "PG",
    "team": "ATL",
    "stagione": "2019-20",
    "voto": 74,
    "ovr2k": 88
   },
   {
    "nome": "Jeff Teague",
    "ruolo": "PG",
    "team": "ATL",
    "stagione": "2019-20",
    "voto": 64,
    "ovr2k": 78
   },
   {
    "nome": "De'Andre Hunter",
    "ruolo": "SF",
    "team": "ATL",
    "stagione": "2019-20",
    "voto": 63,
    "ovr2k": 75
   },
   {
    "nome": "John Collins",
    "ruolo": "PF",
    "team": "ATL",
    "stagione": "2019-20",
    "voto": 90,
    "ovr2k": 85
   },
   {
    "nome": "Clint Capela",
    "ruolo": "C",
    "team": "ATL",
    "stagione": "2019-20",
    "voto": 89,
    "ovr2k": 82
   }
  ],
  "punti": {
   "casa": 111,
   "ospite": 107
  },
  "quarti": [
   {
    "n": 1,
    "casa": 28,
    "ospite": 29,
    "cumCasa": 28,
    "cumOspite": 29,
    "overtime": false,
    "possessi": {
     "casa": 25,
     "ospite": 24
    }
   },
   {
    "n": 2,
    "casa": 23,
    "ospite": 32,
    "cumCasa": 51,
    "cumOspite": 61,
    "overtime": false,
    "possessi": {
     "casa": 25,
     "ospite": 24
    }
   },
   {
    "n": 3,
    "casa": 28,
    "ospite": 22,
    "cumCasa": 79,
    "cumOspite": 83,
    "overtime": false,
    "possessi": {
     "casa": 25,
     "ospite": 24
    }
   },
   {
    "n": 4,
    "casa": 32,
    "ospite": 24,
    "cumCasa": 111,
    "cumOspite": 107,
    "overtime": false,
    "possessi": {
     "casa": 25,
     "ospite": 24
    }
   }
  ],
  "cronaca": [
   {
    "quarto": "1° quarto",
    "tipo": "equilibrio",
    "testo": "Primo quarto punto a punto, 28-29."
   },
   {
    "quarto": "2° quarto",
    "tipo": "allungo",
    "testo": "ATL piazza un 32-23 e prende il largo, all'intervallo è 51-61."
   },
   {
    "quarto": "3° quarto",
    "tipo": "rimonta",
    "testo": "La tua squadra rientra (28-22) e ora è partita, dopo tre quarti è 79-83."
   },
   {
    "quarto": "4° quarto",
    "tipo": "sorpasso",
    "testo": "Sorpasso La tua squadra con un parziale di 32-24, finisce 111-107: vince La tua squadra."
   }
  ],
  "vincitore": "casa",
  "possessi": {
   "casa": 100,
   "ospite": 98
  }
 },
 {
  "seme": 1,
  "round": 1,
  "tuoNome": "Il tuo quintetto",
  "coach": "Mike D'Antoni",
  "tattica": "Seven seconds or less",
  "votoTuo": 93,
  "votoLoro": 76,
  "avv": "ATL 2019-20",
  "mio": [
   {
    "nome": "James Harden",
    "ruolo": "PG",
    "team": "HOU",
    "stagione": "2016-17",
    "voto": 97,
    "ovr2k": 95
   },
   {
    "nome": "Kyle Korver",
    "ruolo": "SG",
    "team": "ATL",
    "stagione": "2014-15",
    "voto": 81,
    "ovr2k": 79
   },
   {
    "nome": "Kevin Durant",
    "ruolo": "SF",
    "team": "GSW",
    "stagione": "2018-19",
    "voto": 93,
    "ovr2k": 96
   },
   {
    "nome": "DeMarcus Cousins",
    "ruolo": "PF",
    "team": "NOP",
    "stagione": "2016-17",
    "voto": 97,
    "ovr2k": 92
   },
   {
    "nome": "Nikola Jokic",
    "ruolo": "C",
    "team": "DEN",
    "stagione": "2018-19",
    "voto": 97,
    "ovr2k": 90
   }
  ],
  "loro": [
   {
    "nome": "Trae Young",
    "ruolo": "PG",
    "team": "ATL",
    "stagione": "2019-20",
    "voto": 74,
    "ovr2k": 88
   },
   {
    "nome": "Jeff Teague",
    "ruolo": "PG",
    "team": "ATL",
    "stagione": "2019-20",
    "voto": 64,
    "ovr2k": 78
   },
   {
    "nome": "De'Andre Hunter",
    "ruolo": "SF",
    "team": "ATL",
    "stagione": "2019-20",
    "voto": 63,
    "ovr2k": 75
   },
   {
    "nome": "John Collins",
    "ruolo": "PF",
    "team": "ATL",
    "stagione": "2019-20",
    "voto": 90,
    "ovr2k": 85
   },
   {
    "nome": "Clint Capela",
    "ruolo": "C",
    "team": "ATL",
    "stagione": "2019-20",
    "voto": 89,
    "ovr2k": 82
   }
  ],
  "punti": {
   "casa": 119,
   "ospite": 89
  },
  "quarti": [
   {
    "n": 1,
    "casa": 28,
    "ospite": 18,
    "cumCasa": 28,
    "cumOspite": 18,
    "overtime": false,
    "possessi": {
     "casa": 25,
     "ospite": 24
    }
   },
   {
    "n": 2,
    "casa": 28,
    "ospite": 21,
    "cumCasa": 56,
    "cumOspite": 39,
    "overtime": false,
    "possessi": {
     "casa": 25,
     "ospite": 24
    }
   },
   {
    "n": 3,
    "casa": 31,
    "ospite": 24,
    "cumCasa": 87,
    "cumOspite": 63,
    "overtime": false,
    "possessi": {
     "casa": 25,
     "ospite": 24
    }
   },
   {
    "n": 4,
    "casa": 32,
    "ospite": 26,
    "cumCasa": 119,
    "cumOspite": 89,
    "overtime": false,
    "possessi": {
     "casa": 25,
     "ospite": 24
    }
   }
  ],
  "cronaca": [
   {
    "quarto": "1° quarto",
    "tipo": "allungo",
    "testo": "La tua squadra parte forte e chiude il primo quarto avanti 28-18."
   },
   {
    "quarto": "2° quarto",
    "tipo": "fuga",
    "testo": "La tua squadra tiene il controllo, all'intervallo è 56-39."
   },
   {
    "quarto": "3° quarto",
    "tipo": "fuga",
    "testo": "La tua squadra tiene il controllo, dopo tre quarti è 87-63."
   },
   {
    "quarto": "4° quarto",
    "tipo": "fuga",
    "testo": "La tua squadra non è mai stata in discussione, finisce 119-89: vince La tua squadra."
   }
  ],
  "vincitore": "casa",
  "possessi": {
   "casa": 101,
   "ospite": 97
  }
 },
 {
  "seme": 1,
  "round": 2,
  "tuoNome": "Il tuo quintetto",
  "coach": "Mike D'Antoni",
  "tattica": "Seven seconds or less",
  "votoTuo": 93,
  "votoLoro": 77,
  "avv": "DET 2018-19",
  "mio": [
   {
    "nome": "James Harden",
    "ruolo": "PG",
    "team": "HOU",
    "stagione": "2016-17",
    "voto": 97,
    "ovr2k": 95
   },
   {
    "nome": "Kyle Korver",
    "ruolo": "SG",
    "team": "ATL",
    "stagione": "2014-15",
    "voto": 81,
    "ovr2k": 79
   },
   {
    "nome": "Kevin Durant",
    "ruolo": "SF",
    "team": "GSW",
    "stagione": "2018-19",
    "voto": 93,
    "ovr2k": 96
   },
   {
    "nome": "DeMarcus Cousins",
    "ruolo": "PF",
    "team": "NOP",
    "stagione": "2016-17",
    "voto": 97,
    "ovr2k": 92
   },
   {
    "nome": "Nikola Jokic",
    "ruolo": "C",
    "team": "DEN",
    "stagione": "2018-19",
    "voto": 97,
    "ovr2k": 90
   }
  ],
  "loro": [
   {
    "nome": "Reggie Jackson",
    "ruolo": "PG",
    "team": "DET",
    "stagione": "2018-19",
    "voto": 69,
    "ovr2k": 80
   },
   {
    "nome": "Wayne Ellington",
    "ruolo": "SG",
    "team": "DET",
    "stagione": "2018-19",
    "voto": 69,
    "ovr2k": 75
   },
   {
    "nome": "Luke Kennard",
    "ruolo": "SF",
    "team": "DET",
    "stagione": "2018-19",
    "voto": 71,
    "ovr2k": 75
   },
   {
    "nome": "Blake Griffin",
    "ruolo": "PF",
    "team": "DET",
    "stagione": "2018-19",
    "voto": 85,
    "ovr2k": 88
   },
   {
    "nome": "Andre Drummond",
    "ruolo": "C",
    "team": "DET",
    "stagione": "2018-19",
    "voto": 90,
    "ovr2k": 86
   }
  ],
  "punti": {
   "casa": 108,
   "ospite": 110
  },
  "quarti": [
   {
    "n": 1,
    "casa": 32,
    "ospite": 28,
    "cumCasa": 32,
    "cumOspite": 28,
    "overtime": false,
    "possessi": {
     "casa": 25,
     "ospite": 24
    }
   },
   {
    "n": 2,
    "casa": 27,
    "ospite": 26,
    "cumCasa": 59,
    "cumOspite": 54,
    "overtime": false,
    "possessi": {
     "casa": 25,
     "ospite": 24
    }
   },
   {
    "n": 3,
    "casa": 24,
    "ospite": 29,
    "cumCasa": 83,
    "cumOspite": 83,
    "overtime": false,
    "possessi": {
     "casa": 25,
     "ospite": 24
    }
   },
   {
    "n": 4,
    "casa": 25,
    "ospite": 27,
    "cumCasa": 108,
    "cumOspite": 110,
    "overtime": false,
    "possessi": {
     "casa": 25,
     "ospite": 24
    }
   }
  ],
  "cronaca": [
   {
    "quarto": "1° quarto",
    "tipo": "normale",
    "testo": "La tua squadra avanti dopo il primo quarto, 32-28."
   },
   {
    "quarto": "2° quarto",
    "tipo": "normale",
    "testo": "La tua squadra controlla il periodo (27-26), all'intervallo è 59-54."
   },
   {
    "quarto": "3° quarto",
    "tipo": "parita",
    "testo": "DET rimette la partita in parità, dopo tre quarti è 83-83."
   },
   {
    "quarto": "4° quarto",
    "tipo": "equilibrio",
    "testo": "Si decide nel finale, finisce 108-110: vince DET."
   }
  ],
  "vincitore": "ospite",
  "possessi": {
   "casa": 102,
   "ospite": 96
  }
 }
];
