# Design — Draft NBA multi-stagione (modello 38-0-0 / 82-0)

**Data:** 2026-06-27
**Stato:** approvato lo scheletro; spec da rivedere prima del piano di implementazione.

---

## 1. Visione in una riga

Trasformare `nba-draft-game` in un **draft "imbattuto" multi-stagione**: una slot machine
estrae **squadra + annata** (es. *Warriors 2015-16*), tu scegli un giocatore da quella rosa
e costruisci un quintetto. Lo stesso giocatore esiste in **versioni diverse per annata**
(2016 Curry ≠ 2021 Curry). È l'equivalente NBA di **38-0-0 Serie A** / **82-0**.

## 2. Il riferimento e la sua intuizione chiave

- **38-0-0 Serie A** (riferimento principale di Tomas): spin → *squadra + stagione*; puoi
  *Cambiare squadra* (stessa stagione) o *Cambiare stagione* (stessa squadra); in *Facile*
  cambi liberamente entrambi. Gli switch sono **aiuti limitati**, legati alla difficoltà.
  Scegli **un** giocatore della rosa estratta e lo metti in uno slot del modulo.
- **Intuizione decisiva:** 38-0-0 **non** usa statistiche grezze. Usa i **rating di FIFA di
  quell'anno**. Le "versioni per annata" escono gratis perché FIFA ri-valuta tutti ogni stagione.
- **Traduzione NBA:** l'equivalente è **2K per edizione** (2K16, 2K17, … 2K27). Così si ottengono
  insieme **rating ricchi** (overall + attributi, per l'ATT/DIF) **e** **versioni per stagione**.

## 3. Decisioni prese (bloccate)

1. **Fonte dati:** rating **2K reali per edizione**, **era moderna 2K16 → 2K27** (≈ stagioni
   2015-16 → 2025-26, ~11-12 annate) **+ un set curato di leggende iconiche** (Jordan, Kobe,
   Shaq…) come carte singole. Si **abbandona** `play.db` (impatto + 157 segnaposto).
2. **Il multi-anno diventa IL gioco** (sostituisce il draft a stagione singola). Niente doppia
   modalità da mantenere per ora.
3. **Meccanica spin/switch** identica a 38-0-0 (vedi §6).
4. **Lineup:** 5 slot per ruolo NBA (**PG, SG, SF, PF, C**) — il quintetto già esistente.
5. **Modello voto squadra:** si tiene OVR/ATT/DIF attuale, ma calcolato su **dati 2K veri**.
6. **Win / "imbattuto":** FUORI da questo spec (pezzo separato, da disegnare dopo). Per ora basta
   che il quintetto produca un voto squadra credibile.

### Bonus (chiude un problema preesistente)
I dati 2K veri per anno **risolvono da soli** il problema dei 157 attributi-segnaposto di
`play.db` (Tatum, Porziņģis, Trae Young, Sabonis…): ognuno prende i suoi attributi 2K veri,
per ogni annata. Il bug che ha fatto partire il lavoro sparisce come effetto collaterale.

### Perché il modello "stona" ora e il 2K-per-stagione lo risolve (validazione utente)
`play.db` è **un'unica fotografia incoerente per epoca**: dà a Kawhi un ATT da *prime* (97) e
insieme una DIF "di adesso" (79) — una carta che non è né il Kawhi 2017 né il 2025. Stessa cosa
per i difensori perimetrali d'élite (Kawhi 79, Dyson Daniels 80): sotto ai centri, perché gli
attributi difensivi *appiattiti* di play.db non colgono il loro impatto sul perimetro.
**Il 2K-per-stagione risolve entrambi:** ogni carta è la foto di UN anno, coerente con sé stessa
(2K17 Kawhi = ATT alto **e** DIF alta insieme; 2K25 Kawhi = entrambi più bassi), e gli attributi
2K reali tarano bene i difensori perimetrali (Kawhi prime ha *perim def* ~95). Il difetto era nel
**dato**, non nel modello. **Primo check di Fase 1:** ri-misurare Kawhi (prime vs ora) e Daniels
sul dataset 2K per confermare la calibrazione.

## 4. Decomposizione in fasi

Progetto grande → due sotto-progetti **indipendenti**, in sequenza (la Fase 2 dipende dallo
schema dati della Fase 1). Ognuno avrà il proprio spec → piano → implementazione.

- **Fase 1 — Dati.** Costruire il dataset 2K multi-stagione (questo documento lo dettaglia).
- **Fase 2 — Gioco.** Spin/switch + quintetto + voto squadra (qui solo abbozzata).

---

## 5. FASE 1 — Dati (il pezzo da fare per primo)

### 5.1 Modello dati
L'unità è la **carta = un giocatore in una stagione**. Campi:

| Campo | Esempio | Note |
|---|---|---|
| `player_id` | `curry-stephen` | **stabile fra le stagioni** → raggruppa le versioni |
| `name` | `Stephen Curry` | normalizzato (accenti, suffissi Jr./III) |
| `season` | `2015-16` | annata NBA canonica; mappata da edizione 2K (convenzione da fissare, vedi §5.4) |
| `edition` | `2K16` | da quale edizione 2K viene il rating |
| `team` | `Golden State Warriors` | squadra di **quella** stagione |
| `pos` | `["PG"]` | ruolo/i ammessi (2K: primario + secondario) |
| `ovr` | `94` | overall 2K |
| `att` | `[…]` | attributi offensivi (mappati ai 7 OFF del modello attuale) |
| `def` | `[…]` | attributi difensivi (mappati ai 5 DEF del modello attuale) |
| `nat` | `USA` | nazionalità — opzionale (38-0-0 mostra le bandiere) |

**Versioni:** stesso `player_id` su più `season` = le carte multiple. La slot machine, dato
*team + season*, mostra tutte le carte con quel `team` e quella `season`.

**Leggende curate:** piccolo insieme di carte pre-2016 (es. `jordan-michael` 1995-96), prese dai
rating 2K "classic / all-time". Stesso schema, con `season` reale dell'annata iconica.

### 5.2 Fonti e pipeline
1. **Base pronta:** dataset Kaggle *"NBA 2K Ratings with Real NBA Stats"* → copre **2K16–2K21**.
2. **Anni mancanti (2K22–2K24) + refresh attuali (2K25–2K27):** scraping di **2kratings.com**
   (pagine per giocatore/edizione con dettaglio attributi) o dataset equivalenti.
3. **Leggende:** rating 2K *classic-teams / all-time* (2kratings) → si sceglie a mano un subset.
4. **Output:** un unico dataset normalizzato (formato tipo `players-data.js`, ma multi-stagione,
   raggruppato per `player_id`).

### 5.3 Mappatura attributi 2K → modello attuale (7 OFF / 5 DEF)
Il modello ATT/DIF esistente vuole 7 attributi offensivi e 5 difensivi. Gli attributi 2K vanno
**mappati** su questi (o, in alternativa, si raffina il modello sugli attributi 2K nativi — è una
scelta di Fase 2). Da definire la tabella di corrispondenza esatta nello spec di Fase 1.

### 5.4 Rischi / da verificare (onestà, niente assunzioni nascoste)
- **Granularità attributi anni vecchi:** 2K16–2K19 potrebbero avere dati più "overall-centrici"
  e meno dettaglio attributi. Se mancano, decidere: derivarli, approssimarli, o limitare l'ATT/DIF
  dettagliato agli anni con attributi completi.
- **Convenzione edizione→annata da fissare:** alcuni dataset etichettano 2K16 come stagione
  2014-15, altri come 2015-16. Scelta cosmetica ma da rendere **coerente** su tutto il dataset.
- **Coerenza nomi** fra fonti diverse (accenti, omonimi, suffissi) → serve normalizzazione.
- **Squadra-per-stagione:** i roster 2K Play Now sono un'istantanea (i trade a stagione in corso
  non sempre riflessi) → accettabile per il gioco.
