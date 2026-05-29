import Link from "next/link";
import {
  getOutstandingDueDoses,
  latestDosePerMedicine,
  listMedicines,
  getTimezone,
} from "@/lib/repo";
import {
  fmtClock,
  fmtDateTime,
  fmtRelative,
  scheduleSummary,
} from "@/lib/format";
import type { DoseWithMedicine } from "@/lib/types";
import { DueDoseActions } from "@/components/DueDoseActions";
import { TakeNowControl } from "@/components/TakeNowControl";

export const dynamic = "force-dynamic";

type DueCard = { dose: DoseWithMedicine; color: "red" | "yellow"; behind: number };

function renderNames(names: string[]) {
  return names.map((n, i) => (
    <span key={i}>
      {i > 0 && (
        <span className="text-slate-400">
          {i === names.length - 1 ? " and " : ", "}
        </span>
      )}
      {n}
    </span>
  ));
}

export default async function Home() {
  const [meds, outstanding, latest, tz] = await Promise.all([
    listMedicines(),
    getOutstandingDueDoses(),
    latestDosePerMedicine(),
    getTimezone(),
  ]);
  const now = new Date();

  // Group outstanding due doses per medicine (already oldest-first from the query).
  const byMed = new Map<number, DoseWithMedicine[]>();
  for (const d of outstanding) {
    const arr = byMed.get(d.medicineId) ?? [];
    arr.push(d);
    byMed.set(d.medicineId, arr);
  }

  // One card per outstanding dose. Oldest of a 2+ backlog is red; rest yellow.
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

  // Soonest upcoming dose across active meds, grouping meds due at the same minute.
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
          No medicines yet
        </h1>
        <p className="text-slate-500 mb-6">
          Add your first medicine, then enable notifications in Settings.
        </p>
        <Link
          href="/add"
          className="inline-block rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          Add a medicine
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-28">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Today
        </h1>
        <Link
          href="/add"
          className="rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          + Add
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
            const accent =
              color === "red" ? "text-red-700" : "text-amber-700";
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
                  <p className={`text-xs font-semibold uppercase tracking-wide ${accent}`}>
                    {color === "red"
                      ? `${behind} doses behind`
                      : behind >= 2
                        ? "Also due"
                        : "Due now"}
                  </p>
                </div>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {dose.medicineName}
                </p>
                <p className="text-sm text-slate-500">
                  Was due {fmtDateTime(dose.scheduledAt, tz)} ·{" "}
                  {fmtRelative(dose.scheduledAt, now)}
                </p>
                <div className="mt-3">
                  <DueDoseActions doseId={dose.id} color={color} />
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
                    <p className="text-sm text-slate-500">{scheduleSummary(m)}</p>
                  </div>
                  <Link
                    href={`/edit/${m.id}`}
                    className="text-sm font-medium text-slate-400 hover:text-teal-600"
                  >
                    Edit
                  </Link>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400" aria-hidden />
                  <p className="text-sm text-slate-600">
                    Next{" "}
                    <span className="font-medium text-slate-900">
                      {fmtDateTime(m.nextDueAt, tz)}
                    </span>{" "}
                    <span className="text-slate-400">
                      · {fmtRelative(m.nextDueAt, now)}
                    </span>
                  </p>
                </div>
                {dose?.status === "taken" && dose.takenAt && (
                  <p className="mt-0.5 pl-4 text-xs text-slate-400">
                    Last taken {fmtDateTime(dose.takenAt, tz)}
                  </p>
                )}

                <div className="mt-3">
                  <TakeNowControl medicineId={m.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {finished.length > 0 && (
        <div>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Completed
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
                    {scheduleSummary(m)} · course finished
                  </p>
                </div>
                <Link
                  href={`/edit/${m.id}`}
                  className="text-sm font-medium text-slate-400 hover:text-teal-600"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nextTake && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-1px_8px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="mx-auto max-w-xl text-sm">
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span aria-hidden>⏰</span>
              <span className="font-medium text-slate-500">Next take:</span>
              <span className="font-semibold text-slate-900">
                {fmtClock(nextTake.when, tz, now)}
              </span>
              <span className="text-slate-400">
                · {fmtRelative(nextTake.when, now)}
              </span>
            </div>
            <p className="mt-0.5 pl-6 font-medium text-slate-900 break-words">
              {renderNames(nextTake.names)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
