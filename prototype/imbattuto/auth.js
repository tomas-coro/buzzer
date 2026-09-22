// Client Auth Supabase scritto a mano con fetch puro (niente SDK
// @supabase/supabase-js: il progetto non ha bundler ne' import da CDN, vedi
// README di build-offline.mjs). Copre solo email+password, senza conferma
// email (disattivata a mano nel dashboard) e senza magic link/social.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const AUTH_URL = `${SUPABASE_URL}/auth/v1`;
const SESSION_KEY = "imbattuto:session";

// Messaggi di errore Supabase noti, tradotti per la UI. Tutto il resto passa
// il messaggio originale: meglio un errore in inglese visibile che uno
// nascosto o tradotto a caso.
const ERRORI_NOTI = {
  "User already registered": "Esiste gia' un account con questa email.",
  "Invalid login credentials": "Email o password sbagliate.",
  "Email not confirmed": "Email non confermata.",
  "Password should be at least 6 characters": "La password deve avere almeno 6 caratteri.",
};

function traduci(msg) {
  return ERRORI_NOTI[msg] || msg || "Errore sconosciuto.";
}

async function chiamaAuth(path, body) {
  let res;
  try {
    res = await fetch(`${AUTH_URL}${path}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: "Nessuna connessione. Riprova quando sei online." };
  }

  let json = null;
  try { json = await res.json(); } catch { /* risposta vuota, es. su logout */ }

  if (!res.ok) {
    return { ok: false, error: traduci(json?.msg || json?.error_description || json?.error) };
  }
  return { ok: true, data: json };
}

// La sessione salvata contiene access_token/refresh_token/expires_at (epoch
// secondi, come li manda Supabase) + l'utente. `expires_at` serve solo a
// capire se conviene rinfrescare prima di una chiamata, non e' un controllo
// di sicurezza: quello lo fa comunque Supabase lato server su ogni richiesta.
function salvaSessione(store, data) {
  const sessione = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    user: { id: data.user.id, email: data.user.email },
  };
  try { store.setItem(SESSION_KEY, JSON.stringify(sessione)); } catch { /* storage non disponibile */ }
  return sessione;
}

export function getSession(store) {
  try {
    const s = JSON.parse(store.getItem(SESSION_KEY));
    return s?.access_token && s?.user?.id ? s : null;
  } catch { return null; }
}

export function clearSession(store) {
  try { store.removeItem(SESSION_KEY); } catch { /* storage non disponibile */ }
}

// Con "Confirm email" disattivato, signup torna gia' una sessione valida:
// niente passaggio intermedio "controlla la tua email".
export async function signUp(store, email, password) {
  const r = await chiamaAuth("/signup", { email, password });
  if (!r.ok) return r;
  if (!r.data.access_token) {
    return { ok: false, error: "Registrazione fatta ma niente sessione: controlla che 'Confirm email' sia disattivato nel dashboard Supabase." };
  }
  return { ok: true, session: salvaSessione(store, r.data) };
}

export async function signIn(store, email, password) {
  const r = await chiamaAuth("/token?grant_type=password", { email, password });
  if (!r.ok) return r;
  return { ok: true, session: salvaSessione(store, r.data) };
}

// Best-effort: anche se la revoca lato server fallisce (offline, token gia'
// scaduto), la sessione locale va comunque cancellata subito.
export async function signOut(store) {
  const sessione = getSession(store);
  clearSession(store);
  if (!sessione) return { ok: true };
  try {
    await fetch(`${AUTH_URL}/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${sessione.access_token}` },
    });
  } catch { /* logout locale gia' fatto, il resto e' best effort */ }
  return { ok: true };
}

// Ritorna una sessione con access_token ancora valido, rinfrescandola se
// serve. sync.js e ogni chiamata REST devono passare da qui invece di
// leggere getSession() a mano, altrimenti rischiano un token scaduto.
export async function sessioneValida(store) {
  const sessione = getSession(store);
  if (!sessione) return null;

  const scadeTraPoco = sessione.expires_at && sessione.expires_at * 1000 < Date.now() + 60_000;
  if (!scadeTraPoco) return sessione;

  const r = await chiamaAuth("/token?grant_type=refresh_token", {
    refresh_token: sessione.refresh_token,
  });
  if (!r.ok) {
    clearSession(store);
    return null;
  }
  return salvaSessione(store, r.data);
}
