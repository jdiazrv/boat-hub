import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Dónde manda el barco sus horas (edge function ingest-engine-hours). */
export const ingestEngineHoursUrl = supabaseUrl
  ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/ingest-engine-hours`
  : null;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

