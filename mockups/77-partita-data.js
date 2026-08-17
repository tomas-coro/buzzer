// dati veri dal motore - generati da tools/dati-tabellone.mjs, non a mano.
// Box score, cronaca, medie e OVR sono quelli che il motore produce davvero.
window.PARTITE = [
 {
  "seme": 3,
  "round": 1,
  "coach": "Joe Mazzulla",
  "tattica": "Tiro da tre o niente",
  "ovrTuo": 90,
  "att": 94,
  "dif": 90,
  "ovrLoro": 76,
  "loroAttDif": {
   "att": 78,
   "dif": 73
  },
  "avv": "ATL 2019-20",
  "avvSigla": "ATL",
  "mio": [
   {
    "nome": "Kyle Lowry",
    "ruolo": "PG",
    "team": "TOR",
    "stagione": "2018-19",
    "ovr": 85,
    "ovr2k": 85,
    "att": 89,
    "dif": 89,
    "reparti": {
     "t3": 80,
     "fin": 43,
     "dif": 71,
     "reb": 35,
     "reg": 98
    }
   },
   {
    "nome": "Luke Kennard",
    "ruolo": "SG",
    "team": "DET",
    "stagione": "2019-20",
    "ovr": 69,
    "ovr2k": 78,
    "att": 88,
    "dif": 60,
    "reparti": {
     "t3": 91,
     "fin": 47,
     "dif": 6,
     "reb": 19,
     "reg": 76
    }
   },
   {
    "nome": "Kevin Durant",
    "ruolo": "SF",
    "team": "OKC",
    "stagione": "2015-16",
    "ovr": 98,
    "ovr2k": 93,
    "att": 99,
    "dif": 99,
    "reparti": {
     "t3": 94,
     "fin": 98,
     "dif": 93,
     "reb": 76,
     "reg": 73
    }
   },
   {
    "nome": "LeBron James",
    "ruolo": "PF",
    "team": "CLE",
    "stagione": "2016-17",
    "ovr": 95,
    "ovr2k": 97,
    "att": 96,
    "dif": 96,
    "reparti": {
     "t3": 56,
     "fin": 98,
     "dif": 84,
     "reb": 74,
     "reg": 95
    }
   },
   {
    "nome": "Anthony Davis",
    "ruolo": "C",
    "team": "NOP",
    "stagione": "2018-19",
    "ovr": 96,
    "ovr2k": 94,
    "att": 86,
    "dif": 99,
    "reparti": {
     "t3": 21,
     "fin": 96,
     "dif": 99,
     "reb": 96,
     "reg": 70
    }
   }
  ],
  "loro": [
   {
    "nome": "Trae Young",
    "ruolo": "PG",
    "team": "ATL",
    "stagione": "2019-20",
    "ovr": 74,
    "ovr2k": 88,
    "att": 99,
    "dif": 60,
    "reparti": {
     "t3": 81,
     "fin": 96,
     "dif": 5,
     "reb": 14,
     "reg": 96
    }
   },
   {
    "nome": "Jeff Teague",
    "ruolo": "PG",
    "team": "ATL",
    "stagione": "2019-20",
    "ovr": 64,
    "ovr2k": 78,
    "att": 75,
    "dif": 60,
    "reparti": {
     "t3": 20,
     "fin": 23,
     "dif": 9,
     "reb": 8,
     "reg": 93
    }
   },
   {
    "nome": "De'Andre Hunter",
    "ruolo": "SF",
    "team": "ATL",
    "stagione": "2019-20",
    "ovr": 63,
    "ovr2k": 75,
    "att": 65,
    "dif": 60,
    "reparti": {
     "t3": 55,
     "fin": 11,
     "dif": 6,
     "reb": 33,
     "reg": 15
    }
   },
   {
    "nome": "John Collins",
    "ruolo": "PF",
    "team": "ATL",
    "stagione": "2019-20",
    "ovr": 90,
    "ovr2k": 85,
    "att": 79,
    "dif": 96,
    "reparti": {
     "t3": 37,
     "fin": 97,
     "dif": 85,
     "reb": 91,
     "reg": 6
    }
   },
   {
    "nome": "Clint Capela",
    "ruolo": "C",
    "team": "ATL",
    "stagione": "2019-20",
    "ovr": 89,
    "ovr2k": 82,
    "att": 69,
    "dif": 99,
    "reparti": {
     "t3": 1,
     "fin": 78,
     "dif": 93,
     "reb": 97,
     "reg": 4
    }
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
    "testo": "Dinamo Sofà rientra (28-22) e ora è partita, dopo tre quarti è 79-83."
   },
   {
    "quarto": "4° quarto",
    "tipo": "sorpasso",
    "testo": "Dinamo Sofà sorpassa con un 32-24."
   }
  ],
  "vincitore": "casa",
  "possessi": {
   "casa": 100,
   "ospite": 98
  },
  "box": {
   "casa": [
    {
     "nome": "Kyle Lowry",
     "per": [
      {
       "pts": 3,
       "reb": 2,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 2,
       "reb": 0,
       "ast": 2,
       "stl": 1,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 6,
       "reb": 3,
       "ast": 2,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 2,
       "reb": 3,
       "ast": 2,
       "stl": 1,
       "tov": 1,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 13,
      "reb": 8,
      "ast": 7,
      "stl": 3,
      "tov": 2,
      "blk": 0
     }
    },
    {
     "nome": "Luke Kennard",
     "per": [
      {
       "pts": 4,
       "reb": 1,
       "ast": 2,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 3,
       "reb": 1,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 5,
       "reb": 1,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 7,
       "reb": 2,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 19,
      "reb": 5,
      "ast": 5,
      "stl": 0,
      "tov": 0,
      "blk": 0
     }
    },
    {
     "nome": "Kevin Durant",
     "per": [
      {
       "pts": 6,
       "reb": 2,
       "ast": 2,
       "stl": 1,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 6,
       "reb": 1,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 3,
       "reb": 4,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 11,
       "reb": 3,
       "ast": 1,
       "stl": 1,
       "tov": 0,
       "blk": 1
      }
     ],
     "tot": {
      "pts": 26,
      "reb": 10,
      "ast": 4,
      "stl": 2,
      "tov": 2,
      "blk": 2
     }
    },
    {
     "nome": "LeBron James",
     "per": [
      {
       "pts": 9,
       "reb": 3,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 6,
       "reb": 3,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 9,
       "reb": 2,
       "ast": 2,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 1,
       "reb": 3,
       "ast": 2,
       "stl": 0,
       "tov": 1,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 25,
      "reb": 11,
      "ast": 6,
      "stl": 2,
      "tov": 4,
      "blk": 0
     }
    },
    {
     "nome": "Anthony Davis",
     "per": [
      {
       "pts": 6,
       "reb": 3,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 6,
       "reb": 4,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 5,
       "reb": 1,
       "ast": 1,
       "stl": 1,
       "tov": 0,
       "blk": 1
      },
      {
       "pts": 11,
       "reb": 2,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 1
      }
     ],
     "tot": {
      "pts": 28,
      "reb": 10,
      "ast": 4,
      "stl": 2,
      "tov": 3,
      "blk": 4
     }
    }
   ],
   "ospite": [
    {
     "nome": "Trae Young",
     "per": [
      {
       "pts": 11,
       "reb": 2,
       "ast": 2,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 11,
       "reb": 2,
       "ast": 3,
       "stl": 1,
       "tov": 2,
       "blk": 0
      },
      {
       "pts": 6,
       "reb": 1,
       "ast": 3,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 12,
       "reb": 1,
       "ast": 3,
       "stl": 1,
       "tov": 1,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 40,
      "reb": 6,
      "ast": 11,
      "stl": 2,
      "tov": 5,
      "blk": 0
     }
    },
    {
     "nome": "Jeff Teague",
     "per": [
      {
       "pts": 3,
       "reb": 1,
       "ast": 4,
       "stl": 1,
       "tov": 2,
       "blk": 0
      },
      {
       "pts": 4,
       "reb": 2,
       "ast": 3,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 7,
       "reb": 1,
       "ast": 2,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 4,
       "reb": 1,
       "ast": 2,
       "stl": 0,
       "tov": 1,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 18,
      "reb": 5,
      "ast": 11,
      "stl": 1,
      "tov": 4,
      "blk": 0
     }
    },
    {
     "nome": "De'Andre Hunter",
     "per": [
      {
       "pts": 6,
       "reb": 1,
       "ast": 1,
       "stl": 1,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 5,
       "reb": 3,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 2,
       "reb": 1,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 3,
       "reb": 2,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 16,
      "reb": 7,
      "ast": 3,
      "stl": 2,
      "tov": 1,
      "blk": 0
     }
    },
    {
     "nome": "John Collins",
     "per": [
      {
       "pts": 7,
       "reb": 5,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 1
      },
      {
       "pts": 9,
       "reb": 6,
       "ast": 0,
       "stl": 0,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 4,
       "reb": 5,
       "ast": 0,
       "stl": 1,
       "tov": 0,
       "blk": 1
      },
      {
       "pts": 1,
       "reb": 2,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 1
      }
     ],
     "tot": {
      "pts": 21,
      "reb": 18,
      "ast": 0,
      "stl": 1,
      "tov": 1,
      "blk": 4
     }
    },
    {
     "nome": "Clint Capela",
     "per": [
      {
       "pts": 2,
       "reb": 3,
       "ast": 0,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 3,
       "reb": 0,
       "ast": 0,
       "stl": 1,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 3,
       "reb": 1,
       "ast": 0,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 4,
       "reb": 4,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 12,
      "reb": 8,
      "ast": 0,
      "stl": 1,
      "tov": 3,
      "blk": 1
     }
    }
   ]
  }
 },
 {
  "seme": 1,
  "round": 1,
  "coach": "Mike D'Antoni",
  "tattica": "Seven seconds or less",
  "ovrTuo": 93,
  "att": 95,
  "dif": 95,
  "ovrLoro": 76,
  "loroAttDif": {
   "att": 78,
   "dif": 73
  },
  "avv": "ATL 2019-20",
  "avvSigla": "ATL",
  "mio": [
   {
    "nome": "James Harden",
    "ruolo": "PG",
    "team": "HOU",
    "stagione": "2016-17",
    "ovr": 97,
    "ovr2k": 95,
    "att": 99,
    "dif": 97,
    "reparti": {
     "t3": 87,
     "fin": 98,
     "dif": 86,
     "reb": 72,
     "reg": 98
    }
   },
   {
    "nome": "Kyle Korver",
    "ruolo": "SG",
    "team": "ATL",
    "stagione": "2014-15",
    "ovr": 81,
    "ovr2k": 79,
    "att": 84,
    "dif": 84,
    "reparti": {
     "t3": 99,
     "fin": 30,
     "dif": 61,
     "reb": 32,
     "reg": 65
    }
   },
   {
    "nome": "Kevin Durant",
    "ruolo": "SF",
    "team": "GSW",
    "stagione": "2018-19",
    "ovr": 93,
    "ovr2k": 96,
    "att": 94,
    "dif": 96,
    "reparti": {
     "t3": 54,
     "fin": 98,
     "dif": 84,
     "reb": 63,
     "reg": 86
    }
   },
   {
    "nome": "DeMarcus Cousins",
    "ruolo": "PF",
    "team": "NOP",
    "stagione": "2016-17",
    "ovr": 97,
    "ovr2k": 92,
    "att": 92,
    "dif": 99,
    "reparti": {
     "t3": 68,
     "fin": 95,
     "dif": 95,
     "reb": 91,
     "reg": 63
    }
   },
   {
    "nome": "Nikola Jokic",
    "ruolo": "C",
    "team": "DEN",
    "stagione": "2018-19",
    "ovr": 97,
    "ovr2k": 90,
    "att": 91,
    "dif": 99,
    "reparti": {
     "t3": 30,
     "fin": 92,
     "dif": 93,
     "reb": 93,
     "reg": 96
    }
   }
  ],
  "loro": [
   {
    "nome": "Trae Young",
    "ruolo": "PG",
    "team": "ATL",
    "stagione": "2019-20",
    "ovr": 74,
    "ovr2k": 88,
    "att": 99,
    "dif": 60,
    "reparti": {
     "t3": 81,
     "fin": 96,
     "dif": 5,
     "reb": 14,
     "reg": 96
    }
   },
   {
    "nome": "Jeff Teague",
    "ruolo": "PG",
    "team": "ATL",
    "stagione": "2019-20",
    "ovr": 64,
    "ovr2k": 78,
    "att": 75,
    "dif": 60,
    "reparti": {
     "t3": 20,
     "fin": 23,
     "dif": 9,
     "reb": 8,
     "reg": 93
    }
   },
   {
    "nome": "De'Andre Hunter",
    "ruolo": "SF",
    "team": "ATL",
    "stagione": "2019-20",
    "ovr": 63,
    "ovr2k": 75,
    "att": 65,
    "dif": 60,
    "reparti": {
     "t3": 55,
     "fin": 11,
     "dif": 6,
     "reb": 33,
     "reg": 15
    }
   },
   {
    "nome": "John Collins",
    "ruolo": "PF",
    "team": "ATL",
    "stagione": "2019-20",
    "ovr": 90,
    "ovr2k": 85,
    "att": 79,
    "dif": 96,
    "reparti": {
     "t3": 37,
     "fin": 97,
     "dif": 85,
     "reb": 91,
     "reg": 6
    }
   },
   {
    "nome": "Clint Capela",
    "ruolo": "C",
    "team": "ATL",
    "stagione": "2019-20",
    "ovr": 89,
    "ovr2k": 82,
    "att": 69,
    "dif": 99,
    "reparti": {
     "t3": 1,
     "fin": 78,
     "dif": 93,
     "reb": 97,
     "reg": 4
    }
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
    "testo": "Dinamo Sofà parte forte e chiude il primo quarto avanti 28-18."
   },
   {
    "quarto": "2° quarto",
    "tipo": "fuga",
    "testo": "Dinamo Sofà tiene il controllo, all'intervallo è 56-39."
   },
   {
    "quarto": "3° quarto",
    "tipo": "fuga",
    "testo": "Dinamo Sofà tiene il controllo, dopo tre quarti è 87-63."
   },
   {
    "quarto": "4° quarto",
    "tipo": "fuga",
    "testo": "Dinamo Sofà non è mai stata in discussione."
   }
  ],
  "vincitore": "casa",
  "possessi": {
   "casa": 101,
   "ospite": 97
  },
  "box": {
   "casa": [
    {
     "nome": "James Harden",
     "per": [
      {
       "pts": 5,
       "reb": 2,
       "ast": 3,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 8,
       "reb": 1,
       "ast": 2,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 6,
       "reb": 3,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 7,
       "reb": 4,
       "ast": 2,
       "stl": 1,
       "tov": 1,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 26,
      "reb": 10,
      "ast": 8,
      "stl": 3,
      "tov": 4,
      "blk": 0
     }
    },
    {
     "nome": "Kyle Korver",
     "per": [
      {
       "pts": 3,
       "reb": 1,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 3,
       "reb": 1,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 3,
       "reb": 1,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 1
      },
      {
       "pts": 0,
       "reb": 2,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 1
      }
     ],
     "tot": {
      "pts": 9,
      "reb": 5,
      "ast": 0,
      "stl": 0,
      "tov": 0,
      "blk": 2
     }
    },
    {
     "nome": "Kevin Durant",
     "per": [
      {
       "pts": 7,
       "reb": 3,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 6,
       "reb": 2,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 7,
       "reb": 2,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 9,
       "reb": 1,
       "ast": 2,
       "stl": 0,
       "tov": 0,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 29,
      "reb": 8,
      "ast": 5,
      "stl": 1,
      "tov": 1,
      "blk": 0
     }
    },
    {
     "nome": "DeMarcus Cousins",
     "per": [
      {
       "pts": 6,
       "reb": 3,
       "ast": 2,
       "stl": 0,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 8,
       "reb": 2,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 9,
       "reb": 3,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 8,
       "reb": 3,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 1
      }
     ],
     "tot": {
      "pts": 31,
      "reb": 11,
      "ast": 5,
      "stl": 2,
      "tov": 4,
      "blk": 4
     }
    },
    {
     "nome": "Nikola Jokic",
     "per": [
      {
       "pts": 7,
       "reb": 2,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 3,
       "reb": 4,
       "ast": 2,
       "stl": 1,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 6,
       "reb": 3,
       "ast": 4,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 8,
       "reb": 2,
       "ast": 2,
       "stl": 1,
       "tov": 1,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 24,
      "reb": 11,
      "ast": 9,
      "stl": 3,
      "tov": 2,
      "blk": 0
     }
    }
   ],
   "ospite": [
    {
     "nome": "Trae Young",
     "per": [
      {
       "pts": 5,
       "reb": 1,
       "ast": 2,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 10,
       "reb": 0,
       "ast": 3,
       "stl": 1,
       "tov": 2,
       "blk": 0
      },
      {
       "pts": 10,
       "reb": 2,
       "ast": 3,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 9,
       "reb": 1,
       "ast": 3,
       "stl": 1,
       "tov": 2,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 34,
      "reb": 4,
      "ast": 11,
      "stl": 2,
      "tov": 6,
      "blk": 0
     }
    },
    {
     "nome": "Jeff Teague",
     "per": [
      {
       "pts": 3,
       "reb": 1,
       "ast": 1,
       "stl": 1,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 3,
       "reb": 1,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 2,
       "reb": 1,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 5,
       "reb": 1,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 13,
      "reb": 4,
      "ast": 4,
      "stl": 3,
      "tov": 2,
      "blk": 0
     }
    },
    {
     "nome": "De'Andre Hunter",
     "per": [
      {
       "pts": 2,
       "reb": 1,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 2,
       "reb": 1,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 3,
       "reb": 1,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 3,
       "reb": 1,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 10,
      "reb": 4,
      "ast": 3,
      "stl": 0,
      "tov": 2,
      "blk": 0
     }
    },
    {
     "nome": "John Collins",
     "per": [
      {
       "pts": 5,
       "reb": 2,
       "ast": 0,
       "stl": 0,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 3,
       "reb": 2,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 7,
       "reb": 2,
       "ast": 0,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 6,
       "reb": 4,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 1
      }
     ],
     "tot": {
      "pts": 21,
      "reb": 10,
      "ast": 2,
      "stl": 0,
      "tov": 3,
      "blk": 2
     }
    },
    {
     "nome": "Clint Capela",
     "per": [
      {
       "pts": 3,
       "reb": 4,
       "ast": 0,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 3,
       "reb": 6,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 1
      },
      {
       "pts": 2,
       "reb": 6,
       "ast": 0,
       "stl": 1,
       "tov": 0,
       "blk": 1
      },
      {
       "pts": 3,
       "reb": 5,
       "ast": 0,
       "stl": 1,
       "tov": 0,
       "blk": 1
      }
     ],
     "tot": {
      "pts": 11,
      "reb": 21,
      "ast": 0,
      "stl": 2,
      "tov": 1,
      "blk": 3
     }
    }
   ]
  }
 },
 {
  "seme": 1,
  "round": 2,
  "coach": "Mike D'Antoni",
  "tattica": "Seven seconds or less",
  "ovrTuo": 93,
  "att": 95,
  "dif": 95,
  "ovrLoro": 77,
  "loroAttDif": {
   "att": 84,
   "dif": 70
  },
  "avv": "DET 2018-19",
  "avvSigla": "DET",
  "mio": [
   {
    "nome": "James Harden",
    "ruolo": "PG",
    "team": "HOU",
    "stagione": "2016-17",
    "ovr": 97,
    "ovr2k": 95,
    "att": 99,
    "dif": 97,
    "reparti": {
     "t3": 87,
     "fin": 98,
     "dif": 86,
     "reb": 72,
     "reg": 98
    }
   },
   {
    "nome": "Kyle Korver",
    "ruolo": "SG",
    "team": "ATL",
    "stagione": "2014-15",
    "ovr": 81,
    "ovr2k": 79,
    "att": 84,
    "dif": 84,
    "reparti": {
     "t3": 99,
     "fin": 30,
     "dif": 61,
     "reb": 32,
     "reg": 65
    }
   },
   {
    "nome": "Kevin Durant",
    "ruolo": "SF",
    "team": "GSW",
    "stagione": "2018-19",
    "ovr": 93,
    "ovr2k": 96,
    "att": 94,
    "dif": 96,
    "reparti": {
     "t3": 54,
     "fin": 98,
     "dif": 84,
     "reb": 63,
     "reg": 86
    }
   },
   {
    "nome": "DeMarcus Cousins",
    "ruolo": "PF",
    "team": "NOP",
    "stagione": "2016-17",
    "ovr": 97,
    "ovr2k": 92,
    "att": 92,
    "dif": 99,
    "reparti": {
     "t3": 68,
     "fin": 95,
     "dif": 95,
     "reb": 91,
     "reg": 63
    }
   },
   {
    "nome": "Nikola Jokic",
    "ruolo": "C",
    "team": "DEN",
    "stagione": "2018-19",
    "ovr": 97,
    "ovr2k": 90,
    "att": 91,
    "dif": 99,
    "reparti": {
     "t3": 30,
     "fin": 92,
     "dif": 93,
     "reb": 93,
     "reg": 96
    }
   }
  ],
  "loro": [
   {
    "nome": "Reggie Jackson",
    "ruolo": "PG",
    "team": "DET",
    "stagione": "2018-19",
    "ovr": 69,
    "ovr2k": 80,
    "att": 90,
    "dif": 60,
    "reparti": {
     "t3": 89,
     "fin": 54,
     "dif": 6,
     "reb": 3,
     "reg": 83
    }
   },
   {
    "nome": "Wayne Ellington",
    "ruolo": "SG",
    "team": "DET",
    "stagione": "2018-19",
    "ovr": 69,
    "ovr2k": 75,
    "att": 83,
    "dif": 62,
    "reparti": {
     "t3": 89,
     "fin": 54,
     "dif": 18,
     "reb": 5,
     "reg": 39
    }
   },
   {
    "nome": "Luke Kennard",
    "ruolo": "SF",
    "team": "DET",
    "stagione": "2018-19",
    "ovr": 71,
    "ovr2k": 75,
    "att": 82,
    "dif": 61,
    "reparti": {
     "t3": 90,
     "fin": 34,
     "dif": 17,
     "reb": 29,
     "reg": 58
    }
   },
   {
    "nome": "Blake Griffin",
    "ruolo": "PF",
    "team": "DET",
    "stagione": "2018-19",
    "ovr": 85,
    "ovr2k": 88,
    "att": 96,
    "dif": 72,
    "reparti": {
     "t3": 86,
     "fin": 91,
     "dif": 39,
     "reb": 70,
     "reg": 74
    }
   },
   {
    "nome": "Andre Drummond",
    "ruolo": "C",
    "team": "DET",
    "stagione": "2018-19",
    "ovr": 90,
    "ovr2k": 86,
    "att": 69,
    "dif": 99,
    "reparti": {
     "t3": 9,
     "fin": 75,
     "dif": 97,
     "reb": 99,
     "reg": 1
    }
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
    "testo": "Dinamo Sofà avanti dopo il primo quarto, 32-28."
   },
   {
    "quarto": "2° quarto",
    "tipo": "normale",
    "testo": "Dinamo Sofà controlla il periodo (27-26), all'intervallo è 59-54."
   },
   {
    "quarto": "3° quarto",
    "tipo": "parita",
    "testo": "DET rimette la partita in parità, dopo tre quarti è 83-83."
   },
   {
    "quarto": "4° quarto",
    "tipo": "equilibrio",
    "testo": "Si decide nel finale."
   }
  ],
  "vincitore": "ospite",
  "possessi": {
   "casa": 102,
   "ospite": 96
  },
  "box": {
   "casa": [
    {
     "nome": "James Harden",
     "per": [
      {
       "pts": 9,
       "reb": 1,
       "ast": 3,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 9,
       "reb": 2,
       "ast": 2,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 6,
       "reb": 3,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 3,
       "reb": 1,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 27,
      "reb": 7,
      "ast": 7,
      "stl": 3,
      "tov": 4,
      "blk": 0
     }
    },
    {
     "nome": "Kyle Korver",
     "per": [
      {
       "pts": 2,
       "reb": 2,
       "ast": 1,
       "stl": 1,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 2,
       "reb": 1,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 3,
       "reb": 1,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 4,
       "reb": 1,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 11,
      "reb": 5,
      "ast": 1,
      "stl": 1,
      "tov": 0,
      "blk": 0
     }
    },
    {
     "nome": "Kevin Durant",
     "per": [
      {
       "pts": 8,
       "reb": 2,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 1
      },
      {
       "pts": 6,
       "reb": 2,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 6,
       "reb": 2,
       "ast": 2,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 5,
       "reb": 2,
       "ast": 2,
       "stl": 0,
       "tov": 1,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 25,
      "reb": 8,
      "ast": 6,
      "stl": 0,
      "tov": 2,
      "blk": 1
     }
    },
    {
     "nome": "DeMarcus Cousins",
     "per": [
      {
       "pts": 8,
       "reb": 3,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 5,
       "reb": 2,
       "ast": 1,
       "stl": 1,
       "tov": 0,
       "blk": 1
      },
      {
       "pts": 5,
       "reb": 2,
       "ast": 1,
       "stl": 1,
       "tov": 0,
       "blk": 1
      },
      {
       "pts": 7,
       "reb": 4,
       "ast": 1,
       "stl": 1,
       "tov": 0,
       "blk": 1
      }
     ],
     "tot": {
      "pts": 25,
      "reb": 11,
      "ast": 4,
      "stl": 3,
      "tov": 1,
      "blk": 4
     }
    },
    {
     "nome": "Nikola Jokic",
     "per": [
      {
       "pts": 5,
       "reb": 5,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 5,
       "reb": 4,
       "ast": 2,
       "stl": 0,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 4,
       "reb": 2,
       "ast": 2,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 6,
       "reb": 3,
       "ast": 2,
       "stl": 1,
       "tov": 1,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 20,
      "reb": 14,
      "ast": 7,
      "stl": 2,
      "tov": 4,
      "blk": 1
     }
    }
   ],
   "ospite": [
    {
     "nome": "Reggie Jackson",
     "per": [
      {
       "pts": 5,
       "reb": 0,
       "ast": 2,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 2,
       "reb": 1,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 2,
       "reb": 1,
       "ast": 2,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 2,
       "reb": 1,
       "ast": 0,
       "stl": 0,
       "tov": 0,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 11,
      "reb": 3,
      "ast": 5,
      "stl": 1,
      "tov": 1,
      "blk": 0
     }
    },
    {
     "nome": "Wayne Ellington",
     "per": [
      {
       "pts": 5,
       "reb": 0,
       "ast": 1,
       "stl": 1,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 4,
       "reb": 1,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 7,
       "reb": 1,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      },
      {
       "pts": 6,
       "reb": 0,
       "ast": 1,
       "stl": 0,
       "tov": 0,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 22,
      "reb": 2,
      "ast": 4,
      "stl": 1,
      "tov": 0,
      "blk": 0
     }
    },
    {
     "nome": "Luke Kennard",
     "per": [
      {
       "pts": 3,
       "reb": 1,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 8,
       "reb": 2,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 5,
       "reb": 1,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 4,
       "reb": 2,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 20,
      "reb": 6,
      "ast": 4,
      "stl": 2,
      "tov": 4,
      "blk": 0
     }
    },
    {
     "nome": "Blake Griffin",
     "per": [
      {
       "pts": 7,
       "reb": 2,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 9,
       "reb": 1,
       "ast": 2,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 7,
       "reb": 1,
       "ast": 2,
       "stl": 0,
       "tov": 1,
       "blk": 0
      },
      {
       "pts": 10,
       "reb": 3,
       "ast": 3,
       "stl": 0,
       "tov": 1,
       "blk": 0
      }
     ],
     "tot": {
      "pts": 33,
      "reb": 7,
      "ast": 8,
      "stl": 0,
      "tov": 4,
      "blk": 0
     }
    },
    {
     "nome": "Andre Drummond",
     "per": [
      {
       "pts": 8,
       "reb": 8,
       "ast": 1,
       "stl": 0,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 3,
       "reb": 5,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 8,
       "reb": 7,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 1
      },
      {
       "pts": 5,
       "reb": 5,
       "ast": 1,
       "stl": 1,
       "tov": 1,
       "blk": 1
      }
     ],
     "tot": {
      "pts": 24,
      "reb": 25,
      "ast": 4,
      "stl": 3,
      "tov": 4,
      "blk": 4
     }
    }
   ]
  }
 }
];
window.FINE_RUN = [
 {
  "seme": 30,
  "esito": "imbattuto",
  "vittorie": 16,
  "obiettivo": 16,
  "coach": "Red Auerbach",
  "quintetto": [
   {
    "nome": "Stephen Curry",
    "ruolo": "PG",
    "team": "GSW",
    "stagione": "2017-18",
    "ovr": 93,
    "ovr2k": 95,
    "att": 99,
    "dif": 93,
    "reparti": {
     "t3": 98,
     "fin": 99,
     "dif": 79,
     "reb": 48,
     "reg": 88
    }
   },
   {
    "nome": "Kawhi Leonard",
    "ruolo": "SG",
    "team": "LAC",
    "stagione": "2019-20",
    "ovr": 96,
    "ovr2k": 96,
    "att": 96,
    "dif": 99,
    "reparti": {
     "t3": 72,
     "fin": 95,
     "dif": 94,
     "reb": 71,
     "reg": 80
    }
   },
   {
    "nome": "LeBron James",
    "ruolo": "SF",
    "team": "CLE",
    "stagione": "2016-17",
    "ovr": 95,
    "ovr2k": 97,
    "att": 96,
    "dif": 96,
    "reparti": {
     "t3": 56,
     "fin": 98,
     "dif": 84,
     "reb": 74,
     "reg": 95
    }
   },
   {
    "nome": "DeMarcus Cousins",
    "ruolo": "PF",
    "team": "NOP",
    "stagione": "2016-17",
    "ovr": 97,
    "ovr2k": 92,
    "att": 92,
    "dif": 99,
    "reparti": {
     "t3": 68,
     "fin": 95,
     "dif": 95,
     "reb": 91,
     "reg": 63
    }
   },
   {
    "nome": "Giannis Antetokounmpo",
    "ruolo": "C",
    "team": "MIL",
    "stagione": "2019-20",
    "ovr": 97,
    "ovr2k": 97,
    "att": 92,
    "dif": 99,
    "reparti": {
     "t3": 47,
     "fin": 99,
     "dif": 95,
     "reb": 92,
     "reg": 79
    }
   }
  ],
  "totali": {
   "fatti": 1841,
   "subiti": 1547,
   "margine": 18.375,
   "piuLarga": {
    "round": 4,
    "avversario": "MIN",
    "vinto": true,
    "tuo": 87,
    "loro": 50,
    "punti": {
     "casa": 124,
     "ospite": 77
    },
    "quarti": [
     {
      "n": 1,
      "casa": 31,
      "ospite": 18,
      "cumCasa": 31,
      "cumOspite": 18,
      "overtime": false,
      "possessi": {
       "casa": 26,
       "ospite": 24
      }
     },
     {
      "n": 2,
      "casa": 30,
      "ospite": 23,
      "cumCasa": 61,
      "cumOspite": 41,
      "overtime": false,
      "possessi": {
       "casa": 26,
       "ospite": 24
      }
     },
     {
      "n": 3,
      "casa": 27,
      "ospite": 23,
      "cumCasa": 88,
      "cumOspite": 64,
      "overtime": false,
      "possessi": {
       "casa": 26,
       "ospite": 24
      }
     },
     {
      "n": 4,
      "casa": 36,
      "ospite": 13,
      "cumCasa": 124,
      "cumOspite": 77,
      "overtime": false,
      "possessi": {
       "casa": 26,
       "ospite": 24
      }
     }
    ],
    "cronaca": [
     {
      "quarto": "1° quarto",
      "tipo": "allungo",
      "testo": "Dinamo Sofà parte forte e chiude il primo quarto avanti 31-18."
     },
     {
      "quarto": "2° quarto",
      "tipo": "fuga",
      "testo": "Dinamo Sofà tiene il controllo, all'intervallo è 61-41."
     },
     {
      "quarto": "3° quarto",
      "tipo": "fuga",
      "testo": "Dinamo Sofà tiene il controllo, dopo tre quarti è 88-64."
     },
     {
      "quarto": "4° quarto",
      "tipo": "allungo",
      "testo": "Dinamo Sofà chiude i conti con un 36-13."
     }
    ],
    "box": {
     "casa": {
      "righe": [
       {
        "nome": "Stephen Curry",
        "per": [
         {
          "pts": 7,
          "reb": 1,
          "ast": 2,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 8,
          "reb": 1,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 1,
          "ast": 2,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 9,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 29,
         "reb": 5,
         "ast": 6,
         "stl": 4,
         "tov": 1,
         "blk": 0
        }
       },
       {
        "nome": "Kawhi Leonard",
        "per": [
         {
          "pts": 8,
          "reb": 1,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 3,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 7,
          "reb": 2,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 12,
          "reb": 3,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 32,
         "reb": 9,
         "ast": 5,
         "stl": 3,
         "tov": 2,
         "blk": 0
        }
       },
       {
        "nome": "LeBron James",
        "per": [
         {
          "pts": 6,
          "reb": 2,
          "ast": 2,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 6,
          "reb": 1,
          "ast": 2,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 6,
          "reb": 2,
          "ast": 2,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 3,
          "ast": 2,
          "stl": 0,
          "tov": 0,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 22,
         "reb": 8,
         "ast": 8,
         "stl": 0,
         "tov": 1,
         "blk": 0
        }
       },
       {
        "nome": "DeMarcus Cousins",
        "per": [
         {
          "pts": 5,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 2,
          "reb": 3,
          "ast": 2,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 5,
          "ast": 0,
          "stl": 1,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 3,
          "reb": 1,
          "ast": 2,
          "stl": 0,
          "tov": 1,
          "blk": 1
         }
        ],
        "tot": {
         "pts": 15,
         "reb": 12,
         "ast": 5,
         "stl": 1,
         "tov": 3,
         "blk": 3
        }
       },
       {
        "nome": "Giannis Antetokounmpo",
        "per": [
         {
          "pts": 5,
          "reb": 4,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 9,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 4,
          "reb": 0,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 8,
          "reb": 4,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 1
         }
        ],
        "tot": {
         "pts": 26,
         "reb": 11,
         "ast": 5,
         "stl": 2,
         "tov": 4,
         "blk": 3
        }
       }
      ],
      "totali": {
       "pts": 124,
       "reb": 45,
       "ast": 29,
       "stl": 10,
       "tov": 11,
       "blk": 6
      }
     },
     "ospite": {
      "righe": [
       {
        "nome": "Jeff Teague",
        "per": [
         {
          "pts": 3,
          "reb": 1,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 2,
          "ast": 4,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 3,
          "reb": 1,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 2,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 12,
         "reb": 5,
         "ast": 8,
         "stl": 3,
         "tov": 4,
         "blk": 0
        }
       },
       {
        "nome": "Jimmy Butler",
        "per": [
         {
          "pts": 5,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 2,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 4,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 3,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 18,
         "reb": 10,
         "ast": 5,
         "stl": 3,
         "tov": 2,
         "blk": 0
        }
       },
       {
        "nome": "Jamal Crawford",
        "per": [
         {
          "pts": 3,
          "reb": 0,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 0,
          "ast": 0,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 3,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 15,
         "reb": 2,
         "ast": 3,
         "stl": 1,
         "tov": 3,
         "blk": 0
        }
       },
       {
        "nome": "Andrew Wiggins",
        "per": [
         {
          "pts": 3,
          "reb": 2,
          "ast": 0,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 2,
          "reb": 2,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 5,
          "reb": 3,
          "ast": 0,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 1,
          "reb": 1,
          "ast": 0,
          "stl": 0,
          "tov": 0,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 11,
         "reb": 8,
         "ast": 1,
         "stl": 0,
         "tov": 2,
         "blk": 1
        }
       },
       {
        "nome": "Karl-Anthony Towns",
        "per": [
         {
          "pts": 4,
          "reb": 5,
          "ast": 0,
          "stl": 0,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 7,
          "reb": 7,
          "ast": 0,
          "stl": 0,
          "tov": 0,
          "blk": 1
         },
         {
          "pts": 6,
          "reb": 4,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 1
         },
         {
          "pts": 4,
          "reb": 2,
          "ast": 0,
          "stl": 0,
          "tov": 0,
          "blk": 1
         }
        ],
        "tot": {
         "pts": 21,
         "reb": 18,
         "ast": 1,
         "stl": 0,
         "tov": 1,
         "blk": 4
        }
       }
      ],
      "totali": {
       "pts": 77,
       "reb": 43,
       "ast": 18,
       "stl": 7,
       "tov": 12,
       "blk": 5
      }
     }
    }
   },
   "piuTirata": {
    "round": 14,
    "avversario": "SAS",
    "vinto": true,
    "tuo": 87,
    "loro": 68,
    "punti": {
     "casa": 106,
     "ospite": 104
    },
    "quarti": [
     {
      "n": 1,
      "casa": 28,
      "ospite": 26,
      "cumCasa": 28,
      "cumOspite": 26,
      "overtime": false,
      "possessi": {
       "casa": 25,
       "ospite": 25
      }
     },
     {
      "n": 2,
      "casa": 23,
      "ospite": 21,
      "cumCasa": 51,
      "cumOspite": 47,
      "overtime": false,
      "possessi": {
       "casa": 25,
       "ospite": 25
      }
     },
     {
      "n": 3,
      "casa": 27,
      "ospite": 30,
      "cumCasa": 78,
      "cumOspite": 77,
      "overtime": false,
      "possessi": {
       "casa": 25,
       "ospite": 25
      }
     },
     {
      "n": 4,
      "casa": 28,
      "ospite": 27,
      "cumCasa": 106,
      "cumOspite": 104,
      "overtime": false,
      "possessi": {
       "casa": 25,
       "ospite": 25
      }
     }
    ],
    "cronaca": [
     {
      "quarto": "1° quarto",
      "tipo": "equilibrio",
      "testo": "Primo quarto punto a punto, 28-26."
     },
     {
      "quarto": "2° quarto",
      "tipo": "normale",
      "testo": "Dinamo Sofà controlla il periodo (23-21), all'intervallo è 51-47."
     },
     {
      "quarto": "3° quarto",
      "tipo": "equilibrio",
      "testo": "Ancora tutto aperto, dopo tre quarti è 78-77."
     },
     {
      "quarto": "4° quarto",
      "tipo": "equilibrio",
      "testo": "Si decide nel finale."
     }
    ],
    "box": {
     "casa": {
      "righe": [
       {
        "nome": "Stephen Curry",
        "per": [
         {
          "pts": 3,
          "reb": 3,
          "ast": 3,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 6,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 0,
          "ast": 2,
          "stl": 1,
          "tov": 0,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 19,
         "reb": 6,
         "ast": 7,
         "stl": 3,
         "tov": 2,
         "blk": 0
        }
       },
       {
        "nome": "Kawhi Leonard",
        "per": [
         {
          "pts": 4,
          "reb": 3,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 8,
          "reb": 0,
          "ast": 0,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 7,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 7,
          "reb": 2,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 26,
         "reb": 7,
         "ast": 3,
         "stl": 3,
         "tov": 2,
         "blk": 0
        }
       },
       {
        "nome": "LeBron James",
        "per": [
         {
          "pts": 5,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 0,
          "reb": 2,
          "ast": 2,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 3,
          "ast": 2,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 2,
          "ast": 2,
          "stl": 0,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 14,
         "reb": 8,
         "ast": 7,
         "stl": 0,
         "tov": 1,
         "blk": 0
        }
       },
       {
        "nome": "DeMarcus Cousins",
        "per": [
         {
          "pts": 12,
          "reb": 5,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 4,
          "reb": 2,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 6,
          "reb": 1,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 4,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 1
         }
        ],
        "tot": {
         "pts": 27,
         "reb": 12,
         "ast": 4,
         "stl": 3,
         "tov": 3,
         "blk": 3
        }
       },
       {
        "nome": "Giannis Antetokounmpo",
        "per": [
         {
          "pts": 4,
          "reb": 0,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 1
         },
         {
          "pts": 6,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 4,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 6,
          "reb": 4,
          "ast": 0,
          "stl": 0,
          "tov": 1,
          "blk": 1
         }
        ],
        "tot": {
         "pts": 20,
         "reb": 11,
         "ast": 3,
         "stl": 0,
         "tov": 3,
         "blk": 3
        }
       }
      ],
      "totali": {
       "pts": 106,
       "reb": 44,
       "ast": 24,
       "stl": 9,
       "tov": 11,
       "blk": 6
      }
     },
     "ospite": {
      "righe": [
       {
        "nome": "Dejounte Murray",
        "per": [
         {
          "pts": 6,
          "reb": 4,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 3,
          "reb": 1,
          "ast": 2,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 2,
          "reb": 2,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 15,
         "reb": 9,
         "ast": 6,
         "stl": 3,
         "tov": 4,
         "blk": 0
        }
       },
       {
        "nome": "Kawhi Leonard",
        "per": [
         {
          "pts": 6,
          "reb": 2,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 5,
          "reb": 4,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 9,
          "reb": 1,
          "ast": 1,
          "stl": 1,
          "tov": 2,
          "blk": 1
         }
        ],
        "tot": {
         "pts": 24,
         "reb": 9,
         "ast": 5,
         "stl": 4,
         "tov": 5,
         "blk": 3
        }
       },
       {
        "nome": "Rudy Gay",
        "per": [
         {
          "pts": 1,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 2,
          "ast": 0,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 5,
          "reb": 2,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 16,
         "reb": 7,
         "ast": 3,
         "stl": 1,
         "tov": 3,
         "blk": 1
        }
       },
       {
        "nome": "LaMarcus Aldridge",
        "per": [
         {
          "pts": 8,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 7,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 11,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 8,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 34,
         "reb": 10,
         "ast": 4,
         "stl": 0,
         "tov": 1,
         "blk": 0
        }
       },
       {
        "nome": "Pau Gasol",
        "per": [
         {
          "pts": 5,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 1
         },
         {
          "pts": 2,
          "reb": 1,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 4,
          "ast": 3,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 3,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 1
         }
        ],
        "tot": {
         "pts": 15,
         "reb": 9,
         "ast": 6,
         "stl": 1,
         "tov": 1,
         "blk": 2
        }
       }
      ],
      "totali": {
       "pts": 104,
       "reb": 44,
       "ast": 24,
       "stl": 9,
       "tov": 14,
       "blk": 6
      }
     }
    }
   }
  },
  "medie": [
   {
    "nome": "Giannis Antetokounmpo",
    "gp": 16,
    "medie": {
     "pts": 26.5625,
     "reb": 13.6875,
     "ast": 5.5,
     "stl": 1.125,
     "tov": 2.875,
     "blk": 2.75
    },
    "somma": {
     "pts": 425,
     "reb": 219,
     "ast": 88,
     "stl": 18,
     "tov": 46,
     "blk": 44
    },
    "max": {
     "pts": 33,
     "reb": 17,
     "ast": 8,
     "stl": 3,
     "tov": 4,
     "blk": 3
    },
    "ruolo": "C",
    "ovr": 97,
    "team": "MIL",
    "stagione": "2019-20"
   },
   {
    "nome": "Kawhi Leonard",
    "gp": 16,
    "medie": {
     "pts": 23.625,
     "reb": 7.5625,
     "ast": 4.625,
     "stl": 3.125,
     "tov": 1.5,
     "blk": 0.3125
    },
    "somma": {
     "pts": 378,
     "reb": 121,
     "ast": 74,
     "stl": 50,
     "tov": 24,
     "blk": 5
    },
    "max": {
     "pts": 32,
     "reb": 10,
     "ast": 6,
     "stl": 4,
     "tov": 3,
     "blk": 1
    },
    "ruolo": "SG",
    "ovr": 96,
    "team": "LAC",
    "stagione": "2019-20"
   },
   {
    "nome": "DeMarcus Cousins",
    "gp": 16,
    "medie": {
     "pts": 23.375,
     "reb": 10.5,
     "ast": 4.4375,
     "stl": 1.9375,
     "tov": 3.0625,
     "blk": 2.8125
    },
    "somma": {
     "pts": 374,
     "reb": 168,
     "ast": 71,
     "stl": 31,
     "tov": 49,
     "blk": 45
    },
    "max": {
     "pts": 31,
     "reb": 14,
     "ast": 6,
     "stl": 3,
     "tov": 4,
     "blk": 4
    },
    "ruolo": "PF",
    "ovr": 97,
    "team": "NOP",
    "stagione": "2016-17"
   },
   {
    "nome": "Stephen Curry",
    "gp": 16,
    "medie": {
     "pts": 22.625,
     "reb": 5.125,
     "ast": 5.5625,
     "stl": 3,
     "tov": 1.5625,
     "blk": 0
    },
    "somma": {
     "pts": 362,
     "reb": 82,
     "ast": 89,
     "stl": 48,
     "tov": 25,
     "blk": 0
    },
    "max": {
     "pts": 29,
     "reb": 7,
     "ast": 8,
     "stl": 4,
     "tov": 3,
     "blk": 0
    },
    "ruolo": "PG",
    "ovr": 93,
    "team": "GSW",
    "stagione": "2017-18"
   },
   {
    "nome": "LeBron James",
    "gp": 16,
    "medie": {
     "pts": 18.875,
     "reb": 7.875,
     "ast": 6.4375,
     "stl": 0.75,
     "tov": 2,
     "blk": 0.125
    },
    "somma": {
     "pts": 302,
     "reb": 126,
     "ast": 103,
     "stl": 12,
     "tov": 32,
     "blk": 2
    },
    "max": {
     "pts": 26,
     "reb": 10,
     "ast": 9,
     "stl": 3,
     "tov": 4,
     "blk": 1
    },
    "ruolo": "SF",
    "ovr": 95,
    "team": "CLE",
    "stagione": "2016-17"
   }
  ],
  "storia": [
   {
    "round": 1,
    "avversario": "ATL",
    "vinto": true,
    "punti": {
     "casa": 111,
     "ospite": 107
    }
   },
   {
    "round": 2,
    "avversario": "DET",
    "vinto": true,
    "punti": {
     "casa": 116,
     "ospite": 90
    }
   },
   {
    "round": 3,
    "avversario": "WAS",
    "vinto": true,
    "punti": {
     "casa": 124,
     "ospite": 93
    }
   },
   {
    "round": 4,
    "avversario": "MIN",
    "vinto": true,
    "punti": {
     "casa": 124,
     "ospite": 77
    }
   },
   {
    "round": 5,
    "avversario": "ORL",
    "vinto": true,
    "punti": {
     "casa": 111,
     "ospite": 99
    }
   },
   {
    "round": 6,
    "avversario": "GSW",
    "vinto": true,
    "punti": {
     "casa": 126,
     "ospite": 105
    }
   },
   {
    "round": 7,
    "avversario": "IND",
    "vinto": true,
    "punti": {
     "casa": 111,
     "ospite": 102
    }
   },
   {
    "round": 8,
    "avversario": "OKC",
    "vinto": true,
    "punti": {
     "casa": 113,
     "ospite": 106
    }
   },
   {
    "round": 9,
    "avversario": "HOU",
    "vinto": true,
    "punti": {
     "casa": 112,
     "ospite": 92
    }
   },
   {
    "round": 10,
    "avversario": "PHI",
    "vinto": true,
    "punti": {
     "casa": 123,
     "ospite": 90
    }
   },
   {
    "round": 11,
    "avversario": "PHI",
    "vinto": true,
    "punti": {
     "casa": 111,
     "ospite": 90
    }
   },
   {
    "round": 12,
    "avversario": "DEN",
    "vinto": true,
    "punti": {
     "casa": 100,
     "ospite": 85
    }
   },
   {
    "round": 13,
    "avversario": "ATL",
    "vinto": true,
    "punti": {
     "casa": 115,
     "ospite": 109
    }
   },
   {
    "round": 14,
    "avversario": "SAS",
    "vinto": true,
    "punti": {
     "casa": 106,
     "ospite": 104
    }
   },
   {
    "round": 15,
    "avversario": "GSW",
    "vinto": true,
    "punti": {
     "casa": 119,
     "ospite": 99
    }
   },
   {
    "round": 16,
    "avversario": "NOP",
    "vinto": true,
    "punti": {
     "casa": 119,
     "ospite": 99
    }
   }
  ]
 },
 {
  "seme": 15,
  "esito": "sconfitta",
  "vittorie": 15,
  "obiettivo": 16,
  "coach": "Red Auerbach",
  "quintetto": [
   {
    "nome": "Russell Westbrook",
    "ruolo": "PG",
    "team": "OKC",
    "stagione": "2017-18",
    "ovr": 96,
    "ovr2k": 93,
    "att": 92,
    "dif": 99,
    "reparti": {
     "t3": 36,
     "fin": 93,
     "dif": 91,
     "reb": 87,
     "reg": 98
    }
   },
   {
    "nome": "James Harden",
    "ruolo": "SG",
    "team": "HOU",
    "stagione": "2017-18",
    "ovr": 95,
    "ovr2k": 96,
    "att": 99,
    "dif": 98,
    "reparti": {
     "t3": 89,
     "fin": 98,
     "dif": 89,
     "reb": 48,
     "reg": 95
    }
   },
   {
    "nome": "Paul George",
    "ruolo": "SF",
    "team": "IND",
    "stagione": "2016-17",
    "ovr": 89,
    "ovr2k": 91,
    "att": 92,
    "dif": 89,
    "reparti": {
     "t3": 90,
     "fin": 90,
     "dif": 70,
     "reb": 59,
     "reg": 42
    }
   },
   {
    "nome": "Jared Sullinger",
    "ruolo": "PF",
    "team": "BOS",
    "stagione": "2014-15",
    "ovr": 90,
    "ovr2k": 77,
    "att": 86,
    "dif": 91,
    "reparti": {
     "t3": 56,
     "fin": 72,
     "dif": 74,
     "reb": 82,
     "reg": 65
    }
   },
   {
    "nome": "Nikola Jokic",
    "ruolo": "C",
    "team": "DEN",
    "stagione": "2017-18",
    "ovr": 97,
    "ovr2k": 89,
    "att": 93,
    "dif": 99,
    "reparti": {
     "t3": 49,
     "fin": 89,
     "dif": 93,
     "reb": 94,
     "reg": 91
    }
   }
  ],
  "totali": {
   "fatti": 1820,
   "subiti": 1563,
   "margine": 16.0625,
   "piuLarga": {
    "round": 8,
    "avversario": "OKC",
    "vinto": true,
    "tuo": 83,
    "loro": 58,
    "punti": {
     "casa": 134,
     "ospite": 98
    },
    "quarti": [
     {
      "n": 1,
      "casa": 36,
      "ospite": 23,
      "cumCasa": 36,
      "cumOspite": 23,
      "overtime": false,
      "possessi": {
       "casa": 25,
       "ospite": 24
      }
     },
     {
      "n": 2,
      "casa": 30,
      "ospite": 28,
      "cumCasa": 66,
      "cumOspite": 51,
      "overtime": false,
      "possessi": {
       "casa": 25,
       "ospite": 24
      }
     },
     {
      "n": 3,
      "casa": 31,
      "ospite": 25,
      "cumCasa": 97,
      "cumOspite": 76,
      "overtime": false,
      "possessi": {
       "casa": 25,
       "ospite": 24
      }
     },
     {
      "n": 4,
      "casa": 37,
      "ospite": 22,
      "cumCasa": 134,
      "cumOspite": 98,
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
      "testo": "Dinamo Sofà parte forte e chiude il primo quarto avanti 36-23."
     },
     {
      "quarto": "2° quarto",
      "tipo": "fuga",
      "testo": "Dinamo Sofà tiene il controllo, all'intervallo è 66-51."
     },
     {
      "quarto": "3° quarto",
      "tipo": "fuga",
      "testo": "Dinamo Sofà tiene il controllo, dopo tre quarti è 97-76."
     },
     {
      "quarto": "4° quarto",
      "tipo": "allungo",
      "testo": "Dinamo Sofà chiude i conti con un 37-22."
     }
    ],
    "box": {
     "casa": {
      "righe": [
       {
        "nome": "Russell Westbrook",
        "per": [
         {
          "pts": 6,
          "reb": 2,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 8,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 9,
          "reb": 3,
          "ast": 0,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 9,
          "reb": 5,
          "ast": 3,
          "stl": 1,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 32,
         "reb": 13,
         "ast": 5,
         "stl": 1,
         "tov": 1,
         "blk": 0
        }
       },
       {
        "nome": "James Harden",
        "per": [
         {
          "pts": 8,
          "reb": 1,
          "ast": 3,
          "stl": 0,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 9,
          "reb": 1,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 8,
          "reb": 1,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 11,
          "reb": 1,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 36,
         "reb": 4,
         "ast": 9,
         "stl": 3,
         "tov": 4,
         "blk": 1
        }
       },
       {
        "nome": "Paul George",
        "per": [
         {
          "pts": 8,
          "reb": 1,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 1,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 8,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 25,
         "reb": 5,
         "ast": 4,
         "stl": 3,
         "tov": 2,
         "blk": 0
        }
       },
       {
        "nome": "Jared Sullinger",
        "per": [
         {
          "pts": 7,
          "reb": 4,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 1
         },
         {
          "pts": 5,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 1
         },
         {
          "pts": 3,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 1
         }
        ],
        "tot": {
         "pts": 20,
         "reb": 13,
         "ast": 4,
         "stl": 1,
         "tov": 0,
         "blk": 3
        }
       },
       {
        "nome": "Nikola Jokic",
        "per": [
         {
          "pts": 7,
          "reb": 4,
          "ast": 2,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 2,
          "ast": 2,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 6,
          "reb": 1,
          "ast": 3,
          "stl": 0,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 4,
          "reb": 3,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 1
         }
        ],
        "tot": {
         "pts": 21,
         "reb": 10,
         "ast": 9,
         "stl": 1,
         "tov": 4,
         "blk": 2
        }
       }
      ],
      "totali": {
       "pts": 134,
       "reb": 45,
       "ast": 31,
       "stl": 9,
       "tov": 11,
       "blk": 6
      }
     },
     "ospite": {
      "righe": [
       {
        "nome": "Chris Paul",
        "per": [
         {
          "pts": 3,
          "reb": 2,
          "ast": 2,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 3,
          "reb": 2,
          "ast": 3,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 3,
          "reb": 2,
          "ast": 2,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 6,
          "reb": 2,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 15,
         "reb": 8,
         "ast": 9,
         "stl": 3,
         "tov": 3,
         "blk": 0
        }
       },
       {
        "nome": "Dennis Schroder",
        "per": [
         {
          "pts": 4,
          "reb": 2,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 10,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 7,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 25,
         "reb": 5,
         "ast": 4,
         "stl": 0,
         "tov": 4,
         "blk": 0
        }
       },
       {
        "nome": "Shai Gilgeous-Alexander",
        "per": [
         {
          "pts": 6,
          "reb": 1,
          "ast": 0,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 7,
          "reb": 4,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 4,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 3,
          "reb": 3,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 20,
         "reb": 10,
         "ast": 3,
         "stl": 4,
         "tov": 1,
         "blk": 1
        }
       },
       {
        "nome": "Danilo Gallinari",
        "per": [
         {
          "pts": 4,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 6,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 8,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 2,
          "ast": 0,
          "stl": 0,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 23,
         "reb": 8,
         "ast": 3,
         "stl": 1,
         "tov": 2,
         "blk": 0
        }
       },
       {
        "nome": "Steven Adams",
        "per": [
         {
          "pts": 6,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 2,
          "reb": 4,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 1
         },
         {
          "pts": 3,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 4,
          "reb": 2,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 1
         }
        ],
        "tot": {
         "pts": 15,
         "reb": 12,
         "ast": 4,
         "stl": 0,
         "tov": 2,
         "blk": 4
        }
       }
      ],
      "totali": {
       "pts": 98,
       "reb": 43,
       "ast": 23,
       "stl": 8,
       "tov": 12,
       "blk": 5
      }
     }
    }
   },
   "piuTirata": {
    "round": 3,
    "avversario": "WAS",
    "vinto": true,
    "tuo": 83,
    "loro": 49,
    "punti": {
     "casa": 96,
     "ospite": 95
    },
    "quarti": [
     {
      "n": 1,
      "casa": 25,
      "ospite": 25,
      "cumCasa": 25,
      "cumOspite": 25,
      "overtime": false,
      "possessi": {
       "casa": 25,
       "ospite": 24
      }
     },
     {
      "n": 2,
      "casa": 27,
      "ospite": 24,
      "cumCasa": 52,
      "cumOspite": 49,
      "overtime": false,
      "possessi": {
       "casa": 25,
       "ospite": 24
      }
     },
     {
      "n": 3,
      "casa": 22,
      "ospite": 19,
      "cumCasa": 74,
      "cumOspite": 68,
      "overtime": false,
      "possessi": {
       "casa": 25,
       "ospite": 24
      }
     },
     {
      "n": 4,
      "casa": 22,
      "ospite": 27,
      "cumCasa": 96,
      "cumOspite": 95,
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
      "tipo": "parita",
      "testo": "Primo quarto in perfetta parità, 25-25."
     },
     {
      "quarto": "2° quarto",
      "tipo": "equilibrio",
      "testo": "Nessuna delle due prende il largo, all'intervallo è 52-49."
     },
     {
      "quarto": "3° quarto",
      "tipo": "normale",
      "testo": "Dinamo Sofà controlla il periodo (22-19), dopo tre quarti è 74-68."
     },
     {
      "quarto": "4° quarto",
      "tipo": "rimonta",
      "testo": "WAS ci prova (27-22) ma non basta."
     }
    ],
    "box": {
     "casa": {
      "righe": [
       {
        "nome": "Russell Westbrook",
        "per": [
         {
          "pts": 4,
          "reb": 5,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 6,
          "reb": 2,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 3,
          "ast": 2,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 3,
          "reb": 1,
          "ast": 2,
          "stl": 0,
          "tov": 0,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 18,
         "reb": 11,
         "ast": 8,
         "stl": 2,
         "tov": 3,
         "blk": 0
        }
       },
       {
        "nome": "James Harden",
        "per": [
         {
          "pts": 10,
          "reb": 1,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 6,
          "reb": 1,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 5,
          "reb": 0,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 3,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 24,
         "reb": 4,
         "ast": 5,
         "stl": 4,
         "tov": 4,
         "blk": 2
        }
       },
       {
        "nome": "Paul George",
        "per": [
         {
          "pts": 4,
          "reb": 3,
          "ast": 0,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 6,
          "reb": 2,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 20,
         "reb": 8,
         "ast": 3,
         "stl": 1,
         "tov": 3,
         "blk": 0
        }
       },
       {
        "nome": "Jared Sullinger",
        "per": [
         {
          "pts": 3,
          "reb": 2,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 1
         },
         {
          "pts": 4,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 3,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 2,
          "ast": 0,
          "stl": 0,
          "tov": 0,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 14,
         "reb": 10,
         "ast": 3,
         "stl": 0,
         "tov": 0,
         "blk": 1
        }
       },
       {
        "nome": "Nikola Jokic",
        "per": [
         {
          "pts": 4,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 1
         },
         {
          "pts": 5,
          "reb": 5,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 1
         },
         {
          "pts": 4,
          "reb": 3,
          "ast": 0,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 7,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 1
         }
        ],
        "tot": {
         "pts": 20,
         "reb": 12,
         "ast": 3,
         "stl": 2,
         "tov": 1,
         "blk": 3
        }
       }
      ],
      "totali": {
       "pts": 96,
       "reb": 45,
       "ast": 22,
       "stl": 9,
       "tov": 11,
       "blk": 6
      }
     },
     "ospite": {
      "righe": [
       {
        "nome": "Bradley Beal",
        "per": [
         {
          "pts": 9,
          "reb": 1,
          "ast": 4,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 2,
          "reb": 1,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 7,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 3,
          "reb": 1,
          "ast": 2,
          "stl": 1,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 21,
         "reb": 4,
         "ast": 9,
         "stl": 3,
         "tov": 4,
         "blk": 0
        }
       },
       {
        "nome": "Troy Brown Jr.",
        "per": [
         {
          "pts": 4,
          "reb": 1,
          "ast": 0,
          "stl": 1,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 2,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 3,
          "reb": 2,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 14,
         "reb": 8,
         "ast": 3,
         "stl": 2,
         "tov": 2,
         "blk": 0
        }
       },
       {
        "nome": "Davis Bertans",
        "per": [
         {
          "pts": 3,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 2,
          "ast": 0,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 7,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 18,
         "reb": 11,
         "ast": 3,
         "stl": 0,
         "tov": 2,
         "blk": 0
        }
       },
       {
        "nome": "Rui Hachimura",
        "per": [
         {
          "pts": 5,
          "reb": 3,
          "ast": 0,
          "stl": 0,
          "tov": 0,
          "blk": 0
         },
         {
          "pts": 7,
          "reb": 2,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 4,
          "reb": 1,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         },
         {
          "pts": 5,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 0
         }
        ],
        "tot": {
         "pts": 21,
         "reb": 9,
         "ast": 3,
         "stl": 0,
         "tov": 3,
         "blk": 0
        }
       },
       {
        "nome": "Thomas Bryant",
        "per": [
         {
          "pts": 4,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 1,
          "blk": 1
         },
         {
          "pts": 6,
          "reb": 2,
          "ast": 1,
          "stl": 1,
          "tov": 0,
          "blk": 1
         },
         {
          "pts": 2,
          "reb": 3,
          "ast": 1,
          "stl": 0,
          "tov": 0,
          "blk": 1
         },
         {
          "pts": 9,
          "reb": 3,
          "ast": 1,
          "stl": 1,
          "tov": 1,
          "blk": 1
         }
        ],
        "tot": {
         "pts": 21,
         "reb": 11,
         "ast": 4,
         "stl": 2,
         "tov": 2,
         "blk": 4
        }
       }
      ],
      "totali": {
       "pts": 95,
       "reb": 43,
       "ast": 22,
       "stl": 7,
       "tov": 13,
       "blk": 4
      }
     }
    }
   }
  },
  "medie": [
   {
    "nome": "James Harden",
    "gp": 16,
    "medie": {
     "pts": 27.75,
     "reb": 5.375,
     "ast": 7.3125,
     "stl": 2.6875,
     "tov": 3.5,
     "blk": 0.8125
    },
    "somma": {
     "pts": 444,
     "reb": 86,
     "ast": 117,
     "stl": 43,
     "tov": 56,
     "blk": 13
    },
    "max": {
     "pts": 39,
     "reb": 7,
     "ast": 9,
     "stl": 4,
     "tov": 4,
     "blk": 2
    },
    "ruolo": "SG",
    "ovr": 95,
    "team": "HOU",
    "stagione": "2017-18"
   },
   {
    "nome": "Russell Westbrook",
    "gp": 16,
    "medie": {
     "pts": 27.6875,
     "reb": 10.9375,
     "ast": 8.4375,
     "stl": 2.25,
     "tov": 3.375,
     "blk": 0
    },
    "somma": {
     "pts": 443,
     "reb": 175,
     "ast": 135,
     "stl": 36,
     "tov": 54,
     "blk": 0
    },
    "max": {
     "pts": 36,
     "reb": 14,
     "ast": 11,
     "stl": 4,
     "tov": 4,
     "blk": 0
    },
    "ruolo": "PG",
    "ovr": 96,
    "team": "OKC",
    "stagione": "2017-18"
   },
   {
    "nome": "Paul George",
    "gp": 16,
    "medie": {
     "pts": 21.3125,
     "reb": 6.375,
     "ast": 2.8125,
     "stl": 2.0625,
     "tov": 1.75,
     "blk": 0
    },
    "somma": {
     "pts": 341,
     "reb": 102,
     "ast": 45,
     "stl": 33,
     "tov": 28,
     "blk": 0
    },
    "max": {
     "pts": 30,
     "reb": 8,
     "ast": 4,
     "stl": 3,
     "tov": 3,
     "blk": 0
    },
    "ruolo": "SF",
    "ovr": 89,
    "team": "IND",
    "stagione": "2016-17"
   },
   {
    "nome": "Nikola Jokic",
    "gp": 16,
    "medie": {
     "pts": 19.4375,
     "reb": 12.1875,
     "ast": 4.8125,
     "stl": 1.5,
     "tov": 2,
     "blk": 2.1875
    },
    "somma": {
     "pts": 311,
     "reb": 195,
     "ast": 77,
     "stl": 24,
     "tov": 32,
     "blk": 35
    },
    "max": {
     "pts": 24,
     "reb": 15,
     "ast": 9,
     "stl": 3,
     "tov": 4,
     "blk": 3
    },
    "ruolo": "C",
    "ovr": 97,
    "team": "DEN",
    "stagione": "2017-18"
   },
   {
    "nome": "Jared Sullinger",
    "gp": 16,
    "medie": {
     "pts": 17.5625,
     "reb": 9.875,
     "ast": 2.875,
     "stl": 0.5,
     "tov": 0.375,
     "blk": 3
    },
    "somma": {
     "pts": 281,
     "reb": 158,
     "ast": 46,
     "stl": 8,
     "tov": 6,
     "blk": 48
    },
    "max": {
     "pts": 25,
     "reb": 13,
     "ast": 4,
     "stl": 2,
     "tov": 3,
     "blk": 4
    },
    "ruolo": "PF",
    "ovr": 90,
    "team": "BOS",
    "stagione": "2014-15"
   }
  ],
  "storia": [
   {
    "round": 1,
    "avversario": "ATL",
    "vinto": true,
    "punti": {
     "casa": 125,
     "ospite": 96
    }
   },
   {
    "round": 2,
    "avversario": "DET",
    "vinto": true,
    "punti": {
     "casa": 119,
     "ospite": 90
    }
   },
   {
    "round": 3,
    "avversario": "WAS",
    "vinto": true,
    "punti": {
     "casa": 96,
     "ospite": 95
    }
   },
   {
    "round": 4,
    "avversario": "MIN",
    "vinto": true,
    "punti": {
     "casa": 111,
     "ospite": 87
    }
   },
   {
    "round": 5,
    "avversario": "ORL",
    "vinto": true,
    "punti": {
     "casa": 116,
     "ospite": 100
    }
   },
   {
    "round": 6,
    "avversario": "GSW",
    "vinto": true,
    "punti": {
     "casa": 114,
     "ospite": 92
    }
   },
   {
    "round": 7,
    "avversario": "IND",
    "vinto": true,
    "punti": {
     "casa": 116,
     "ospite": 92
    }
   },
   {
    "round": 8,
    "avversario": "OKC",
    "vinto": true,
    "punti": {
     "casa": 134,
     "ospite": 98
    }
   },
   {
    "round": 9,
    "avversario": "HOU",
    "vinto": true,
    "punti": {
     "casa": 116,
     "ospite": 90
    }
   },
   {
    "round": 10,
    "avversario": "PHI",
    "vinto": true,
    "punti": {
     "casa": 123,
     "ospite": 96
    }
   },
   {
    "round": 11,
    "avversario": "PHI",
    "vinto": true,
    "punti": {
     "casa": 113,
     "ospite": 108
    }
   },
   {
    "round": 12,
    "avversario": "DEN",
    "vinto": true,
    "punti": {
     "casa": 110,
     "ospite": 109
    }
   },
   {
    "round": 13,
    "avversario": "ATL",
    "vinto": true,
    "punti": {
     "casa": 111,
     "ospite": 108
    }
   },
   {
    "round": 14,
    "avversario": "SAS",
    "vinto": true,
    "punti": {
     "casa": 112,
     "ospite": 96
    }
   },
   {
    "round": 15,
    "avversario": "GSW",
    "vinto": true,
    "punti": {
     "casa": 103,
     "ospite": 95
    }
   },
   {
    "round": 16,
    "avversario": "NOP",
    "vinto": false,
    "punti": {
     "casa": 101,
     "ospite": 111
    }
   }
  ]
 }
];
window.PROFILO = {
 "squadra": "Dinamo Sofà",
 "corse": 40,
 "partite": 379,
 "imbattute": 2,
 "giocatori": [
  {
   "nome": "LeBron James",
   "gp": 174,
   "medie": {
    "pts": 24.229885057471265,
    "reb": 8.206896551724139,
    "ast": 7.137931034482759,
    "stl": 1.6264367816091954,
    "tov": 3.0689655172413794,
    "blk": 0.1206896551724138
   },
   "somma": {
    "pts": 4216,
    "reb": 1428,
    "ast": 1242,
    "stl": 283,
    "tov": 534,
    "blk": 21
   },
   "max": {
    "pts": 39,
    "reb": 14,
    "ast": 12,
    "stl": 4,
    "tov": 6,
    "blk": 2
   }
  },
  {
   "nome": "James Harden",
   "gp": 142,
   "medie": {
    "pts": 29.767605633802816,
    "reb": 6.985915492957746,
    "ast": 8.119718309859154,
    "stl": 2.6056338028169015,
    "tov": 3.816901408450704,
    "blk": 0.3873239436619718
   },
   "somma": {
    "pts": 4227,
    "reb": 992,
    "ast": 1153,
    "stl": 370,
    "tov": 542,
    "blk": 55
   },
   "max": {
    "pts": 51,
    "reb": 12,
    "ast": 14,
    "stl": 4,
    "tov": 7,
    "blk": 2
   }
  },
  {
   "nome": "Russell Westbrook",
   "gp": 112,
   "medie": {
    "pts": 25.482142857142858,
    "reb": 9.044642857142858,
    "ast": 8.419642857142858,
    "stl": 2.7589285714285716,
    "tov": 3.5267857142857144,
    "blk": 0.008928571428571428
   },
   "somma": {
    "pts": 2854,
    "reb": 1013,
    "ast": 943,
    "stl": 309,
    "tov": 395,
    "blk": 1
   },
   "max": {
    "pts": 42,
    "reb": 14,
    "ast": 12,
    "stl": 5,
    "tov": 5,
    "blk": 1
   }
  },
  {
   "nome": "Kevin Durant",
   "gp": 96,
   "medie": {
    "pts": 26.489583333333332,
    "reb": 8.375,
    "ast": 4.8125,
    "stl": 0.9583333333333334,
    "tov": 2.3333333333333335,
    "blk": 1.5
   },
   "somma": {
    "pts": 2543,
    "reb": 804,
    "ast": 462,
    "stl": 92,
    "tov": 224,
    "blk": 144
   },
   "max": {
    "pts": 39,
    "reb": 13,
    "ast": 8,
    "stl": 4,
    "tov": 4,
    "blk": 4
   }
  },
  {
   "nome": "Giannis Antetokounmpo",
   "gp": 89,
   "medie": {
    "pts": 26.39325842696629,
    "reb": 10.269662921348315,
    "ast": 5.112359550561798,
    "stl": 2.0224719101123596,
    "tov": 2.5730337078651684,
    "blk": 2.1797752808988764
   },
   "somma": {
    "pts": 2349,
    "reb": 914,
    "ast": 455,
    "stl": 180,
    "tov": 229,
    "blk": 194
   },
   "max": {
    "pts": 43,
    "reb": 18,
    "ast": 10,
    "stl": 4,
    "tov": 4,
    "blk": 4
   }
  },
  {
   "nome": "DeMarcus Cousins",
   "gp": 79,
   "medie": {
    "pts": 25.949367088607595,
    "reb": 11.987341772151899,
    "ast": 4.227848101265823,
    "stl": 1.9620253164556962,
    "tov": 3.1645569620253164,
    "blk": 2.7341772151898733
   },
   "somma": {
    "pts": 2050,
    "reb": 947,
    "ast": 334,
    "stl": 155,
    "tov": 250,
    "blk": 216
   },
   "max": {
    "pts": 36,
    "reb": 17,
    "ast": 9,
    "stl": 4,
    "tov": 5,
    "blk": 4
   }
  },
  {
   "nome": "Nikola Jokic",
   "gp": 73,
   "medie": {
    "pts": 22.246575342465754,
    "reb": 12.273972602739725,
    "ast": 6.6438356164383565,
    "stl": 1.7808219178082192,
    "tov": 2.6301369863013697,
    "blk": 1.2328767123287672
   },
   "somma": {
    "pts": 1624,
    "reb": 896,
    "ast": 485,
    "stl": 130,
    "tov": 192,
    "blk": 90
   },
   "max": {
    "pts": 39,
    "reb": 17,
    "ast": 11,
    "stl": 4,
    "tov": 4,
    "blk": 3
   }
  },
  {
   "nome": "Luka Doncic",
   "gp": 63,
   "medie": {
    "pts": 23.428571428571427,
    "reb": 8.444444444444445,
    "ast": 6.587301587301587,
    "stl": 1.3174603174603174,
    "tov": 3.1587301587301586,
    "blk": 0
   },
   "somma": {
    "pts": 1476,
    "reb": 532,
    "ast": 415,
    "stl": 83,
    "tov": 199,
    "blk": 0
   },
   "max": {
    "pts": 41,
    "reb": 12,
    "ast": 10,
    "stl": 3,
    "tov": 5,
    "blk": 0
   }
  },
  {
   "nome": "Anthony Davis",
   "gp": 62,
   "medie": {
    "pts": 25.79032258064516,
    "reb": 11.806451612903226,
    "ast": 3.096774193548387,
    "stl": 2.096774193548387,
    "tov": 1.2903225806451613,
    "blk": 3.435483870967742
   },
   "somma": {
    "pts": 1599,
    "reb": 732,
    "ast": 192,
    "stl": 130,
    "tov": 80,
    "blk": 213
   },
   "max": {
    "pts": 41,
    "reb": 17,
    "ast": 6,
    "stl": 4,
    "tov": 4,
    "blk": 5
   }
  },
  {
   "nome": "Hassan Whiteside",
   "gp": 59,
   "medie": {
    "pts": 18.627118644067796,
    "reb": 14.23728813559322,
    "ast": 0.3728813559322034,
    "stl": 0.3220338983050847,
    "tov": 1.152542372881356,
    "blk": 3.389830508474576
   },
   "somma": {
    "pts": 1099,
    "reb": 840,
    "ast": 22,
    "stl": 19,
    "tov": 68,
    "blk": 200
   },
   "max": {
    "pts": 29,
    "reb": 19,
    "ast": 2,
    "stl": 2,
    "tov": 3,
    "blk": 5
   }
  },
  {
   "nome": "Stephen Curry",
   "gp": 47,
   "medie": {
    "pts": 24.638297872340427,
    "reb": 6.127659574468085,
    "ast": 5.829787234042553,
    "stl": 2.617021276595745,
    "tov": 2.3191489361702127,
    "blk": 0
   },
   "somma": {
    "pts": 1158,
    "reb": 288,
    "ast": 274,
    "stl": 123,
    "tov": 109,
    "blk": 0
   },
   "max": {
    "pts": 37,
    "reb": 10,
    "ast": 10,
    "stl": 4,
    "tov": 5,
    "blk": 0
   }
  },
  {
   "nome": "Paul George",
   "gp": 46,
   "medie": {
    "pts": 22.52173913043478,
    "reb": 7.108695652173913,
    "ast": 3.130434782608696,
    "stl": 2.3260869565217392,
    "tov": 2.5434782608695654,
    "blk": 0
   },
   "somma": {
    "pts": 1036,
    "reb": 327,
    "ast": 144,
    "stl": 107,
    "tov": 117,
    "blk": 0
   },
   "max": {
    "pts": 38,
    "reb": 10,
    "ast": 5,
    "stl": 4,
    "tov": 5,
    "blk": 0
   }
  },
  {
   "nome": "Jrue Holiday",
   "gp": 44,
   "medie": {
    "pts": 21.818181818181817,
    "reb": 5.0227272727272725,
    "ast": 7.2727272727272725,
    "stl": 2.3636363636363638,
    "tov": 2.977272727272727,
    "blk": 0.3409090909090909
   },
   "somma": {
    "pts": 960,
    "reb": 221,
    "ast": 320,
    "stl": 104,
    "tov": 131,
    "blk": 15
   },
   "max": {
    "pts": 31,
    "reb": 8,
    "ast": 11,
    "stl": 4,
    "tov": 5,
    "blk": 2
   }
  },
  {
   "nome": "Pau Gasol",
   "gp": 38,
   "medie": {
    "pts": 20.63157894736842,
    "reb": 11.5,
    "ast": 3.3947368421052633,
    "stl": 0.07894736842105263,
    "tov": 1.4210526315789473,
    "blk": 3.289473684210526
   },
   "somma": {
    "pts": 784,
    "reb": 437,
    "ast": 129,
    "stl": 3,
    "tov": 54,
    "blk": 125
   },
   "max": {
    "pts": 32,
    "reb": 15,
    "ast": 6,
    "stl": 1,
    "tov": 4,
    "blk": 4
   }
  },
  {
   "nome": "Paul Millsap",
   "gp": 36,
   "medie": {
    "pts": 20.166666666666668,
    "reb": 10.5,
    "ast": 3.5,
    "stl": 2.4444444444444446,
    "tov": 1.4444444444444444,
    "blk": 2.888888888888889
   },
   "somma": {
    "pts": 726,
    "reb": 378,
    "ast": 126,
    "stl": 88,
    "tov": 52,
    "blk": 104
   },
   "max": {
    "pts": 31,
    "reb": 14,
    "ast": 6,
    "stl": 4,
    "tov": 4,
    "blk": 5
   }
  },
  {
   "nome": "Kawhi Leonard",
   "gp": 35,
   "medie": {
    "pts": 25.085714285714285,
    "reb": 8.17142857142857,
    "ast": 4.3428571428571425,
    "stl": 2.8857142857142857,
    "tov": 1.8571428571428572,
    "blk": 0.4
   },
   "somma": {
    "pts": 878,
    "reb": 286,
    "ast": 152,
    "stl": 101,
    "tov": 65,
    "blk": 14
   },
   "max": {
    "pts": 37,
    "reb": 12,
    "ast": 7,
    "stl": 4,
    "tov": 4,
    "blk": 2
   }
  },
  {
   "nome": "Tyreke Evans",
   "gp": 34,
   "medie": {
    "pts": 17.764705882352942,
    "reb": 5.852941176470588,
    "ast": 6.735294117647059,
    "stl": 1.911764705882353,
    "tov": 2.9411764705882355,
    "blk": 0
   },
   "somma": {
    "pts": 604,
    "reb": 199,
    "ast": 229,
    "stl": 65,
    "tov": 100,
    "blk": 0
   },
   "max": {
    "pts": 29,
    "reb": 9,
    "ast": 9,
    "stl": 4,
    "tov": 4,
    "blk": 0
   }
  },
  {
   "nome": "Draymond Green",
   "gp": 31,
   "medie": {
    "pts": 15.290322580645162,
    "reb": 9.064516129032258,
    "ast": 6.580645161290323,
    "stl": 2.2903225806451615,
    "tov": 2.193548387096774,
    "blk": 1.903225806451613
   },
   "somma": {
    "pts": 474,
    "reb": 281,
    "ast": 204,
    "stl": 71,
    "tov": 68,
    "blk": 59
   },
   "max": {
    "pts": 24,
    "reb": 15,
    "ast": 9,
    "stl": 4,
    "tov": 4,
    "blk": 4
   }
  },
  {
   "nome": "Derrick Favors",
   "gp": 28,
   "medie": {
    "pts": 18.928571428571427,
    "reb": 11.321428571428571,
    "ast": 1.1428571428571428,
    "stl": 1.1785714285714286,
    "tov": 0.5714285714285714,
    "blk": 2.9642857142857144
   },
   "somma": {
    "pts": 530,
    "reb": 317,
    "ast": 32,
    "stl": 33,
    "tov": 16,
    "blk": 83
   },
   "max": {
    "pts": 27,
    "reb": 15,
    "ast": 4,
    "stl": 3,
    "tov": 3,
    "blk": 5
   }
  },
  {
   "nome": "James Johnson",
   "gp": 28,
   "medie": {
    "pts": 17.785714285714285,
    "reb": 8.535714285714286,
    "ast": 3.7142857142857144,
    "stl": 2.1785714285714284,
    "tov": 1.8214285714285714,
    "blk": 2.1785714285714284
   },
   "somma": {
    "pts": 498,
    "reb": 239,
    "ast": 104,
    "stl": 61,
    "tov": 51,
    "blk": 61
   },
   "max": {
    "pts": 25,
    "reb": 12,
    "ast": 5,
    "stl": 4,
    "tov": 4,
    "blk": 4
   }
  },
  {
   "nome": "Joel Embiid",
   "gp": 24,
   "medie": {
    "pts": 26.833333333333332,
    "reb": 11.625,
    "ast": 3.25,
    "stl": 0.9583333333333334,
    "tov": 3.25,
    "blk": 3.2916666666666665
   },
   "somma": {
    "pts": 644,
    "reb": 279,
    "ast": 78,
    "stl": 23,
    "tov": 78,
    "blk": 79
   },
   "max": {
    "pts": 40,
    "reb": 16,
    "ast": 6,
    "stl": 4,
    "tov": 5,
    "blk": 5
   }
  },
  {
   "nome": "Karl-Anthony Towns",
   "gp": 24,
   "medie": {
    "pts": 20.75,
    "reb": 13.125,
    "ast": 2.5,
    "stl": 0.375,
    "tov": 1.4166666666666667,
    "blk": 2.25
   },
   "somma": {
    "pts": 498,
    "reb": 315,
    "ast": 60,
    "stl": 9,
    "tov": 34,
    "blk": 54
   },
   "max": {
    "pts": 29,
    "reb": 17,
    "ast": 5,
    "stl": 2,
    "tov": 3,
    "blk": 4
   }
  },
  {
   "nome": "Manu Ginobili",
   "gp": 23,
   "medie": {
    "pts": 18.565217391304348,
    "reb": 4.521739130434782,
    "ast": 5.391304347826087,
    "stl": 3.130434782608696,
    "tov": 2.6956521739130435,
    "blk": 0.043478260869565216
   },
   "somma": {
    "pts": 427,
    "reb": 104,
    "ast": 124,
    "stl": 72,
    "tov": 62,
    "blk": 1
   },
   "max": {
    "pts": 28,
    "reb": 6,
    "ast": 8,
    "stl": 4,
    "tov": 4,
    "blk": 1
   }
  },
  {
   "nome": "Rudy Gobert",
   "gp": 22,
   "medie": {
    "pts": 14.454545454545455,
    "reb": 14.136363636363637,
    "ast": 0.5454545454545454,
    "stl": 0.22727272727272727,
    "tov": 0.8181818181818182,
    "blk": 3.772727272727273
   },
   "somma": {
    "pts": 318,
    "reb": 311,
    "ast": 12,
    "stl": 5,
    "tov": 18,
    "blk": 83
   },
   "max": {
    "pts": 18,
    "reb": 18,
    "ast": 3,
    "stl": 1,
    "tov": 3,
    "blk": 5
   }
  },
  {
   "nome": "Robert Covington",
   "gp": 21,
   "medie": {
    "pts": 17.333333333333332,
    "reb": 8.571428571428571,
    "ast": 1.9047619047619047,
    "stl": 2.4761904761904763,
    "tov": 2.0952380952380953,
    "blk": 0.2857142857142857
   },
   "somma": {
    "pts": 364,
    "reb": 180,
    "ast": 40,
    "stl": 52,
    "tov": 44,
    "blk": 6
   },
   "max": {
    "pts": 24,
    "reb": 11,
    "ast": 5,
    "stl": 5,
    "tov": 5,
    "blk": 1
   }
  },
  {
   "nome": "John Wall",
   "gp": 20,
   "medie": {
    "pts": 22.9,
    "reb": 5.55,
    "ast": 8.65,
    "stl": 3.45,
    "tov": 3.15,
    "blk": 0.7
   },
   "somma": {
    "pts": 458,
    "reb": 111,
    "ast": 173,
    "stl": 69,
    "tov": 63,
    "blk": 14
   },
   "max": {
    "pts": 35,
    "reb": 8,
    "ast": 12,
    "stl": 4,
    "tov": 4,
    "blk": 2
   }
  },
  {
   "nome": "Jeremy Lamb",
   "gp": 20,
   "medie": {
    "pts": 18.55,
    "reb": 6.15,
    "ast": 4.35,
    "stl": 1.85,
    "tov": 1.35,
    "blk": 1.2
   },
   "somma": {
    "pts": 371,
    "reb": 123,
    "ast": 87,
    "stl": 37,
    "tov": 27,
    "blk": 24
   },
   "max": {
    "pts": 30,
    "reb": 8,
    "ast": 7,
    "stl": 4,
    "tov": 3,
    "blk": 4
   }
  },
  {
   "nome": "Kyle Lowry",
   "gp": 18,
   "medie": {
    "pts": 17.666666666666668,
    "reb": 6.111111111111111,
    "ast": 6.777777777777778,
    "stl": 2.388888888888889,
    "tov": 2.5,
    "blk": 0.16666666666666666
   },
   "somma": {
    "pts": 318,
    "reb": 110,
    "ast": 122,
    "stl": 43,
    "tov": 45,
    "blk": 3
   },
   "max": {
    "pts": 28,
    "reb": 9,
    "ast": 8,
    "stl": 4,
    "tov": 4,
    "blk": 1
   }
  },
  {
   "nome": "Nikola Vucevic",
   "gp": 16,
   "medie": {
    "pts": 23,
    "reb": 12.5,
    "ast": 4.5,
    "stl": 1.0625,
    "tov": 1.875,
    "blk": 2.875
   },
   "somma": {
    "pts": 368,
    "reb": 200,
    "ast": 72,
    "stl": 17,
    "tov": 30,
    "blk": 46
   },
   "max": {
    "pts": 34,
    "reb": 17,
    "ast": 7,
    "stl": 2,
    "tov": 4,
    "blk": 4
   }
  },
  {
   "nome": "Rudy Gay",
   "gp": 16,
   "medie": {
    "pts": 18.125,
    "reb": 7.75,
    "ast": 4,
    "stl": 1.3125,
    "tov": 2.375,
    "blk": 0.125
   },
   "somma": {
    "pts": 290,
    "reb": 124,
    "ast": 64,
    "stl": 21,
    "tov": 38,
    "blk": 2
   },
   "max": {
    "pts": 25,
    "reb": 12,
    "ast": 6,
    "stl": 2,
    "tov": 4,
    "blk": 1
   }
  }
 ]
};
