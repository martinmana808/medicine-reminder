import Link from "next/link";
import { notFound } from "next/navigation";
import { getLanguage, getMedicine } from "@/lib/repo";
import { t } from "@/lib/i18n";
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
  const [med, lang] = await Promise.all([
    getMedicine(Number(id)),
    getLanguage(),
  ]);
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
          {t(lang, "edit.title")}
        </h1>
      </div>
      <MedicineForm
        lang={lang}
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
          {t(lang, "edit.corrections")}
        </p>
        <p className="mb-2 text-sm text-slate-500">
          {t(lang, "edit.correctionsBody")}
        </p>
        <UndoLastTakeButton medicineId={med.id} lang={lang} />
      </div>

      <div className="border-t border-slate-200 pt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t(lang, "edit.dangerZone")}
        </p>
        <DeleteButton medicineId={med.id} lang={lang} />
      </div>
    </div>
  );
}
