import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn(
    'Supabase env vars missing — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.'
  );
}

export const supabase = createClient(url || 'http://localhost', anon || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'scholar-connect-auth',
  },
});

export const supabaseReady = Boolean(url && anon);
