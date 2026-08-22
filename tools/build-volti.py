#!/usr/bin/env python3
"""Scarica e ritaglia i volti dei giocatori delle carte.

PERCHE' IL VOLTO E NON IL BUSTO. La NBA pubblica una sola headshot per
giocatore, quella dell'ULTIMA squadra: l'archivio per stagione
(ak-static/.../miami/2013/) risponde 403 da anni. Con il busto intero LeBron
2012-13 di Miami comparirebbe in canotta Lakers, e nel draft la maglia è un
dato che si legge. Ritagliando la testa la maglia sparisce e resta la faccia,
che fra una stagione e l'altra cambia molto meno.

Le headshot NBA hanno lo SFONDO TRASPARENTE e l'inquadratura standard, quindi
la testa si trova a occhio dai pixel opachi: la prima riga non vuota è la
sommita' del capo, la riga più larga li' sotto è la larghezza della testa.

Uso:
  python3 tools/build-volti.py            tutte le carte (~780 giocatori)
  python3 tools/build-volti.py --solo 20  le prime 20, per provare
"""
import argparse, io, json, re, shutil, subprocess, sys, unicodedata
from pathlib import Path

import numpy as np
from PIL import Image

RADICE = Path(__file__).resolve().parent.parent
USCITA = RADICE / "assets" / "volti"
MAPPA = RADICE / "data" / "volti-id.json"
# La lista id -> nome di nba_api: è un file di dati, non una dipendenza; lo
# leggiamo una volta e ce ne teniamo la mappa in data/volti-id.json.
FONTE_ID = "https://raw.githubusercontent.com/swar/nba_api/master/src/nba_api/stats/library/data.py"
HEADSHOT = "https://cdn.nba.com/headshots/nba/latest/1040x760/{id}.png"
# Si scarica con curl e non con urllib: il Python di python.org su questo Mac non
# ha il pacchetto di certificati installato e ogni https muore con
# CERTIFICATE_VERIFY_FAILED. curl usa quelli di sistema e c'è ovunque.
UA = "Mozilla/5.0"


def scarica(url, timeout=30):
    """I byte dell'URL. Alza un'eccezione se curl fallisce: niente ritorni vuoti
    che poi diventano immagini rotte senza che nessuno se ne accorga."""
    if shutil.which("curl") is None:
        raise RuntimeError("serve curl per scaricare le foto")
    r = subprocess.run(
        ["curl", "-sSL", "--fail", "--max-time", str(timeout),
         "-A", UA, "-e", "https://www.nba.com/", url],
        capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(f"curl {r.returncode}: {r.stderr.decode().strip()[:120]}")
    return r.stdout

LATO = 160        # il volto finito, in pixel: la casella più grande è 76px @2x
ZOOM = 1.62       # quanto largo il quadrato rispetto alla testa: più basso, più stretto sul viso
ALTO = 0.12       # quanto spazio lasciare sopra il capo, in frazioni di lato

# Le due fonti chiamano diversamente un pugno di giocatori. Stessa logica degli
# alias in build-cards.mjs: nome della carta -> nome nella lista NBA.
ALIAS = {
    "Enes Kanter": "Enes Freedom",
    "Nicolas Claxton": "Nic Claxton",
}


def norm(s):
    """Nome confrontabile: niente accenti, niente punti, niente suffissi."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.sub(r"[^a-z ]", "", s)
    s = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b", "", s)
    return re.sub(r"\s+", " ", s).strip()


def carte():
    """I giocatori unici di cards.js: (player_id, nome). Letti col regex perché
    cards.js è un modulo ES e qui siamo in Python."""
    src = (RADICE / "prototype" / "imbattuto" / "cards.js").read_text()
    visti = {}
    for pid, nome in re.findall(r'"player_id":"(.*?)","name":"(.*?)"', src):
        visti.setdefault(pid, nome)
    return sorted(visti.items())


def mappa_id():
    if MAPPA.exists():
        return json.loads(MAPPA.read_text())
    print("scarico la lista id NBA...", file=sys.stderr)
    src = scarica(FONTE_ID, 60).decode()
    rows = re.findall(r'\[(\d+), ".*?", ".*?", "(.*?)", (?:True|False)\]', src)
    fuori = {}
    for pid, full in rows:
        fuori.setdefault(norm(full), int(pid))
    MAPPA.parent.mkdir(parents=True, exist_ok=True)
    MAPPA.write_text(json.dumps(fuori, indent=0, sort_keys=True))
    return fuori


def volto(dati):
    """Ritaglia la testa da una headshot NBA e la restituisce quadrata."""
    im = Image.open(dati).convert("RGBA")
    opachi = np.array(im.getchannel("A")) > 20
    righe = np.where(opachi.any(axis=1))[0]
    if len(righe) == 0:
        raise ValueError("headshot vuota")
    top = int(righe[0])
    larghezze, centri = [], []
    for r in opachi[top:top + 220]:
        xs = np.where(r)[0]
        if len(xs):
            larghezze.append(xs[-1] - xs[0] + 1)
            centri.append((xs[-1] + xs[0]) / 2)
    testa = max(larghezze) if larghezze else im.width // 3
    cx = float(np.median(centri)) if centri else im.width / 2
    lato = int(testa * ZOOM)
    x0, y0 = int(cx - lato / 2), int(top - lato * ALTO)
    fuori = Image.new("RGBA", (lato, lato), (0, 0, 0, 0))
    fuori.paste(im.crop((x0, y0, x0 + lato, y0 + lato)), (0, 0))
    return fuori.resize((LATO, LATO), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--solo", type=int, default=0, help="quanti giocatori (0 = tutti)")
    ap.add_argument("--rifai", action="store_true", help="riscarica anche i volti già fatti")
    args = ap.parse_args()

    USCITA.mkdir(parents=True, exist_ok=True)
    ids = mappa_id()
    elenco = carte()
    if args.solo:
        elenco = elenco[:args.solo]

    fatti = saltati = persi = 0
    mancanti = []
    for pid, nome in elenco:
        dest = USCITA / f"{pid}.webp"
        if dest.exists() and not args.rifai:
            saltati += 1
            continue
        nba = ids.get(norm(ALIAS.get(nome, nome)))
        if nba is None:
            mancanti.append(nome)
            persi += 1
            continue
        try:
            dati = scarica(HEADSHOT.format(id=nba))
            volto(io.BytesIO(dati)).save(dest, "WEBP", quality=82, method=6)
            fatti += 1
        except Exception as e:  # niente fallback muto: chi manca si vede
            mancanti.append(f"{nome} ({e})")
            persi += 1
        if (fatti + persi) % 50 == 0:
            print(f"  {fatti} fatti, {persi} persi...", file=sys.stderr)

    print(f"volti: {fatti} nuovi, {saltati} già presenti, {persi} senza foto", file=sys.stderr)
    if mancanti:
        print("senza foto: " + ", ".join(mancanti[:30]), file=sys.stderr)


if __name__ == "__main__":
    main()
