import { NextResponse } from "next/server";
import { getUserIdFromBearer } from "@/lib/api/bearer";
import { createStocktakeForUser, type MobileStocktakeInput } from "@/lib/stocktakes/create";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await getUserIdFromBearer(req);
  if (!userId) return NextResponse.json({ ok: false, error: "errors.unauthorized" }, { status: 401 });
  let body: MobileStocktakeInput;
  try { body = (await req.json()) as MobileStocktakeInput; }
  catch { return NextResponse.json({ ok: false, error: "errors.invalidData" }, { status: 400 }); }
  const result = await createStocktakeForUser(userId, body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
