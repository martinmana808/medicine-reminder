import { getTimezone, listRecentDoses } from "@/lib/repo";
import { fmtDateTime } from "@/lib/format";
import { DoseHistoryRow } from "@/components/DoseHistoryRow";

export const dynamic = "force-dynamic";
export const metadata = { title: "History" };

export default async function HistoryPage() {
  const [doses, tz] = await Promise.all([listRecentDoses(100), getTimezone()]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        History
      </h1>
      {doses.length === 0 ? (
        <p className="text-slate-500">No doses recorded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {doses.map((d) => (
            <DoseHistoryRow
              key={d.id}
              id={d.id}
              medicineName={d.medicineName}
              status={d.status}
              scheduledLabel={fmtDateTime(d.scheduledAt, tz)}
              takenLabel={d.takenAt ? fmtDateTime(d.takenAt, tz) : null}
              takenAtIso={(d.takenAt ?? d.scheduledAt).toISOString()}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
