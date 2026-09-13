# Serie Playoff (design)

## Contesto

Oggi L'IMBATTUTO ha un solo formato attivo: `"imbattuto"` (16-0), 16 round
singoli, una sconfitta finisce la corsa. `formato` è già un campo dello stato
(`game/run.js:newRun`) ed è già tracciato dalla leaderboard (`meta.js`), ma il
prototipo ne usa uno solo - le altre due card in home (`Serie Playoff`,
`82-0 Stagione`, oltre a `★ Sfida`) sono placeholder "presto".

Questa spec copre la prima delle tre: **Serie Playoff**. Deciso via grill-me
(13/09/2026, tutte risposte raccomandate confermate) di affrontarla prima
delle altre due perché riusa quasi tutto il motore partita già pronto.

## Decisioni (grill-me, 13/09/2026)

1. **Regola sconfitta**: una sconfitta NON finisce più la corsa da sola. Le
   partite si giocano in serie al meglio delle 7 (come i veri playoff NBA):
   la serie continua finché nessuno dei due arriva a 4 vittorie. La corsa
   finisce solo se **perdi la serie** (l'avversario arriva a 4 prima di te).
2. **Traguardo finale**: 4 serie per vincere la modalità, non 16. Stesso
   schema dei playoff NBA veri: Round 1 → Semifinale di conference → Finale
   di conference → Finale NBA. Ogni round è una serie a sé, con un avversario
   diverso e via via più forte (stesso principio di `oppMin/oppMax` crescente
   per round già usato in `game/difficulty.js`).
3. **Draft e coach**: restano identici al formato attuale. Stessa rosa da 10,
   stesso salary cap per difficoltà, stessi aiuti (re-spin/squadra/stagione),
   stesso reveal a gradini, un solo coach scelto per l'intera corsa. Nessuna
   ritaratura di tetto/aiuti per il nuovo formato.
4. **Avversario dentro la serie**: la stessa squadra-stagione storica per
   tutte le gare della serie (realistico: affronti es. i Lakers 86-87 su
   tutte le gare finché la serie non finisce). Cambia solo quando si passa al
   round successivo.
5. **UI**: il tabellone a 16 tacche del formato attuale non si applica.
   Sostituito da un doppio contatore: "Round X di 4" + punteggio di serie
   corrente in stile playoff vero (es. "2-1"), aggiornato dopo ogni gara.
6. **Copy vittoria finale**: NON "SEI IMBATTUTO" (con gare perse dentro le
   serie non sarebbe letteralmente vero). Nuovo esito **"Campione"** per il
   formato playoff, con schermata/testo dedicati.

## Architettura

Nessuna riscrittura del motore esistente. Il formato `"imbattuto"` non viene
toccato in nessun punto: si aggiunge un percorso parallelo per `"playoff"`,
scelto da `app.js` in base a `state.formato`.

### `game/run.js`

- **`newRun`**: nessuna modifica ai campi esistenti. Per `formato: "playoff"`
  si aggiungono in più, inizializzati a `startRun`:
  - `gara: 0` - quale partita della serie corrente (1→7).
  - `serieRecord: { noi: 0, loro: 0 }` - vittorie nella serie in corso.
  - `round` resta il contatore esistente ma per questo formato indica il
    round dei playoff (1→4), non il round singolo di "imbattuto".
- **`startRun`**: per `formato: "playoff"`, oltre a quanto già fa
  (`round = 1`, avversario pescato), inizializza `gara = 1` e
  `serieRecord = { noi: 0, loro: 0 }`.
- **Nuova funzione `resolveSeriesGame(state)`**, gemella di `resolveRound` ma
  con la logica di serie:
  - Calcola `partitaRound(state)` come oggi (la simulazione della singola
    partita non cambia).
  - Aggiorna `serieRecord` in base al vincitore.
  - Se il giocatore arriva a 4 vittorie nella serie → serie vinta:
    - se `round < 4` → avanza a `round + 1`, pesca nuovo avversario (stesso
      `pickOpponent` con soglie crescenti), resetta `gara = 1` e
      `serieRecord = { noi: 0, loro: 0 }`.
    - se `round === 4` → corsa finita, `stato: "finito"`, `esito: "campione"`.
  - Se l'avversario arriva a 4 vittorie nella serie → corsa finita,
    `stato: "finito"`, `esito: "sconfitta"` (stesso esito testuale di oggi,
    resta corretto).
  - Altrimenti (serie ancora aperta) → `gara = gara + 1`, stesso avversario,
    stato resta `"run"`.
  - Il seed della singola gara: `rngSeed(state.seme + state.round * 7 +
    state.gara)`, per non ripetere lo stesso RNG tra gare diverse della
    stessa serie (oggi `resolveRound` usa solo `seme + round`, che basta
    perché non esistono gare multiple nello stesso round).
  - Stessa forma di `storia` di `resolveRound` (una entry per partita
    giocata, non per serie) - la schermata esito di fine corsa deve poter
    mostrare tutte le gare, non solo il riepilogo di serie.
- **`esitoRound`**: resta invariata, usata da entrambi i formati per il
  verdetto pre-`resolveRound`/`resolveSeriesGame` durante l'animazione del
  buzzer.
- **`partitaRound`**: non cambia. Legge `state.round` per il seed - per il
  formato playoff questo seed di *turno* è comunque combinato con `gara` solo
  dentro `resolveSeriesGame`, quindi va allineato: `partitaRound` deve usare
  la stessa combinazione `round*7 + gara` quando `state.formato === "playoff"`
  (altrimenti la partita mostrata prima del buzzer e quella risolta dopo
  userebbero seed diversi). Punto tecnico da chiudere in fase di piano, non
  un fork di design.

### `app.js`

- **Case `resolveRound`** (o nuovo case dedicato, da decidere in fase di
  piano): se `state.formato === "playoff"` chiama `resolveSeriesGame`,
  altrimenti `resolveRound` come oggi.
- Nessun'altra modifica al ciclo draft → coach → run: identico per entrambi i
  formati.

### UI (`prototype/imbattuto/`)

- **`screens/home.js`**: la card "Serie Playoff" perde `<span class="soon">`
  e diventa cliccabile, come "16-0" oggi.
- **`screens/difficolta.js`**: stessa schermata di scelta difficoltà, dispatch
  `newRun({ formato: "playoff", ... })` invece di `"imbattuto"`.
- **`screens/run.js`**: il tabellone a tacche (`.sh-ticks`, oggi generato da
  `N` = 16) non si applica al formato playoff. Nuovo blocco doppio contatore:
  "Round X di 4" + punteggio di serie ("2-1"), visibile solo quando
  `state.formato === "playoff"`. Il tabellone a tacche resta per `"imbattuto"`
  esattamente come oggi.
- **`screens/esito.js`**: nuovo esito `"campione"` con testo/schermata
  dedicati (non riusa "SEI IMBATTUTO"). L'esito `"sconfitta"` resta lo stesso
  componente di oggi per entrambi i formati.
- **`meta.js` / `screens/leaderboard.js`**: `formato` smette di essere
  hardcodato a `"imbattuto"` in `leaderboard.js:38` - bucket separato per
  `"playoff"`, stessa struttura dati già supportata da `meta.js`.

## Non tocca

- `game/partita.js` (simulazione della singola partita), `game/coach.js`,
  `game/rosa.js`, `game/difficulty.js` (tetti/aiuti per difficoltà - restano
  gli stessi valori, applicati identici a entrambi i formati).
- Il draft manuale e l'autobuild draft-live appena chiusi
  (`docs/superpowers/specs/2026-09-11-autobuild-draft-live-design.md`): la
  UI di draft non sa e non deve sapere in che formato è la corsa.
- Il formato `"imbattuto"` esistente: `resolveRound`, il tabellone a tacche,
  l'esito "imbattuto" restano bit-per-bit come sono oggi.

## Testing

- Casi da coprire: vittoria di serie (4-0, 4-3, tutte le combinazioni di
  vittorie/sconfitte che portano a 4), sconfitta di serie, vittoria della
  4ª serie (esito "campione"), verifica che l'avversario resti lo stesso per
  tutte le gare di una serie e cambi solo al round successivo, verifica che
  il seed non produca la stessa identica partita per due gare diverse della
  stessa serie.
- Nessun impatto atteso sul formato `"imbattuto"`: i test esistenti su
  `game/run.js` (`resolveRound`, `startRun`) devono continuare a passare
  invariati - la spec non modifica quel percorso.
