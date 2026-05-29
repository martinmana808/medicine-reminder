import { getTimezone, listRecentDoses } from "@/lib/repo";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "History" };

const statusStyles: Record<string, string> = {
  taken: "text-teal-400",
  due: "text-amber-400",
  skipped: "text-slate-500",
};

export default async function HistoryPage() {
  const [doses, tz] = await Promise.all([listRecentDoses(100), getTimezone()]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">History</h1>
      {doses.length === 0 ? (
        <p className="text-slate-400">No doses recorded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/50">
          {doses.map((d) => (
            <li key={d.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{d.medicineName}</p>
                <p className="text-xs text-slate-500">
                  Scheduled {fmtDateTime(d.scheduledAt, tz)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-medium capitalize ${
                    statusStyles[d.status] ?? "text-slate-400"
                  }`}
                >
                  {d.status}
                </p>
                {d.takenAt && (
                  <p className="text-xs text-slate-500">
                    {fmtDateTime(d.takenAt, tz)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
