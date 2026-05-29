import { getTimezone } from "@/lib/repo";
import { NotificationManager } from "@/components/NotificationManager";
import { TimezoneForm } from "@/components/TimezoneForm";
import { DebugDemo } from "@/components/DebugDemo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const tz = await getTimezone();

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="space-y-3">
        <h2 className="font-medium">Notifications</h2>
        <p className="text-sm text-slate-400">
          Install this app to your home screen, then enable notifications so
          reminders arrive even when the app is closed.
        </p>
        <NotificationManager />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Timezone</h2>
        <p className="text-sm text-slate-400">
          Used to interpret daily times like &quot;08:00&quot;.
        </p>
        <TimezoneForm current={tz} />
      </section>

      <section className="space-y-3 border-t border-slate-800 pt-6">
        <h2 className="font-medium text-slate-400">Debug</h2>
        <p className="text-sm text-slate-500">
          Seed demo cards to preview the due states: one yellow (1 dose due) and
          one red (2 doses behind). Clear them when done.
        </p>
        <DebugDemo />
      </section>
    </div>
  );
}
