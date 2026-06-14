import { NextResponse } from "next/server";
import { getUserIdFromBearer } from "@/lib/api/bearer";
import { upsertProductForUser, type MobileProductInput } from "@/lib/products/write";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await getUserIdFromBearer(req);
  if (!userId) return NextResponse.json({ ok: false, error: "errors.unauthorized" }, { status: 401 });
  let body: MobileProductInput;
  try { body = (await req.json()) as MobileProductInput; }
  catch { return NextResponse.json({ ok: false, error: "errors.invalidData" }, { status: 400 }); }
  const result = await upsertProductForUser(userId, body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
