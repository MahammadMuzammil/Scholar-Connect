import { createContext, useContext, useEffect, useState } from 'react';
import { getSession, subscribeSession } from '../store/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());

  useEffect(() => subscribeSession(setSession), []);

  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

export function useSession() {
  return useContext(AuthContext);
}
