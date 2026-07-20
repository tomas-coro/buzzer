# Design dettagliato — FASE 1 / STEP 2: Attributi + ruoli derivati dalle statistiche

**Data:** 2026-06-29
**Stato:** design approvato in brainstorming; spec da rivedere prima del piano di implementazione.
**Spec padre Fase 1:** `2026-06-27-fase1-dati-design.md` (lo Step 1 — OVR — è già fatto e verde).
**Spec scheletro pivot:** `2026-06-27-draft-multistagione-2k-design.md`

---

## 1. Contesto in una riga

Lo Step 1 ha prodotto il dataset multi-stagione con **OVR + statistiche reali** (6 stagioni 2014-15 → 2019-20,
~30 squadre, `data/nba-data.js`). Lo Step 2 **arricchisce ogni carta** con i **12 attributi** del modello
(7 offensivi + 5 difensivi) + la **posizione** (primaria/secondaria), così da riattivare il voto
**ATT/DIF di squadra asimmetrico** già progettato. Il gioco vero (slot machine, quintetto, UI) è Fase 2.

### La svolta che ha generato questo design (verità onesta)
Lo scraping di attributi 2K storici è un **vicolo cieco verificato**, non ipotizzato: 2kratings espone
JSON-LD pulito solo per l'edizione *corrente*; le card "throwback" non coprono i roster; Wayback archivia
le pagine-giocatore solo dal 2019-20 (→ 1 stagione su 6). Nessun dataset pronto (Kaggle/GitHub/HF) ha gli
attributi 2K per 2K16-2K21. **Conclusione:** gli attributi **non si scaricano, si derivano** dalle statistiche
reali. Questo Step 2 è quindi un lavoro di *modellazione dei dati*, non di scraping di attributi.

---

## 2. Fonti dati (due, entrambe già a portata)

1. **CSV box-score `willyiamyu`** — già in cache dallo Step 1. Dà le **accuratezze di tiro e i volumi**:
   `3P%, 3PA, FT%, FTA, FG%, FGA, 3PM, FGM` (→ 2P% derivabile), più i conteggi per-partita.
2. **basketball-reference, tabella "Advanced"** — **una pagina per stagione** (`NBA_2015_advanced` …
   `NBA_2020_advanced`, 6 pagine totali). Dà le **rate-stat normalizzate per opportunità/ritmo** e la
   **posizione**: `Pos, TS%, 3PAr, FTr, ORB%, DRB%, TRB%, AST%, STL%, BLK%, TOV%, USG%, OBPM, DBPM`.

**Perché due fonti:** le rate-stat dell'Advanced (per-opportunità) sono la materia giusta per i voti; le
accuratezze di tiro (3P%, FT%) stanno solo nel box-score. Si usano insieme.

