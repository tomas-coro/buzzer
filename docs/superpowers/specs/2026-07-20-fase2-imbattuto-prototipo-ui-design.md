# Design — Piano B: Prototipo UI cliccabile L'IMBATTUTO

**Data:** 2026-07-20
**Stato:** design approvato in brainstorming; spec da rivedere prima del piano di implementazione.
**Spec padre:** `2026-07-20-fase2-imbattuto-fast-design.md` (modalità) — questo ne è la UI di Piano B.
**Motore:** `game/*.js` (Piano A, 38 test verdi) — riusato, non riscritto.

---

## 1. Visione in una riga

Una web-app statica **cliccabile** che fa girare il loop completo di L'IMBATTUTO
(Home → Draft → Coach → Run → Esito → Leaderboard) **collegata al motore vero**
`game/*.js`, così Tomas può toccarla come il gioco reale e approvare flusso ed
estetica **prima** di costruire l'app definitiva. È il "mockup prima dell'app".

## 2. Cosa NON è (confini)

- **Non** è l'app di produzione: è il prototipo di validazione (mockup-first). La
  rifinitura da app-vera viene dopo l'approvazione del flusso.
- **Non** ricostruisce il dataset definitivo per-stagione (attributi reali per tutte
  le 2412 carte): quello è un **step dati separato** (di fatto lo Step 2, sorgente
  nba-sim), da fare prima dell'app vera.
- **Non** implementa il motore meta di Piano C (leaderboard/awards/stats "veri"):
  qui il meta è un localStorage minimo, segnaposto.
- **Non** reintroduce scelte estetiche: la direzione è già fissata (spec modalità §10).

## 3. Decisioni bloccate (da brainstorming)

1. **Deliverable:** UN prototipo integrato end-to-end, non schermate isolate.
2. **Motore vero:** le schermate chiamano `game/*.js` (`newRun`, `draftPick`,
   `useAid`, `chooseCoach`, `startRun`, `resolveRound`, `buildHistoricalQuintets`,
   `pickOpponent`), non logica duplicata.
3. **Sequenza:** prototipo UI **prima**, dataset definitivo **dopo** (scelta Tomas).
4. **Dati prototipo = blend** (vedi §6): rose vere per team-stagione da buzzer +
   attributi/posizioni reali da nba-sim dove il nome combacia; il resto derivato al
   volo dall'OVR **solo per il mockup**, marcato come provvisorio a schermo.
5. **Draft:** **spin automatico** team+stagione ad ogni turno (spec modalità §4).
6. **Leaderboard:** **minimo funzionante** (localStorage), non rifinito.
7. **Estetica:** riuso della direzione dei mockup esistenti (near-black + accento
   oro, display condensato maiuscolo, tema arena/sirena).

## 4. Architettura

Cartella nuova `prototype/imbattuto/`:

- `index.html` — contenitore, carica CSS e `app.js` (come modulo).
- `app.js` — orchestratore: tiene lo stato del run (l'oggetto `State` del motore),
  fa il rendering della schermata corrente, gestisce gli eventi, chiama il motore.
- `cards.js` — dati carte del prototipo (generato, vedi §6), esporta il pool
  raggruppato per `team|stagione` e helper di pesca.
- `styles.css` — stile condiviso (estratto/rifuso dai mockup di riferimento).
- `meta.js` — persistenza leaderboard/stats minima su `localStorage`.

**Modello di esecuzione:**
- `app.js` **importa** i moduli ES del motore (`../../game/run.js`, ecc.). Gli import
  ES da `file://` sono bloccati dal browser → il prototipo si serve con
  `python3 -m http.server` da root repo e si apre su
  `http://localhost:PORT/prototype/imbattuto/`.
- **Stato unico:** l'oggetto `State` del motore è la sorgente di verità; `app.js` non
  duplica campi di gioco, li legge da lì. Ogni azione UI produce un **nuovo** `State`
  (le funzioni del motore sono pure) e ri-renderizza.
- **Router schermate:** funzione dello `stato` del run (`draft`/`coach`/`run`/`finito`)
  + fasi UI locali (home, leaderboard) che non sono stati del motore.

## 5. Le schermate (variante scelta tra i mockup)

Dove esistono più varianti, l'implementatore parte dalla variante indicata; Tomas
può ridirigere puntando il dito sul prototipo.

| # | Schermata | Base mockup | Motore chiamato |
|---|---|---|---|
| 1 | Home: formato + difficoltà | `20`, `21` | `newRun({formato,difficolta})` |
| 2 | Draft "1 fra 5" (5 turni) | `45`, `42`; scheda candidato `25` | spin (§6) → `draftPick`; aiuti → `useAid` |
| 3 | Coach (voti OFF/DEF) | da `50`/`51` | `chooseCoach(coach)` |
| 4 | Run: tabellone + meter calore | tabellone `24`, meter `23` | `startRun`/`resolveRound` |
| 5 | Esito (imbattuto/sconfitta) | fine-run `51` | legge `esito` dallo `State` |
| 6 | Leaderboard (minimo) | nuova, stile arena | `meta.js` (localStorage) |

**Flusso e aiuti:** il draft mostra gli aiuti disponibili dallo `State.aids`
(dipendenti dalla difficoltà) e li consuma via `useAid`; in Facile gli switch sono
liberi. A quintetto completo (`stato="coach"`) si passa alla schermata Coach.

## 6. Dati del prototipo (blend)

Script generatore `prototype/imbattuto/build-cards.mjs` (una tantum, node) che
produce `cards.js`:

1. Legge `data/nba-data.js` (2412 carte reali: nome, team, stagione, OVR, stats).
2. Legge l'export nba-sim `mockups/59-players-data.js` (giocatori con `pos`,
   `att[7]`, `def[5]` reali).
