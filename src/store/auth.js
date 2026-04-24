import { supabase } from '../lib/supabase.js';

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, scholar_id, name')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('Failed to fetch profile:', error);
    return null;
  }
  return data;
}

// Shape the raw Supabase user + DB profile into our app's session object.
export async function sessionFromSupabase(supaSession) {
  const user = supaSession?.user;
  if (!user) return null;
  const profile = await fetchProfile(user.id);
  const role = profile?.role || 'user';
  const scholarId = profile?.scholar_id || null;
  const name =
    profile?.name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Guest';
  return {
    role,
    id: scholarId || user.id,   // scholars identify as their scholar id; users as auth UUID
    authUserId: user.id,
    scholarId,
    name,
    email: user.email,
  };
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return sessionFromSupabase(data?.session);
}

export function subscribeSession(handler) {
  const { data } = supabase.auth.onAuthStateChange(async (_event, supaSession) => {
    handler(await sessionFromSupabase(supaSession));
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
