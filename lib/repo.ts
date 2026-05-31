import { query } from "./db";
import {
  firstDueAt,
  isCourseFinished,
  recomputeNextDue,
  type ScheduleSpec,
} from "./schedule";
import type {
  CreateMedicineInput,
  Dose,
  DoseWithMedicine,
  Medicine,
  PushSubscriptionRecord,
} from "./types";

const DAY_MS = 86_400_000;

type MedicineRow = {
  id: number;
  name: string;
  type: "interval" | "daily";
  interval_hours: string | null;
  daily_times: string[] | null;
  start_at: Date;
  end_at: Date | null;
  next_due_at: Date | null;
  active: boolean;
  created_at: Date;
};

type DoseRow = {
  id: number;
  medicine_id: number;
  scheduled_at: Date;
  status: "due" | "taken" | "skipped";
  taken_at: Date | null;
  created_at: Date;
  source?: string;
  prev_next_due_at?: Date | null;
  medicine_name?: string;
};

function toMedicine(r: MedicineRow): Medicine {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    intervalHours: r.interval_hours === null ? null : Number(r.interval_hours),
    dailyTimes: r.daily_times,
    startAt: r.start_at,
    endAt: r.end_at,
    nextDueAt: r.next_due_at,
    active: r.active,
    createdAt: r.created_at,
  };
}

function toDose(r: DoseRow): Dose {
  return {
    id: r.id,
    medicineId: r.medicine_id,
    scheduledAt: r.scheduled_at,
    status: r.status,
    takenAt: r.taken_at,
    createdAt: r.created_at,
  };
}

function specOf(m: Medicine): ScheduleSpec {
  return {
    type: m.type,
    intervalHours: m.intervalHours,
    dailyTimes: m.dailyTimes,
  };
}

// ---------- settings ----------

export async function getTimezone(): Promise<string> {
  try {
    const rows = await query<{ timezone: string }>(
      "select timezone from settings where id = 1",
    );
    return rows[0]?.timezone ?? "UTC";
  } catch {
    return "UTC";
  }
}

export async function setTimezone(timezone: string): Promise<void> {
  await query(
    `insert into settings (id, timezone) values (1, $1)
     on conflict (id) do update set timezone = excluded.timezone`,
    [timezone],
  );
}

export async function getLanguage(): Promise<"en" | "es"> {
  try {
    const rows = await query<{ language: string }>(
      "select language from settings where id = 1",
    );
    return rows[0]?.language === "es" ? "es" : "en";
  } catch {
    return "en";
  }
}

export async function setLanguage(language: "en" | "es"): Promise<void> {
  await query("update settings set language = $1 where id = 1", [language]);
}

// ---------- medicines ----------

export async function listMedicines(
  opts: { activeOnly?: boolean } = {},
): Promise<Medicine[]> {
  const where = opts.activeOnly ? "where active = true" : "";
  const rows = await query<MedicineRow>(
    `select * from medicines ${where} order by active desc, next_due_at asc nulls last, name asc`,
  );
  return rows.map(toMedicine);
}

export async function getMedicine(id: number): Promise<Medicine | null> {
  const rows = await query<MedicineRow>("select * from medicines where id = $1", [
    id,
  ]);
  return rows[0] ? toMedicine(rows[0]) : null;
}

export async function createMedicine(
  input: CreateMedicineInput,
): Promise<Medicine> {
  const tz = await getTimezone();
  const spec: ScheduleSpec = {
    type: input.type,
    intervalHours: input.intervalHours,
    dailyTimes: input.dailyTimes,
  };
  const nextDue = firstDueAt(spec, input.startAt, tz, new Date());
  const endAt =
    input.durationDays === null
      ? null
      : new Date(input.startAt.getTime() + input.durationDays * DAY_MS);
  const active = !isCourseFinished(nextDue, endAt);
  const rows = await query<MedicineRow>(
    `insert into medicines
       (name, type, interval_hours, daily_times, start_at, end_at, next_due_at, active)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning *`,
    [
      input.name,
      input.type,
      input.intervalHours,
      input.dailyTimes,
      input.startAt,
      endAt,
      active ? nextDue : null,
      active,
    ],
  );
  return toMedicine(rows[0]);
}

