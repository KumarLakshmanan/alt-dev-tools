import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for server-side use (service role).
 * Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 * Only used for storing feedback — no auth, no user data.
 */
export function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
