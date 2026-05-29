import { clearDemoData, createDemoData } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function POST() {
  await createDemoData(new Date());
  return Response.json({ ok: true, created: true });
}

export async function DELETE() {
  await clearDemoData();
  return Response.json({ ok: true, cleared: true });
}
