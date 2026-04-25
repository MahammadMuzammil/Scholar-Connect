// Demo mode: lets users join any future booking immediately. Revert to
// `10 * 60 * 1000` (10 min before slot) for production behavior.
const OPEN_BEFORE_MS = 365 * 24 * 60 * 60 * 1000; // 1 year
const GRACE_AFTER_MS = 15 * 60 * 1000;

export function getCallWindow(booking, now = Date.now()) {
  const start = new Date(booking.slotStartsAt).getTime();
  const duration = (booking.durationMinutes || 30) * 60 * 1000;
  const openAt = start - OPEN_BEFORE_MS;
  const closeAt = start + duration + GRACE_AFTER_MS;

  if (now < openAt) return { status: 'too_early', openAt, startsAt: start, closeAt };
  if (now > closeAt) return { status: 'expired', openAt, startsAt: start, closeAt };
  return { status: 'open', openAt, startsAt: start, closeAt };
}

export function formatCountdown(ms) {
  if (ms <= 0) return 'now';
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}