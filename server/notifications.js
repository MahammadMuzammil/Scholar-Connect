// Scholar directory — server-side copy, kept in sync with frontend.
// In a real app this lives in the database, keyed by scholar ID.
// Each scholar must WhatsApp "join gradually-prevent" to +14155238886 once
// to opt into the Twilio sandbox before they can receive messages.
const SCHOLARS = {
  'sh-muzammil': { name: 'Sheikh Muzammil', email: 'muzammil@scholarconnect.test', whatsapp: '+919652446584' },
  'sh-farooq':   { name: 'Sheikh Farooq',   email: 'farooq@scholarconnect.test',   whatsapp: '+919985573482' },
};

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

function callUrl(bookingId, { asScholar = false } = {}) {
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const base = (process.env.PUBLIC_WEB_URL || vercelUrl || 'http://localhost:5173').replace(/\/$/, '');
  // `?s=1` marks the visitor as the scholar so the video token is issued with owner privileges.
  return `${base}/call/${bookingId}${asScholar ? '?s=1' : ''}`;
}

function renderEmail(booking, scholar) {
  const subject = `New booking from ${booking.user?.name || 'a user'} — ${fmt(booking.slotStartsAt)}`;
  const preview = [
    `New ScholarConnect booking.`,
    ``,
    `Scheduled for: ${fmt(booking.slotStartsAt)}`,
    `User: ${booking.user?.name} <${booking.user?.email}>`,
    `Amount: $${booking.amount}${booking.postFajr ? ` (Golden Hour +${booking.premiumPercent}%)` : ''}`,
    booking.topic ? `Topic: ${booking.topic}` : '',
    ``,
    `Join the call at the scheduled time: ${callUrl(booking.id, { asScholar: true })}`,
  ].filter(Boolean).join('\n');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#111">
      <h2 style="margin:0 0 8px">Assalamu alaikum, ${scholar.name.split(' ')[0]}</h2>
      <p>You have a new booking on ScholarConnect.</p>
      <table style="border-collapse:collapse;width:100%;margin:14px 0">
        <tr><td style="padding:6px 0;color:#666">Scheduled</td><td><strong>${fmt(booking.slotStartsAt)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#666">User</td><td>${booking.user?.name || 'Anonymous'} &lt;${booking.user?.email || ''}&gt;</td></tr>
        <tr><td style="padding:6px 0;color:#666">Amount</td><td>$${booking.amount}${booking.postFajr ? ` <span style="color:#b45309">(Golden Hour +${booking.premiumPercent}%)</span>` : ''}</td></tr>
        ${booking.topic ? `<tr><td style="padding:6px 0;color:#666">Topic</td><td>${booking.topic}</td></tr>` : ''}
      </table>
      <p>
        <a href="${callUrl(booking.id, { asScholar: true })}"
           style="display:inline-block;padding:10px 18px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none">
          Join the call
        </a>
      </p>
      <p style="color:#888;font-size:13px">The call window opens 10 minutes before the scheduled time.</p>
    </div>
  `;

  return { subject, text: preview, html };
}

function renderWhatsApp(booking, scholar) {
  const premium = booking.postFajr ? ` (Golden Hour +${booking.premiumPercent}%)` : '';
  return [
    `🕌 *New ScholarConnect booking*`,
    ``,
    `Assalamu alaikum ${scholar.name.split(' ')[0]},`,
    `${booking.user?.name || 'A user'} booked a session with you.`,
    ``,
    `📅 ${fmt(booking.slotStartsAt)}`,
    `💰 $${booking.amount}${premium}`,
    booking.topic ? `📝 ${booking.topic}` : null,
    ``,
    `Tap to join:`,
    ``,
    callUrl(booking.id, { asScholar: true }),
    ``,
    `(Opens 10 min before the scheduled time)`,
  ].filter(Boolean).join('\n');
}

async function sendEmail(booking, scholar) {
  const email = renderEmail(booking, scholar);

  if (!process.env.RESEND_API_KEY) {
    console.log('\n--- [email] RESEND_API_KEY not set, logging email ---');
    console.log(`To: ${scholar.name} <${scholar.email}>`);
    console.log(`Subject: ${email.subject}\n`);
    console.log(email.text);
    console.log('------------------------------------------------------\n');
    return { sent: false, channel: 'email', mode: 'console', to: scholar.email };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'ScholarConnect <onboarding@resend.dev>',
      to: scholar.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  const data = await res.json();
  return { sent: true, channel: 'email', mode: 'resend', to: scholar.email, id: data.id };
}

async function sendWhatsApp(booking, scholar) {
  const message = renderWhatsApp(booking, scholar);
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    console.log('\n--- [whatsapp] Twilio env not set, logging message ---');
    console.log(`To: ${scholar.name} (WhatsApp ${scholar.whatsapp})\n`);
    console.log(message);
    console.log('-------------------------------------------------------\n');
    return { sent: false, channel: 'whatsapp', mode: 'console', to: scholar.whatsapp };
  }

  const body = new URLSearchParams({
    From: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
    To: `whatsapp:${scholar.whatsapp}`,
    Body: message,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
      },
      body,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio ${res.status}: ${text}`);
  }
  const data = await res.json();
  return { sent: true, channel: 'whatsapp', mode: 'twilio', to: scholar.whatsapp, sid: data.sid };
}

export async function notifyScholarBooked(booking) {
  const scholar = SCHOLARS[booking.scholarId];
  if (!scholar) return { sent: false, reason: 'unknown_scholar_id' };

  const results = await Promise.allSettled([
    sendEmail(booking, scholar),
    sendWhatsApp(booking, scholar),
  ]);

  return {
    email: results[0].status === 'fulfilled' ? results[0].value : { sent: false, channel: 'email', error: results[0].reason?.message },
    whatsapp: results[1].status === 'fulfilled' ? results[1].value : { sent: false, channel: 'whatsapp', error: results[1].reason?.message },
  };
}
