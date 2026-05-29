import { takeMedicineAt } from "@/lib/repo";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const takenAt = body?.takenAt ? new Date(body.takenAt) : new Date();
  if (Number.isNaN(takenAt.getTime())) {
    return Response.json({ error: "invalid takenAt" }, { status: 400 });
  }
  const ok = await takeMedicineAt(Number(id), takenAt);
  if (!ok) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}
