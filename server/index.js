import 'dotenv/config';
import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  const twilioConfigured =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM;
  console.log(`\n  ScholarConnect API ready on http://localhost:${PORT}`);
  console.log(`  - Daily.co:        ${process.env.DAILY_API_KEY ? 'configured' : 'fallback (Jitsi)'}`);
  console.log(`  - Resend:          ${process.env.RESEND_API_KEY ? 'configured' : 'fallback (console log)'}`);
  console.log(`  - Twilio WhatsApp: ${twilioConfigured ? 'configured' : 'fallback (console log)'}\n`);
});
