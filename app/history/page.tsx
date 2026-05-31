import { getLanguage, getTimezone, listRecentDoses } from "@/lib/repo";
import { fmtDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import { DoseHistoryRow } from "@/components/DoseHistoryRow";

export const dynamic = "force-dynamic";
export const metadata = { title: "History" };

export default async function HistoryPage() {
  const [doses, tz, lang] = await Promise.all([
    listRecentDoses(100),
    getTimezone(),
    getLanguage(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        {t(lang, "history.title")}
      </h1>
      {doses.length === 0 ? (
        <p className="text-slate-500">{t(lang, "history.empty")}</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {doses.map((d) => (
            <DoseHistoryRow
              key={d.id}
              id={d.id}
              medicineName={d.medicineName}
              status={d.status}
              lang={lang}
              scheduledLabel={fmtDateTime(d.scheduledAt, tz, lang)}
              takenLabel={d.takenAt ? fmtDateTime(d.takenAt, tz, lang) : null}
              takenAtIso={(d.takenAt ?? d.scheduledAt).toISOString()}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