export async function updateMedicine(
  id: number,
  input: CreateMedicineInput,
): Promise<Medicine | null> {
  const tz = await getTimezone();
  const spec: ScheduleSpec = {
    type: input.type,
    intervalHours: input.intervalHours,
    dailyTimes: input.dailyTimes,
  };
  const nextDue = firstDueAt(spec, input.startAt, tz, new Date());
  const endAt =
    input.durationDays === null
      ? null
      : new Date(input.startAt.getTime() + input.durationDays * DAY_MS);
  const active = !isCourseFinished(nextDue, endAt);
  const rows = await query<MedicineRow>(
    `update medicines set
       name = $2, type = $3, interval_hours = $4, daily_times = $5,
       start_at = $6, end_at = $7, next_due_at = $8, active = $9
     where id = $1
     returning *`,
    [
      id,
      input.name,
      input.type,
      input.intervalHours,
      input.dailyTimes,
      input.startAt,
      endAt,
      active ? nextDue : null,
      active,
    ],
  );
  return rows[0] ? toMedicine(rows[0]) : null;
}

export async function deleteMedicine(id: number): Promise<void> {
  await query("delete from medicines where id = $1", [id]);
}

// ---------- dose lifecycle ----------

export async function getDueMedicines(now: Date): Promise<Medicine[]> {
  const rows = await query<MedicineRow>(
    "select * from medicines where active = true and next_due_at is not null and next_due_at <= $1",
    [now],
  );
  return rows.map(toMedicine);
}

/**
 * THE single place next_due_at is set. Derives it deterministically from the
 * schedule + what has actually been logged (last intake time, last materialized
 * slot). Every mutation calls this instead of nudging next_due_at directly.
 */
export async function recomputeMedicineNextDue(
  medicineId: number,
  now: Date,
): Promise<void> {
  const med = await getMedicine(medicineId);
  if (!med) return;
  const tz = await getTimezone();
  const takenRows = await query<{ t: Date | null }>(
    "select max(taken_at) as t from doses where medicine_id = $1 and status = 'taken'",
    [medicineId],
  );
  const slotRows = await query<{ s: Date | null }>(
    "select max(scheduled_at) as s from doses where medicine_id = $1",
    [medicineId],
  );
  const next = recomputeNextDue(
    specOf(med),
    med.startAt,
    {
      lastTakenAt: takenRows[0]?.t ?? null,
      lastSlotAt: slotRows[0]?.s ?? null,
    },
    now,
    tz,
  );
  const finished = isCourseFinished(next, med.endAt);
  await query(
    "update medicines set next_due_at = $2, active = $3 where id = $1",
    [medicineId, finished ? null : next, !finished],
  );
}

/**
 * Fire the currently-due dose: create the due row (idempotent on the unique
 * scheduled_at) and recompute next_due_at. Returns the created dose only when it
 * was newly inserted, so the caller knows whether to push a notification.
 */
export async function fireDose(
  med: Medicine,
  now: Date,
): Promise<{ created: boolean; dose: Dose | null }> {
  if (!med.nextDueAt) return { created: false, dose: null };
  const inserted = await query<DoseRow>(
    `insert into doses (medicine_id, scheduled_at, status)
     values ($1, $2, 'due')
     on conflict (medicine_id, scheduled_at) do nothing
     returning *`,
    [med.id, med.nextDueAt],
  );
  await recomputeMedicineNextDue(med.id, now);
  return {
    created: inserted.length > 0,
    dose: inserted[0] ? toDose(inserted[0]) : null,
  };
}

