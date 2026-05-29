import { saveSubscription } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sub = await req.json().catch(() => null);
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return Response.json({ error: "invalid subscription" }, { status: 400 });
  }
  await saveSubscription({ endpoint, p256dh, auth });
  return Response.json({ ok: true });
}
