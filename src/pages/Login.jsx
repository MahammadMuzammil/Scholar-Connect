import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../store/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAuth();
  const redirectTo = location.state?.from?.pathname;

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form);
      // Pull the session + profile into AuthContext before navigating, so the
      // destination route doesn't render with stale `session: null` and bounce
      // back to /login.
      await refresh();
      navigate(redirectTo || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign-in failed.');
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: 480 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Sign in</h2>
        <p className="muted" style={{ fontSize: 14, marginTop: -4, marginBottom: 16 }}>
          Users and scholars sign in with the same form.
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}
          <button className="primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
            No account? <Link to="/signup" style={{ color: 'var(--text)' }}>Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
