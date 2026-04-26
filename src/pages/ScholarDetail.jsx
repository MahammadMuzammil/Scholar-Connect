import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { generateSlots } from '../store/scholars.js';
import { useScholar } from '../context/ScholarsContext.jsx';
import { getBookedSlotIds, subscribeBookings } from '../store/bookings.js';
import { getSlotPricing } from '../lib/pricing.js';
import Stars from '../components/Stars.jsx';

function formatSlot(iso) {
  const d = new Date(iso);
  const day = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return { day, time };
}

export default function ScholarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { scholar, loading } = useScholar(id);

  const slots = useMemo(() => (scholar ? generateSlots(scholar.id) : []), [scholar]);
  const [bookedSlotIds, setBookedSlotIds] = useState(() => new Set());
  // True until the first availability fetch resolves. While true we render
  // every slot as disabled to prevent clicks on stale "available" state.
  const [slotsLoading, setSlotsLoading] = useState(true);

  useEffect(() => {
    if (!scholar) return;
    let cancelled = false;
    setSlotsLoading(true);

    const refresh = () =>
      getBookedSlotIds(scholar.id).then((ids) => {
        if (!cancelled) setBookedSlotIds(ids);
      });

    refresh().finally(() => {
      if (!cancelled) setSlotsLoading(false);
    });

    // Realtime updates after the initial fetch — don't reset slotsLoading.
    const unsub = subscribeBookings({ scholarId: scholar.id }, refresh);
    return () => { cancelled = true; unsub?.(); };
  }, [scholar]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="empty">Loading scholar…</div>
      </div>
    );
  }

  if (!scholar) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="empty">
          Scholar not found. <Link to="/">Back to list</Link>
        </div>
      </div>
    );
  }

  const grouped = slots.reduce((acc, s) => {
    const { day } = formatSlot(s.startsAt);
    (acc[day] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="container" style={{ padding: '28px 0 40px' }}>
      <div className="two-col">
        <section className="card">
          <div className="inline" style={{ gap: 20, alignItems: 'flex-start' }}>
            <div className="avatar lg" style={{ backgroundImage: `url(${scholar.photo})` }} />
            <div className="stack" style={{ gap: 6, flex: '1 1 200px', minWidth: 0 }}>
              <h2 style={{ margin: 0 }}>{scholar.name}</h2>
              <div className="muted">{scholar.title}</div>
              <div className="inline">
                <Stars value={scholar.rating} />
                <span className="muted" style={{ fontSize: 13 }}>
                  {scholar.rating} ({scholar.reviews} reviews)
                </span>
                {scholar.verified && <span className="verified-pill">✓ Verified</span>}
              </div>
            </div>
          </div>

          <p style={{ marginTop: 16, color: 'var(--muted)' }}>{scholar.bio}</p>

          <div className="stack" style={{ marginTop: 12 }}>
            <div>
              <strong>Specialties:</strong>{' '}
              {scholar.specialties.map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
            <div>
              <strong>Languages:</strong>{' '}
              {scholar.languages.map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>

          <h3 style={{ marginTop: 24 }}>
            Available slots{' '}
            {slotsLoading && (
              <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
                · checking availability…
              </span>
            )}
          </h3>
          <div className="stack">
            {Object.entries(grouped).map(([day, list]) => (
              <div key={day}>
                <div className="muted" style={{ marginBottom: 6, fontSize: 13 }}>{day}</div>
                <div className="slot-grid">
                  {list.map((slot) => {
                    const { time } = formatSlot(slot.startsAt);
                    const booked = bookedSlotIds.has(slot.id);
                    const pricing = getSlotPricing(scholar, slot.startsAt);
                    const classes = [
                      'slot',
                      booked ? 'booked' : '',
                      pricing.postFajr ? 'post-fajr' : '',
                    ].filter(Boolean).join(' ');
                    return (
                      <button
                        key={slot.id}
                        className={classes}
                        disabled={booked || slotsLoading}
                        onClick={() =>
                          navigate(`/book/${scholar.id}?slot=${encodeURIComponent(slot.id)}`)
                        }
                      >
                        <div style={{ fontWeight: 600 }}>{time}</div>
                        <div style={{ fontSize: 11, marginTop: 2 }}>
                          {pricing.postFajr ? (
                            <strong style={{ color: '#fbbf24' }}>${pricing.price}</strong>
                          ) : (
                            <span style={{ opacity: .8 }}>${pricing.price}</span>
                          )}
                        </div>
                        {pricing.postFajr && !booked && (
                          <div style={{ fontSize: 10, marginTop: 2, color: '#fbbf24' }}>
                            ⭐ Golden Hour +{pricing.premiumPercent}%
                          </div>
                        )}
                        {booked && <div style={{ fontSize: 11 }}>booked</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="card">
          <div className="muted" style={{ fontSize: 13 }}>Session fee</div>
          <div className="price" style={{ fontSize: 28 }}>
            ${scholar.pricePerSession}
            <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>
              {' '}/ {scholar.sessionMinutes} min
            </span>
          </div>
          <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '16px 0' }} />
          <ul className="stack" style={{ paddingLeft: 18, color: 'var(--muted)', fontSize: 14 }}>
            <li>Private one-on-one video call</li>
            <li>Shariah-compliant guidance</li>
            <li>Reschedule up to 4 hours before</li>
          </ul>
          {scholar.phone && (
            <>
              <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '16px 0' }} />
              <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                Questions before booking?
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}>
                {scholar.phone}
              </div>
              <div className="inline" style={{ gap: 8 }}>
                <a href={`tel:${scholar.phone}`} style={{ flex: 1 }}>
                  <button className="ghost" style={{ width: '100%' }}>📞 Call</button>
                </a>
                <a
                  href={`https://wa.me/${scholar.phone.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ flex: 1 }}
                >
                  <button className="ghost" style={{ width: '100%' }}>💬 WhatsApp</button>
                </a>
              </div>
            </>
          )}
          <Link to="/">
            <button className="ghost" style={{ marginTop: 10, width: '100%' }}>
              ← Back to all scholars
            </button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
