import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

export default function RequireAuth({ role, children }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [supa, setSupa] = useState({ checked: false, hasSession: false });

  // Same fix as RootRedirect — bridge the gap between supabase having a
  // session in memory and our React state catching up after sign-in.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSupa({ checked: true, hasSession: !!data?.session });
    });
    return () => { mounted = false; };
  }, []);

  const stillResolving = loading || !supa.checked || (supa.hasSession && !session);

  if (stillResolving) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="empty">Loading…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (role && session.role !== role) {
    return <Navigate to={session.role === 'scholar' ? '/dashboard' : '/'} replace />;
  }
  return children;
}
