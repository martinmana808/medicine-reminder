import { DateTime } from "luxon";
import type { Medicine } from "./types";

export function fmtDateTime(d: Date | string | null, tz: string): string {
  if (!d) return "—";
  return DateTime.fromJSDate(new Date(d))
    .setZone(tz)
    .toFormat("ccc d LLL, h:mm a");
}

export function fmtRelative(d: Date | string | null, now: Date): string {
  if (!d) return "";
  const rel = DateTime.fromJSDate(new Date(d)).toRelative({
    base: DateTime.fromJSDate(now),
  });
  return rel ?? "";
}

export function scheduleSummary(m: Medicine): string {
  if (m.type === "interval") {
    const every = `Every ${m.intervalHours}h`;
    return m.endAt ? `${every}` : `${every} · ongoing`;
  }
  const times = (m.dailyTimes ?? []).join(", ");
  return `Daily at ${times}`;
}