- **ToS/scraping** di 2kratings → preferire i dataset pronti dove possibile, scraping gentile per il resto.

---

## 6. FASE 2 — Gioco (abbozzo, da dettagliare nel suo spec)

- **Spin:** estrae *squadra + stagione*; mostra la rosa di quell'anno (carte con ovr/ruolo/att/dif).
- **Switch / aiuti:** *Cambia squadra* (stessa stagione) · *Cambia stagione* (stessa squadra) ·
  in **Facile** entrambi liberi. Numero di aiuti = funzione della **difficoltà** (Incubo = 0).
- **Quintetto:** 5 slot per ruolo (PG/SG/SF/PF/C); ogni giocatore scelto riempie uno slot compatibile.
- **Voto squadra:** OVR/ATT/DIF (modello attuale) su dati veri; la coreografia fine-draft G1 esistente
  si riusa.
- **Win/imbattuto:** da progettare separatamente.

---

## 7. Cosa NON facciamo ora (YAGNI)
- Condizione di vittoria / simulazione "imbattuto".
- Seconda modalità a stagione singola affiancata.
- Ere pre-2016 complete con versioni multiple (solo leggende curate, per ora).
- Badge 2K, foto/loghi ufficiali (progetto fan-made: niente marchi).

## 8. Prossimo passo
Rivedere questo spec. Se ok → spec dettagliato della **Fase 1 (Dati)** e relativo piano di
implementazione.
