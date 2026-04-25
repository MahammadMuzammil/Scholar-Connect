import express from 'express';
import cors from 'cors';
import { provisionVideoSession } from './daily.js';
import { notifyScholarBooked } from './notifications.js';
import {
  createApplicationAndNotify,
  approveApplication,
  approvalSuccessHtml,
  approvalErrorHtml,
} from './applications.js';

// Demo mode: server allows token issuance for any future booking. Revert to
// `10 * 60 * 1000` for production behavior.
const OPEN_BEFORE_MS = 365 * 24 * 60 * 60 * 1000; // 1 year
const GRACE_AFTER_MS = 15 * 60 * 1000;

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      daily: Boolean(process.env.DAILY_API_KEY),
      resend: Boolean(process.env.RESEND_API_KEY),
      twilio: Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_WHATSAPP_FROM
      ),
    });
  });

  app.post('/api/video-session', async (req, res) => {
    try {
      const { bookingId, slotStartsAt, durationMinutes = 30, displayName, isScholar } = req.body;
      if (!bookingId || !slotStartsAt) {
        return res.status(400).json({ error: 'bookingId and slotStartsAt required' });
      }
      const start = new Date(slotStartsAt).getTime();
      const now = Date.now();
      const openAt = start - OPEN_BEFORE_MS;
      const closeAt = start + durationMinutes * 60 * 1000 + GRACE_AFTER_MS;

      if (now < openAt) {
        return res.status(403).json({ error: 'too_early', openAt, message: 'Call not yet open' });
      }
      if (now > closeAt) {
        return res.status(403).json({ error: 'expired', message: 'Call window has closed' });
      }

      const session = await provisionVideoSession({
        bookingId,
        closeAt,
        displayName,
        isScholar: Boolean(isScholar),
      });
      return res.json(session);
    } catch (err) {
      console.error('[/api/video-session]', err);
      return res.status(500).json({ error: 'server_error', message: err.message });
    }
  });

  // Scholar applies — server creates application row + emails admin.
  app.post('/api/scholar-application', async (req, res) => {
    try {
      const { userId, name, email } = req.body || {};
      if (!userId || !name || !email) {
        return res.status(400).json({ error: 'userId, name, email required' });
      }
      const result = await createApplicationAndNotify({ userId, name, email }, req);
      return res.json(result);
    } catch (err) {
      console.error('[/api/scholar-application]', err);
      return res.status(500).json({ error: 'server_error', message: err.message });
    }
  });

  // Admin clicks approve link from email.
  app.get('/api/scholar-application/approve', async (req, res) => {
    try {
      const { id, token } = req.query;
      if (!id || !token) {
        res.status(400).set('Content-Type', 'text/html');
        return res.send(approvalErrorHtml('Missing id or token in URL.'));
      }
      const result = await approveApplication({ id, token });
      if (!result.ok) {
        res.status(result.reason === 'invalid_token' ? 403 : 404)
          .set('Content-Type', 'text/html');
        return res.send(approvalErrorHtml(result.reason));
      }
      res.set('Content-Type', 'text/html');
      return res.send(approvalSuccessHtml(result.application?.name || 'Scholar'));
    } catch (err) {
      console.error('[/api/scholar-application/approve]', err);
      res.status(500).set('Content-Type', 'text/html');
      return res.send(approvalErrorHtml(err.message));
    }
  });

  app.post('/api/notify', async (req, res) => {
    try {
      const booking = req.body;
      if (!booking?.id || !booking.scholarId) {
        return res.status(400).json({ error: 'invalid_booking' });
      }
      const result = await notifyScholarBooked(booking);
      return res.json(result);
    } catch (err) {
      console.error('[/api/notify]', err);
      return res.status(500).json({ error: 'server_error', message: err.message });
    }
  });

  return app;
}
