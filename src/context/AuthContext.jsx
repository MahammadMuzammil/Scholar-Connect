import { createContext, useContext, useEffect, useState } from 'react';
import { getSession, subscribeSession } from '../store/auth.js';

const AuthContext = createContext({ session: null, loading: true });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSession()
      .then((s) => { if (!cancelled) setSession(s); })
      .finally(() => { if (!cancelled) setLoading(false); });
    const unsub = subscribeSession((s) => setSession(s));
    return () => { cancelled = true; unsub(); };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
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
