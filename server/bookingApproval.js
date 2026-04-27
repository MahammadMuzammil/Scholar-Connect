import crypto from 'node:crypto';
import { getAdminClient } from './supabaseAdmin.js';

function publicWebUrl() {
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  return (process.env.PUBLIC_WEB_URL || vercelUrl || 'http://localhost:5173').replace(/\/$/, '');
}

function apiBaseUrl(req) {
  const fromEnv = publicWebUrl();
  if (fromEnv && !fromEnv.startsWith('http://localhost')) return fromEnv;
  const proto = req?.headers?.['x-forwarded-proto'] || 'https';
  const host = req?.headers?.host;
  return host ? `${proto}://${host}` : fromEnv;
}

function makeToken(bookingId) {
  const secret = process.env.APPROVAL_SECRET;
  if (!secret) {
    throw new Error('APPROVAL_SECRET env var is not set');
  }
  return crypto
    .createHmac('sha256', secret)
    .update(`booking:${bookingId}`)
    .digest('hex')
    .slice(0, 40);
}

function verifyToken(bookingId, token) {
  if (!token) return false;
  try {
    const expected = makeToken(bookingId);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function bookingApproveLink(req, bookingId) {
  const base = apiBaseUrl(req);
  const token = makeToken(bookingId);
  return `${base}/api/booking/approve?id=${encodeURIComponent(bookingId)}&token=${token}`;
}

export async function approveBooking({ id, token }) {
  if (!verifyToken(id, token)) {
    return { ok: false, reason: 'invalid_token' };
  }

  const admin = getAdminClient();

  const { data: booking, error: fetchErr } = await admin
    .from('bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!booking) return { ok: false, reason: 'not_found' };
  if (booking.status === 'confirmed') {
    return { ok: true, alreadyConfirmed: true, booking };
  }

  const { error: updateErr } = await admin
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', id);
  if (updateErr) throw updateErr;

  return { ok: true, booking: { ...booking, status: 'confirmed' } };
}

function fmt(iso) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function bookingApprovalSuccessHtml(booking) {
  const when = booking?.slot_starts_at ? fmt(booking.slot_starts_at) : '';
  const user = booking?.user_name || 'the user';
  return `<!doctype html>
<html><head><title>Booking confirmed</title>
<style>body{font-family:system-ui,sans-serif;max-width:560px;margin:60px auto;padding:24px;color:#111;text-align:center}
.box{background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:28px}
.tick{font-size:42px;color:#16a34a}
a{color:#16a34a;font-weight:600}
.row{margin:6px 0;color:#444}
</style></head>
<body><div class="box">
<div class="tick">✓</div>
<h2>Booking confirmed</h2>
<p>The booking from <strong>${user}</strong> is now confirmed.</p>
${when ? `<p class="row">📅 ${when}</p>` : ''}
${booking?.amount ? `<p class="row">💰 $${booking.amount}</p>` : ''}
<p class="row">They can now join the call when the slot opens.</p>
<p style="margin-top:18px"><a href="${publicWebUrl()}">Go to ScholarConnect →</a></p>
</div></body></html>`;
}

export function bookingApprovalErrorHtml(reason) {
  const map = {
    invalid_token: 'The approval link is invalid or has been tampered with.',
    not_found: "We couldn't find that booking.",
  };
  const msg = map[reason] || reason || 'Something went wrong.';
  return `<!doctype html>
<html><head><title>Approval error</title>
<style>body{font-family:system-ui,sans-serif;max-width:560px;margin:60px auto;padding:24px;color:#111;text-align:center}
.box{background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:28px}
.x{font-size:42px;color:#dc2626}
</style></head>
<body><div class="box">
<div class="x">⚠</div>
<h2>Couldn't approve</h2>
<p>${msg}</p>
</div></body></html>`;
}
