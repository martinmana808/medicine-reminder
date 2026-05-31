import { getLanguage, getTimezone, setLanguage, setTimezone } from "@/lib/repo";
import { isLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    timezone: await getTimezone(),
    language: await getLanguage(),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (body?.language !== undefined) {
    if (!isLang(body.language)) {
      return Response.json({ error: "invalid language" }, { status: 400 });
    }
    await setLanguage(body.language);
    return Response.json({ ok: true, language: body.language });
  }

  const tz = body?.timezone;
  if (typeof tz !== "string" || !tz) {
    return Response.json({ error: "invalid timezone" }, { status: 400 });
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    return Response.json({ error: "unknown timezone" }, { status: 400 });
  }
  await setTimezone(tz);
  return Response.json({ ok: true, timezone: tz });
}
