import { z } from "zod";
import type { CreateMedicineInput } from "./types";

export const medicineSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(120),
    type: z.enum(["interval", "daily"]),
    intervalHours: z.number().positive().max(168).nullable().optional(),
    dailyTimes: z
      .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM"))
      .nullable()
      .optional(),
    startAt: z.string().min(1),
    durationDays: z.number().int().positive().max(3650).nullable().optional(),
  })
  .refine(
    (v) => v.type !== "interval" || (v.intervalHours ?? 0) > 0,
    { message: "intervalHours is required for interval medicines", path: ["intervalHours"] },
  )
  .refine(
    (v) => v.type !== "daily" || (v.dailyTimes?.length ?? 0) > 0,
    { message: "dailyTimes is required for daily medicines", path: ["dailyTimes"] },
  );

export function toCreateInput(
  data: z.infer<typeof medicineSchema>,
): CreateMedicineInput {
  return {
    name: data.name.trim(),
    type: data.type,
    intervalHours: data.type === "interval" ? data.intervalHours ?? null : null,
    dailyTimes:
      data.type === "daily" ? (data.dailyTimes ?? []).slice().sort() : null,
    startAt: new Date(data.startAt),
    durationDays: data.durationDays ?? null,
  };
}
