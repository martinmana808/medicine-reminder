import { getTimezone, setTimezone } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ timezone: await getTimezone() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const tz = body?.timezone;
  if (typeof tz !== "string" || !tz) {
    return Response.json({ error: "invalid timezone" }, { status: 400 });
  }
  try {
    // Validate the timezone is real.
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    return Response.json({ error: "unknown timezone" }, { status: 400 });
  }
  await setTimezone(tz);
  return Response.json({ ok: true, timezone: tz });
}
