import { Link } from 'react-router-dom';
import { getCallWindow, formatCountdown } from '../lib/callWindow.js';
import { useNow } from '../hooks/useNow.js';

export default function JoinButton({ booking }) {
  const now = useNow(1000);
  const win = getCallWindow(booking, now);

  if (win.status === 'open') {
    return (
      <Link to={`/call/${booking.id}`}>
        <button className="primary">Join call</button>
      </Link>
    );
  }
  if (win.status === 'too_early') {
    return (
      <button className="primary" disabled title="Opens 10 min before the scheduled time">
        Opens in {formatCountdown(win.openAt - now)}
      </button>
    );
  }
  return <button disabled>Session ended</button>;
}
