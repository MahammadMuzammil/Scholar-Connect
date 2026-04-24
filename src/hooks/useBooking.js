import { useEffect, useState } from 'react';
import { getBooking } from '../store/bookings.js';

export function useBooking(id) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getBooking(id)
      .then((b) => { if (!cancelled) { setBooking(b); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { booking, loading, error };
}
