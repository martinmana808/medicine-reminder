import Link from "next/link";
import { notFound } from "next/navigation";
import { getMedicine } from "@/lib/repo";
import { MedicineForm } from "@/components/MedicineForm";
import { DeleteButton } from "@/components/DeleteButton";
import { UndoLastTakeButton } from "@/components/UndoLastTakeButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit medicine" };

const DAY_MS = 86_400_000;

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const med = await getMedicine(Number(id));
  if (!med) notFound();

  const durationDays = med.endAt
    ? Math.max(1, Math.round((med.endAt.getTime() - med.startAt.getTime()) / DAY_MS))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-slate-700">
          ←
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit medicine
        </h1>
      </div>
      <MedicineForm
        initial={{
          id: med.id,
          name: med.name,
          type: med.type,
          intervalHours: med.intervalHours,
          dailyTimes: med.dailyTimes,
          startAtIso: med.startAt.toISOString(),
          durationDays,
        }}
      />

      <div className="border-t border-slate-200 pt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Corrections
        </p>
        <p className="mb-2 text-sm text-slate-500">
          Tapped &quot;Taken&quot; by accident? This reverts your most recent take
          and recalculates the next dose.
        </p>
        <UndoLastTakeButton medicineId={med.id} />
      </div>

      <div className="border-t border-slate-200 pt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Danger zone
        </p>
        <DeleteButton medicineId={med.id} />
      </div>
    </div>
  );
}
