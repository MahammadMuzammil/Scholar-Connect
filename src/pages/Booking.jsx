import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { generateSlots } from '../store/scholars.js';
import { useScholar } from '../context/ScholarsContext.jsx';
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
  const { scholar, loading } = useScholar(id);
  const session = useSession();

  const slot = useMemo(() => {
    if (!scholar) return null;
    return generateSlots(scholar.id).find((s) => s.id === slotId) || null;
  }, [scholar, slotId]);

  const [form, setForm] = useState({ topic: '' });
  const [processing, setProcessing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [copied, setCopied] = useState(false);

  const PHONEPE_NUMBER = '9652446584';
  const copyPhoneNumber = async () => {
    try {
      await navigator.clipboard.writeText(PHONEPE_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Older browsers / iOS Safari without secure context fallback
      const ta = document.createElement('textarea');
      ta.value = PHONEPE_NUMBER;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="empty">Loading…</div>
      </div>
    );
  }

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
        // Booking starts as pending — admin must verify the PhonePe payment
        // and click the approve link in the email before the user can join.
        status: 'pending',
      });
      notifyBookingCreated(booking);
      // Hand the freshly-created booking to the confirmation page directly so
      // it renders immediately, without re-fetching from Supabase.
      navigate(`/confirmation/${booking.id}`, { state: { booking } });
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

          <h3>Payment</h3>
          <div
            className="stack"
            style={{
              alignItems: 'center',
              padding: 16,
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              gap: 12,
            }}
          >
            <div className="muted" style={{ fontSize: 13, textAlign: 'center' }}>
              Pay <strong>${pricing.price}</strong> via PhonePe / Google Pay / any UPI app
            </div>
            <div style={{ fontWeight: 700, fontSize: 26 }}>${pricing.price}</div>

            {/* OPTION 1: pay by phone number — easiest for users who don't want to scan */}
            <div
              style={{
                width: '100%',
                background: 'rgba(22,163,74,.10)',
                border: '1.5px solid rgba(22,163,74,.4)',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: 22 }}>📱</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="muted" style={{ fontSize: 12 }}>Send to PhonePe number</div>
                <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '.5px' }}>
                  {PHONEPE_NUMBER}
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>MUJAMMIL M</div>
              </div>
              <button
                type="button"
                onClick={copyPhoneNumber}
                style={{ padding: '8px 14px', fontSize: 13 }}
              >
                {copied ? '✓ Copied' : 'Copy number'}
              </button>
            </div>

            <div className="muted" style={{ fontSize: 12, textAlign: 'center' }}>
              — or scan the QR code —
            </div>

            {/* OPTION 2: scan the QR */}
            <img
              src="/payment-qr.png"
              alt="PhonePe QR — pay MUJAMMIL M"
              style={{
                width: '100%',
                maxWidth: 240,
                borderRadius: 8,
                background: '#000',
                display: 'block',
              }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="muted" style={{ fontSize: 12, textAlign: 'center' }}>
              After paying, click the button below to confirm your booking. The admin will verify
              your payment before activating the call.
            </div>
          </div>

          {submitError && (
            <p style={{ color: 'var(--danger)', fontSize: 14 }}>{submitError}</p>
          )}

          <button className="primary" type="submit" disabled={processing} style={{ width: '100%', marginTop: 10 }}>
            {processing ? 'Submitting…' : `I've paid $${pricing.price} — confirm booking`}
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
