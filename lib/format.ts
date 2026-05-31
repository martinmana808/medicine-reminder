import { DateTime } from "luxon";
import type { Medicine } from "./types";
import { t, localeOf, type Lang } from "./i18n";

export function fmtDateTime(
  d: Date | string | null,
  tz: string,
  lang: Lang = "en",
): string {
  if (!d) return "—";
  return DateTime.fromJSDate(new Date(d))
    .setZone(tz)
    .setLocale(localeOf(lang))
    .toFormat("ccc d LLL, h:mm a");
}

/** Compact clock label: "8:00 PM" if today, else "Sat 8:00 PM". */
export function fmtClock(
  d: Date | string,
  tz: string,
  now: Date,
  lang: Lang = "en",
): string {
  const dt = DateTime.fromJSDate(new Date(d))
    .setZone(tz)
    .setLocale(localeOf(lang));
  const nowDt = DateTime.fromJSDate(now).setZone(tz);
  return dt.toFormat(dt.hasSame(nowDt, "day") ? "h:mm a" : "ccc h:mm a");
}

export function fmtRelative(
  d: Date | string | null,
  now: Date,
  lang: Lang = "en",
): string {
  if (!d) return "";
  const rel = DateTime.fromJSDate(new Date(d))
    .setLocale(localeOf(lang))
    .toRelative({ base: DateTime.fromJSDate(now) });
  return rel ?? "";
}

export function scheduleSummary(m: Medicine, lang: Lang = "en"): string {
  if (m.type === "interval") {
    return t(lang, m.endAt ? "schedule.everyHours" : "schedule.ongoing", {
      h: m.intervalHours ?? 0,
    });
  }
  return t(lang, "schedule.dailyAt", { times: (m.dailyTimes ?? []).join(", ") });
}
