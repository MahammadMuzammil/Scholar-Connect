import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupUser } from '../store/auth.js';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signupUser(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign-up failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: 480 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Create your account</h2>
        <p className="muted" style={{ fontSize: 14, marginTop: -4, marginBottom: 16 }}>
          Sign up as a user to book scholars. Scholars receive credentials directly.
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Aisha Rahman"
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
          {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}
          <button className="primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
          <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
            Already have one? <Link to="/login" style={{ color: 'var(--text)' }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
