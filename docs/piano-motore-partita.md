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

### B - simulazione partita - FATTO (2026-08-17)

`game/partita.js` + `game/partita.test.js` (27 test). Firma:
`simulaPartita({casa, ospite, rng})` → `{punti, possessi, quarti[], cronaca[],
vincitore}`. Ogni squadra è `{nome, reparti, ritmo}`: il coach non entra ancora,
ci pensa la tappa C a tradurre plus/malus in reparti spostati e ritmo.

Il modello sta su tre regole:
1. **punti = possessi × efficienza**. Il ritmo (-1..+1) decide i possessi
   (89 lenta · 99 neutra · 109 corsa), i reparti decidono quanto rendono.
2. **i rimbalzi danno possessi, non efficienza** (scelta di Tomas): chi domina a
   rimbalzo tira più volte. Una squadra di lunghi che tira male può vincere lo
   stesso.
3. **varianza legata all'equilibrio**: nel 4° quarto la deviazione sale del 50%
   sotto i 5 punti di scarto, del 20% sotto i 10, e non sale affatto se la
   partita è scappata.

Calibrazione: l'outsider da -6 di reparti vince **1 volta su 4** (scelta di
Tomas, come la NBA vera).

Difetti trovati al banco sulle carte vere - non dai test, che usavano squadre
finte tutte a 50:
- partite da **54 punti** e margini da **72**: cinque riserve contro cinque
  stelle davano scarti da 40 punti di reparto, che nella NBA non esistono.
  Corretto con `satura()` (tanh): sotto i 22 punti di scarto passa tutto, sopra
  si appiattisce. Al banco: media 104, p5 87, max 145, margine medio 11.4,
  overtime 2.1% - tutti dentro i valori NBA;
- la cronaca scriveva "prende il largo" a una squadra sotto di un punto:
  l'allungo va controllato **dopo** il parziale di chi insegue, non prima;
- tre quarti in equilibrio stampavano tre volte la stessa frase.

Nota: al banco, in una partita su tre vince la squadra con l'OVR medio più
basso. Non è un difetto, è il punto: la partita non la decide più l'overall 2K,
la decidono i reparti.

### C - motore - FATTO (2026-08-17)

Nato da un'obiezione di Tomas: "non voglio perdere per RNG di OVR". Scomponendo
il 33% di partite in cui la squadra con l'OVR medio più alto perdeva:

