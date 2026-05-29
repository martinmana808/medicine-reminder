export type ScheduleType = "interval" | "daily";
export type DoseStatus = "due" | "taken" | "skipped";

export interface Medicine {
  id: number;
  name: string;
  type: ScheduleType;
  intervalHours: number | null;
  dailyTimes: string[] | null;
  startAt: Date;
  endAt: Date | null;
  nextDueAt: Date | null;
  active: boolean;
  createdAt: Date;
}

export interface Dose {
  id: number;
  medicineId: number;
  scheduledAt: Date;
  status: DoseStatus;
  takenAt: Date | null;
  createdAt: Date;
}

export interface DoseWithMedicine extends Dose {
  medicineName: string;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface CreateMedicineInput {
  name: string;
  type: ScheduleType;
  intervalHours: number | null;
  dailyTimes: string[] | null;
  startAt: Date;
  /** Course length in days; null = ongoing. */
  durationDays: number | null;
}
