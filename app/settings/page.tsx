import { getTimezone } from "@/lib/repo";
import { NotificationManager } from "@/components/NotificationManager";
import { TimezoneForm } from "@/components/TimezoneForm";
import { DebugDemo } from "@/components/DebugDemo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const tz = await getTimezone();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Settings
      </h1>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-slate-900">Notifications</h2>
        <p className="text-sm text-slate-500">
          Install this app to your home screen, then enable notifications so
          reminders arrive even when the app is closed.
        </p>
        <NotificationManager />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-slate-900">Timezone</h2>
        <p className="text-sm text-slate-500">
          Used to interpret daily times like &quot;08:00&quot;.
        </p>
        <TimezoneForm current={tz} />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Debug
        </h2>
        <p className="text-sm text-slate-500">
          Seed demo cards to preview the due states: one yellow (1 dose due) and
          one red (2 doses behind). Clear them when done.
        </p>
        <DebugDemo />
      </section>
    </div>
  );
}
