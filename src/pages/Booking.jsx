import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { getScholar, generateSlots } from '../data/scholars.js';
import { createBooking } from '../store/bookings.js';
import { getSlotPricing } from '../lib/pricing.js';
import { notifyBookingCreated } from '../lib/api.js';
import { useSession } from '../context/AuthContext.jsx';

function formatSlot(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Booking() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const slotId = sp.get('slot');
  const navigate = useNavigate();
  const scholar = getScholar(id);
  const session = useSession();

  const slot = useMemo(() => {
    if (!scholar) return null;
    return generateSlots(scholar.id).find((s) => s.id === slotId) || null;
  }, [scholar, slotId]);

  const [form, setForm] = useState({ topic: '', card: '4242 4242 4242 4242' });
  const [processing, setProcessing] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!scholar) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="empty">
          Scholar not found. <Link to="/">Back to list</Link>
        </div>
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="empty">
          No slot selected.{' '}
          <Link to={`/scholar/${scholar.id}`}>Pick a slot for {scholar.name}</Link>
        </div>
      </div>
    );
  }

  const pricing = getSlotPricing(scholar, slot.startsAt);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setProcessing(true);
    try {
      // Simulate a ~900ms "payment" delay for realism.
      await new Promise((r) => setTimeout(r, 900));
      const booking = await createBooking({
        scholarId: scholar.id,
        scholarName: scholar.name,
        slotId: slot.id,
        slotStartsAt: slot.startsAt,
        durationMinutes: scholar.sessionMinutes,
        amount: pricing.price,
        basePrice: pricing.basePrice,
        postFajr: pricing.postFajr,
        premiumPercent: pricing.premiumPercent,
        userId: session.id,
        user: { name: session.name, email: session.email },
        topic: form.topic,
      });
      notifyBookingCreated(booking);
      navigate(`/confirmation/${booking.id}`);
    } catch (err) {
      setSubmitError(
        err.code === '23505'
          ? 'This slot was just booked by someone else. Please pick another.'
          : err.message || 'Could not save booking.'
      );
      setProcessing(false);
    }
  };

  return (
    <div className="container" style={{ padding: '28px 0 40px' }}>
      <h2 style={{ margin: '0 0 16px' }}>Confirm your booking</h2>
      <div className="two-col">
        <form className="card" onSubmit={submit}>
          <h3 style={{ marginTop: 0 }}>Your details</h3>
          <div className="field">
            <label>Name</label>
            <input value={session.name} disabled />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={session.email} disabled />
          </div>
          <div className="field">
            <label>What would you like to discuss? (optional)</label>
            <textarea
              rows={3}
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="A short note helps the scholar prepare."
            />
          </div>

          <h3>Payment (mock)</h3>
          <div className="field">
            <label>Card number</label>
            <input
              value={form.card}
              onChange={(e) => setForm({ ...form, card: e.target.value })}
              placeholder="4242 4242 4242 4242"
            />
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: -6 }}>
            No real charge. In production this would use Stripe / Razorpay.
          </p>

          {submitError && (
            <p style={{ color: 'var(--danger)', fontSize: 14 }}>{submitError}</p>
          )}

          <button className="primary" type="submit" disabled={processing} style={{ width: '100%', marginTop: 10 }}>
            {processing ? 'Processing…' : `Pay $${pricing.price} & confirm`}
          </button>
        </form>

        <aside className="card">
          <h3 style={{ marginTop: 0 }}>Summary</h3>
          <div className="inline" style={{ marginBottom: 10 }}>
            <div className="avatar" style={{ backgroundImage: `url(${scholar.photo})` }} />
            <div>
              <div style={{ fontWeight: 600 }}>{scholar.name}</div>
              <div className="muted" style={{ fontSize: 13 }}>{scholar.title}</div>
            </div>
          </div>
          <div className="row-between">
            <span className="muted">Date & time</span>
            <strong>{formatSlot(slot.startsAt)}</strong>
          </div>
          <div className="row-between" style={{ marginTop: 6 }}>
            <span className="muted">Duration</span>
            <strong>{scholar.sessionMinutes} min</strong>
          </div>
          <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '14px 0' }} />
          {pricing.postFajr && (
            <>
              <div className="row-between">
                <span className="muted">Session fee</span>
                <span>${pricing.basePrice}</span>
              </div>
              <div className="row-between" style={{ marginTop: 6 }}>
                <span style={{ color: '#fbbf24' }}>⭐ Golden Hour premium</span>
                <strong style={{ color: '#fbbf24' }}>
                  +${pricing.price - pricing.basePrice} (+{pricing.premiumPercent}%)
                </strong>
              </div>
              <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '14px 0' }} />
            </>
          )}
          <div className="row-between">
            <span>Total</span>
            <span className="price">${pricing.price}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
