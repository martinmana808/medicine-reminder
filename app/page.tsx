import Link from "next/link";
import {
  getOutstandingDueDoses,
  latestDosePerMedicine,
  listMedicines,
  getTimezone,
  getLanguage,
} from "@/lib/repo";
import {
  fmtClock,
  fmtDateTime,
  fmtRelative,
  scheduleSummary,
} from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";
import type { DoseWithMedicine } from "@/lib/types";
import { DueDoseActions } from "@/components/DueDoseActions";
import { TakeNowControl } from "@/components/TakeNowControl";

export const dynamic = "force-dynamic";

type DueCard = { dose: DoseWithMedicine; color: "red" | "yellow"; behind: number };

function renderNames(names: string[], lang: Lang) {
  const sep = (last: boolean) => (last ? t(lang, "common.and") : t(lang, "common.comma"));
  return names.map((n, i) => (
    <span key={i}>
      {i > 0 && (
        <span className="text-slate-400">{sep(i === names.length - 1)}</span>
      )}
      {n}
    </span>
  ));
}

export default async function Home() {
  const [meds, outstanding, latest, tz, lang] = await Promise.all([
    listMedicines(),
    getOutstandingDueDoses(),
    latestDosePerMedicine(),
    getTimezone(),
    getLanguage(),
  ]);
  const now = new Date();

  const byMed = new Map<number, DoseWithMedicine[]>();
  for (const d of outstanding) {
    const arr = byMed.get(d.medicineId) ?? [];
    arr.push(d);
    byMed.set(d.medicineId, arr);
  }

  const dueCards: DueCard[] = [];
  for (const list of byMed.values()) {
    list.forEach((dose, i) => {
      const color = list.length >= 2 && i === 0 ? "red" : "yellow";
      dueCards.push({ dose, color, behind: list.length });
    });
  }
  dueCards.sort((a, b) => {
    if (a.color !== b.color) return a.color === "red" ? -1 : 1;
    return a.dose.scheduledAt.getTime() - b.dose.scheduledAt.getTime();
  });

  const dueMedIds = new Set(byMed.keys());
  const calmMeds = meds.filter((m) => m.active && !dueMedIds.has(m.id));
  const finished = meds.filter((m) => !m.active);

  const upcoming = meds
    .filter((m) => m.active && m.nextDueAt)
    .map((m) => ({ m, minute: Math.floor(m.nextDueAt!.getTime() / 60000) }));
  let nextTake: { names: string[]; when: Date } | null = null;
  if (upcoming.length > 0) {
    const minMinute = Math.min(...upcoming.map((u) => u.minute));
    const group = upcoming.filter((u) => u.minute === minMinute);
    nextTake = {
      names: group.map((u) => u.m.name),
      when: group[0].m.nextDueAt!,
    };
  }

  if (meds.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-6xl mb-4">💊</p>
        <h1 className="text-xl font-semibold mb-2 text-slate-900">
          {t(lang, "today.empty.title")}
        </h1>
        <p className="text-slate-500 mb-6">{t(lang, "today.empty.body")}</p>
        <Link
          href="/add"
          className="inline-block rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          {t(lang, "today.empty.cta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-36">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t(lang, "today.title")}
        </h1>
        <Link
          href="/add"
          className="rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          {t(lang, "today.add")}
        </Link>
      </div>

      {/* Due / overdue — attention */}
      {dueCards.length > 0 && (
        <ul className="space-y-3">
          {dueCards.map(({ dose, color, behind }) => {
            const card =
              color === "red"
                ? "border-red-300 bg-red-50"
                : "border-amber-300 bg-amber-50";
            const accent = color === "red" ? "text-red-700" : "text-amber-700";
            const label =
              color === "red"
                ? t(lang, "today.dosesBehind", { n: behind })
                : behind >= 2
                  ? t(lang, "today.alsoDue")
                  : t(lang, "today.dueNow");
            return (
              <li
                key={dose.id}
                className={`rounded-2xl border p-4 shadow-sm ${card}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      color === "red" ? "bg-red-500" : "bg-amber-500"
                    }`}
                    aria-hidden
                  />
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${accent}`}
                  >
                    {label}
                  </p>
                </div>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {dose.medicineName}
                </p>
                <p className="text-sm text-slate-500">
                  {t(lang, "today.wasDue", {
                    date: fmtDateTime(dose.scheduledAt, tz, lang),
                    rel: fmtRelative(dose.scheduledAt, now, lang),
                  })}
                </p>
                <div className="mt-3">
                  <DueDoseActions doseId={dose.id} color={color} lang={lang} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Caught up — calm / resting */}
      {calmMeds.length > 0 && (
        <ul className="space-y-3">
          {calmMeds.map((m) => {
            const dose = latest.get(m.id);
            return (
              <li
                key={m.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {m.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {scheduleSummary(m, lang)}
                    </p>
                  </div>
                  <Link
                    href={`/edit/${m.id}`}
                    className="text-sm font-medium text-slate-400 hover:text-teal-600"
                  >
                    {t(lang, "common.edit")}
                  </Link>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400" aria-hidden />
                  <p className="text-sm text-slate-600">
                    {t(lang, "today.next", {
                      date: fmtDateTime(m.nextDueAt, tz, lang),
                      rel: fmtRelative(m.nextDueAt, now, lang),
                    })}
                  </p>
                </div>
                {dose?.status === "taken" && dose.takenAt && (
                  <p className="mt-0.5 pl-4 text-xs text-slate-400">
                    {t(lang, "today.lastTaken", {
                      date: fmtDateTime(dose.takenAt, tz, lang),
                    })}
                  </p>
                )}

                <div className="mt-3">
                  <TakeNowControl medicineId={m.id} lang={lang} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {finished.length > 0 && (
        <div>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t(lang, "today.completed")}
          </h2>
          <ul className="space-y-2">
            {finished.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
              >
                <div>
                  <p className="font-medium text-slate-700">{m.name}</p>
                  <p className="text-xs text-slate-400">
                    {scheduleSummary(m, lang)} · {t(lang, "today.courseFinished")}
                  </p>
                </div>
                <Link
                  href={`/edit/${m.id}`}
                  className="text-sm font-medium text-slate-400 hover:text-teal-600"
                >
                  {t(lang, "common.edit")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nextTake && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white px-4 pt-3.5 pb-[max(0.9rem,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(15,23,42,0.12)]">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                  {t(lang, "nextTake.label")}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {fmtClock(nextTake.when, tz, now, lang)}
                </span>
                <span className="text-sm font-medium text-slate-400">
                  · {fmtRelative(nextTake.when, now, lang)}
                </span>
              </div>
              <p className="mt-0.5 text-[15px] font-semibold text-slate-700 break-words">
                {renderNames(nextTake.names, lang)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
