import { query } from "./db";
import {
  advanceAfterFire,
  firstDueAt,
  isCourseFinished,
  reanchorAfterTaken,
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
  const rows = await query<{ timezone: string }>(
    "select timezone from settings where id = 1",
  );
  return rows[0]?.timezone ?? "UTC";
}

export async function setTimezone(timezone: string): Promise<void> {
  await query(
    `insert into settings (id, timezone) values (1, $1)
     on conflict (id) do update set timezone = excluded.timezone`,
    [timezone],
  );
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
  const nextDue = firstDueAt(spec, input.startAt, tz);
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
  const nextDue = firstDueAt(spec, input.startAt, tz);
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
 * Fire the currently-due dose for a medicine: create the dose row (idempotent on
 * the unique scheduled_at), then advance next_due_at and deactivate if the course
 * has ended. Returns the created dose only when it was newly inserted (so the
 * caller knows whether to push).
 */
export async function fireDose(
  med: Medicine,
  tz: string,
): Promise<{ created: boolean; dose: Dose | null }> {
  if (!med.nextDueAt) return { created: false, dose: null };
  const scheduledAt = med.nextDueAt;

  const inserted = await query<DoseRow>(
    `insert into doses (medicine_id, scheduled_at, status)
     values ($1, $2, 'due')
     on conflict (medicine_id, scheduled_at) do nothing
     returning *`,
    [med.id, scheduledAt],
  );

  const newNextDue = advanceAfterFire(specOf(med), scheduledAt, tz);
  const finished = isCourseFinished(newNextDue, med.endAt);
  await query(
    "update medicines set next_due_at = $2, active = $3 where id = $1",
    [med.id, finished ? null : newNextDue, !finished],
  );

  return {
    created: inserted.length > 0,
    dose: inserted[0] ? toDose(inserted[0]) : null,
  };
}

export async function markTaken(
  doseId: number,
  takenAt: Date,
): Promise<boolean> {
  const doseRows = await query<DoseRow>(
    `update doses set status = 'taken', taken_at = $2
     where id = $1 and status <> 'taken'
     returning *`,
    [doseId, takenAt],
  );
  if (doseRows.length === 0) return false;
  const dose = toDose(doseRows[0]);

  const med = await getMedicine(dose.medicineId);
  if (!med) return true;

  if (med.type === "interval") {
    const newNextDue = reanchorAfterTaken(specOf(med), takenAt, med.nextDueAt);
    const finished = isCourseFinished(newNextDue, med.endAt);
    await query(
      "update medicines set next_due_at = $2, active = $3 where id = $1",
      [med.id, finished ? null : newNextDue, !finished],
    );
  }
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
 * Record that a medicine was taken at an arbitrary time and re-anchor its
 * schedule from that moment. Resolves the latest pending "due" dose if one
 * exists, otherwise logs a fresh "taken" dose. Interval meds get their next
 * dose set to takenAt + interval; daily meds advance to the next clock time.
 */
export async function takeMedicineAt(
  medicineId: number,
  takenAt: Date,
): Promise<boolean> {
  const med = await getMedicine(medicineId);
  if (!med) return false;
  const tz = await getTimezone();

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
    await query(
      `insert into doses (medicine_id, scheduled_at, status, taken_at)
       values ($1, $2, 'taken', $2)
       on conflict (medicine_id, scheduled_at)
       do update set status = 'taken', taken_at = excluded.taken_at`,
      [medicineId, takenAt],
    );
  }

  const newNextDue = advanceAfterFire(specOf(med), takenAt, tz);
  const finished = isCourseFinished(newNextDue, med.endAt);
  await query(
    "update medicines set next_due_at = $2, active = $3 where id = $1",
    [medicineId, finished ? null : newNextDue, !finished],
  );
  return true;
}

/**
 * Undo a taken dose: mark it pending again and reset the medicine's next dose
 * back to that dose's scheduled time (so it will remind again).
 */
export async function undoDose(doseId: number): Promise<boolean> {
  const doseRows = await query<DoseRow>("select * from doses where id = $1", [
    doseId,
  ]);
  if (doseRows.length === 0) return false;
  const dose = toDose(doseRows[0]);

  await query(
    "update doses set status = 'due', taken_at = null where id = $1",
    [doseId],
  );

  const med = await getMedicine(dose.medicineId);
  if (med) {
    const finished = isCourseFinished(dose.scheduledAt, med.endAt);
    await query(
      "update medicines set next_due_at = $2, active = $3 where id = $1",
      [med.id, finished ? null : dose.scheduledAt, !finished],
    );
  }
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

/** Latest dose per medicine, used to show "today's status" on the home screen. */
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
