-- Schema Supabase per il login opzionale di buzzer.
-- Da incollare nel SQL editor del progetto (ref ynjhhxeftihcbnatnldz), non eseguibile da qui:
-- questa sessione ha solo la anon key, non una service role key.
--
-- Sincronizza: buzzer-player-name / buzzer-player-icon / buzzer-language (-> profiles)
-- e imbattuto:runs (-> runs, un blob jsonb per run, non normalizzato: le run vecchie
-- non hanno roster/perRound e normalizzare romperebbe quelle righe).
-- NON sincronizza imbattuto:current (transiente, resta locale).

-- ============================================================
-- profiles: 1 riga per utente, i settaggi oggi in localStorage
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  player_name text,
  player_icon text,
  language text,
  -- Timestamp scritto dal CLIENT ad ogni upsert (non solo al primo insert):
  -- serve per il last-write-wins in sync.js quando due device divergono.
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: solo il proprio profilo"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- runs: N righe per utente, una per partita registrata da
-- recordRun() in meta.js. Chiave (user_id, ts) invece di un uuid
-- generato al volo: le run già salvate in locale non hanno un id
-- proprio, solo `ts` (meta.js:45, Date.now()). Usare (user_id, ts)
-- come chiave rende l'upsert idempotente anche sulle run vecchie,
-- senza dover riscrivere id nel localStorage per evitare duplicati
-- ad ogni sync successivo.
-- ============================================================
create table public.runs (
  user_id uuid not null references auth.users (id) on delete cascade,
  ts bigint not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, ts)
);

create index runs_user_ts_idx on public.runs (user_id, ts desc);

alter table public.runs enable row level security;

create policy "runs: solo le proprie run"
  on public.runs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Verifica RLS dopo aver incollato lo schema (sostituisci <ANON_KEY>,
-- <JWT_UTENTE_A> = access_token da /auth/v1/token?grant_type=password
-- per un account di test):
--
-- 1) insert con JWT reale -> deve rispondere 201
-- curl -X POST 'https://ynjhhxeftihcbnatnldz.supabase.co/rest/v1/runs' \
--   -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <JWT_UTENTE_A>" \
--   -H "Content-Type: application/json" -H "Prefer: return=representation" \
--   -d '{"ts": 1737500000000, "data": {"formato":"test"}}'
--
-- 2) select con lo stesso JWT -> deve tornare solo le run di quell'utente
-- curl 'https://ynjhhxeftihcbnatnldz.supabase.co/rest/v1/runs?select=*' \
--   -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <JWT_UTENTE_A>"
--
-- 3) select con la SOLA anon key, senza Authorization -> deve tornare [] vuoto
--    (questo e' il test vero: una policy scritta ma non funzionante spesso
--    passa 1 e 2 e fallisce solo qui)
-- curl 'https://ynjhhxeftihcbnatnldz.supabase.co/rest/v1/runs?select=*' \
--   -H "apikey: <ANON_KEY>"
