import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useScholars } from '../context/ScholarsContext.jsx';
import Stars from '../components/Stars.jsx';

export default function Home() {
  const { scholars, loading, error } = useScholars();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return scholars;
    return scholars.filter((s) =>
      [s.name, s.title, ...(s.specialties || []), ...(s.languages || [])]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [q, scholars]);

  return (
    <div className="container">
      <section className="hero">
        <h1>Connect with a verified Imam or Islamic scholar</h1>
        <p>
          Connect over video with certified muftis, Quran teachers, dream interpreters, and Islamic
          counselors. Pick a slot, pay, and join your private call.
        </p>
        <div className="card" style={{
          marginTop: 18,
          padding: '12px 14px',
          background: 'rgba(245,158,11,.10)',
          borderColor: 'rgba(245,158,11,.45)',
        }}>
          <div className="inline" style={{ gap: 10 }}>
            <span style={{ fontSize: 20 }}>🌅</span>
            <div>
              <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: 18 }}>
                ⭐ Golden Hour — premium sessions after Fajr
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                Fajr is the most blessed time of the day. Sessions between 5:00 AM and 8:00 AM carry a 50% premium — reserve a slot in the most barakah-filled hours with your scholar.
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 18, maxWidth: 520 }}>
          <input
            type="text"
            placeholder="Search by name, topic, or language (e.g. fiqh, tajweed, Urdu)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </section>

      <section style={{ paddingBottom: 40 }}>
        {loading ? (
          <div className="empty">Loading scholars…</div>
        ) : error ? (
          <div className="empty">Couldn't load scholars: {error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No scholars match your search.</div>
        ) : (
          <div className="grid">
            {filtered.map((s) => (
              <article key={s.id} className="card scholar-card">
                <div className="scholar-avatar-frame">
                  <div
                    className="avatar xl"
                    style={{ backgroundImage: `url(${s.photo})` }}
                    role="img"
                    aria-label={`${s.name} profile photo`}
                  />
                  {s.verified && <span className="avatar-verified-badge" title="Verified scholar">✓</span>}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{s.name}</div>
                  <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>{s.title}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  {s.specialties.map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
                <div className="row-between">
                  <div>
                    <Stars value={s.rating} />{' '}
                    <span className="muted" style={{ fontSize: 13 }}>
                      {s.rating} ({s.reviews})
                    </span>
                  </div>
                  <div className="price">${s.pricePerSession}</div>
                </div>
                <Link to={`/scholar/${s.id}`}>
                  <button className="primary" style={{ width: '100%' }}>
                    View profile & book
                  </button>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
