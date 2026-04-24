import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { generateSlots } from '../store/scholars.js';
import { useScholar } from '../context/ScholarsContext.jsx';
import { getBookingsForScholar, markRead, subscribeBookings } from '../store/bookings.js';
import { useSession } from '../context/AuthContext.jsx';
import JoinButton from '../components/JoinButton.jsx';

function fmt(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ScholarDashboard() {
  const session = useSession();
  const { scholar, loading: scholarLoading } = useScholar(session?.id);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!scholar) return;
    getBookingsForScholar(scholar.id)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [scholar]);

  useEffect(() => {
    refresh();
    if (!scholar) return;
    return subscribeBookings({ scholarId: scholar.id }, refresh);
  }, [scholar, refresh]);

  const bookedSlotIds = useMemo(
    () => new Set(bookings.map((b) => b.slotId)),
    [bookings]
  );

  const upcomingSlots = useMemo(
    () => (scholar ? generateSlots(scholar.id).slice(0, 15) : []),
    [scholar]
  );

  if (scholarLoading) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="empty">Loading…</div>
      </div>
    );
  }

  if (!scholar) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="empty">Scholar profile not found for this session.</div>
      </div>
    );
  }

  const unread = bookings.filter((b) => !b.read).length;

  const onMarkRead = async (id) => {
    try {
      await markRead(id);
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ padding: '28px 0 40px' }}>
      <h2 style={{ margin: '0 0 16px' }}>Welcome back, {scholar.name.split(' ')[0]}</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="inline">
          <div className="avatar" style={{ backgroundImage: `url(${scholar.photo})` }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{scholar.name}</div>
            <div className="muted" style={{ fontSize: 13 }}>{scholar.title}</div>
          </div>
          <span className="verified-pill" style={{ marginLeft: 'auto' }}>
            {unread > 0 ? `${unread} new booking${unread > 1 ? 's' : ''}` : 'No new bookings'}
          </span>
        </div>
      </div>

      <div className="two-col">
        <section>
          <h3 style={{ margin: '0 0 10px' }}>Incoming bookings ({bookings.length})</h3>
          {loading ? (
            <div className="empty">Loading…</div>
          ) : bookings.length === 0 ? (
            <div className="empty">
              No bookings yet. Share your profile: <Link to={`/scholar/${scholar.id}`}>public page</Link>.
            </div>
          ) : (
            <div className="stack">
              {bookings.map((b) => (
                <article key={b.id} className="card">
                  <div className="row-between">
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {b.user?.name || 'Anonymous'}
                        {!b.read && <span className="badge" style={{ marginLeft: 8 }}>new</span>}
                      </div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {b.user?.email} · booked {fmt(b.createdAt)}
                      </div>
                    </div>
                    <div className="price">${b.amount}</div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div className="muted" style={{ fontSize: 13 }}>Scheduled for</div>
                    <strong>{fmt(b.slotStartsAt)}</strong>
                  </div>
                  {b.topic && (
                    <div style={{ marginTop: 10 }}>
                      <div className="muted" style={{ fontSize: 13 }}>Topic</div>
                      <div>{b.topic}</div>
                    </div>
                  )}
                  <div className="inline" style={{ marginTop: 14 }}>
                    <JoinButton booking={b} />
                    {!b.read && (
                      <button className="ghost" onClick={() => onMarkRead(b.id)}>Mark as read</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="card">
          <h3 style={{ marginTop: 0 }}>Upcoming slots</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: -4 }}>
            Your availability shown to users. Booked slots are greyed out.
          </p>
          <div className="stack" style={{ gap: 6 }}>
            {upcomingSlots.map((s) => {
              const booked = bookedSlotIds.has(s.id);
              return (
                <div
                  key={s.id}
                  className="row-between"
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-soft)',
                    borderRadius: 8,
                    opacity: booked ? 0.5 : 1,
                  }}
                >
                  <span>{fmt(s.startsAt)}</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {booked ? 'booked' : 'open'}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
