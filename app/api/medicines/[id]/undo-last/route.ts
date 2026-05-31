import { undoLastTake } from "@/lib/repo";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const undone = await undoLastTake(Number(id));
  return Response.json({ ok: true, undone });
}
