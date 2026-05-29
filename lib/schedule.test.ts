import { describe, it, expect } from "vitest";
import {
  nextDailyOccurrence,
  firstDueAt,
  advanceAfterFire,
  reanchorAfterTaken,
  isCourseFinished,
  type ScheduleSpec,
} from "./schedule";

const interval = (h: number): ScheduleSpec => ({
  type: "interval",
  intervalHours: h,
  dailyTimes: null,
});
const daily = (times: string[]): ScheduleSpec => ({
  type: "daily",
  intervalHours: null,
  dailyTimes: times,
});

describe("nextDailyOccurrence", () => {
  it("returns today's time when it is still ahead (UTC)", () => {
    const after = new Date("2026-05-29T06:00:00Z");
    const next = nextDailyOccurrence(after, ["08:00"], "UTC");
    expect(next.toISOString()).toBe("2026-05-29T08:00:00.000Z");
  });

  it("rolls to tomorrow when today's time already passed", () => {
    const after = new Date("2026-05-29T09:00:00Z");
    const next = nextDailyOccurrence(after, ["08:00"], "UTC");
    expect(next.toISOString()).toBe("2026-05-30T08:00:00.000Z");
  });

  it("picks the soonest of multiple times", () => {
    const after = new Date("2026-05-29T09:00:00Z");
    const next = nextDailyOccurrence(after, ["08:00", "20:00"], "UTC");
    expect(next.toISOString()).toBe("2026-05-29T20:00:00.000Z");
  });

  it("respects timezone (08:00 in New York, not UTC)", () => {
    // 2026-05-29 in NY is EDT (UTC-4), so 08:00 local = 12:00 UTC
    const after = new Date("2026-05-29T06:00:00Z");
    const next = nextDailyOccurrence(after, ["08:00"], "America/New_York");
    expect(next.toISOString()).toBe("2026-05-29T12:00:00.000Z");
  });
});

describe("firstDueAt", () => {
  it("interval: first dose is exactly the start time", () => {
    const start = new Date("2026-05-29T10:00:00Z");
    expect(firstDueAt(interval(8), start, "UTC").toISOString()).toBe(
      "2026-05-29T10:00:00.000Z",
    );
  });

  it("daily: first dose is the next clock time at or after start", () => {
    const start = new Date("2026-05-29T08:00:00Z");
    // start lands exactly on 08:00, should be included
    expect(firstDueAt(daily(["08:00"]), start, "UTC").toISOString()).toBe(
      "2026-05-29T08:00:00.000Z",
    );
  });
});

describe("advanceAfterFire", () => {
  it("interval: adds interval hours to scheduled time", () => {
    const scheduled = new Date("2026-05-29T10:00:00Z");
    expect(advanceAfterFire(interval(8), scheduled, "UTC").toISOString()).toBe(
      "2026-05-29T18:00:00.000Z",
    );
  });

  it("interval: supports fractional hours", () => {
    const scheduled = new Date("2026-05-29T10:00:00Z");
    expect(advanceAfterFire(interval(0.5), scheduled, "UTC").toISOString()).toBe(
      "2026-05-29T10:30:00.000Z",
    );
  });

  it("daily: advances to the next clock occurrence", () => {
    const scheduled = new Date("2026-05-29T08:00:00Z");
    expect(advanceAfterFire(daily(["08:00"]), scheduled, "UTC").toISOString()).toBe(
      "2026-05-30T08:00:00.000Z",
    );
  });
});

describe("reanchorAfterTaken", () => {
  it("interval: next dose is interval hours after the moment taken", () => {
    const taken = new Date("2026-05-29T11:30:00Z"); // took it 1.5h late
    const result = reanchorAfterTaken(interval(8), taken, null);
    expect(result!.toISOString()).toBe("2026-05-29T19:30:00.000Z");
  });

  it("daily: taking does not shift the clock schedule", () => {
    const taken = new Date("2026-05-29T08:05:00Z");
    const current = new Date("2026-05-30T08:00:00Z");
    const result = reanchorAfterTaken(daily(["08:00"]), taken, current);
    expect(result!.toISOString()).toBe(current.toISOString());
  });
});

describe("isCourseFinished", () => {
  it("finished when next due is past the end date", () => {
    expect(
      isCourseFinished(
        new Date("2026-06-06T10:00:00Z"),
        new Date("2026-06-05T10:00:00Z"),
      ),
    ).toBe(true);
  });

  it("not finished when next due is before the end date", () => {
    expect(
      isCourseFinished(
        new Date("2026-06-04T10:00:00Z"),
        new Date("2026-06-05T10:00:00Z"),
      ),
    ).toBe(false);
  });

  it("ongoing course (no end) is never finished", () => {
    expect(isCourseFinished(new Date("2026-06-04T10:00:00Z"), null)).toBe(false);
  });
});
