import { supabase } from '../lib/supabase.js';
import { scholarIdByEmail } from '../data/scholars.js';

// Shape the raw Supabase user into our app's session object.
// Adds `role` and (for scholars) `scholarId` derived from the email mapping.
export function sessionFromSupabase(supaSession) {
  const user = supaSession?.user;
  if (!user) return null;
  const email = user.email;
  const scholarId = email ? scholarIdByEmail(email) : null;
  return {
    role: scholarId ? 'scholar' : 'user',
    id: scholarId || user.id,          // scholars identify as their scholar id (used to filter bookings)
    authUserId: user.id,
    scholarId,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Guest',
    email,
  };
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return sessionFromSupabase(data?.session);
}

export function subscribeSession(handler) {
  const { data } = supabase.auth.onAuthStateChange((_event, supaSession) => {
    handler(sessionFromSupabase(supaSession));
  });
  return () => data.subscription.unsubscribe();
}

export async function signupUser({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  if (!data.session) {
    // Happens when email confirmation is ON — user must verify first.
    throw new Error(
      'Account created — please check your email to confirm. Or disable "Confirm email" in Supabase Authentication → Providers for dev.'
    );
  }
  return sessionFromSupabase(data.session);
}

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return sessionFromSupabase(data.session);
}

export async function logout() {
  await supabase.auth.signOut();
}
