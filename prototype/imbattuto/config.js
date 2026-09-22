// Config Supabase. La anon key e' pensata per stare nel client (nessun
// server dietro): la sicurezza vera sta nelle policy RLS di
// docs/supabase-schema.sql, non nel nascondere questa chiave.
export const SUPABASE_URL = "https://ynjhhxeftihcbnatnldz.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluamhoeGVmdGloY2JuYXRubGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNTc2MzgsImV4cCI6MjEwNTYzMzYzOH0.5UmEWw7HeqIO7jA__t53oQDW4peIgH1C64phOxkC5hs";
