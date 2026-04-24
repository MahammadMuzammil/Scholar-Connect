import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupUser } from '../store/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  useEffect(() => {
    if (!signedUp || !session) return;
    if (session.role === 'scholar') {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [signedUp, session, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signupUser(form);
      setSignedUp(true);
    } catch (err) {
      setError(err.message || 'Sign-up failed.');
      setBusy(false);
    }
  };

  const selectRole = (role) => setForm((f) => ({ ...f, role }));

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: 480 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Create your account</h2>
        <p className="muted" style={{ fontSize: 14, marginTop: -4, marginBottom: 16 }}>
          Choose your role. You can book scholars as a user, or offer sessions as a scholar.
        </p>

        <div className="inline" style={{ gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className={form.role === 'user' ? 'primary' : 'ghost'}
            onClick={() => selectRole('user')}
            style={{ flex: 1 }}
          >
            👤 I'm a user
          </button>
          <button
            type="button"
            className={form.role === 'scholar' ? 'primary' : 'ghost'}
            onClick={() => selectRole('scholar')}
            style={{ flex: 1 }}
          >
            🕌 I'm a scholar
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label>Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={form.role === 'scholar' ? 'Sheikh Ibrahim' : 'Aisha Rahman'}
              autoComplete="name"
            />
          </div>
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
              placeholder="At least 6 characters"
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {form.role === 'scholar' && (
            <p className="muted" style={{ fontSize: 13, marginTop: -4, marginBottom: 14 }}>
              You'll appear in the marketplace with a default profile — you can update your title,
              bio, photo, and price later.
            </p>
          )}

          {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}
          <button className="primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Creating account…' : `Create ${form.role} account`}
          </button>
          <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
            Already have one? <Link to="/login" style={{ color: 'var(--text)' }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
