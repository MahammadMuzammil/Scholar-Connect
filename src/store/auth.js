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

export async function signupUser({ name, email, password, role = 'user' }) {
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

  // If signing up as a scholar, create the scholar profile row and link it.
  if (role === 'scholar') {
    const userId = data.session.user.id;
    const scholarId = userId; // use auth UUID as the scholar id

    const { error: scholarErr } = await supabase.from('scholars').insert({
      id: scholarId,
      name,
      title: 'Scholar',
      specialties: [],
      languages: [],
      rating: 4.8,
      reviews: 0,
      price_per_session: 40,
      session_minutes: 30,
      photo: `https://i.pravatar.cc/300?u=${encodeURIComponent(email)}`,
      bio: `${name} is a new scholar on ScholarConnect.`,
      sort_order: 100,
    });
    if (scholarErr) throw new Error(`Couldn't create scholar profile: ${scholarErr.message}`);

    const { error: profErr } = await supabase
      .from('profiles')
      .update({ role: 'scholar', scholar_id: scholarId })
      .eq('id', userId);
    if (profErr) throw new Error(`Couldn't set role: ${profErr.message}`);
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
