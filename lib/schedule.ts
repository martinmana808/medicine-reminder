import { DateTime } from "luxon";

/**
 * Pure scheduling logic for medicine doses.
 *
 * Two schedule types:
 *  - "interval": every `intervalHours` hours, re-anchored when a dose is taken.
 *  - "daily":    one or more fixed clock times per day (in the user's timezone),
 *                clock-based and not affected by when a dose is actually taken.
 *
 * All instants are JS `Date` (UTC). Timezone only matters for daily clock times.
 */
export interface ScheduleSpec {
  type: "interval" | "daily";
  intervalHours: number | null;
  dailyTimes: string[] | null; // e.g. ["08:00", "20:00"]
}

const HOUR_MS = 3_600_000;

/** The soonest instant strictly after `after` whose local time matches one of `times`. */
export function nextDailyOccurrence(
  after: Date,
  times: string[],
  tz: string,
): Date {
  const sorted = [...times].sort();
  const base = DateTime.fromJSDate(after, { zone: tz });
  for (let offset = 0; offset <= 1; offset++) {
    const day = base.plus({ days: offset });
    for (const t of sorted) {
      const [hh, mm] = t.split(":").map(Number);
      const cand = day.set({
        hour: hh,
        minute: mm,
        second: 0,
        millisecond: 0,
      });
      if (cand.toMillis() > after.getTime()) return cand.toUTC().toJSDate();
    }
  }
  // Unreachable in practice (tomorrow's earliest time is always ahead), kept for safety.
  const [hh, mm] = sorted[0].split(":").map(Number);
  return base
    .plus({ days: 1 })
    .set({ hour: hh, minute: mm, second: 0, millisecond: 0 })
    .toUTC()
    .toJSDate();
}

/** Initial `next_due_at` for a newly created medicine. */
export function firstDueAt(spec: ScheduleSpec, startAt: Date, tz: string): Date {
  if (spec.type === "interval") return startAt;
  // Include an exact match on startAt by looking one ms earlier.
  return nextDailyOccurrence(new Date(startAt.getTime() - 1), spec.dailyTimes!, tz);
}

/** `next_due_at` after a due dose has fired (regardless of whether it was taken). */
export function advanceAfterFire(
  spec: ScheduleSpec,
  scheduledAt: Date,
  tz: string,
): Date {
  if (spec.type === "interval") {
    return new Date(scheduledAt.getTime() + spec.intervalHours! * HOUR_MS);
  }
  return nextDailyOccurrence(scheduledAt, spec.dailyTimes!, tz);
}

/** `next_due_at` after the user marks a dose taken at `takenAt`. */
export function reanchorAfterTaken(
  spec: ScheduleSpec,
  takenAt: Date,
  currentNextDue: Date | null,
): Date | null {
  if (spec.type === "interval") {
    return new Date(takenAt.getTime() + spec.intervalHours! * HOUR_MS);
  }
  return currentNextDue; // daily clock schedule is unaffected
}

/** A course is finished once its next dose would fall past the end date. */
export function isCourseFinished(
  nextDueAt: Date | null,
  endAt: Date | null,
): boolean {
  if (!nextDueAt || !endAt) return false;
  return nextDueAt.getTime() > endAt.getTime();
}
