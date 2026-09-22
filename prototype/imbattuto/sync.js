// Pull-merge-push tra localStorage e Supabase. Regola ferrea: MAI un
// overwrite cieco. Se un device e' vuoto e il cloud ha dati, sync() non deve
// cancellare il cloud - ogni passo qui sotto e' scritto per essere additivo
// (merge per chiave), mai "svuota e rimpiazza".

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { sessioneValida } from "./auth.js";
import { allRuns, replaceAllRuns } from "./meta.js";

const REST_URL = `${SUPABASE_URL}/rest/v1`;

const NOME_KEY = "buzzer-player-name";
const ICONA_KEY = "buzzer-player-icon";
const LINGUA_KEY = "buzzer-language";
const DEFAULT_PROFILO = { nome: "PLAYER1", icona: "p1", lingua: "it" };

async function rest(path, session, opts = {}) {
  let res;
  try {
    res = await fetch(`${REST_URL}${path}`, {
      ...opts,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        ...opts.headers,
      },
    });
  } catch {
    throw new Error("Nessuna connessione. Riprova quando sei online.");
  }
  const testo = await res.text();
  if (!res.ok) {
    throw new Error(`Sync fallita (${res.status}): ${testo || res.statusText}`);
  }
  if (!testo) return null; // 201/204 senza Prefer: return=representation
  return JSON.parse(testo);
}

// ============================================================
// Runs: chiave di dedup = ts (meta.js:45 lo stampa su ogni run,
// anche quelle vecchie salvate prima di questo file). Le run sono
// immutabili una volta registrate: in caso di collisione di ts tra
// locale e cloud si tiene la versione locale, non conta quale vince
// perche' il contenuto e' lo stesso evento.
// ============================================================
async function syncRuns(store, session) {
  // Le run moderne hanno già ts da recordRun().
  // Per eventuali run legacy senza ts assegniamo un valore stabile UNA SOLA
  // VOLTA e lo persistiamo subito in localStorage prima di qualsiasi sync.
  // L'offset evita collisioni tra più run legacy migrate nello stesso tick.
  const originali = allRuns(store);
  const baseTs = Date.now();
  let modificati = false;

  const locali = originali.map((r, index) => {
    if (r.ts) return r;
    modificati = true;
    return { ...r, ts: baseTs + index };
  });

  if (modificati) {
    replaceAllRuns(store, locali);
  }

  const cloud = await rest(`/runs?user_id=eq.${session.user.id}&select=ts,data`, session);

  const tsCloud = new Set(cloud.map((r) => r.ts));
  const unite = new Map();
  for (const r of cloud) unite.set(r.ts, r.data);
  for (const r of locali) unite.set(r.ts, r); // il locale vince sulle collisioni

  const mergedRuns = [...unite.values()].sort((a, b) => a.ts - b.ts);
  replaceAllRuns(store, mergedRuns);

  const daCaricare = locali.filter((r) => !tsCloud.has(r.ts));
  if (daCaricare.length) {
    const righe = daCaricare.map((r) => ({ user_id: session.user.id, ts: r.ts, data: r }));
    await rest("/runs?on_conflict=user_id,ts", session, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(righe),
    });
  }

  return { pull: cloud.length, push: daCaricare.length };
}

// ============================================================
// Profilo: nessun timestamp per campo lato locale, quindi last-write-wins
// vero non e' possibile al primo sync. Regola scelta con l'advisor: se il
// device e' ancora ai default (mai personalizzato) e il cloud ha un
// profilo, il cloud vince; altrimenti il locale vince e sovrascrive il
// cloud (e' la versione piu' "vissuta" che abbiamo).
// ============================================================
function leggiProfiloLocale(store) {
  return {
    nome: store.getItem(NOME_KEY) || DEFAULT_PROFILO.nome,
    icona: store.getItem(ICONA_KEY) || DEFAULT_PROFILO.icona,
    lingua: store.getItem(LINGUA_KEY) || DEFAULT_PROFILO.lingua,
  };
}

function eDefault(p) {
  return p.nome === DEFAULT_PROFILO.nome
    && p.icona === DEFAULT_PROFILO.icona
    && p.lingua === DEFAULT_PROFILO.lingua;
}

async function syncProfilo(store, session) {
  const locale = leggiProfiloLocale(store);
  const righe = await rest(`/profiles?id=eq.${session.user.id}&select=*`, session);
  const cloudProfilo = righe[0] || null;

  if (cloudProfilo && eDefault(locale)) {
    try { store.setItem(NOME_KEY, cloudProfilo.player_name ?? DEFAULT_PROFILO.nome); } catch {}
    try { store.setItem(ICONA_KEY, cloudProfilo.player_icon ?? DEFAULT_PROFILO.icona); } catch {}
    try { store.setItem(LINGUA_KEY, cloudProfilo.language ?? DEFAULT_PROFILO.lingua); } catch {}
    return { direzione: "pull" };
  }

  await rest("/profiles?on_conflict=id", session, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      id: session.user.id,
      player_name: locale.nome,
      player_icon: locale.icona,
      language: locale.lingua,
      updated_at: new Date().toISOString(),
    }),
  });
  return { direzione: "push" };
}

// Entry point unico usato da screens/profilo.js dopo login/registrazione e
// su richiesta manuale ("sincronizza ora"). Non lancia mai in automatico
// senza sessione: chi la chiama deve gia' avere un utente loggato.
export async function sync(store) {
  const session = await sessioneValida(store);
  if (!session) return { ok: false, error: "Non sei loggato." };

  try {
    const runs = await syncRuns(store, session);
    const profilo = await syncProfilo(store, session);
    return { ok: true, runs, profilo };
  } catch (e) {
    return { ok: false, error: e.message || "Sync fallita." };
  }
}