- **25,4%** caso puro (l'1-su-4 scelto nella tappa B);
- **19,9%** divergenza: OVR alto ma reparti peggiori. La correlazione tra media
  OVR e forza vera nei reparti era **0,50**.

Non era emozione, era una trappola: si draftava su un numero e se ne subiva un
altro. Deciso di togliere la divergenza alla radice.

- `rating.js`: il voto non è più la media degli overall 2K, è la sintesi pesata
  dei cinque reparti. **I pesi non sono a occhio**: escono dall'impatto che un
  punto di reparto ha sul margine in `partita.js`, chiedendolo alle costanti vere
  (attacco 39,7% · difesa 39,7% · rimbalzi 22,4%). Se si tara il motore, i pesi
  si spostano da soli. Aggiunta `votoCarta` per il numero grande della scheda.
- `coach.js`: **ponte** verso la tappa D. I voti A-F restano ma agiscono sui
  reparti (attacco muove t3/fin/reg, difesa muove dif/reb), e `champ_bonus` entra
  nei reparti invece di essere sommato a un voto che la partita non guarda.
- `run.js`: `partitaRound(state)` è una funzione **pura** dello stato - il seme
  del round nasce da `seme + round`, quindi la UI può animare il tabellone e
  `resolveRound` rigioca esattamente la stessa partita. `storia` salva punteggio,
  quarti e cronaca. `newRun({seme})` rende una corsa riproducibile.
- `display.js`: il voto nativo è un percentile (50 = mediano), quindi si rimappa
  su **60-99** per il display - riserva ~63, titolare mediano ~77, quintetto
  storico mediano ~81, fuoriclasse ~96. Estremi misurati sulle 2412 carte.

Controllo di sanità: le carte col voto più alto sono Westbrook 2016-17, Durant
2016-17, Giannis 2019-20, Jokic 2017-18. Sono le stagioni giuste.

### C2 - taratura della difficoltà - FATTO (2026-08-17)

Col voto sui reparti, le vecchie soglie `oppMin/oppMax` (70-99, scala 2K)
cadevano tutte **sopra il massimo del pool** (i 180 quintetti storici stanno tra
40 e 74): ogni round pescava lo stesso quintetto, il più forte di sempre.

Nato `tools/banco-corse.mjs`: simula corse intere (draft + coach + 16 partite)
con un giocatore competente e misura quante finiscono imbattute. Bersagli
concordati con Tomas e raggiunti (1000 corse per livello):

| livello | soglie | 16-0 | bersaglio | vittorie medie |
|---|---|---|---|---|
| facile | 44-66 | 41,9% | 40% | 12,4 |
| normale | 45-72 | 11,3% | 12% | 9,5 |
| difficile | 45-74 | 2,6% | 3% | 7,2 |
| incubo | 54-74 | 0,5% | 0,5% | 4,4 |

Due cose emerse dal banco: in Facile il tetto è 66, quindi le squadre leggendarie
non si incontrano proprio; e buona parte del salto tra livelli **non** viene dalle
soglie ma dagli **aiuti**, che cambiano quanto forte è la squadra che riesci a
draftare (voto medio 81 in Facile, 68 in Incubo).

### D - coach (`prototype/imbattuto/coaches.js`)
Conversione dei 12 + 18 nuovi, ognuno con 2 plus, 1 malus e il ritmo.

### E - UI (mockup prima, poi porting)

**E1 - mockup del tabellone: FATTO (2026-08-17), in attesa del giudizio di Tomas.**
`mockups/76-tabellone-quarti.html`, dati veri generati da `tools/dati-tabellone.mjs`
(tre partite pescate da corse reali: volata 111-107, dominio 119-89, sconfitta
108-110). Scelte fissate col grill, tutte confermate sulla raccomandazione:

- punteggio grande + **box score a quarti** stile NBA che si riempie una casella
  per volta (non tabellone LED col solo quarto corrente);
- **cronaca che si accumula**, quattro righe a fine partita (non ticker a riga
  singola: a Rapida non si leggerebbe e alla fine non resterebbe niente);
- **chip velocità sempre a schermo**, cambiabili in corsa;
- il tabellone **si ferma sul finale** e chiede il tap per andare avanti;
- le formazioni restano visibili, **compresse al via**.

Due mosse nate dal fatto che su 740px non ci stava tutto: al via le due
formazioni si affiancano su una riga sola e il box score si accende (prima del
via quattro colonne di puntini rubavano 80px senza dire niente). Aggiunta anche
la striscia delle 16 vittorie, che nella schermata run esiste già.

Difetti trovati e corretti provando il mockup nel browser, non a occhio sul
codice: quarta riga di cronaca segata (le prime misure erano falsate dai font
non ancora caricati), colore della riga preso dal tipo di frase invece che dal
parziale - dipingeva di verde un allungo dell'avversario -, marcatore del quarto
in corso che restava accesso su una colonna già chiusa, "1 quarti da giocare",
"Sotto tu di 4", e il cambio di velocità che entrava in vigore solo dal quarto
dopo (a Lenta: premi Rapida e per quattro secondi non succede niente).

**Emerso dal mockup, da correggere nel MOTORE** (`cronaca()` in `partita.js`):
le frasi del 4° quarto sono troppo lunghe e ripetono il punteggio che il
tabellone mostra già in grande ("finisce 111-107: vince La tua squadra" mentre
il verdetto dice "Passi il turno · 111-107"), e col nome "La tua squadra" alcune
suonano sgrammaticate ("Sorpasso La tua squadra con un parziale di 32-24"). Nel
mockup c'è una rete di sicurezza (massimo due linee per riga), ma la correzione
vera è accorciare e rifrasare le frasi.

**E2 - da fare**: porting su `screens/run.js` e `screens/coach.js` (scheda coach
con plus/malus e anteprima sui tuoi reparti), dopo l'ok di Tomas sul mockup.

**Aggiunto dopo la tappa C**: nel draft il numero grande della carta deve passare
da `card.ovr` (2K) a `toDisplayOvr(votoCarta(card))`. Il motore è già pronto, ma
è una modifica visiva, quindi passa da un mockup prima dell'app vera. L'OVR 2K
resta in scheda come dato reale, in secondo piano.

### F - box score per giocatore - FATTO (2026-08-17)

Nato dal grill sulla schermata partita: Tomas voleva le statistiche del suo
quintetto dopo ogni partita e le medie a fine corsa, "calcolate nella
simulazione come fa eraball.com" (dove "the stat line shown on a player's draft
card is actually what drives the simulation").

**Il vincolo che ha deciso il modello**: il punteggio di `partita.js` è tarato
(media 104, margine 11,4, e le soglie 16-0 escono da lì). Far nascere i punti
dai singoli e sommarli avrebbe sballato tutto. Quindi le righe si generano
dentro la simulazione, quarto per quarto, con lo stesso rng, ma **atterrano** sul
punteggio già calcolato: la somma delle cinque righe di un quarto è esattamente
il punteggio di quel quarto.

- `game/boxscore.js` + 26 test. Sei statistiche: PT · RIMB · AST · RUB · PP · STP.
  Le quote nascono da `stats_real` normalizzata al minuto; i totali di squadra
  sono legati alla partita (assist ai punti, rimbalzi ai possessi, recuperi e
  stoppate al reparto difesa, palle perse alla regia); `ripartisci` arrotonda col
  resto più grande così la somma torna sempre.
- `run.js`: `boxScoreRound(state)` puro come `partitaRound` (seme `+ 7919`, così
  ritarare il box score non cambia chi vince), e `storia` salva le righe.
- `medieCarriera` aggrega **per persona**: LeBron 2012-13 e LeBron 2017-18 sono
  lo stesso LeBron. Tiene anche i massimi di una singola partita.
- `newRun({squadra})`: il nome squadra entra nella cronaca.

Banco su 5690 righe vere: 21,2 pt · 8,8 rimb · 4,9 ast · 1,7 rub · 2,5 pp ·
1,1 stp di media per giocatore, cioè totali di squadra da 106/44/25/13 - i
valori NBA. Zeri: 3,3% senza assist, 25% senza recuperi, 54% senza stoppate.

Due difetti del motore corretti guardando i risultati veri:
- `cronaca()` ripeteva nell'ultima riga il punteggio finale e il vincitore che
  il tabellone mostra già in grande, e scriveva "Sorpasso La tua squadra";
- `opponents.js` teneva il quintetto avversario ordinato per OVR mentre la UI
  stampa i ruoli in ordine PG→C: nel mockup i nomi finivano accanto al ruolo di
  un altro. Ora il pool è ordinato per ruolo.

### E3 - mockup della partita, tre regie - FATTO (2026-08-17), in attesa del giudizio

`mockups/77-partita-direzioni.html`, dati da `tools/dati-tabellone.mjs`. Sei
schermate: tre regie della partita (**A cruscotto · B giornale · C palazzetto**),
fine partita, fine corsa (16-0 e eliminato), profilo con la classifica dei
giocatori più usati.

Deciso col grill del 2026-08-17:
- **desktop-first, due colonne**, mobile a colonna singola. Il 76 era un telefono
  da 390px in mezzo a 1200px di nero;
- **niente login per ora**: profilo locale, ma scritto come oggetto unico
  sincronizzabile, così l'account dopo è un innesto da un paio d'ore;
- **nome squadra** chiesto al primo avvio e modificabile dalle impostazioni;
- via il cerchio "1° QUARTO" (il quarto lo dice la colonna accesa del box score),
  al suo posto il **margine in tempo reale**;
- "voto" diventa **OVR**, con **ATT** e **DIF** accanto;
- chip velocità da fascia intera a un segmentato alto 26px;
- le carte si vedono solo prima del via, poi diventano le righe del box score.

Difetti trovati provando le schermate nel browser: buchi neri sotto le carte e
sotto i box score (riempiti col **duello dei reparti** e col **briefing prima
del via**, che rispondono al "perché è finita così"); miglior marcatore segnato
con un puntino che sembrava un refuso; quinta colonna dei quarti vuota quando il
supplementare non c'è; cronaca troncata a due righe anche a fine partita in C;
"migliore in campo" preso dalla squadra vincente mentre il top scorer stava
dall'altra parte; a fine corsa "15 partite giocate" quando erano 16.

**Regia scelta da Tomas (2026-08-17): A · Cruscotto.**

### E4 - porting della partita nell'app - FATTO (2026-08-17)

`prototype/imbattuto/screens/run.js` riscritto sulla regia A, blocco CSS `.sh-*`
`.a-*` al posto del vecchio `.rn-*` (tabellone con lo shot clock, rimosso).
La schermata anima `partitaRound`/`boxScoreRound` in locale e dispatcha
`resolveRound` solo alla CTA finale: app.js ri-renderizza tutto a ogni dispatch,
quindi animare e applicare nello stesso momento non si può.

Scelte prese col grill prima di scrivere: si porta **solo la partita** (fine
partita, fine corsa e profilo restano da fare); la shell dell'app sale a 1240px
ma **solo `.screen.run` la usa**, le altre schermate restano nei loro 720px, così
il porting non rimette in gioco home, draft e coach; i breakpoint mobile del
mockup vengono portati com'erano.

La velocità scelta si ricorda tra le partite (`localStorage`, chiave
`buzzer.velocita`): su una corsa da 16 partite ripartire da Normale ogni volta
era una scelta da rifare 16 volte.

Difetti trovati provando l'app nel browser, non a occhio sul codice:
- la classe `.flash` del mockup collideva con `.flash` della home (la lampata
  tonda, `position:absolute` 172px): **cancellava** i numeri del punteggio e le
  celle del box score invece di illuminarli. Rinominata `sh-flash`;
- 200px di nero sotto la CTA (la riga bassa non cresceva) e un rettangolo vuoto
  sotto le righe del box score: `.a-bot { flex: 1 }` più `.sh-box { height: 100% }`;
- il 4° quarto restava col bordo giallo anche a partita finita, e sembrava ancora
  in corso: il bordo sta su `live`, non su `just`;
- sei pixel di barra di scroll a 900px di altezza, tolti col padding inferiore
  ridotto sulla schermata partita.

Provato: corsa intera fino alla sconfitta (11 vittorie poi 105-111), le quattro
velocità, il cambio in corsa, cinque colonne di quarti col supplementare, e
390px senza overflow. Suite: 140 motore + 36 prototipo, tutti verdi.

**Da fare**: porting di `screens/esito.js` (fine partita e fine corsa) e la
schermata profilo nuova.

## Tappa G - rosa da 10, coach vero, punto a punto (dal grill del 2026-08-17)

Tomas ha bocciato la partita portata nell'app: coach non spiegati, nessun effetto
sui giocatori, simulazione a quarti «inutile e brutta». Quattro blocchi di
`/grill-me` hanno chiuso i bivi. Le decisioni:

- **rosa da 10**, due per ruolo (titolare + riserva). I minuti sono il peso di
  tutto: reparti di squadra, box score e punto a punto leggono da lì;
- **coach con 2 plus e 1 malus** che agiscono sulle CARTE, una per una, più ritmo
  e rotazione. Passivo durante la partita: il campionato tipo 38-0-0 resta fuori;
- **punto a punto** srotolando i quarti già tarati (la taratura 16-0 non si
  tocca), eventi con nome, durate 20/10/5s + istantanea, log a due livelli;
- **box score** con tiri, triple e liberi separati, dieci righe;
- mockup unico con tre schermate **dopo** il motore, app solo a mockup approvato.

### G1 - rosa, coach, avversari - FATTO (2026-08-17)

`game/rosa.js` (dieci caselle, `slotLibero` per il draft a un tocco, minuti
36/12 · 32/16 · 28/20 sempre a somma 240), `game/coach.js` riscritto
(`applyCoach(rosa, coach)` torna la rosa allenata + `effetti`, cioè chi guadagna
cosa: è quello che la schermata coach mostra col dito), `game/opponents.js` con
`buildHistoricalRose` (175 squadre-stagione su 180: sotto le dieci carte la rosa
non si costruisce, e cinque avversari in meno battono cinque panchine inventate).

### G2 - run.js e box score sui minuti - FATTO (2026-08-17)

`game/run.js` gira sulla rosa da 10: lo stato tiene `rosa` (draftata) e
`rosaAllenata` (dopo il coach) **separate**, così la schermata mostra il prima e
il dopo e cambiare coach non consuma niente. `game/boxscore.js` pesa le quote per
i minuti veri: a parità di resa al minuto, un titolare da 32' produce il doppio
di una riserva da 16'. Ogni riga porta i suoi minuti.

### G3 - avversari a urna e ritaratura - FATTO (2026-08-17)

Le rose da dieci hanno compresso il pool da 40-74 a **38-67** (mediana 51), e le
soglie vecchie erano di nuovo fuori scala. Nato `tools/taratura-soglie.mjs`, che
CERCA le soglie invece di provarle a mano: alza il pavimento finché il tetto del
pool basta, poi biseziona sul tetto, con campioni più grandi dove il bersaglio è
raro (misurare uno 0,5% con 400 corse vuol dire misurare due corse, cioè rumore).

Cercando è saltato fuori un difetto vecchio: `pickOpponent` prendeva sempre il
voto più vicino alla soglia, quindi **i sedici avversari di un livello erano gli
stessi in ogni corsa**, e in Incubo (banda stretta, 14 squadre) la stessa squadra
tornava fino a tre volte nella stessa corsa: 6 avversari distinti su 16. Deciso
con Tomas: pescata a caso fra le **otto più vicine** alla soglia, con l'rng del
seme della corsa, escludendo chi hai già affrontato. Ora sono 16/16 distinti in
ogni livello, e cinque corse in Incubo mostrano 21 squadre diverse.

| livello | soglie | 16-0 | bersaglio | vittorie medie |
|---|---|---|---|---|
| facile | 41-67 | 39,8% | 40% | 12,2 |
| normale | 42-67 | 12,9% | 12% | 9,2 |
| difficile | 54-67 | 3,2% | 3% | 5,0 |
| incubo | 61-67 | 1,0% | 0,5% | 2,5 |

**Incubo non arriva allo 0,5%**: è il pavimento del pool, non un errore di
taratura. Col tetto già sulla squadra più forte di sempre, alzare oppMin non
sposta più niente (63-67 → 1,05%, 65-67 → 1,15%, 67-67 → 1,07%). L'una corsa su
cento che passa è quella con un draft eccezionale, e quella coda le soglie non la
tagliano: servirebbe un'altra manopola.

### G4a - punto a punto - FATTO (2026-08-17)

`game/playbyplay.js` + `game/playbyplay.test.js` (41 test) e
`tools/banco-punto-a-punto.mjs`. Quattro blocchi di `/grill-me` hanno chiuso i
bivi prima di scrivere; tutte le risposte hanno confermato la raccomandazione,
tranne il mix di tiro, dove Tomas ha aggiunto che il profilo vero è una
**tendenza e non un destino** (Curry può chiudere senza triple, Gobert ne segna
una ogni tanto, un Curry da 20 rimbalzi non deve esistere).

Le decisioni:

- **il box score comanda**, il punto a punto lo srotola. La taratura del
  punteggio non si tocca e `boxscore.js` non si tocca;
- **si generano anche i tiri sbagliati**: senza, i rimbalzi non hanno causa e le
  percentuali di tiro non esistono;
- **le riserve entrano in blocco nel tratto centrale** di ogni quarto: così ogni
  azione cade quando il suo protagonista è in campo e i minuti di `minutiRosa`
  tornano esatti senza aggiustamenti;
- **orologio vero** (11:47 del 1° quarto), ricavato dalle azioni del segmento;
- **le colonne di tiro sono un sottoprodotto** (`tiri`), non nuove statistiche
  dentro `boxscore.js`: due vincoli incrociati sarebbero stati fragili;
- **falli modellati con la colonna FALLI**: ogni viaggio in lunetta ha il nome di
  chi ha commesso il fallo;
- **log a due livelli**: `notevole` per regola fissa (sorpasso, parziale da 8+,
  tripla, schiacciata, stoppata, cambio, finale in equilibrio);
- **ogni azione ha la sua causa**: l'assist sul canestro, il rimbalzo dopo
  l'errore, la stoppata sul tiro, il recupero sulla palla persa;
- **le azioni NON si salvano in storia**: si ricalcolano dal seme, e 16 partite
  da ~350 azioni sarebbero qualche megabyte di localStorage.

Il vincolo che regge tutto: **ogni tiro sbagliato produce un rimbalzo**. I
rimbalzi li ha già decisi il box score, quindi sono loro a dire quanti errori si
tirano - e da lì escono i tentativi, cioè le percentuali che il box score da solo
non poteva avere.

Quattro difetti trovati al banco, non dai test (che erano già tutti verdi):

1. **78/105 dalla lunetta.** Nella scomposizione dei punti il peso dei liberi non
   era diviso per il loro valore: valendo poco vincevano sempre, perché servivano
   tante scelte per coprire il bottino.
2. **57 tiri liberi anche dopo il primo fix.** La scomposizione stava al livello
   del SEGMENTO, dove una riserva fa due punti: i residui da un punto si possono
   fare solo dalla lunetta. Nata `sparpaglia`, che scompone il bottino INTERO del
   giocatore e poi divide i canestri già formati fra i periodi, rispettando al
   punto il punteggio del motore.
3. **41/42 dalla lunetta.** I liberi sbagliati non esistevano: i viaggi
   nascevano solo dai punti fatti. Ora i tentativi escono dalla percentuale vera
   e gli errori si appoggiano ai viaggi esistenti o creano un 0/2.
4. **46,5% da tre di lega.** Gli errori da fuori si contavano sul mix teorico
   invece che sui canestri davvero segnati, e la conversione del residuo (un
   canestro da due allungato in tripla) aggiungeva triple senza tentativi.

Banco su 199 partite con rose storiche, contro le medie NBA:

| misura | motore | NBA | scarto |
|---|---|---|---|
| FG% | 45,3 | 47,0 | -4% |
| 3PA | 31,7 | 35,0 | -9% |
| 3P% | 38,7 | 36,5 | +6% |
| FTA | 25,8 | 22,0 | +17% |
| TL% | 77,7 | 78,0 | 0% |
| falli | 19,6 | 19,5 | +1% |
| secondi per azione | 13,8 | 14,5 | -5% |

Le 3PA sotto scala non sono un difetto: il pool è storico, e negli anni Ottanta
da tre non si tirava. Una partita produce ~314 azioni, di cui ~79 notevoli.

`run.js`: `playByPlayRound(state)` puro come gli altri, seme staccato (`+ 3121`)
perché ritarare il racconto non cambi né chi vince né il tabellino.
`game/fixtures.js` ha ora anche `stats_vol`, che è il dato da cui nasce il mix di
tiro. Suite: 232 test, tutti verdi. Taratura 16-0 invariata (banco a 200 corse:
37% · 13% · 3% · 0,5%).

### G4b - FATTA (mockup)

`mockups/78-partita-diretta.html`, regia A · Cruscotto scelta al grill, tre
schermate: **prima del via** (carte con i cinque reparti, quintetto avversario,
duello dei reparti), **diretta** (log che scorre ad azioni, punteggio, orologio,
tabellino che si riempie), **tabellino** (colonne di tiro, migliore in campo,
cifre di squadra, cronaca quarto per quarto).

Le tre decisioni prese guardandolo, non a tavolino:

1. **La velocità si dichiara in durata della partita**, non in millisecondi per
   riga: con "Essenziale" le righe sono ~96 e con "Tutto" ~333, e un passo fisso
   darebbe due partite lunghe il triplo l'una dell'altra. Lenta 120s · Normale
   60s · Rapida 20s · Salta (tarate a mano da Tomas, 2026-08-18).
2. **Il tabellino si allinea a ogni fine quarto.** Dentro il quarto in corso si
   accumula dalle azioni, sui quarti chiusi vale quello che dice `boxscore.js`.
   Serve perché il log è una vista LOSSY del box score: un assist ha bisogno di
   un canestro a cui appoggiarsi, e quelli che avanzano restano nel box senza una
   riga. Con lo snap, a fine partita il tabellino del mockup coincide col motore
   su tutte le colonne (verificato: 0 differenze).
3. **La colonna FALLI in diretta conta meno del vero**, perché il log dà un nome
   solo ai falli che mandano in lunetta. Il mockup lo dichiara a schermo e nel
   tabellino finale usa il numero del motore.

Due difetti veri trovati costruendolo:

- **`chi2` senza indice.** L'azione portava il cognome di chi serve l'assist, ruba
  o commette il fallo, ma non il suo posto in rosa: con due `Harden` in squadra
  tutti gli assist finivano sullo stesso. Aggiunto `chi2Idx` in `playbyplay.js`,
  con due test (uno costruisce apposta una rosa di dieci omonimi).
- **La stessa carta draftata due volte** in `tools/dati-tabellone.mjs`: il draft
  greedy non escludeva chi aveva già preso, e in squadra finivano due James
  Harden 2016-17 identici. Resta aperto se il draft VERO debba impedirlo.

Il generatore ha ora `--azioni` (aggiunge azioni, tiri e falli ai tre scenari) e
stampa in ASCII puro: un `.js` servito senza `charset` veniva letto in latin-1 e
"Dinamo Sofà" diventava "Dinamo SofÃ".

### G4b2 - pausa che si può guardare + nomi per esteso - FATTA (2026-08-18)

Il bottone Pausa c'era già, ma da fermi non c'era niente da guardare. Aggiunti
tre pezzi alla diretta, tutti sui dati che il motore produce già:

1. **Barra del tempo.** Si trascina e la partita torna a quel momento: punteggio,
   quarti, tabellini, log e analisi si ricalcolano da `state.k`, perché nessuno
   di quei pezzi tiene un totale suo. Accanto, due frecce da un'azione e i salti
   a inizio quarto. Trascinare mette in pausa.
   Il prezzo tecnico: i pezzi della diretta sono diventati nodi **persistenti**
   riempiti da `aggiornaDiretta()`, perché un `input[type=range]` ricreato a metà
   trascinamento perde il dito. `render()` resta il disegno completo.
2. **Scheda del giocatore.** Click su una riga del tabellino (o su un nome in
   "chi sta decidendo"): la partita si ferma e a destra si apre la sua scheda -
   OVR, cinque reparti, cifre, tiri, e tutte le azioni in cui compare, da
   protagonista o da comprimario (`azioniDi` guarda `chiIdx` e `chi2Idx`). Esc
   chiude.
3. **Pannello Analisi**, secondo volto della colonna destra: margine azione per
   azione (SVG senza testo dentro, così non si deforma), i tre che stanno
   decidendo, e il confronto di squadra. Le righe in percentuale usano scala
   0-100 e non l'una contro l'altra: 50% contro 47% disegnava due barre quasi
   piene, il contrario di quello che dicono i numeri.

Nomi delle squadre: nuovo `prototype/imbattuto/team-names.js` (30 franchigie,
gemello di `team-colors.js`, solo presentazione). Il generatore mette `avvNome` +
`avvAnno` sulla partita e `teamNome` su ogni carta; il mockup usa il nome per
esteso dove c'è spazio ("Miami Heat 2014-15") e tiene la sigla nelle colonne
strette. La cronaca del motore nomina l'avversaria con la sigla: nel mockup si
allarga a schermo con `perEsteso()`. **Alla fonte va sistemato nell'app**: il
nome nasce in `prototype/imbattuto/pool.js`, non nel motore.

### G4c - da fare

1. Porting nell'app: `app.js`, `screens/draft.js` e `screens/run.js` usano ancora
   cinque slot e `state.quintetto`, quindi oggi sono rotti contro il motore.
2. ~~Nome squadra per esteso alla fonte~~ - FATTO (2026-08-18). `team-names.js`
   è passato da `prototype/imbattuto/` a `game/`: la cronaca la scrive il motore,
   quindi il nome deve stare dove sta `partita.js`. `run.js` passa ora
   `teamName(state.avversario.team)` come `nome` dell'ospite in `partitaRound` e
   nel play-by-play. La sigla resta l'IDENTITÀ (`chiaveAvversario`, storia,
   colori): cambia solo come si legge. Nel mockup 78 il rattoppo `perEsteso()`
   è stato tolto, il testo arriva già giusto dai dati.

