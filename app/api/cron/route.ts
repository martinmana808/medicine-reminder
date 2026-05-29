import { fireDose, getDueMedicines, getTimezone } from "@/lib/repo";
import { sendToAll } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const provided =
    url.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (process.env.CRON_SECRET && provided !== process.env.CRON_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tz = await getTimezone();
  const due = await getDueMedicines(now);

  let fired = 0;
  for (const med of due) {
    const { created, dose } = await fireDose(med, tz);
    if (created && dose) {
      await sendToAll({
        title: `Time for ${med.name}`,
        body: "Tap to mark this dose as taken.",
        doseId: dose.id,
        url: "/",
      });
      fired++;
    }
  }

  return Response.json({ ok: true, checked: due.length, fired });
}
