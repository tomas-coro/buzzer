# Piano - reparti, coach 2K e partita a due lati

Deciso col grill del 2026-08-17 (5 blocchi). Questo file esiste perché il lavoro
dura più di una sessione: se la chat si chiude, il piano resta qui.

## Cosa cambia, in una riga

Oggi la partita è `media OVR tua >= media OVR loro`. Dopo, la partita si gioca a
**quattro quarti con un punteggio vero** (tipo 112-108), i giocatori hanno **cinque
reparti** e il coach sposta quei reparti in bene e in male, stile NBA 2K.

## Decisioni chiuse

- **5 reparti**: Tiro3 · Finalizzazione · Difesa · Rimbalzi · Regia.
- **Ritmo**: non è un reparto dei giocatori, è la **manopola del coach**. Decide i
  possessi, cioè se finisce 128-124 o 96-92.
- **Coach = 2 plus + 1 malus** sui reparti + una manopola ritmo. I voti A-F off/def
  spariscono. I 12 coach attuali si **convertono** (nome e tattica restano), si sale
  a ~30 per avere varianza; se ne pescano 3 a run, uno per profilo.
- **Effetto coach visibile prima di scegliere**: anteprima sui tuoi 5 giocatori.
- **Partita a due lati**: i tuoi punti nascono dal tuo attacco contro la loro difesa.
  Non è scontato che l'OVR più alto vinca, ma va calibrato: con una difesa scarna
  devi segnare tanto per restare in piedi.
- **Varianza sì**, e **legata all'equilibrio**: entri nel 4° quarto con <=5 di scarto
  e la varianza sale; sei sopra di 20 e non succede niente. Niente peso fisso
  sull'ultimo quarto (Tomas non era convinto, questa è l'alternativa approvata).
- **Punteggi realistici**, con partite anche basse (una da 90 punti deve poter
  esistere), non solo 110-120.
- **Cronaca**: una riga per quarto, generata dai dati veri.
- **Velocità della simulazione scelta dal giocatore** (riferimento: 7a0.com.br).
  I tempi sono **per quarto**: Lenta ~4 s · Normale ~2 s · Rapida ~0,8 s · Salta.
  Cambiabile **in corsa**, non solo all'inizio: la corsa è di 16 partite, a Lenta
  sarebbero ~4,5 minuti di sola simulazione.
- **Normalizzazione dei reparti = percentile dentro la stagione**, non assoluto su
  tutte le 2412 carte: 25 punti nel 1985 e nel 2019 non valgono uguale.
- **Coach avversario reale**: rimandato (serve uno scraper Basketball Reference).
  In v1 gli avversari hanno un ritmo neutro.

## Dati disponibili (verificato)

Ogni carta ha `stats_real` con: `pts reb ast stl blk tov fg_pct tp_pct ft_pct min
gp plus_minus`. **Non** ci sono i tentativi da tre né i tiri per zona: Tiro3 e Difesa
sono per forza **proxy dichiarati in scheda** ("stima da box score"), come concordato.

## Tappe

### A - reparti - FATTO (2026-08-17)

`game/reparti.js` + `game/reparti.test.js` (24 test), calcolo agganciato a
`build-cards.mjs`, `cards.js` rigenerato: **2412 carte su 2412 coi volumi veri**.
Suite: 62 motore + 35 prototipo, tutti verdi.

In corso d'opera è saltato fuori che senza i tentativi di tiro i reparti erano
inservibili, quindi è nato `tools/build-shooting.py` → `data/shooting-br.json`
(3053 voci: tentativi da tre, tiri da due, rimbalzi offensivi e difensivi separati).

Quattro difetti trovati e corretti guardando i risultati veri, non i test:
1. riserve da pochi minuti in cima ai reparti → correzione per minuti totali giocati
   (`affidabilita`, K = 800 minuti), che però **non tocca il tiro da tre**: lì i
   tentativi sono un dato certo, non un campione piccolo;
2. centri incoronati tiratori → il reparto tiro passa **tutto** dal volume di
   tentativi, la qualità pesa dentro il volume e non può crearlo dal nulla;
3. percentuale da tre su pochi tentativi → stabilizzata con 50 tentativi di prior
   alla media lega (35%);
4. 35 carte senza volumi per colpa dei nomi → normalizzazione tollerante
   (`chiaveVolumi`): iniziali puntate ("C.J." = "CJ"), lettere turche/polacche che
   NFKD non scompone, alias (Basketball-Reference chiama Enes Kanter "Enes Freedom"),
   e il suffisso "jr" tolto solo se sta in fondo (prima "JR Smith" diventava "smith").

Nota per il futuro: lo stesso difetto del suffisso vive ancora in `normalizeName` e
quindi in `data/positions-pbp.json`; lì non l'ho toccato per non rigenerare le
posizioni, ma JR Smith ha la posizione dedotta invece che reale.

### A - impianto originale (`game/reparti.js` + build)
I cinque valori 0-99 si calcolano **a build-time** in `build-cards.mjs` e finiscono
sulla carta come `reparti: {t3, fin, dif, reb, reg}`. Il motore resta puro: non deve
conoscere le 2412 carte per fare un percentile.

Proxy di partenza (tarabili): `t3` da tp_pct pesata sul volume stimato · `fin` da
fg_pct + punti per minuto · `dif` da (stl+blk) per minuto con plus_minus come
correttivo · `reb` da rimbalzi per minuto · `reg` da assist per minuto meno palle
perse. Poi **percentile dentro la stagione** con una soglia minima di minuti, così
i 4 minuti a partita non producono mostri.

### B - simulazione partita (`game/partita.js`)
`simulaPartita({tuoi, loro, coachTuo, coachLoro, rng})` → `{punti, quarti[],
cronaca[], vincitore}`. Possessi dal ritmo dei due coach; efficienza offensiva dai
reparti d'attacco contro quelli difensivi avversari; punti per quarto con varianza;
overtime se pari. **RNG iniettabile** per avere test deterministici.
Calibrazione al banco su ~1000 partite simulate: media ~110, coda bassa fino a ~90.

### C - motore (`rating.js`, `coach.js`, `run.js`)
`applyCoach` non moltiplica più un voto unico: applica plus/malus ai reparti della
squadra. `esitoRound` chiama la simulazione. `storia` salva il punteggio vero.
Test di `rating`/`coach`/`run` da riscrivere.

### D - coach (`prototype/imbattuto/coaches.js`)
Conversione dei 12 + 18 nuovi, ognuno con 2 plus, 1 malus e il ritmo.

### E - UI (mockup prima, poi porting)
Mockup nuovo del tabellone: punteggio che sale a quarti, riga di cronaca, tempo,
selettore velocità. 2-3 direzioni per il blocco cronaca. Poi `screens/run.js` e
`screens/coach.js` (scheda coach con plus/malus e anteprima sui tuoi reparti).

## Stime

A ~3 ore · B ~4 ore · C ~2 ore · D ~2 ore · E ~4 ore. In tutto: circa due giornate
di lavoro, non una.

## Aperti

- Tempi esatti dei preset velocità: si sentono nel mockup, non si decidono a tavolino.
- Ritaratura di `oppMin`/`oppMax` in `difficulty.js`: la selezione dell'avversario
  resta sul voto sintetico, ma le soglie vanno riviste quando la partita cambia.
- Peso dei reparti nel voto sintetico mostrato in scheda (resta una sintesi, non
  decide più la partita).
