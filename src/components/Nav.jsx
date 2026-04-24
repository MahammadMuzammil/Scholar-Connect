import { NavLink, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { getBookingsForScholar, subscribeBookings } from '../store/bookings.js';
import { useSession } from '../context/AuthContext.jsx';
import { logout } from '../store/auth.js';
import { getScholar } from '../data/scholars.js';

export default function Nav() {
  const session = useSession();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => {
    if (session?.role !== 'scholar') { setUnread(0); return; }
    getBookingsForScholar(session.id)
      .then((rows) => setUnread(rows.filter((b) => !b.read).length))
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    refresh();
    if (session?.role !== 'scholar') return;
    return subscribeBookings({ scholarId: session.id }, refresh);
  }, [session, refresh]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName =
    session?.role === 'scholar'
      ? getScholar(session.id)?.name || 'Scholar'
      : session?.name;

  return (
    <div className="nav">
      <div className="container nav-row">
        <NavLink to={session?.role === 'scholar' ? '/dashboard' : '/'} className="brand">
          <div className="brand-mark">S</div>
          <span>ScholarConnect</span>
        </NavLink>

        <div className="nav-links">
          {!session && (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <NavLink to="/signup">Sign up</NavLink>
            </>
          )}

          {session?.role === 'user' && (
            <>
              <NavLink to="/" end>Scholars</NavLink>
              <NavLink to="/my-bookings">My bookings</NavLink>
              <span className="muted" style={{ fontSize: 13, padding: '0 6px' }}>
                {displayName}
              </span>
              <button className="ghost" onClick={handleLogout}>Log out</button>
            </>
          )}

          {session?.role === 'scholar' && (
            <>
              <NavLink to="/dashboard">
                Bookings
                {unread > 0 && <span className="badge" style={{ marginLeft: 8 }}>{unread}</span>}
              </NavLink>
              <span className="muted" style={{ fontSize: 13, padding: '0 6px' }}>
                {displayName}
              </span>
              <button className="ghost" onClick={handleLogout}>Log out</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
