import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginScholar, loginUser } from '../store/auth.js';
import { scholars } from '../data/scholars.js';

export default function Login() {
  const [tab, setTab] = useState('user');
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname;

  const [userForm, setUserForm] = useState({ email: '', password: '' });
  const [scholarForm, setScholarForm] = useState({
    scholarId: scholars[0].id,
    passcode: '',
  });
  const [error, setError] = useState('');

  const submitUser = (e) => {
    e.preventDefault();
    setError('');
    try {
      loginUser(userForm);
      navigate(redirectTo || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const submitScholar = (e) => {
    e.preventDefault();
    setError('');
    try {
      loginScholar(scholarForm);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: 480 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Sign in to ScholarConnect</h2>
        <div className="inline" style={{ gap: 6, marginBottom: 16 }}>
          <button
            type="button"
            className={tab === 'user' ? 'primary' : 'ghost'}
            onClick={() => { setTab('user'); setError(''); }}
          >
            I'm a user
          </button>
          <button
            type="button"
            className={tab === 'scholar' ? 'primary' : 'ghost'}
            onClick={() => { setTab('scholar'); setError(''); }}
          >
            I'm a scholar
          </button>
        </div>

        {tab === 'user' ? (
          <form onSubmit={submitUser}>
            <div className="field">
              <label>Email</label>
              <input
                required
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                required
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}
            <button className="primary" type="submit" style={{ width: '100%' }}>
              Sign in
            </button>
            <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
              No account? <Link to="/signup" style={{ color: 'var(--text)' }}>Create one</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={submitScholar}>
            <div className="field">
              <label>Choose your scholar profile</label>
              <select
                value={scholarForm.scholarId}
                onChange={(e) => setScholarForm({ ...scholarForm, scholarId: e.target.value })}
              >
                {scholars.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Passcode</label>
              <input
                required
                type="password"
                value={scholarForm.passcode}
                onChange={(e) => setScholarForm({ ...scholarForm, passcode: e.target.value })}
                placeholder="scholar123"
              />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}
            <button className="primary" type="submit" style={{ width: '100%' }}>
              Sign in as scholar
            </button>
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              Demo passcode: <code>scholar123</code>. In production, scholars receive real credentials after verification.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
