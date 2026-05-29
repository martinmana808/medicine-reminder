import { DateTime } from "luxon";
import type { Medicine } from "./types";

export function fmtDateTime(d: Date | string | null, tz: string): string {
  if (!d) return "—";
  return DateTime.fromJSDate(new Date(d))
    .setZone(tz)
    .toFormat("ccc d LLL, h:mm a");
}

/** Compact clock label: "8:00 PM" if today, else "Sat 8:00 PM". */
export function fmtClock(d: Date | string, tz: string, now: Date): string {
  const dt = DateTime.fromJSDate(new Date(d)).setZone(tz);
  const nowDt = DateTime.fromJSDate(now).setZone(tz);
  return dt.toFormat(dt.hasSame(nowDt, "day") ? "h:mm a" : "ccc h:mm a");
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
