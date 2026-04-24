import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useBooking } from '../hooks/useBooking.js';
import { getCallWindow, formatCountdown } from '../lib/callWindow.js';
import { useNow } from '../hooks/useNow.js';
import { useSession } from '../context/AuthContext.jsx';
import { requestVideoSession } from '../lib/api.js';
import { getScholar } from '../data/scholars.js';

function fmt(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function VideoCall() {
  const { bookingId } = useParams();
  const [sp] = useSearchParams();
  const { booking, loading, error } = useBooking(bookingId);
  const session = useSession();
  const now = useNow(1000);

  // Role detection (in priority order):
  //   1. `?s=1` in the URL → scholar (used in WhatsApp links to scholars)
  //   2. logged-in scholar session → scholar
  //   3. otherwise → user (guest or logged-in user)
  const roleHint = sp.get('s') === '1' ? 'scholar' : null;
  const isScholar = roleHint === 'scholar' || session?.role === 'scholar';

  const [vs, setVs] = useState(null);
  const [vsError, setVsError] = useState(null);
  const [provisioning, setProvisioning] = useState(false);

  const win = booking ? getCallWindow(booking, now) : null;

  useEffect(() => {
    if (!booking || win?.status !== 'open' || vs || provisioning) return;
    setProvisioning(true);
    const displayName = isScholar
      ? getScholar(booking.scholarId)?.name || booking.scholarName || 'Scholar'
      : session?.name || booking.user?.name || 'Guest';
    requestVideoSession(booking, { displayName, isScholar })
      .then(setVs)
      .catch((err) => setVsError(err.message || 'Could not start the session.'))
      .finally(() => setProvisioning(false));
  }, [booking, win?.status, session, isScholar, vs, provisioning]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="empty">Loading booking…</div>
      </div>
    );
  }
  if (error || !booking) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="empty">
          {error || 'Booking not found.'} <Link to="/">Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '20px 0 40px' }}>
      <div className="row-between" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 4px' }}>Session with {booking.scholarName}</h2>
          <div className="muted" style={{ fontSize: 14 }}>
            Scheduled for {fmt(booking.slotStartsAt)}
            {vs?.provider && <> · {vs.provider === 'daily' ? 'Daily.co' : 'Jitsi (dev fallback)'}</>}
          </div>
        </div>
        <div className="inline">
          <Link to="/">
            <button>Home</button>
          </Link>
        </div>
      </div>

      {win.status === 'open' ? (
        provisioning ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
            <div>Provisioning your secure room…</div>
          </div>
        ) : vsError ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
            <h3 style={{ margin: '0 0 6px' }}>Couldn't start the session</h3>
            <p className="muted">{vsError}</p>
            <button onClick={() => { setVsError(null); setVs(null); }}>Try again</button>
          </div>
        ) : vs ? (
          <>
            <div className="video-wrap">
              <iframe
                src={vs.roomUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                title="Video call"
              />
            </div>
            {vs.warning && (
              <p style={{ fontSize: 13, marginTop: 10, color: '#f59e0b' }}>⚠ {vs.warning}</p>
            )}
            <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
              Call window closes 15 minutes after the session ends.
            </p>
          </>
        ) : null
      ) : win.status === 'too_early' ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>⏳</div>
          <h3 style={{ margin: '0 0 6px' }}>The call hasn't opened yet</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            You can join 10 minutes before the scheduled time.
          </p>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 14 }}>
            {formatCountdown(win.openAt - now)}
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            until you can join
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>⌛</div>
          <h3 style={{ margin: '0 0 6px' }}>This session has ended</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            The call window closed. Reach out to book another session.
          </p>
        </div>
      )}
    </div>
  );
}
