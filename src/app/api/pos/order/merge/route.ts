import { NextResponse } from "next/server";
import { getUserIdFromBearer } from "@/lib/api/bearer";
import { mergeOrdersForUser } from "@/lib/orders/edit";

/** API gộp đơn cho mobile (Bearer token). Body: { orderIds: string[] }. */
export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await getUserIdFromBearer(req);
  if (!userId) return NextResponse.json({ ok: false, error: "errors.unauthorized" }, { status: 401 });

  let body: { orderIds?: string[] };
  try {
    body = (await req.json()) as { orderIds?: string[] };
  } catch {
    return NextResponse.json({ ok: false, error: "errors.invalidData" }, { status: 400 });
  }
  if (!Array.isArray(body.orderIds)) {
    return NextResponse.json({ ok: false, error: "errors.invalidData" }, { status: 400 });
  }

  const result = await mergeOrdersForUser(userId, body.orderIds);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
