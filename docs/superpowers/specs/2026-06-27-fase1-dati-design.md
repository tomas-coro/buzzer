# Design dettagliato — FASE 1: Dati (draft NBA multi-stagione)

**Data:** 2026-06-27
**Stato:** design approvato in brainstorming; spec da rivedere prima del piano di implementazione.
**Spec padre (scheletro del pivot):** `2026-06-27-draft-multistagione-2k-design.md`

---

## 1. Contesto in una riga

La Fase 1 costruisce il **dataset 2K multi-stagione** che alimenterà il gioco (slot machine
*squadra + annata* → scegli un giocatore → quintetto). È un lavoro di **dati**, non di UI: tutto
il resto (modello ATT/DIF, calibrazione, qualità del gioco) dipende da quali dati riusciamo
davvero a procurarci. Questo documento dettaglia la Fase 1; la Fase 2 (il gioco) avrà spec proprio.

## 2. Decisioni bloccate (brainstorming 27/06/2026)

1. **Ampiezza:** si parte da ciò che è **già pronto** — le 6 edizioni coperte dal dataset libero
   (stagioni **2014-15 → 2019-20**, edizioni **2K16 → 2K21**), tutte le ~30 squadre. Niente scraping
   in questo primo blocco. Estensione a 2K22-27 = futura.
