import { getLanguage, getTimezone } from "@/lib/repo";
import { t } from "@/lib/i18n";
import { NotificationManager } from "@/components/NotificationManager";
import { TimezoneForm } from "@/components/TimezoneForm";
import { LanguageForm } from "@/components/LanguageForm";
import { DebugDemo } from "@/components/DebugDemo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [tz, lang] = await Promise.all([getTimezone(), getLanguage()]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        {t(lang, "settings.title")}
      </h1>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-slate-900">
          {t(lang, "settings.language")}
        </h2>
        <p className="text-sm text-slate-500">{t(lang, "settings.languageBody")}</p>
        <LanguageForm current={lang} />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-slate-900">
          {t(lang, "settings.notifications")}
        </h2>
        <p className="text-sm text-slate-500">
          {t(lang, "settings.notificationsBody")}
        </p>
        <NotificationManager lang={lang} />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-slate-900">
          {t(lang, "settings.timezone")}
        </h2>
        <p className="text-sm text-slate-500">{t(lang, "settings.timezoneBody")}</p>
        <TimezoneForm current={tz} lang={lang} />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t(lang, "settings.debug")}
        </h2>
        <p className="text-sm text-slate-500">{t(lang, "settings.debugBody")}</p>
        <DebugDemo lang={lang} />
      </section>
    </div>
  );
}