### G5 - cambi e minutaggi decisi da chi gioca - DA DECIDERE

Chiesto da Tomas il 2026-08-18: in pausa poter fare un cambio o forzare i minuti
di un giocatore, con i limiti imposti dal coach. **Oggi il motore non può**:
`simulaPartita` calcola l'intera partita in un colpo (possessi, ppp, quattro
quarti) e i minuti sono un INPUT fisso che `boxscore.js` usa per spalmare le
statistiche. Non esiste un "adesso" in cui infilare un cambio.

Cosa servirebbe: spezzare la simulazione in segmenti (per quarto, o per finestra
di sei minuti), calcolare i reparti di chi è in campo in ogni segmento, e poter
far ripartire il calcolo dal punto di pausa con minuti nuovi. Mezza giornata sul
motore più il mockup. Nel 78 NON è stato messo un bottone finto: il mockup
srotola azioni già prodotte, quindi un cambio non sposterebbe un punto.

## Stime

A ~3 ore · B ~4 ore · C ~2 ore · D ~2 ore · E ~4 ore · G1-G3 ~5 ore ·
G4a ~4 ore. Restano: mockup ~3 ore, porting ~4 ore.

## Aperti

- Tempi esatti dei preset velocità: si sentono nel mockup, non si decidono a tavolino.
- Incubo allo 0,5%: serve una manopola oltre le soglie, oppure si accetta l'1%.
- Peso dei reparti nel voto sintetico mostrato in scheda (resta una sintesi, non
  decide più la partita).
