import { NextResponse } from "next/server";
import { getUserIdFromBearer } from "@/lib/api/bearer";
import { updateOrderForUser } from "@/lib/orders/edit";
import type { UpdateOrderOutput } from "@/lib/schemas/order";

/** API sửa đơn cho mobile (Bearer token). Lõi: updateOrderForUser. */
export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await getUserIdFromBearer(req);
  if (!userId) return NextResponse.json({ ok: false, error: "errors.unauthorized" }, { status: 401 });

  let body: UpdateOrderOutput;
  try {
    body = (await req.json()) as UpdateOrderOutput;
  } catch {
    return NextResponse.json({ ok: false, error: "errors.invalidData" }, { status: 400 });
  }

  const result = await updateOrderForUser(userId, body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