2. **Strategia a 2 step** (perché il dataset pronto ha l'OVR ma **non** gli attributi di dettaglio):
   - **Step 1 — OVR, zero scraping** (questo è il pezzo da fare per primo).
   - **Step 2 — Attributi + ruoli via scraping di 2kratings** (riattiva il modello ATT/DIF; spec proprio).
3. **Ruoli (PG/SG/SF/PF/C):** rimandati allo **Step 2**, perché 2kratings dà *posizione e attributi
   dalla stessa fonte* → si evita un fragile incrocio-per-nome fra due dataset solo per le posizioni.

### Verità onesta che ha guidato queste scelte
Il dataset Kaggle *"NBA 2K Ratings with Real NBA Stats"* (autore `willyiamyu`) — verificato
**guardando il file vero**, non le descrizioni — contiene **solo l'OVR 2K + le statistiche reali NBA**.
**Non** contiene i sotto-attributi 2K (tiro da 3 *rating*, difesa perimetrale, ecc.), che il modello
ATT/DIF richiede. Quegli attributi vivono solo su **2kratings.com** (per giocatore/per edizione), che
blocca le richieste automatiche (403) → servirà uno scraper "vero browser" (Playwright, già disponibile)
nello Step 2. Da qui la separazione in due step: lo Step 1 consegna qualcosa di **giocabile presto e
senza dipendenze**; lo Step 2 aggiunge la ricchezza che richiede lavoro/rischio.

---

## 3. STEP 1 — Dati OVR (il pezzo da fare per primo)

### 3.1 Obiettivo
Produrre un **dataset** multi-stagione, costruito **solo da fonti pronte**, **dato in mano alla
Fase 2** (il gioco). Lo Step 1 è data engineering, non UI: deve consegnare dati nella forma giusta
perché la Fase 2 possa, con essi:
- far girare la slot machine *squadra + stagione* → **rosa reale** di quell'anno (via l'indice `(team, season)`);
- mostrare ogni carta con **nome + OVR** (+ stagione/edizione/squadra);
- calcolare un **voto squadra = media degli OVR** (modello minimo, in attesa dell'ATT/DIF dello Step 2).

Lo Step 1 in sé **non** costruisce UI, spin o quintetto (è Fase 2): produce il dataset + l'indice e li
verifica. Niente attributi, niente split ATT/DIF, niente ruoli: tutto questo è lo Step 2.

### 3.2 Fonte dati (verificata 27/06/2026)
- **File unico, libero da GitHub** (nessun login Kaggle):
  `https://raw.githubusercontent.com/willyiamyu/nba2k_analysis/master/nba_rankings_2014-2020`
  (CSV, ~340 KB, **2412 righe** = ~400 giocatori × 6 stagioni).
- **Colonne presenti:** indice, `PLAYER`, `TEAM` (sigla, es. `GSW`), `AGE`, `SEASON` (es. `2019-20`),
  `GP, W, L, MIN`, `PTS`, `FGM, FGA, FG%`, `3PM, 3PA, 3P%`, `FTM, FTA, FT%`, `OREB, DREB, REB`,
  `AST, TOV, STL, BLK, PF`, `FP, DD2, TD3, +/-`, **`rankings` = OVR 2K**.
- **Copertura:** stagioni 2014-15, 2015-16, 2016-17, 2017-18, 2018-19, 2019-20 (= edizioni 2K16→2K21);
  ~400 giocatori/stagione = i giocatori da rotazione (le ultime riserve restano fuori → accettabile).
- **Cosa NON c'è:** posizione/ruolo; sotto-attributi 2K. Entrambi arrivano nello Step 2 da 2kratings.

### 3.3 Modello dati (output)
Unità = **carta = un giocatore in una stagione**. Campi prodotti nello Step 1:

| Campo | Esempio | Note |
|---|---|---|
| `player_id` | `stephen-curry` | slug **stabile fra le stagioni** → raggruppa le versioni; normalizza accenti, `Jr./III`, omonimi |
| `name` | `Stephen Curry` | nome leggibile |
| `season` | `2015-16` | dalla colonna `SEASON` (etichetta canonica mostrata all'utente) |
| `edition` | `2K16` | derivata da `season` con mappa fissa (vedi 3.5) |
| `team` | `Golden State Warriors` | da mappa sigla→nome |
| `team_abbr` | `GSW` | dalla colonna `TEAM` |
| `ovr` | `90` | da `rankings`, cast a intero |
| `stats_real` | `{pts, reb, ast, stl, blk, tov, "3p%", "fg%", min, gp, plusminus, …}` | **conservate da parte**: utili a Step 2 / sanity check, **non** usate per il voto in Step 1 |
| `pos` | *(assente)* | arriva nello Step 2 |

**Struttura del file di output (due viste sugli stessi dati):**
- **per `player_id`**: ogni giocatore con la lista delle sue carte-stagione (= le "versioni");
- **indice `(team, season) → [carte]`**: ciò che la slot machine interroga direttamente.

Formato: JSON (o `.js` con `export`, coerente con `mockups/59-players-data.js` esistente) — da
confermare nel piano in base a come la Fase 2 lo consumerà.

### 3.4 Pipeline (uno script Python, esecuzione singola)
1. **Scarica** il CSV grezzo dall'URL raw GitHub.
2. **Normalizza:**
   - `PLAYER` → `name` pulito → `player_id` slug (minuscole, accenti rimossi, spazi→`-`, suffissi gestiti);
   - `TEAM` (sigla) → `team` nome pieno via mappa esplicita (incl. eventuali sigle storiche/rilocazioni);
   - `SEASON` → `season` etichetta; `season` → `edition` via mappa (3.5);
   - `rankings` → `ovr` intero; estrai `stats_real` dalle colonne box-score.
3. **Costruisci** le carte, raggruppa per `player_id`, costruisci l'indice `(team, season)`.
4. **Esporta** il file dataset + l'indice.
5. **Sanity check automatici** (output stampato, da mostrare a Tomas — vedi 3.6).

### 3.5 Convenzioni fissate (basso rischio, decise in design)
- **Etichetta stagione:** si usa la `SEASON` reale del dataset (es. `2015-16`). Così l'ambiguità
  "2K16 = 2014-15 o 2015-16?" **non ci tocca**: mostriamo la stagione vera delle statistiche.
- **Mappa `season → edition`:** `2014-15→2K16`, `2015-16→2K17`, `2016-17→2K18`, `2017-18→2K19`,
  `2018-19→2K20`, `2019-20→2K21` (convenzione del dataset sorgente). `edition` è informativa, non
  guida la logica di gioco.
- **Sigle squadra:** mappa sigla→nome esplicita (30 squadre). Nessuna rilocazione rilevante nel 2014-2020.

### 3.6 Sanity check (la verifica, niente "fidati")
Lo script stampa e Tomas controlla:
- n. carte totali (~2400) e n. stagioni (6);
- n. squadre per stagione (~30 ciascuna);
- **top-OVR per stagione** plausibili (es. 2015-16: Curry/LeBron/Durant in cima, OVR ~90+);
- nessun `ovr` fuori da [40, 99]; nessun campo obbligatorio vuoto;
- nessuna **collisione di `player_id`** fra nomi diversi, e stesso giocatore = stesso id fra stagioni
  (es. `stephen-curry` presente in tutte e 6 le annate);
- **spot check coerenza versioni:** una manciata di giocatori con la loro evoluzione OVR per anno.

### 3.7 Definition of Done — Step 1
- File dataset + indice `(team, season)` generati e versionati.
- Sanity check eseguiti e **mostrati** (output reale).
- 6 stagioni × ~30 squadre interrogabili; OVR coerenti a campione.
- Nessuna dipendenza da Kaggle/login né da scraping.

### 3.8 Cosa NON facciamo nello Step 1 (YAGNI)
- Attributi 2K, split ATT/DIF, check Kawhi/Daniels.
- Ruoli/posizioni e slot del quintetto (→ Step 2).
- Leggende pre-2016.
- Edizioni 2K22-2K27.
- UI di gioco (è Fase 2).

---

## 4. STEP 2 — Attributi + ruoli (abbozzo, avrà spec proprio)

- **Obiettivo:** aggiungere a ogni carta i **sotto-attributi 2K** (7 OFF / 5 DEF del modello) e la
  **posizione** → riattiva il voto **ATT/DIF asimmetrico** e gli slot per ruolo.
- **Fonte:** `2kratings.com`, pagine per giocatore/edizione (hanno posizione + attributi dettagliati).
- **Tecnica:** scraper "vero browser" (Playwright) per aggirare il 403; **gentile** (rate limit, cache
  locale, rispetto ToS); match per `player_id` già normalizzato nello Step 1.
- **Mappatura attributi 2K → 7 OFF / 5 DEF:** tabella di corrispondenza da definire nello spec di Step 2.
- **Primo check appena ci sono gli attributi:** ri-misurare **Kawhi** (prime vs ora) e **Dyson Daniels**
  per validare la calibrazione difensiva (era la motivazione originale del pivot).
- **DoD:** ogni carta dello Step 1 arricchita con `pos` + `att[7]` + `def[5]`; modello ATT/DIF gira.

---

## 5. Rischi / punti aperti (onestà, niente assunzioni nascoste)
- **Normalizzazione nomi** = il punto più delicato: serve coerenza `player_id` perché lo Step 2 (e le
  versioni multi-anno) ci si appoggiano. Da curare con spot check.
- **Copertura ~400/anno:** alcune riserve profonde non ci sono → i roster di gioco sono "da rotazione",
  non al completo. Accettabile (anzi, desiderabile: meno rumore).
- **Fattibilità scraping Step 2** (403 di 2kratings): da confermare con un mini-spike dedicato all'inizio
  dello Step 2, **non** ora.
- **Formato output** (JSON vs `.js`): scelta definitiva nel piano, guidata da come la Fase 2 lo consuma.

## 6. Prossimo passo
Rivedere questo spec. Se ok → **piano di implementazione dello Step 1** (writing-plans): script di
download+normalizzazione, struttura file, sanity check.