3. **Join per nome:** dove il nome combacia (≈165), la carta prende attributi e
   posizione reali (`estimated:false`).
4. **Fallback derivato (solo mockup):** dove non combacia, deriva `att[7]`/`def[5]`
   in modo plausibile dall'OVR + dalle `stats_real` (es. tp_pct→Tiro 3, reb→Rimbalzi)
   e assegna una posizione da euristica; marca `estimated:true`.
5. **Struttura carta** compatibile col motore (Global Constraints Piano A):
   `{ player_id, name, season, team, team_abbr, ovr, pos:{primary,secondary}, att:[7], def:[5], estimated }`.
6. Esporta `CARDS_BY_TEAM_SEASON` (`{ "GSW|2015-16": Card[], ... }`) per lo spin e per
   `buildHistoricalQuintets` (pool avversari).

**A schermo:** le carte `estimated:true` mostrano un piccolo marcatore ("attributi
provvisori") — niente valori finti spacciati per reali (coerente con "niente
fallback silenzioso").

**Spin automatico (draft):** ad ogni turno il prototipo estrae a caso una coppia
team+stagione che abbia ≥5 candidati compatibili col ruolo del turno, ne mostra 5,
Tomas ne sceglie 1. Se <5 candidati → ri-estrae (o usa un aiuto). Mai riempire con
carte inventate oltre il fallback derivato dichiarato.

## 7. Cosa è vero vs provvisorio

- **Vero (motore Piano A):** assegnamento slot per ruolo, voto squadra, effetto coach,
  bracket avversari storici, esito round (Approccio A), aiuti, difficoltà.
- **Provvisorio (dichiarato):** parte degli attributi carta (fallback derivato);
  meta/leaderboard/stats (localStorage minimo, non il motore Piano C).

## 8. Gestione errori (niente fallback silenzioso)

- Se un team-stagione ha <5 candidati per il ruolo → messaggio chiaro + ri-spin,
  mai quintetto finto (già garantito dal motore e dallo spin).
- Carte `estimated:true` marcate a schermo, non nascoste.
- Errore del motore (es. slot occupato) → non deve mai accadere dalla UI (il flusso
  guida gli input); se accade, mostrare l'errore, non ingoiarlo.

## 9. Definition of Done — prototipo

- Loop completo cliccabile Home→Draft→Coach→Run→Esito→Leaderboard, servito localmente.
- Draft 5 slot "1 fra 5" con spin automatico e aiuti corretti per difficoltà.
- Coach selezionabile con effetto visibile sul voto (ATT/DIF).
- Run contro quintetti storici reali: streak, meter, soglia crescente, fine-run
  corretti — guidati dal motore vero.
- Leaderboard minima persistita in localStorage.
- Estetica coerente con la direzione dei mockup di riferimento.
- Tomas può giocare un run intero e approvare flusso + estetica.

## 10. Fuori scope / prossimi passi

- **Dataset definitivo per-stagione** (attributi reali per tutte le carte, via
  derivazione nba-sim su buzzer): step dati separato, prima dell'app vera.
- **Motore meta Piano C** (leaderboard/awards/stats reali + persistenza).
- **App di produzione** (rifinitura, responsive completo, integrazione col resto).

## 11. Rischi / punti aperti

- **Estetica frammentata:** i 60 mockup hanno più varianti per schermata; il rischio
  è incoerenza una volta assemblati. Mitigazione: `styles.css` condiviso e scelte di
  variante dichiarate in §5, con revisione visiva di Tomas sul prototipo.
- **Sparsità dello spin:** con pool ridotto un team-stagione potrebbe non avere 5
  candidati per ogni ruolo; il fallback derivato (che copre tutte le 2412 carte
  buzzer) mitiga, ma i 5 candidati devono restare compatibili col ruolo.
- **Import ES da file://:** vanno serviti via http.server; documentare il comando di
  avvio nel README del prototipo.
- **Fedeltà attributi:** i voti squadra reali arriveranno solo col dataset
  definitivo; nel prototipo servono a testare il *flusso*, non il bilanciamento fine.
