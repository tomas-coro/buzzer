# Autobuild draft live sulla board (design)

## Contesto

Playtest mobile reale del 10/09/2026 (vedi memoria `playtest-mobile-reale-6-problemi`):
oggi "Completa rosa" (`autoDraft` in `app.js:89-110`) calcola tutta la rosa in un
colpo con un `while` sincrono e salta a `draftReveal.js`, una schermata separata
con scaletta a comparsa e auto-avanzamento a timer.

Direzione confermata da Tomas: riempire live gli slot sulla board di draft vera,
uno alla volta, stile FIFA - stessa animazione della pesca manuale (ticker di
ricerca + volo mirino), ma comandata da sola invece che da un click. Niente
pagina a parte.

## Decisioni (grill-me, 11/09/2026)

1. **Cadenza**: stessa sequenza visiva del pick manuale, senza velocizzarla -
   ticker "radar lock" (~610ms) + volo mirino (~620ms) per ogni slot, come oggi.
   Non un ritmo fisso più corto pensato apposta per l'auto: il peso di ogni
   pick è quello che regge l'illusione "stile FIFA".
2. **Interazione durante l'autoplay**: UI bloccata. Un solo bottone "Ferma"
   interrompe l'automatismo e torna al draft manuale con la rosa fatta fino a
   quel punto (i pick già piazzati restano, non si annullano).
3. **Fine sequenza**: quando l'ultima casella si riempie, la board resta
   visibile a piena rosa un istante, poi compare un bottone "Vai al coach".
   Niente timer automatico, niente `draftReveal.js`.

## Architettura

Nessuna schermata nuova. L'autobuild ripercorre lo stesso codice del pick
manuale già in `draft.js` (ticker + `selectCand` + `placeIn` + `flyMirino`),
solo scatenato da un timer/callback invece che da un click reale. La decisione
di QUALE carta e QUALE slot prendere resta nel motore (`sceltaAutoDraft`,
`game/run.js`, non toccato): `draft.js` non deve importare logica di gioco, solo
eseguire un pick già deciso.

### `app.js`

- **Nuovo helper** `spinAutoStep(malusMax)`: pesca rose (`spinRosterView`) e
  prova `sceltaAutoDraft` finché non trova un pick valido (stesso limite di 500
  giri di guardia di oggi, per evitare loop infiniti se la rosa non è
  completabile). Ritorna il `draftView` da mostrare con `auto: { cardIndex,
  slotKey, costo, malusMax }` già risolto - lo spin che l'utente vede in
  autoplay ha SEMPRE un esito garantito, niente ticker "a vuoto" su spin
  scartati internamente.
- **Case `autoDraft`**: non fa più il `while` sincrono. Chiama
  `spinAutoStep(action.malusMax)` una volta e imposta quel `draftView`. Non
  tocca più `ui` (niente salto a `draftReveal`).
- **Case `assign`**: quando l'azione porta `auto` (cioè il piazzamento è
  arrivato dall'autoplay di `draft.js`, non da un click umano):
  - se `state.stato` resta `"draft"` dopo il piazzamento → prossimo step:
    `draftView = spinAutoStep(auto.malusMax)`.
  - se `state.stato` passa a `"coach"` (rosa piena) → `draftView = null` e
    `ui = "draft"` esplicito (come già fa oggi `autoDraft` per `draftReveal`),
    così la schermata NON deriva subito a `coach.js`: resta sulla board piena
    finché l'utente non preme "Vai al coach".
  - il piazzamento manuale (nessun `auto` sull'azione) non cambia comportamento.
- **Nuovo case `stopAutoDraft`**: interrompe l'autoplay a metà rosa.
  `draftView = { ...spinRosterView(), ticker: true }` (uno spin manuale
  normale, niente `auto`) - la UI torna al draft classico con le caselle già
  piazzate dall'autoplay.
- **`autoDraftAdvance`** (esiste già): resta invariato, ora si occupa solo di
  chiudere la pausa finale (`ui = null` → la schermata deriva a `coach.js`
  perché `state.stato` è già `"coach"`).
- **Rimozione**: import di `draftReveal` e relativa voce nel registry
  `screens`.

### `draft.js`

- **`draftView === null`** (rosa completa, in attesa di "Vai al coach" durante
  l'autoplay - caso che oggi non arriva mai qui perché finiva su
  `draftReveal`): il render mostra SOLO l'header + il tabellone (`court`,
  già pieno) + un pannello "Rosa completa" con un bottone che fa
  `ctx.dispatch({ type: "autoDraftAdvance" })`. Niente `cap-board` candidati,
  niente ticker, niente aiuti: quella parte della UI oggi presuppone sempre
  `draftView.cards`/`draftView.slots`, va resa condizionale a `draftView`
  non nullo.
- **`draftView.auto` presente** (spin in corso d'autoplay):
  - la sequenza visiva (ticker + righe candidato) si disegna come oggi, ma i
    click reali su carte/slot/aiuti restano disattivi (bottone "Ferma" a
    parte) - la UI è bloccata per decisione del punto 2.
  - il callback `onLock` di `scanThenLock` (già usato per `revealRosa`), dopo
    aver rivelato la rosa, chiama `selectCand(auto.cardIndex)` (evidenzia la
    carta e lo slot, nessuna animazione propria) e poi, dopo una pausa fissa
    di 250ms per dare tempo all'occhio di registrare la carta evidenziata,
    `placeIn(auto.slotKey)` - stesso `flyMirino` (~620ms), stesso `commit()`.
    `commit()` passa `auto: { malusMax: draftView.auto.malusMax }` dentro
    l'azione `assign`, così `app.js` sa di dover proseguire l'autoplay.
  - un bottone "Ferma" (visibile solo quando `draftView.auto` è presente)
    dispatcha `{ type: "stopAutoDraft" }`.
- **Bar "Auto-draft"** (`#autod-go`, i gradini di malus): quando parte
  l'autoplay resta al suo posto ma disabilitata/nascosta finché non si preme
  "Ferma" o non finisce la rosa - non deve essere possibile lanciare un
  secondo autoplay sopra uno già in corso.

### File rimossi

- `prototype/imbattuto/screens/draftReveal.js` - non più referenziato da
  nessuna schermata.

## Non tocca

- `game/run.js` (`sceltaAutoDraft`, `draftPick`, transizioni di stato): motore
  intatto, la spec riguarda solo la UI del draft (`app.js` orchestrazione,
  `draft.js` presentazione).
- Il draft manuale (click reali) non cambia comportamento in nessun punto.

## Testing

- Verifica dal vivo nel browser (`python3 -m http.server 8899`, viewport
  mobile) con `javascript_tool`/conteggio eventi di animazione, stesso metodo
  già usato per il bug del ticker (vedi `lezione-timing-ui-screenshot`): non
  fidarsi di screenshot per timing sub-secondo.
- Casi da coprire a mano: autoplay fino in fondo con più gradini di malus,
  "Ferma" a metà rosa e ripresa manuale, rosa non completabile (guardia sui
  500 giri) - verificare che l'errore resti visibile e non silenzioso.
