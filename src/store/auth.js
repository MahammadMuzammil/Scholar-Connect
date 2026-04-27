import { supabase } from '../lib/supabase.js';
import { uploadApplicantPhoto } from './scholars.js';

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
    id: scholarId || user.id,
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

export async function signupUser({ name, email, password, role = 'user', photoFile = null }) {
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

  // Scholar role requires admin approval — submit an application.
  // The user is logged in as a regular 'user' until admin approves.
  if (role === 'scholar') {
    const userId = data.session.user.id;

    // Optional photo upload while the user is freshly authenticated. Failures
    // here shouldn't block the application — admin can approve and the
    // scholar can re-upload later from the dashboard.
    let photoUrl = null;
    if (photoFile) {
      try {
        photoUrl = await uploadApplicantPhoto(userId, photoFile);
      } catch (uploadErr) {
        console.warn('Applicant photo upload failed:', uploadErr);
      }
    }

    try {
      const res = await fetch('/api/scholar-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name, email, photoUrl }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || 'Could not submit scholar application.');
      }
      return {
        applicationSubmitted: true,
        alreadyExists: body.alreadyExists,
        photoUploaded: Boolean(photoUrl),
      };
    } catch (err) {
      throw new Error(`Application failed: ${err.message}`);
    }
  }
  return { applicationSubmitted: false };
}

export async function login({ email, password }) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function logout() {
  await supabase.auth.signOut();
}
