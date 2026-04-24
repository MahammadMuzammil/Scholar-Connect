import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSession, subscribeSession } from '../store/auth.js';

const AuthContext = createContext({ session: null, loading: true, refresh: () => {} });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await getSession();
    setSession(s);
    return s;
  }, []);

  useEffect(() => {
    let cancelled = false;
    getSession()
      .then((s) => { if (!cancelled) setSession(s); })
      .finally(() => { if (!cancelled) setLoading(false); });
    const unsub = subscribeSession((s) => setSession(s));
    return () => { cancelled = true; unsub(); };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  return useContext(AuthContext).session;
}

export function useAuth() {
  return useContext(AuthContext);
}
