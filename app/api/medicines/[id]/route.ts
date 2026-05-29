import { deleteMedicine, getMedicine, updateMedicine } from "@/lib/repo";
import { medicineSchema, toCreateInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const med = await getMedicine(Number(id));
  if (!med) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(med);
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = medicineSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const med = await updateMedicine(Number(id), toCreateInput(parsed.data));
  if (!med) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(med);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await deleteMedicine(Number(id));
  return Response.json({ ok: true });
}