**Dipendenza da spike (da fare all'INIZIO del piano, non prima):** confermare che le 6 pagine Advanced
rispondano 200 con User-Agent da browser e che la colonna `Pos` + le rate-stat si parsino pulite.
La tabella "Shooting" (zone di tiro) è **fuori scope**: non apriamo una settima pagina per stagione.

---

## 3. Il motore di calibrazione (per gli 8 attributi *misurati*)

Tutti gli attributi misurati passano per lo stesso tubo a 3 stadi, così sono coerenti tra loro:

1. **Stat grezza → stat stabilizzata** (correzione campione piccolo, *empirical-Bayes shrinkage*):
   la rate viene tirata verso la media di lega in proporzione inversa al campione (minuti/tentativi).
   *Perché:* un 2/4 da 3 stagionale non deve risultare un cecchino. Disinnesca il problema del volume.
2. **Stabilizzata → percentile DENTRO la stagione.** Si classifica il giocatore contro i contemporanei
   di *quell'anno*. *Perché per-stagione e non sui 6 anni insieme:* tra 2014 e 2020 c'è la rivoluzione del
   tiro da 3 (volumi esplosi); il percentile per-stagione neutralizza lo slittamento d'epoca ed è il
   sapore 2K ("quanto dominavi i tuoi pari"). Con ~400 giocatori/stagione il campione è abbondante.
3. **Percentile → voto 0-99 con curva "sapore 2K"** (non lineare: comprime il basso, allunga l'alto).
   **Differenza chiave:** l'OVR (già dato dallo Step 1) resta nella banda 2K (~70+ per chi è in rotazione);
   i **singoli attributi usano TUTTO il range 0-99** — un centro che non tira ha Tiro 3 ≈ 25, come nelle
   carte vere. I parametri della curva vivono in un **banco tarabile a occhio** (stile `59-formula-squadra.html`).

---

## 4. La mappa dei 12 attributi (8 misurati / 4 stimati)

Ordine attributi = etichette di `mockups/59-players-data.js`:
`OFF_LABELS = [Tiro 3, Tiro medio, Finalizzazione, Tiro libero, Palleggio, Playmaking, Senza palla]`,
`DEF_LABELS = [Dif. perimetro, Dif. interna, Palle rubate, Stoppate, Rimbalzi]`.

| # | Attributo | Tipo | Cosa lo guida (fonte) |
|---|---|---|---|
| 1 | **Tiro 3** | misurato | 3P% corretto per volume di 3PA *(CSV)* |
| 2 | **Tiro medio** | **stimato** | nessun dato di zona → OVR + tocco generale (FT%, TS%) + posizione |
| 3 | **Finalizzazione** | **stimato** | spinta da 2P% + FTr (pressione al ferro) + posizione |
| 4 | **Tiro libero** | misurato | FT% corretto per volume di FTA *(CSV)* |
| 5 | **Palleggio** | **stimato** | spinta da TOV% basso a parità di USG% + AST% |
| 6 | **Playmaking** | misurato | AST% + assist/palle perse *(Advanced + CSV)* |
| 7 | **Senza palla** | **stimato** | nessun segnale box-score → OVR + posizione + efficienza a basso uso |
| 8 | **Dif. perimetro** | misurato | DBPM (livello) + forma da STL% + posizione *(vedi §5)* |
| 9 | **Dif. interna** | misurato | DBPM (livello) + forma da BLK%/DRB% + posizione *(vedi §5)* |
| 10 | **Palle rubate** | misurato | STL% *(Advanced)* |
| 11 | **Stoppate** | misurato | BLK% *(Advanced)* |
| 12 | **Rimbalzi** | misurato | TRB% *(Advanced)* |

**I 4 stimati** sono quelli con segnale di box-score nullo (zone di tiro, movimento senza palla) o troppo
debole/inquinato per dichiararsi "misurati" con onestà (il 2P% mescola ferro e media distanza; le palle
perse mescolano palleggio e scelte). **Stimato ≠ "solo OVR":** Finalizzazione e Palleggio usano il loro
proxy reale come *spinta*; Tiro medio e Senza palla restano ancorati a OVR + posizione. La distinzione
resta **interna**: la maschera esposta è un solo flag `estimated` per cella (niente sotto-categorie — YAGNI).

---

## 5. La difesa: lo split del DBPM (cuore del fix originale)

Problema che ha fatto nascere il pivot: i difensori perimetrali d'élite (Kawhi prime, Paul George)
uscivano sottovalutati perché steli/stoppate non catturano la difesa point-of-attack. Soluzione a due tempi:

- **Livello difensivo = DBPM** (un solo numero ~−3…+6 → percentile → voto). Premia la difesa perimetrale
  che il tabellino si perde.
- **Forma (come spalmo il livello tra perimetro e interno) = STL% + BLK%/DRB% + posizione**, con pesi
  posizionali su una retta PG→C (perimetro pesa verso le guardie, interno verso i lunghi).

Comportamento atteso (da validare in §8):
- **Gobert** (DBPM alto, STL basso, C) → Interna alta, Perimetro media.
- **Kawhi 2016-17** (DBPM alto, STL alto, SF) → Perimetro alta, Interna buona. ✅ fix.
- **Curry/Trae** (DBPM negativo) → entrambe basse, qualunque sia l'OVR. ✅ coerente col modello asimmetrico.

Nota: le celle 8/9 condividono i segnali con 10/11 (STL%/BLK%). La sovrapposizione è **voluta** (un
rim-protector ha sia Stoppate alte sia Dif. interna alta), come in 2K.

---

## 6. Posizione primaria + secondaria

- **Primaria** = colonna `Pos` della tabella Advanced (già derivata dal gioco reale).
- **Secondaria:**
  - se bbref dà una posizione combinata (es. `SG-PG`, `PF-C`) → secondo token;
  - altrimenti **vicino di casa** sulla retta `PG↔SG↔SF↔PF↔C`, scelto dal lato verso cui pende il profilo
    (tanti assist/poca stazza → verso PG; tanti rimbalzi/stoppate → verso C);
  - posizione "pura" senza pendenza → **nessuna secondaria** (`null`).

---

## 7. Schema di output (arricchimento *in place* delle carte)

Ogni carta di `data/nba-data.js` (Step 1: `player_id, name, season, edition, team, team_abbr, ovr, stats_real`)
si arricchisce così:

```js
{
  // ...campi Step 1 invariati...
  pos: { primary: "SF", secondary: "PF" /* | null */ },
  att: [ /* 7 voti, ordine OFF_LABELS */ ],
  def: [ /* 5 voti, ordine DEF_LABELS */ ],
  estimated: { att: [ /* bool×7 */ ], def: [ /* bool×5 */ ] }, // true = stimato (i 4 fissi + buchi dati)
  stats_adv: { dbpm, obpm, usg, ts, stl_pct, blk_pct, trb_pct, drb_pct, orb_pct, ast_pct, tov_pct, ftr, /* … */ },
  enrich: { advanced_matched: true /* | false */, match: "exact" /* | "fuzzy" | "none" */ }
}
```

- `estimated` è una **maschera per cella**: se a un giocatore manca un dato advanced, *quel* singolo
  attributo diventa stimato e la maschera lo segna con precisione (oltre ai 4 fissi).
- `stats_adv` conserva i grezzi advanced (come `stats_real` per il box-score): trasparenza + ri-derivazione.
- `enrich` rende ispezionabile l'esito dell'incrocio per nome con bbref.

Tutto serve il principio approvato in Sez. 1: **scartati/stimati sempre visibili, niente fallback silenzioso.**

---

## 8. Aggancio al modello ATT/DIF di squadra

Il modello asimmetrico esistente **resta identico nella forma** (vedi memory `formula-squadra-dati`):
`ATT = OVR + A·(offW − E[offW|OVR])`, `DIF = DB + SD·(defW − mediaDefW)`, squadra = media dei 5; offW/defW =
medie pesate dei 7 off / 5 def con pesi interni fissi. I voti nuovi sono su scala 0-99 **stessa di play.db**,
quindi il calcolo di offW/defW **non cambia**. **Cambiano solo le costanti di calibrazione** (la regressione
`AO/BO` di `E[offW|OVR]` e `mediaDefW`), da **rifittare sul nuovo dataset** perché la distribuzione attributi
è diversa. Lo Step 2 rifitta queste costanti e **ri-fa girare il banco `59-formula-squadra.html`** come
validazione. Lo Step 2 **non** costruisce UI di gioco (Fase 2).

---

## 9. Validazione (verifica, non "fidati")

Check automatici stampati + ispezione a occhio:
- **Difesa (motivo del pivot):** perimetrali d'élite *in range* — **Kawhi 2016-17, Paul George, Jrue Holiday**
  — con **Dif. perimetro alta**, alla pari o sopra i centri. Confronto **Kawhi 2016-17 vs 2019-20** sulla
  stessa scala. *(Dyson Daniels è FUORI range — debutto 2022-23 — quindi sostituito da questi.)*
- **Tiro:** Curry 2015-16 Tiro 3 ~99; centro non tiratore (Gobert/Drummond) Tiro 3 ~25.
- **Rimbalzi/stoppate:** centri in cima, guardie in fondo.
- **Modello squadra:** ri-girando il banco — Curry DIF bassa, Gobert DIF alta, Kawhi-prime perimetro alto.
- **Copertura/onestà:** % carte con match advanced + **lista esplicita delle non-matchate**.
- **Sanità numerica:** ogni attributo copre ~tutto 0-99; nessuno collassato a un valore unico; nessun voto
  fuori [0,99]; nessun NaN.

---

## 10. Testing (TDD, prima il test)

Unit test:
- **curva** 0-99: monotòna, dentro i bordi;
- **shrinkage**: poche prove → tirato verso la media; tante prove → invariato;
- **percentile per stagione**: calcolato dentro la stagione, non cross-anno;
- **split DBPM** (input sintetici): Gobert → interna>perimetro; Kawhi → perimetro>interna;
- **parser posizione**: combinata → primaria+secondaria; pura → secondaria `null`;
- **flag estimated**: i 4 fissi sempre marcati; advanced mancante → cella marcata.

Integrazione: build end-to-end sui dati **già in cache** → output sanity prodotto.
I **20 test dello Step 1 restano verdi** (nessuna regressione).

---

## 11. Gestione errori (niente fallback silenzioso)

- Giocatore nel CSV ma **non** nell'Advanced → carta **tenuta** (ha OVR + box-score), attributi
  advanced-dipendenti **stimati da OVR e marcati**, `advanced_matched:false`, **in lista a report**.
  Mai zero/finto in silenzio.
- Nome non combaciante (accenti, `Jr./III`, omonimi) → match fuzzy con **metodo loggato**; **ambiguo →
  non-matchato + a report**, mai indovinato di nascosto.
- Singola stat mancante su giocatore matchato (es. DBPM vuoto) → solo *quell'*attributo stimato; resto misurato.
- Fetch di una pagina-stagione bbref fallito → **errore secco, stop** (niente dataset mezzo costruito).
- Attributo fuori range / NaN → **eccezione**, non clamp silenzioso.

---

## 12. Fuori scope (YAGNI)

UI di gioco e slot del quintetto (Fase 2); edizioni 2K22-2K27; leggende pre-2016; tabella "Shooting" di
bbref (zone di tiro); qualunque scraping di attributi 2K.

---

## 13. Definition of Done — Step 2

- Ogni carta dello Step 1 arricchita con `pos` + `att[7]` + `def[5]` + maschera `estimated` + `stats_adv` + `enrich`.
- Costanti del modello ATT/DIF rifittate sul nuovo dataset; banco `59-formula-squadra.html` ri-girato e coerente.
- Validazione (§9) eseguita e **mostrata** (output reale), inclusa la lista delle carte non-matchate.
- Test (§10) verdi, Step 1 incluso.
- Nessuno scraping di attributi 2K; sole fonti = CSV in cache + 6 pagine Advanced bbref.

## 14. Rischi / punti aperti

- **Fattibilità bbref** (200 con UA browser, parsing `Pos` + rate-stat) → spike all'inizio del piano.
- **Normalizzazione nomi** per il join CSV↔bbref: punto delicato, da curare con spot-check (riusa lo slug
  `player_id` già stabilizzato nello Step 1).
- **Taratura curva e costanti** = lavoro a occhio nel banco: il design fissa il *metodo*, non i numeri finali.

## 15. Prossimo passo

Rivedere questo spec. Se ok → **piano di implementazione** (writing-plans): spike bbref, parser Advanced,
join per nome, motore di calibrazione, split DBPM, posizioni, arricchimento `nba-data.js`, refit costanti,
validazione + test.
