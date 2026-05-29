import { sendToAll } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await sendToAll({
    title: "Test notification 🎉",
    body: "Your medicine reminders are working.",
    url: "/",
  });
  return Response.json({ ok: true, ...result });
}
