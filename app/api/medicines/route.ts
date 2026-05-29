import { createMedicine, listMedicines } from "@/lib/repo";
import { medicineSchema, toCreateInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const meds = await listMedicines();
  return Response.json(meds);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = medicineSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const med = await createMedicine(toCreateInput(parsed.data));
  return Response.json(med, { status: 201 });
}