export async function markTaken(
  doseId: number,
  takenAt: Date,
): Promise<boolean> {
  const existing = await query<DoseRow>(
    "select * from doses where id = $1",
    [doseId],
  );
  if (existing.length === 0 || existing[0].status === "taken") return false;
  await query(
    "update doses set status = 'taken', taken_at = $2 where id = $1",
    [doseId, takenAt],
  );
  await recomputeMedicineNextDue(existing[0].medicine_id, new Date());
  return true;
}

export async function snoozeDose(
  doseId: number,
  minutes: number,
  now: Date,
): Promise<boolean> {
  const doseRows = await query<DoseRow>(
    "select * from doses where id = $1",
    [doseId],
  );
  if (doseRows.length === 0) return false;
  const medicineId = doseRows[0].medicine_id;
  const snoozeUntil = new Date(now.getTime() + minutes * 60_000);
  await query(
    "update medicines set next_due_at = $2, active = true where id = $1",
    [medicineId, snoozeUntil],
  );
  return true;
}

/**
 * Log that a medicine was taken at a chosen time. Resolves the outstanding due
 * dose if one exists, otherwise records the take against the upcoming scheduled
 * slot (taking the next dose early). next_due_at is then recomputed from scratch.
 */
export async function takeMedicineAt(
  medicineId: number,
  takenAt: Date,
): Promise<boolean> {
  const med = await getMedicine(medicineId);
  if (!med) return false;

  const pending = await query<DoseRow>(
    "select * from doses where medicine_id = $1 and status = 'due' order by scheduled_at desc limit 1",
    [medicineId],
  );

  if (pending.length > 0) {
    await query(
      "update doses set status = 'taken', taken_at = $2 where id = $1",
      [pending[0].id, takenAt],
    );
  } else {
    // Record against the upcoming scheduled slot so it counts as that dose.
    const slot = med.nextDueAt ?? takenAt;
    await query(
      `insert into doses (medicine_id, scheduled_at, status, taken_at, source)
       values ($1, $2, 'taken', $3, 'scheduled')
       on conflict (medicine_id, scheduled_at)
       do update set status = 'taken', taken_at = excluded.taken_at`,
      [medicineId, slot, takenAt],
    );
  }

  await recomputeMedicineNextDue(medicineId, new Date());
  return true;
}

/**
 * Undo a taken dose. If it was an upcoming dose taken early (its slot is still in
 * the future), remove the record entirely; otherwise revert it to pending so it
 * shows as due again. next_due_at is recomputed either way.
 */
export async function undoDose(doseId: number): Promise<boolean> {
  const doseRows = await query<DoseRow>("select * from doses where id = $1", [
    doseId,
  ]);
  if (doseRows.length === 0) return false;
  const row = doseRows[0];
  const now = new Date();

  if (new Date(row.scheduled_at).getTime() > now.getTime()) {
    await query("delete from doses where id = $1", [doseId]);
  } else {
    await query(
      "update doses set status = 'due', taken_at = null where id = $1",
      [doseId],
    );
  }

  await recomputeMedicineNextDue(row.medicine_id, now);
  return true;
}

/**
 * Undo the most recently taken dose for a medicine — the quick "I tapped Taken by
 * accident" fix. Reuses undoDose, so the next dose re-derives from the prior take.
 */
export async function undoLastTake(medicineId: number): Promise<boolean> {
  const rows = await query<DoseRow>(
    `select id from doses
     where medicine_id = $1 and status = 'taken'
     order by taken_at desc nulls last, id desc
     limit 1`,
    [medicineId],
  );
  if (rows.length === 0) return false;
  return undoDose(rows[0].id);
}

/** Delete a dose entirely (history cleanup), then recompute the schedule. */
export async function deleteDose(doseId: number): Promise<boolean> {
  const rows = await query<DoseRow>(
    "delete from doses where id = $1 returning medicine_id",
    [doseId],
  );
  if (rows.length === 0) return false;
  await recomputeMedicineNextDue(rows[0].medicine_id, new Date());
  return true;
}

