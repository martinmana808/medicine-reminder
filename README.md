# 💊 Medicine Reminder

A personal, installable PWA that sends push notifications when it's time to take a
medicine. Supports interval courses ("every 8h for 7 days"), fixed daily times, and
re-anchors interval schedules when you mark a dose **Taken**. Free to host and run.

See the design spec: [`docs/superpowers/specs/2026-05-29-medicine-reminder-design.md`](docs/superpowers/specs/2026-05-29-medicine-reminder-design.md).

## Stack

Next.js (App Router) · Web Push (VAPID) · Neon Postgres · Vercel · external 1-min cron.

## Local setup

1. **Install deps** (already done if you scaffolded): `npm install`
2. **Database** — create a free Neon Postgres database (Vercel Marketplace or
   neon.tech) and put its connection string in `.env.local` as `DATABASE_URL`.
3. **VAPID keys** — already generated into `.env.local`. To regenerate:
   `npx web-push generate-vapid-keys` (set both `VAPID_PUBLIC_KEY` and
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to the public key).
4. **Migrate**: `npm run migrate`
5. **Run**: `npm run dev`, open http://localhost:3000

> Push notifications require HTTPS (or `localhost`). To test push on your phone,
> deploy first (Vercel gives you HTTPS).

## Deploy (all free tiers)

1. Push this repo to GitHub and import it into **Vercel** (Hobby plan).
2. Add a **Neon** database from the Vercel Marketplace (sets `DATABASE_URL`).
3. In Vercel project settings → Environment Variables, add:
   `VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
   `VAPID_SUBJECT`, `CRON_SECRET` (copy from `.env.local`).
4. Deploy, then run the migration against the production DB:
   `DATABASE_URL="<prod url>" npm run migrate`
5. **Heartbeat:** create a free job at [cron-job.org](https://cron-job.org) that
   GETs `https://<your-app>.vercel.app/api/cron?secret=<CRON_SECRET>` every minute.

## Use it

1. Open the app on your phone and **Add to Home Screen** (install the PWA).
2. Open it from the home screen → **Settings → Enable notifications**.
3. Tap **Send test notification** to confirm push works.
4. Add medicines. Reminders fire at each scheduled time; tap **Taken** on the
   notification (or in the app) to log the dose and re-anchor interval schedules.

## Scripts

- `npm run dev` — dev server
- `npm run build` / `npm start` — production build / serve
- `npm test` — Vitest (scheduling logic)
- `npm run migrate` — apply `lib/schema.sql`
- `npm run gen:icons` — regenerate app icons

## Notes / v1 scope

- Single user, no authentication. The `/api/cron` endpoint is protected by
  `CRON_SECRET`.
- To change a medicine, delete it and add it again (no in-place edit yet).
- **Snooze** reschedules the reminder 10 minutes out.
