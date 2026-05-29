import { deleteDose, updateDoseTakenAt } from "@/lib/repo";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const ok = await deleteDose(Number(id));
  if (!ok) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const takenAt = body?.takenAt ? new Date(body.takenAt) : null;
  if (!takenAt || Number.isNaN(takenAt.getTime())) {
    return Response.json({ error: "invalid takenAt" }, { status: 400 });
  }
  const ok = await updateDoseTakenAt(Number(id), takenAt);
  if (!ok) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}
