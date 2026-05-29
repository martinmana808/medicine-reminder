import Link from "next/link";
import { latestDosePerMedicine, listMedicines, getTimezone } from "@/lib/repo";
import { fmtDateTime, fmtRelative, scheduleSummary } from "@/lib/format";
import { TakeNowControl } from "@/components/TakeNowControl";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [meds, tz, latest] = await Promise.all([
    listMedicines(),
    getTimezone(),
    latestDosePerMedicine(),
  ]);
  const now = new Date();
  const active = meds.filter((m) => m.active);
  const finished = meds.filter((m) => !m.active);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Today</h1>
        <Link
          href="/add"
          className="rounded-md bg-teal-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-400"
        >
          + Add
        </Link>
      </div>

      <ul className="space-y-3">
        {active.map((m) => {
          const dose = latest.get(m.id);
          const isDue =
            dose?.status === "due" &&
            !!m.nextDueAt &&
            new Date(dose.scheduledAt) <= now;
          return (
            <li
              key={m.id}
              className={`rounded-xl border p-4 ${
                isDue
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-slate-800 bg-slate-900/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-sm text-slate-400">{scheduleSummary(m)}</p>
                </div>
                <Link
                  href={`/edit/${m.id}`}
                  className="text-xs text-slate-500 hover:text-teal-400"
                >
                  Edit
                </Link>
              </div>

              <div className="mt-3 text-sm">
                {isDue ? (
                  <span className="font-medium text-teal-300">Due now</span>
                ) : (
                  <span className="text-slate-400">
                    Next: {fmtDateTime(m.nextDueAt, tz)}{" "}
                    <span className="text-slate-500">
                      ({fmtRelative(m.nextDueAt, now)})
                    </span>
                  </span>
                )}
                {dose?.status === "taken" && dose.takenAt && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Last taken {fmtDateTime(dose.takenAt, tz)} (
                    {fmtRelative(dose.takenAt, now)})
                  </p>
                )}
              </div>

              <div className="mt-3">
                <TakeNowControl medicineId={m.id} />
              </div>

              <div className="mt-2 flex justify-end">
                <DeleteButton medicineId={m.id} />
              </div>
            </li>
          );
        })}
      </ul>

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
                <DeleteButton medicineId={m.id} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
