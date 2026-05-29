# Medicine Reminder — Design Spec

**Date:** 2026-05-29
**Status:** Approved (build authorized "YOLO mode")

## Goal

A personal, installable PWA that sends push notifications when it's time to take a
medicine. Single user, no accounts. Free to host and run.

## Core requirement that shapes everything

To notify the user when the app is **closed**, a server must send a **Web Push**.
There is no reliable client-only way to schedule a future notification on a closed
device (the Notification Triggers API is dead). So the system is always:
PWA + service worker + a server that sends pushes + a heartbeat that decides "now".

## Stack (all free tiers)

- **Next.js (App Router) + TypeScript** PWA on **Vercel Hobby**
- **Web Push** with self-generated **VAPID** keys (no third-party push service)
- **Neon Postgres** (free tier, Vercel Marketplace)
- **Heartbeat:** external **cron-job.org** (free, 1-minute) pinging `/api/cron`
  with a secret token. (Vercel Hobby cron is throttled to ~daily, so we don't use it.)

## Schedule model

Two medicine types cover all stated cases:

- **interval** — every `interval_hours`, e.g. "every 8h for 7 days". Re-anchors on
  Taken.
- **daily** — one or more fixed clock times per day (`daily_times`), e.g. "08:00",
  ongoing or until `end_at`. Clock-based; not re-anchored.

Courses end via `end_at` (e.g. start + 7 days) or run ongoing (`end_at = null`).

### `next_due_at` lifecycle (the core logic)

Each active medicine carries a single `next_due_at`. The cron endpoint each minute
finds meds with `now >= next_due_at` and:

1. Creates a `dose` row (`status='due'`, `scheduled_at = next_due_at`) — unique per
   `(medicine_id, scheduled_at)`, so it never double-fires.
2. Sends the push to all subscriptions.
3. Advances `next_due_at`:
   - interval → `scheduled_at + interval_hours`
   - daily → next clock occurrence after `scheduled_at` (in the user's timezone)
4. If `next_due_at > end_at`, deactivates the medicine.

When the user taps **Taken** at time T:
- dose → `status='taken'`, `taken_at=T`
- interval meds **re-anchor**: `next_due_at = T + interval_hours`
- daily meds: unchanged

This handles late doses (re-anchor) and forgotten doses (rhythm continues).

**Snooze:** sets `next_due_at = now + 10min` so the reminder fires again shortly.

## Data model (Postgres)

- `settings(id=1, timezone)` — single row; timezone makes daily times correct
- `medicines(id, name, type, interval_hours, daily_times[], start_at, end_at,
  next_due_at, active, created_at)`
- `doses(id, medicine_id, scheduled_at, status, taken_at, created_at)`,
  unique `(medicine_id, scheduled_at)` — this table is the history
- `push_subscriptions(endpoint, p256dh, auth, created_at)`

## API routes

- `GET  /api/cron?secret=…` — heartbeat; fires due doses + pushes
- `POST /api/subscribe` — store a browser push subscription
- `POST /api/test-notification` — send a test push
- `GET/POST /api/medicines`, `GET/PUT/DELETE /api/medicines/[id]`
- `POST /api/doses/[id]/taken`, `POST /api/doses/[id]/snooze`

## UI (4 screens)

- **Home** — active meds with next dose time + today's status; per-med Taken button
- **Add/Edit** — name, interval-vs-daily, hours or times, start, duration days / ongoing
- **History** — recent doses
- **Settings** — Enable notifications, timezone, Send test notification

## Service worker (`/sw.js`)

- `push` → `showNotification(name, { actions: [Taken, Snooze 10m], data:{doseId} })`
- `notificationclick` → action `taken`/`snooze` POSTs to the API; body tap opens app

## Error handling & edges

- Push 404/410 → delete the dead subscription
- Cron idempotency via the unique `(medicine_id, scheduled_at)` constraint
- Timezone stored explicitly for correct daily times and "today"
- `/api/cron` protected by `CRON_SECRET`; app itself is single-user/unauthenticated

## Testing

- `lib/schedule.ts` pure functions (`firstDueAt`, `advanceAfterFire`,
  `reanchorAfterTaken`, `nextDailyOccurrence`, `isCourseFinished`) built test-first
  with Vitest.
- "Send test notification" button for end-to-end push verification.

## Required secrets (set in `.env.local` and Vercel)

- `DATABASE_URL` — Neon connection string
- `VAPID_PUBLIC_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` — `mailto:you@example.com`
- `CRON_SECRET` — random string shared with cron-job.org
