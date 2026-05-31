import { fireDose, getDueMedicines, getLanguage } from "@/lib/repo";
import { sendToAll } from "@/lib/push";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const provided =
    url.searchParams.get("secret") ??
    req.headers.get("x-cron-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (process.env.CRON_SECRET && provided !== process.env.CRON_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const lang = await getLanguage();
  const due = await getDueMedicines(now);

  let fired = 0;
  for (const med of due) {
    const { created, dose } = await fireDose(med, now);
    if (created && dose) {
      await sendToAll({
        title: t(lang, "push.timeFor", { name: med.name }),
        body: t(lang, "push.tapToMark"),
        doseId: dose.id,
        url: "/",
        takenLabel: t(lang, "push.taken"),
        snoozeLabel: t(lang, "push.snooze"),
      });
      fired++;
    }
  }

  return Response.json({ ok: true, checked: due.length, fired });
}
