import { createClient } from '@supabase/supabase-js';

let cached = null;

// Server-side Supabase client using the service-role key. Bypasses RLS so it
// can create scholar rows and update other users' profiles during approval.
// Never expose this key to the browser.
export function getAdminClient() {
  if (cached) return cached;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Service-role Supabase client not configured: set SUPABASE_SERVICE_ROLE_KEY (and VITE_SUPABASE_URL or SUPABASE_URL).'
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
