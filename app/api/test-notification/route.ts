import { sendToAll } from "@/lib/push";
import { getLanguage } from "@/lib/repo";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function POST() {
  const lang = await getLanguage();
  const result = await sendToAll({
    title: t(lang, "push.testTitle"),
    body: t(lang, "push.testBody"),
    url: "/",
  });
  return Response.json({ ok: true, ...result });
}
