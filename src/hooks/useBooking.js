import { useEffect, useState } from 'react';
import { getBooking, subscribeBookings } from '../store/bookings.js';

export function useBooking(id) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);

    const refresh = () =>
      getBooking(id)
        .then((b) => { if (!cancelled) { setBooking(b); setError(null); } })
        .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load'); });

    refresh().finally(() => { if (!cancelled) setLoading(false); });

    // Live updates so consumers re-render when the admin approves the booking
    // (status: 'pending' → 'confirmed') or any other field changes.
    const unsub = subscribeBookings({ bookingId: id }, refresh);

    return () => { cancelled = true; unsub?.(); };
  }, [id]);

  return { booking, loading, error };
}
