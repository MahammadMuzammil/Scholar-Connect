import { useCallback, useEffect, useState } from 'react';
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

  const refresh = useCallback(() => {
    if (!session?.id) return;
    getBookingsForUser(session.id)
      .then((rows) => setBookings(rows))
      .finally(() => setLoading(false));
  }, [session?.id]);

  useEffect(() => {
    refresh();
    if (!session?.id) return;
    return subscribeBookings({ userId: session.id }, refresh);
  }, [session?.id, refresh]);

  return (
    <div className="container" style={{ padding: '28px 0 40px' }}>
      <h2 style={{ margin: '0 0 16px' }}>My bookings</h2>
      {loading ? (
        <div className="empty">Loading…</div>
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
