import { NextResponse } from "next/server";
import { getUserIdFromBearer } from "@/lib/api/bearer";
import { convertQuoteToOrderForUser } from "@/lib/orders/convert";

/**
 * API chốt báo giá thành đơn cho mobile.
 * Auth: header `Authorization: Bearer <access_token Supabase>`.
 * Body: { quoteId: string }. Tái dùng lõi convertQuoteToOrderForUser (logic web).
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await getUserIdFromBearer(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "errors.unauthorized" }, { status: 401 });
  }

  let body: { quoteId?: string };
  try {
    body = (await req.json()) as { quoteId?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "errors.invalidData" }, { status: 400 });
  }
  if (!body.quoteId) {
    return NextResponse.json({ ok: false, error: "errors.invalidData" }, { status: 400 });
  }

  const result = await convertQuoteToOrderForUser(userId, body.quoteId);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
