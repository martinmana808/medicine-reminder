import { undoDose } from "@/lib/repo";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const ok = await undoDose(Number(id));
  if (!ok) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}
