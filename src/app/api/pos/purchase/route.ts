import { NextResponse } from "next/server";
import { getUserIdFromBearer } from "@/lib/api/bearer";
import { createPurchaseForUser } from "@/lib/purchases/create";
import type { CreatePurchaseInput } from "@/lib/schemas/order";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await getUserIdFromBearer(req);
  if (!userId) return NextResponse.json({ ok: false, error: "errors.unauthorized" }, { status: 401 });
  let body: CreatePurchaseInput;
  try { body = (await req.json()) as CreatePurchaseInput; }
  catch { return NextResponse.json({ ok: false, error: "errors.invalidData" }, { status: 400 }); }
  const result = await createPurchaseForUser(userId, body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
