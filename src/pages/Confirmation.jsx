import { Link, useParams, useLocation } from 'react-router-dom';
import { useBooking } from '../hooks/useBooking.js';
import { getCallWindow, formatCountdown } from '../lib/callWindow.js';
import { useNow } from '../hooks/useNow.js';

function fmt(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Confirmation() {
  const { bookingId } = useParams();
  const location = useLocation();
  // Booking handed to us by Booking.jsx navigate() — lets us render
  // instantly on first paint without waiting for a Supabase fetch.
  const initialBooking = location.state?.booking || null;
  // useBooking is reactive — it re-fetches when the admin approves.
  const { booking: fetched, loading, error } = useBooking(bookingId);
  const booking = fetched || initialBooking;
  const now = useNow(1000);

  if (!booking && loading) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="empty">Loading booking…</div>
      </div>
    );
  }
  if (!booking) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="empty">
          {error || 'Booking not found.'} <Link to="/">Go home</Link>
        </div>
      </div>
    );
  }

  const isPending = booking.status === 'pending';

  const win = getCallWindow(booking, now);

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: 720 }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: isPending ? 'rgba(245,158,11,.15)' : 'rgba(34,197,94,.15)',
            border: isPending ? '2px solid rgba(245,158,11,.5)' : '2px solid rgba(34,197,94,.5)',
            display: 'grid', placeItems: 'center', margin: '0 auto 14px',
            color: isPending ? '#f59e0b' : '#22c55e', fontSize: 30,
          }}
        >
          {isPending ? '⏳' : '✓'}
        </div>
        <h2 style={{ margin: 0 }}>
          {isPending ? 'Awaiting payment verification' : 'Booking confirmed'}
        </h2>
        <p className="muted" style={{ marginTop: 8 }}>
          {isPending ? (
            <>
              We've received your booking. The admin will verify your PhonePe payment shortly
              and confirm. You'll be able to join the call once it's confirmed —
              <strong> this page updates automatically</strong>.
            </>
          ) : (
            <>A message was sent to <strong>{booking.scholarName}</strong>. They'll join the call at the scheduled time.</>
          )}
        </p>

        <div className="stack" style={{ textAlign: 'left', marginTop: 20 }}>
          <div className="row-between">
            <span className="muted">Scholar</span>
            <strong>{booking.scholarName}</strong>
          </div>
          <div className="row-between">
            <span className="muted">Scheduled</span>
            <strong>{fmt(booking.slotStartsAt)}</strong>
          </div>
          <div className="row-between">
            <span className="muted">Amount paid</span>
            <strong>
              ${booking.amount}
              {booking.postFajr && (
                <span style={{ marginLeft: 8, color: '#fbbf24', fontSize: 13 }}>
                  ⭐ Golden Hour (+{booking.premiumPercent}%)
                </span>
              )}
            </strong>
          </div>
          <div className="row-between">
            <span className="muted">Booking ID</span>
            <code style={{ fontSize: 13 }}>{booking.id}</code>
          </div>
        </div>

        <div
          className="inline"
          style={{ justifyContent: 'center', marginTop: 22, flexDirection: 'column', gap: 10 }}
        >
          {isPending ? (
            <button className="primary" disabled>
              Waiting for admin approval…
            </button>
          ) : win.status === 'open' ? (
            <Link to={`/call/${booking.id}`}>
              <button className="primary">Join video call now</button>
            </Link>
          ) : win.status === 'too_early' ? (
            <>
              <button className="primary" disabled>
                Call opens in {formatCountdown(win.openAt - now)}
              </button>
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                You can join 10 minutes before the scheduled time.
              </p>
            </>
          ) : (
            <button disabled>Session ended</button>
          )}
          <Link to="/my-bookings">
            <button className="ghost">View my bookings</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
