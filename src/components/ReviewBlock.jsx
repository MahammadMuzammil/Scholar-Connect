import { useEffect, useState } from 'react';
import StarRating from './StarRating.jsx';
import { getReviewForBooking, submitReview } from '../store/reviews.js';
import { getCallWindow } from '../lib/callWindow.js';
import { useNow } from '../hooks/useNow.js';

// Renders the post-call rating block on a booking row.
// Hides itself until the call window has expired (session is over).
export default function ReviewBlock({ booking }) {
  const now = useNow(60000);
  const win = getCallWindow(booking, now);

  const [existing, setExisting] = useState(undefined); // undefined = loading, null = none, object = present
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (win.status !== 'expired') return;
    getReviewForBooking(booking.id)
      .then((r) => { if (!cancelled) setExisting(r || null); })
      .catch(() => { if (!cancelled) setExisting(null); });
    return () => { cancelled = true; };
  }, [booking.id, win.status]);

  if (win.status !== 'expired') return null;
  if (existing === undefined) return null;

  if (existing) {
    return (
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>Your review</div>
        <StarRating value={existing.rating} readOnly size={20} />
        {existing.comment && (
          <p style={{ marginTop: 6, marginBottom: 0, fontSize: 14 }}>{existing.comment}</p>
        )}
      </div>
    );
  }

  const submit = async () => {
    if (!rating) {
      setError('Please choose a star rating.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const saved = await submitReview({ booking, rating, comment });
      setExisting(saved);
    } catch (e) {
      setError(e.message || 'Could not save review.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>How was your session?</div>
      <StarRating value={rating} onChange={setRating} size={26} />
      <textarea
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment for the scholar"
        style={{ marginTop: 8 }}
      />
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 6 }}>{error}</p>}
      <button
        className="primary"
        onClick={submit}
        disabled={busy}
        style={{ marginTop: 8 }}
      >
        {busy ? 'Saving…' : 'Submit review'}
      </button>
    </div>
  );
}
