# Design — FASE 2 / L'IMBATTUTO (modalità veloce, 5 slot)

**Data:** 2026-07-20
**Stato:** design approvato in brainstorming; spec da rivedere prima del piano di implementazione.
**Spec padre:** `2026-06-27-draft-multistagione-2k-design.md` (Fase 2 era solo abbozzata).
**Prerequisito dati:** `2026-06-29-fase1-step2-attributi-design.md` (12 attributi + posizione) — piano già scritto, da eseguire.
**Riferimenti:** 7-0 (2K MyTeam Unlimited), 38-0-0 Serie A, [eraball.com](https://eraball.com).

---

## 1. Visione in una riga

**L'IMBATTUTO** è la modalità veloce di buzzer: costruisci **un quintetto** (5 ruoli) pescando
carte giocatore-stagione 2K-style, poi affronti un **bracket di squadre NBA storiche reali** e devi
vincere **N partite di fila senza mai perdere** (imbattuto). Per arrivare in cima devi completare
l'imbattuto a **tutte le difficoltà**. È l'equivalente NBA di 7-0 / 38-0-0.

## 2. Cosa NON è (confini)

- **Non** è il draft completo a 9 slot (5 titolari + 4 panchina): quello sarà un suo spec separato,
  costruito sopra lo stesso motore. Qui: **solo 5 slot** (quintetto), uno per ruolo.
- **Non** c'è simulazione partita-per-partita: l'esito di un round è **voto squadra vs voto squadra**
  (vedi §6). Niente box-score simulati, niente RNG di partita.
- **Non** ci sono, per ora (YAGNI): tag d'impatto sui giocatori, modalità tier/salary-cap,
  penalità d'epoca (abbiamo 6 stagioni quasi adiacenti 2014-15→2019-20: irrilevante).

## 3. Decisioni bloccate

1. **Dati carte:** OVR + 12 attributi (7 off / 5 def) + posizione, derivati dalle statistiche reali
   (lo **Step 2** della Fase 1). Nessun tag, nessuna statistica grezza mostrata come voto.
2. **Roster:** 5 slot per ruolo NBA (**PG, SG, SF, PF, C**). Dimensione roster = parametro di modalità
   (le modalità future useranno 6 o 9); qui è fissata a 5.
3. **Draft "1 fra 5":** ogni turno peschi *team + stagione* e scegli **1 candidato fra 5** per il ruolo
   di quel turno. Divergenza voluta da eraball (che mostra l'intera rosa).
4. **Vittoria:** una squadra, **N vittorie di fila**; una sconfitta = run finito. Avversari = **squadre
   NBA storiche reali** dal dataset. Top del gioco = imbattuto a **tutte e 4 le difficoltà**.
5. **Esito round:** **Approccio A — soglia secca**, deterministico (`tuo voto ≥ voto avversario` = vinci).
6. **Spunti da eraball adottati:** **coach** con voti OFF/DEF; **leaderboard + awards + stats a vita**.
   **Scartati:** tag giocatore, tier/salary-cap.

---

## 4. Il loop di gioco (flusso end-to-end)

```
Home → scegli formato (Playoff / Stagione / Sfida) + difficoltà
   → DRAFT quintetto: 5 turni (PG→SG→SF→PF→C)
        turno = spin(team+stagione) → 5 candidati per il ruolo → scegli 1
        aiuti disponibili = f(difficoltà): cambia squadra · cambia stagione · re-spin
   → scegli COACH (voti OFF/DEF)
   → RUN imbattuto: bracket di avversari storici, difficoltà crescente
        ogni round: tuo voto vs voto avversario (Approccio A)
        vinci → avanza, meter del calore +1 → prossimo round
        perdi → run finito
   → FINE: punteggio + awards → leaderboard + stats a vita
```

## 5. Modello dati (unità e interfacce)

### 5.1 Carta (dallo Step 2, sola lettura in Fase 2)
`{ player_id, name, season, edition, team, team_abbr, ovr, pos:{primary,secondary},
   att:[7], def:[5], estimated, stats_real, stats_adv, enrich }`

### 5.2 Slot del quintetto
`{ role: "PG"|"SG"|"SF"|"PF"|"C", card: Carta|null }`
Un candidato è assegnabile a uno slot se `role ∈ {pos.primary, pos.secondary}`.

### 5.3 Coach
`{ id, name, off_grade: "A".."F", def_grade: "A".."F", champ_bonus: number }`
Effetto sul voto squadra: §6.

### 5.4 Stato del run
`{ formato, difficolta, quintetto:[5 Slot], coach, aiuti_rimasti:{squadra,stagione,respin},
   round_corrente, vittorie, avversario_corrente, storia:[esiti], stato:"draft"|"run"|"finito" }`

### 5.5 Avversario
`{ team, season, quintetto:[5 Carta], voto:{att,dif,ovr} }` — quintetto storico reale
(lo "starting five" di quella squadra-stagione) valutato con la **stessa** formula del giocatore.

## 6. Motore di valutazione (voto squadra)

Riuso del modello del banco `mockups/59-formula-squadra.html` (asimmetrico):

- `offW(att)` / `defW(def)` = medie pesate dei 7 off / 5 def con pesi interni fissi
  (`WOFF=[1.4,1.1,1.2,0.7,0.8,0.9,0.9]`, `WDEF=[1.3,1.3,1.1,1.1,0.7]`).
- Squadra = aggregato dei 5 titolari.
- `ATT = OVR + A·(offW − E[offW|OVR])`, `DIF = DB + SD·(defW − mediaDefW)`.
- Costanti `AO/BO/mediaDefW` = quelle **rifittate sul dataset arricchito** (Step 2, Task 9).
- **Coach:** i voti OFF/DEF (A–F → moltiplicatore) spingono rispettivamente ATT e DIF; `champ_bonus`
  aggiuntivo. Un coach OFF "A" alza ATT, un DEF "A" alza DIF. (Curva A–F da tarare nel banco.)
- `OVR squadra` = combinazione di ATT e DIF (come nel banco).

**Esito round (Approccio A):** `vinci ⟺ OVR_tuo ≥ OVR_avversario`. Deterministico, nessuna varianza.
La tensione viene dalla **soglia crescente** del bracket, non dal caso.

## 7. Difficoltà & progressione

| Livello | Aiuti nel draft | Bracket |
|---|---|---|
| Facile | switch squadra/stagione liberi + re-spin | avversari bassi, N piccolo |
| Normale | pochi aiuti | avversari medi |
| Difficile | 1 aiuto | avversari alti |
| Incubo | 0 aiuti | avversari top, N pieno |

- Ogni **imbattuto completato** a un livello = sblocco/trofeo di quel livello.
- **Top del gioco:** imbattuto completato a **tutti e 4** i livelli.
- `N` (numero vittorie per "imbattuto") e la scala avversari sono **parametri tarabili** per formato+difficoltà.

## 8. Formati

- **Playoff:** bracket corto (run veloce) — il formato di ingresso.
- **Stagione:** run lungo (più round prima del titolo).
- **Sfida:** vincoli fissi (es. era/decade o rosa limitata), stile weekly challenge di eraball.

Tutti e tre usano lo stesso motore §6 e la stessa struttura run; cambiano `N`, pool avversari e vincoli.

## 9. Meta (spunti eraball)

- **Leaderboard:** per `formato × difficoltà`. Punteggio = vittorie + margine cumulato (tie-break).
- **Awards** fine-run: es. *MVP del quintetto* (miglior contributo pesato), badge imbattuto.
- **Stats a vita:** run giocate, imbattuti, difficoltà sbloccate, miglior streak.
- Persistenza: `localStorage` (coerente con il progetto statico; nessun backend richiesto per la v1).

## 10. UI (mockup già esistenti da rifinire)

- **Zona modalità / home:** `20`, `21` (L'IMBATTUTO, sirena, formati).
- **Draft "1 fra 5":** `42`, `45`, `25` (scheda candidato nei 4 livelli), `27`/`29` (rosa/impatto).
- **Tabellone (segnapunti run):** `24` (jumbotron / split-flap).
- **Meter del calore (streak):** `22`, `23` (il "SU 16").
- **Fine draft / quintetto completo:** `50`, `51`, `55`-`57` (animazioni G1).
- **Formula squadra (banco):** `58`, `59`.

Direzione estetica già fissata nei mockup: near-black + accento oro, display condensato maiuscolo,
tema arena/sirena. La UI di Fase 2 rifinisce questi, non riparte da zero.

## 11. Gestione errori (niente fallback silenzioso)

- Dataset `nba-data.js` non arricchito (Step 2 non eseguito) → **errore chiaro** all'avvio della modalità
  ("attributi mancanti"), non voti finti a zero.
- Meno di 5 candidati validi per un ruolo dopo lo spin → mostra quanti ce ne sono + consenti re-spin;
  mai riempire con carte inventate.
- Slot senza candidato compatibile per posizione → il giocatore non è assegnabile a quello slot
  (nessun assegnamento silenzioso fuori ruolo).

## 12. Testing

- **Motore voto** (unit): offW/defW note; coach A/F alza/abbassa ATT/DIF; esito round `≥` corretto ai bordi.
- **Assegnamento slot** (unit): compatibilità posizione primaria/secondaria; rifiuto fuori ruolo.
- **Run** (unit): vittoria avanza e incrementa streak; sconfitta termina; N raggiunto = imbattuto.
- **Aiuti** (unit): consumo corretto per difficoltà; Incubo = 0.
- **Pool avversari** (unit): estrazione quintetti storici + voto con la stessa formula.
- **Meta** (unit): punteggio, sblocco difficoltà, persistenza localStorage.

## 13. Definition of Done — L'IMBATTUTO fast

- Draft 5 slot "1 fra 5" funzionante nei 4 livelli con aiuti corretti.
- Coach selezionabile con effetto misurabile su ATT/DIF.
- Run imbattuto (Approccio A) contro quintetti storici reali; streak e fine-run corretti.
- Leaderboard + awards + stats a vita persistiti (localStorage).
- Voti squadra coerenti col banco `59-formula-squadra` sul dataset **arricchito** (Step 2 eseguito).
- Test §12 verdi.

## 14. Rischi / punti aperti

- **Dipendenza da Step 2:** senza i 12 attributi il voto squadra non regge. Step 2 va eseguito prima
  (o in parallelo) a questa Fase 2.
- **Taratura:** `N`, scala avversari, curva coach A–F, costanti `AO/BO/mediaDefW` = lavoro a occhio nel
  banco. Il design fissa il *metodo*, non i numeri finali.
- **Pool avversari:** definire quali quintetti storici usare e come ordinarli per difficoltà (miglior 5
  per team-stagione? per OVR?) — da fissare nel piano di implementazione.

## 15. Prossimo passo

Rivedere questo spec. Se ok → piano di implementazione (writing-plans). Nota: lo **Step 2** dei dati è
prerequisito e ha già il suo piano; si può eseguire prima di iniziare questa Fase 2.
