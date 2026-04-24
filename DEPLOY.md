# Deploying ScholarConnect

This app has two deployable pieces, both on the same Vercel project:
- **Frontend** — static Vite build served from `dist/`
- **Backend** — serverless function at `api/[[...slug]].js` wrapping the Express app

Persistence lives in **Supabase** (managed Postgres + realtime).

## 1a. One-time Supabase Auth setup

ScholarConnect now uses Supabase Auth — passwords are hashed, sessions are JWTs, and login works across devices.

### Disable email confirmation (for dev)
Supabase by default requires users to click a confirmation link in their email before logging in. For a demo this is friction. Turn it off:

1. Supabase dashboard → **Authentication → Providers**
2. Expand **Email**
3. Toggle **"Confirm email"** OFF → click **Save**

### Pre-create the scholar accounts

Scholars don't self-register. Create their auth accounts manually so they can log in:

1. Supabase dashboard → **Authentication → Users**
2. Click **"Add user"** → **"Create new user"**
3. Email: `muzammil@scholarconnect.test` — Password: choose one and note it (e.g. `Muzammil#2003`)
4. ✅ Check **"Auto Confirm User"**
5. Click **Create user**
6. Repeat for Farooq with email `farooq@scholarconnect.test`

These two emails are the mapping keys in [src/data/scholars.js](src/data/scholars.js) (`SCHOLAR_EMAILS`). When someone signs in with either, the app routes them to the scholar dashboard instead of the marketplace.

Pass the password to each scholar privately. They'll sign in at `/login` with their email + that password.

## 1. Create a Supabase project (10 min)

1. Sign up at https://supabase.com (free tier).
2. **New project** → pick a region close to your users → set a DB password.
3. Wait ~1 min for it to provision.
4. In the left sidebar, open **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, and click **Run**. This creates the `bookings` table, indexes, RLS policies, and enables realtime.
5. Go to **Settings → API**. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
6. Paste both into your local `.env` so you can test locally before deploying.

## 2. Push the repo to GitHub

Vercel deploys from git. If you don't already have a repo:

```bash
git init
git add .
git commit -m "initial"
# create repo on github.com, then:
git remote add origin <your-github-url>
git push -u origin main
```

## 3. Import into Vercel

1. Sign up / sign in at https://vercel.com with your GitHub account.
2. **Add New → Project** → pick your repo.
3. Vercel auto-detects Vite. Framework preset should say **Vite**.
4. **Don't deploy yet** — click **Environment Variables** first.

## 4. Set environment variables in Vercel

Add every variable below (all three environments: Production, Preview, Development unless noted):

| Variable | Where from | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API | Baked into frontend build |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API | Baked into frontend build |
| `DAILY_API_KEY` | Daily.co → Developers → API keys | Server runtime |
| `DAILY_DOMAIN` | Your `*.daily.co` subdomain only | `alhamdulillah`, not full hostname |
| `RESEND_API_KEY` | Resend → API keys | Optional; fallback logs to console |
| `RESEND_FROM` | e.g. `ScholarConnect <onboarding@resend.dev>` | Optional |
| `TWILIO_ACCOUNT_SID` | Twilio console dashboard | Server runtime |
| `TWILIO_AUTH_TOKEN` | Twilio console dashboard | Server runtime |
| `TWILIO_WHATSAPP_FROM` | Sandbox number with `+`, no `whatsapp:` prefix | e.g. `+14155238886` |

`PUBLIC_WEB_URL` is **not** needed — the server auto-detects the deployed URL via `VERCEL_URL`. If you add a custom domain, set `PUBLIC_WEB_URL=https://yourdomain.com` so notification links use it.

## 5. Deploy

Click **Deploy**. First build takes ~90 s. You'll get a URL like `https://scholar-connect-xyz.vercel.app`.

Open it → the SPA loads, you can sign up as a user, pick a scholar, book a slot. The booking persists to Supabase. Scholar logs in on another device → sees the booking live.

## 6. Verify each integration

| Check | How |
|---|---|
| Supabase writes | Book a session, then check Supabase → **Table Editor → bookings** for the row |
| Realtime works | Open scholar dashboard in a second browser, book from the first — dashboard updates without refresh |
| Daily.co tokens | Inside the call-window, open `/call/<bookingId>` — the URL bar should show a Daily room URL in the iframe source |
| WhatsApp send | Book a session; opted-in phone gets a WhatsApp message within ~5 s; URL in the message uses your production domain |

## 7. Custom domain (optional)

Vercel → Project → **Settings → Domains** → add your domain → Vercel tells you what CNAME/A record to set in your DNS. After propagation set `PUBLIC_WEB_URL=https://yourdomain.com` in Vercel env vars.

## Notes, limits, gotchas

- **Free tier Supabase**: project pauses after 7 days of no activity. One request wakes it up (~2 s cold start).
- **Vercel serverless cold starts**: first request to `/api/*` after idle may be ~1 s slow. Subsequent requests are fast.
- **WhatsApp Sandbox**: each recipient number must text `join <your-code>` to the sandbox number once every 72 hours. For production messaging use a real WhatsApp Business sender.
- **Daily.co minutes**: free tier is 10,000 participant-minutes/month.
- **Auth in this build is mock** (localStorage + scholar passcode). If the project grows beyond a demo, migrate to Supabase Auth — the schema supports it with minor changes.

## Local dev still works

The same codebase runs locally with `npm run dev`:
- `server/index.js` uses `dotenv` + `app.listen` for local
- `api/[[...slug]].js` is Vercel-only, not used locally
- Both import the same `createApp()` from `server/app.js` — no code duplication
