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
      <div className="text-center py-16">
        <p className="text-5xl mb-4">💊</p>
        <h1 className="text-xl font-semibold mb-2">No medicines yet</h1>
        <p className="text-slate-400 mb-6">
          Add your first medicine, then enable notifications in Settings.
        </p>
        <Link
          href="/add"
          className="inline-block rounded-md bg-teal-500 px-5 py-2.5 font-medium text-white hover:bg-teal-400"
        >
          Add a medicine
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Today</h1>
        <Link
          href="/add"
          className="rounded-md bg-teal-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-400"
        >
          + Add
        </Link>
      </div>

      {/* Due / overdue — alarming */}
      {dueCards.length > 0 && (
        <ul className="space-y-3">
          {dueCards.map(({ dose, color, behind }) => {
            const styles =
              color === "red"
                ? "border-red-500 bg-red-500/15"
                : "border-amber-400 bg-amber-400/10";
            const accent =
              color === "red" ? "text-red-300" : "text-amber-300";
            return (
              <li
                key={dose.id}
                className={`rounded-xl border-2 p-4 ${styles}`}
              >
                <div>
                  <p className="font-semibold">{dose.medicineName}</p>
                  <p className={`text-sm font-medium ${accent}`}>
                    {color === "red"
                      ? `${behind} doses behind`
                      : behind >= 2
                        ? "Also due"
                        : "Due now"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Was due {fmtDateTime(dose.scheduledAt, tz)} (
                    {fmtRelative(dose.scheduledAt, now)})
                  </p>
                </div>
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
                className="rounded-xl border border-sky-900/60 bg-sky-950/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-200">{m.name}</p>
                    <p className="text-sm text-slate-500">
                      {scheduleSummary(m)}
                    </p>
                  </div>
                  <Link
                    href={`/edit/${m.id}`}
                    className="text-xs text-slate-600 hover:text-teal-400"
                  >
                    Edit
                  </Link>
                </div>

                <p className="mt-2 text-sm text-sky-200/80">
                  Next: {fmtDateTime(m.nextDueAt, tz)}{" "}
                  <span className="text-slate-500">
                    ({fmtRelative(m.nextDueAt, now)})
                  </span>
                </p>
                {dose?.status === "taken" && dose.takenAt && (
                  <p className="text-xs text-slate-600">
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
          <h2 className="text-sm font-semibold text-slate-400 mb-2">
            Completed
          </h2>
          <ul className="space-y-2">
            {finished.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-slate-800 bg-slate-900/30 p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-slate-300">{m.name}</p>
                  <p className="text-xs text-slate-500">
                    {scheduleSummary(m)} · course finished
                  </p>
                </div>
                <Link
                  href={`/edit/${m.id}`}
                  className="text-xs text-slate-600 hover:text-teal-400"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nextTake && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800 bg-slate-900/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-xl text-sm">
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span aria-hidden>⏰</span>
              <span className="text-slate-400">Next take:</span>
              <span className="text-slate-200">
                {fmtClock(nextTake.when, tz, now)}
              </span>
              <span className="text-slate-500">
                · {fmtRelative(nextTake.when, now)}
              </span>
            </div>
            <p className="mt-0.5 pl-6 font-medium text-slate-100 break-words">
              {renderNames(nextTake.names)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
