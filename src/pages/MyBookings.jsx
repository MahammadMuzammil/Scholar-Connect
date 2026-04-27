import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookingsForUser, subscribeBookings } from '../store/bookings.js';
import { useSession } from '../context/AuthContext.jsx';
import JoinButton from '../components/JoinButton.jsx';
import ReviewBlock from '../components/ReviewBlock.jsx';

function fmt(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MyBookings() {
  const session = useSession();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Bumping this triggers a re-fetch (used by the Retry button).
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!session?.id) {
      // Should not happen because RequireAuth gates this page, but guard anyway.
      setLoading(false);
      return;
    }
    let cancelled = false;

    const refresh = async () => {
      try {
        const rows = await getBookingsForUser(session.id);
        if (!cancelled) {
          setBookings(rows);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load bookings');
      } finally {
        // Always release the loading state, even on error, so the page never
        // gets stuck on "Loading…" if the fetch fails.
        if (!cancelled) setLoading(false);
      }
    };

    refresh();
    const unsub = subscribeBookings({ userId: session.id }, refresh);
    return () => { cancelled = true; unsub?.(); };
  }, [session?.id, retryTick]);

  return (
    <div className="container" style={{ padding: '28px 0 40px' }}>
      <h2 style={{ margin: '0 0 16px' }}>My bookings</h2>
      {loading ? (
        <div className="empty">Loading…</div>
      ) : error ? (
        <div className="empty">
          Couldn't load your bookings: {error}
          <button
            onClick={() => { setError(null); setLoading(true); setRetryTick((n) => n + 1); }}
            style={{ marginLeft: 10 }}
          >
            Retry
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty">
          You haven't booked any sessions yet. <Link to="/">Browse scholars</Link>.
        </div>
      ) : (
        <div className="stack">
          {bookings.map((b) => (
            <article key={b.id} className="card">
              <div className="row-between">
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {b.scholarName}
                    {b.status === 'pending' && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: 'rgba(245,158,11,.15)',
                          color: '#f59e0b',
                          border: '1px solid rgba(245,158,11,.4)',
                          verticalAlign: 'middle',
                        }}
                      >
                        ⏳ Pending approval
                      </span>
                    )}
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>{fmt(b.slotStartsAt)}</div>
                </div>
                <div className="price">${b.amount}</div>
              </div>
              {b.topic && (
                <div style={{ marginTop: 10 }}>
                  <div className="muted" style={{ fontSize: 13 }}>Topic</div>
                  <div>{b.topic}</div>
                </div>
              )}
              <div className="inline" style={{ marginTop: 14 }}>
                <JoinButton booking={b} />
                <Link to={`/confirmation/${b.id}`}>
                  <button className="ghost">View details</button>
                </Link>
              </div>
              <ReviewBlock booking={b} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
