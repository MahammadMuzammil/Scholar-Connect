import crypto from 'node:crypto';
import { getAdminClient } from './supabaseAdmin.js';

function publicWebUrl() {
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  return (process.env.PUBLIC_WEB_URL || vercelUrl || 'http://localhost:5173').replace(/\/$/, '');
}

function apiBaseUrl(req) {
  // Use the request's own host so the approve link stays within this deployment.
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  return `${proto}://${host}`;
}

function makeToken(applicationId) {
  const secret = process.env.APPROVAL_SECRET;
  if (!secret) {
    throw new Error('APPROVAL_SECRET env var is not set');
  }
  return crypto
    .createHmac('sha256', secret)
    .update(String(applicationId))
    .digest('hex')
    .slice(0, 40);
}

function verifyToken(applicationId, token) {
  if (!token) return false;
  try {
    const expected = makeToken(applicationId);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

function approveLink(req, applicationId) {
  const base = apiBaseUrl(req);
  const token = makeToken(applicationId);
  return `${base}/api/scholar-application/approve?id=${applicationId}&token=${token}`;
}

async function sendAdminEmail({ applicationId, name, email, approveUrl }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('[applications] ADMIN_EMAIL not set — skipping admin email');
    return { sent: false, reason: 'admin_email_unset' };
  }

  const subject = `New scholar application — ${name}`;
  const text = [
    `A new scholar has applied to ScholarConnect.`,
    ``,
    `Name:    ${name}`,
    `Email:   ${email}`,
    `App ID:  ${applicationId}`,
    ``,
    `To approve, open this link:`,
    approveUrl,
    ``,
    `(Ignore this email to leave the application as pending.)`,
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#111">
      <h2 style="margin:0 0 12px">New scholar application</h2>
      <p style="margin:0 0 14px">A user has applied to become a scholar on ScholarConnect.</p>
      <table style="border-collapse:collapse;width:100%;margin:14px 0">
        <tr><td style="padding:6px 0;color:#666;width:120px">Name</td><td><strong>${name}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#666">Email</td><td>${email}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Application&nbsp;ID</td><td><code>${applicationId}</code></td></tr>
      </table>
      <p style="margin:18px 0 8px"><strong>Click to approve:</strong></p>
      <p>
        <a href="${approveUrl}"
           style="display:inline-block;padding:12px 22px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          ✓ Approve scholar
        </a>
      </p>
      <p style="color:#888;font-size:13px;margin-top:24px">
        Ignore this email to leave the application as pending.
        Anyone with this link can approve, so don't forward it.
      </p>
    </div>
  `;

  if (!process.env.RESEND_API_KEY) {
    console.log('\n--- [applications] RESEND_API_KEY not set, logging admin email ---');
    console.log(`To: ${adminEmail}`);
    console.log(`Subject: ${subject}\n`);
    console.log(text);
    console.log('-----------------------------------------------------------------\n');
    return { sent: false, mode: 'console', to: adminEmail };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'ScholarConnect <onboarding@resend.dev>',
      to: adminEmail,
      subject,
      text,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  const data = await res.json();
  return { sent: true, mode: 'resend', to: adminEmail, id: data.id };
}

export async function createApplicationAndNotify({ userId, name, email }, req) {
  const admin = getAdminClient();

  // Try to insert. If the user already has a pending/approved application, surface that.
  const { data, error } = await admin
    .from('scholar_applications')
    .insert({ user_id: userId, name, email })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // unique_violation — already applied
      const { data: existing } = await admin
        .from('scholar_applications')
        .select('*')
        .eq('user_id', userId)
        .single();
      return { application: existing, alreadyExists: true };
    }
    throw error;
  }

  const approveUrl = approveLink(req, data.id);
  let emailResult = { sent: false };
  try {
    emailResult = await sendAdminEmail({
      applicationId: data.id,
      name,
      email,
      approveUrl,
    });
  } catch (e) {
    console.error('[applications] failed to send admin email', e);
  }

  return { application: data, email: emailResult, approveUrl };
}

export async function approveApplication({ id, token }) {
  if (!verifyToken(id, token)) {
    return { ok: false, reason: 'invalid_token' };
  }

  const admin = getAdminClient();

  const { data: app, error: fetchErr } = await admin
    .from('scholar_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!app) return { ok: false, reason: 'not_found' };
  if (app.status === 'approved') return { ok: true, alreadyApproved: true, application: app };

  // Use the auth user's UUID as the scholar id so it matches profile.scholar_id.
  const scholarId = app.user_id;

  // Create the scholar row (or update if it exists).
  const { error: scholarErr } = await admin.from('scholars').upsert({
    id: scholarId,
    name: app.name,
    title: 'Scholar',
    specialties: [],
    languages: [],
    rating: 4.8,
    reviews: 0,
    price_per_session: 40,
    session_minutes: 30,
    photo: `https://i.pravatar.cc/300?u=${encodeURIComponent(app.email)}`,
    bio: `${app.name} is a verified scholar on ScholarConnect.`,
    sort_order: 100,
    active: true,
  });
  if (scholarErr) throw scholarErr;

  // Promote the user's profile.
  const { error: profileErr } = await admin
    .from('profiles')
    .update({ role: 'scholar', scholar_id: scholarId })
    .eq('id', app.user_id);
  if (profileErr) throw profileErr;

  // Mark the application approved.
  const { error: appUpdateErr } = await admin
    .from('scholar_applications')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (appUpdateErr) throw appUpdateErr;

  return { ok: true, application: { ...app, status: 'approved' } };
}

export function approvalSuccessHtml(name) {
  return `<!doctype html>
<html><head><title>Application approved</title>
<style>body{font-family:system-ui,sans-serif;max-width:560px;margin:60px auto;padding:24px;color:#111;text-align:center}
.box{background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:28px}
.tick{font-size:42px;color:#16a34a}
a{color:#16a34a;font-weight:600}
</style></head>
<body><div class="box">
<div class="tick">✓</div>
<h2>Approved</h2>
<p><strong>${name}</strong> is now a scholar on ScholarConnect.</p>
<p>They'll see the scholar dashboard the next time they sign in.</p>
<p style="margin-top:18px"><a href="${publicWebUrl()}">Go to ScholarConnect →</a></p>
</div></body></html>`;
}

export function approvalErrorHtml(reason) {
  const map = {
    invalid_token: 'The approval link is invalid or has been tampered with.',
    not_found: "We couldn't find that application.",
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