/** Edit the recorded "taken at" time of a dose, then recompute the schedule. */
export async function updateDoseTakenAt(
  doseId: number,
  takenAt: Date,
): Promise<boolean> {
  const rows = await query<DoseRow>(
    "update doses set taken_at = $2 where id = $1 returning medicine_id",
    [doseId, takenAt],
  );
  if (rows.length === 0) return false;
  await recomputeMedicineNextDue(rows[0].medicine_id, new Date());
  return true;
}

// ---------- doses (history / status) ----------

export async function listRecentDoses(
  limit = 50,
): Promise<DoseWithMedicine[]> {
  const rows = await query<DoseRow>(
    `select d.*, m.name as medicine_name
     from doses d join medicines m on m.id = d.medicine_id
     order by d.scheduled_at desc
     limit $1`,
    [limit],
  );
  return rows.map((r) => ({
    ...toDose(r),
    medicineName: r.medicine_name ?? "",
  }));
}

/** Latest dose per medicine, used to show "last taken" on the home screen. */
export async function latestDosePerMedicine(): Promise<Map<number, Dose>> {
  const rows = await query<DoseRow>(
    `select distinct on (medicine_id) *
     from doses
     order by medicine_id, scheduled_at desc`,
  );
  const map = new Map<number, Dose>();
  for (const r of rows) map.set(r.medicine_id, toDose(r));
  return map;
}

/** All outstanding (un-taken) due doses, oldest first, with medicine name. */
export async function getOutstandingDueDoses(): Promise<DoseWithMedicine[]> {
  const rows = await query<DoseRow>(
    `select d.*, m.name as medicine_name
     from doses d join medicines m on m.id = d.medicine_id
     where d.status = 'due' and m.active = true and d.scheduled_at <= now()
     order by d.medicine_id, d.scheduled_at asc`,
  );
  return rows.map((r) => ({ ...toDose(r), medicineName: r.medicine_name ?? "" }));
}

// ---------- debug / demo seeding ----------

const DEMO_PREFIX = "[DEMO]";

export async function clearDemoData(): Promise<void> {
  await query("delete from medicines where name like $1", [`${DEMO_PREFIX}%`]);
}

/** Seed one "yellow" medicine (1 overdue dose) and one "red" (2 overdue doses). */
export async function createDemoData(now: Date): Promise<void> {
  await clearDemoData();
  const HOUR = 3_600_000;

  // Yellow: a single overdue dose.
  const yellow = await query<MedicineRow>(
    `insert into medicines (name, type, interval_hours, start_at, end_at, next_due_at, active)
     values ($1, 'interval', 12, $2, null, $3, true) returning *`,
    [
      `${DEMO_PREFIX} Yellow (1 due)`,
      new Date(now.getTime() - HOUR),
      new Date(now.getTime() + 11 * HOUR),
    ],
  );
  await query(
    "insert into doses (medicine_id, scheduled_at, status, source) values ($1, $2, 'due', 'scheduled')",
    [yellow[0].id, new Date(now.getTime() - HOUR)],
  );

  // Red: two overdue doses (oldest renders red, newer yellow).
  const red = await query<MedicineRow>(
    `insert into medicines (name, type, interval_hours, start_at, end_at, next_due_at, active)
     values ($1, 'interval', 12, $2, null, $3, true) returning *`,
    [
      `${DEMO_PREFIX} Red (2 due)`,
      new Date(now.getTime() - 13 * HOUR),
      new Date(now.getTime() + 11 * HOUR),
    ],
  );
  await query(
    `insert into doses (medicine_id, scheduled_at, status, source) values
       ($1, $2, 'due', 'scheduled'),
       ($1, $3, 'due', 'scheduled')`,
    [
      red[0].id,
      new Date(now.getTime() - 13 * HOUR),
      new Date(now.getTime() - HOUR),
    ],
  );
}

// ---------- push subscriptions ----------

export async function saveSubscription(
  sub: PushSubscriptionRecord,
): Promise<void> {
  await query(
    `insert into push_subscriptions (endpoint, p256dh, auth)
     values ($1, $2, $3)
     on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth`,
    [sub.endpoint, sub.p256dh, sub.auth],
  );
}
