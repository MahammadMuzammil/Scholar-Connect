import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupUser } from '../store/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingApplication, setPendingApplication] = useState(false);

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      // Photo only goes up for scholar applicants; ignored otherwise.
      const result = await signupUser({
        ...form,
        photoFile: form.role === 'scholar' ? photoFile : null,
      });
      if (result?.applicationSubmitted) {
        setPendingApplication(true);
        return;
      }
      // Pull the session + profile into AuthContext before navigating. Hard
      // timeout so a slow profiles fetch can't pin the button on
      // "Creating account…" forever.
      await Promise.race([
        refresh(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Profile fetch timed out — please try signing in.')),
            5000
          )
        ),
      ]);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign-up failed.');
      setBusy(false);
    }
  };

  const selectRole = (role) => setForm((f) => ({ ...f, role }));

  if (pendingApplication) {
    return (
      <div className="container" style={{ padding: '40px 0', maxWidth: 560 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(245,158,11,.15)', border: '2px solid rgba(245,158,11,.5)',
              display: 'grid', placeItems: 'center', margin: '0 auto 14px',
              color: '#f59e0b', fontSize: 30,
            }}
          >
            ⏳
          </div>
          <h2 style={{ margin: 0 }}>Application submitted</h2>
          <p className="muted" style={{ marginTop: 10 }}>
            Thank you, <strong>{form.name}</strong>. Your scholar application is now with the admin
            for review. You'll be notified once approved.
          </p>
          <p className="muted" style={{ fontSize: 14 }}>
            In the meantime your account works as a regular user — you can browse and book
            sessions with other scholars.
          </p>
          <div className="inline" style={{ justifyContent: 'center', marginTop: 18 }}>
            <Link to="/">
              <button className="primary">Browse scholars</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: 480 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Create your account</h2>
        <p className="muted" style={{ fontSize: 14, marginTop: -4, marginBottom: 16 }}>
          Choose your role. You can book scholars as a user, or apply to offer sessions as a scholar.
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
            <>
              <div className="field">
                <label>Profile photo (optional)</label>
                <div className="inline" style={{ gap: 14, alignItems: 'center' }}>
                  {photoPreview ? (
                    <div
                      className="avatar lg"
                      style={{ backgroundImage: `url(${photoPreview})` }}
                      aria-label="Selected photo preview"
                    />
                  ) : (
                    <div
                      className="avatar lg"
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--muted)',
                        fontSize: 28,
                      }}
                    >
                      🕌
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <input
                      id="signup-photo"
                      type="file"
                      accept="image/*"
                      onChange={onPhotoChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="signup-photo">
                      <span
                        className="ghost"
                        style={{
                          display: 'inline-block',
                          padding: '8px 14px',
                          borderRadius: 8,
                          background: 'var(--bg-soft)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          fontSize: 14,
                        }}
                      >
                        {photoFile ? 'Change photo' : 'Choose photo'}
                      </span>
                    </label>
                    {photoFile && (
                      <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                        {photoFile.name} ({Math.round(photoFile.size / 1024)} KB)
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="muted" style={{ fontSize: 13, marginTop: -4, marginBottom: 14 }}>
                Scholar accounts require admin approval. After signing up, an email is sent to the
                admin. Once approved, you'll see the scholar dashboard the next time you sign in.
              </p>
            </>
          )}

          {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}
          <button className="primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy
              ? 'Creating account…'
              : form.role === 'scholar'
                ? 'Submit scholar application'
                : 'Create user account'}
          </button>
          <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
            Already have one? <Link to="/login" style={{ color: 'var(--text)' }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
