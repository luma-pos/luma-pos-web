import { NextResponse } from "next/server";
import { getUserIdFromBearer } from "@/lib/api/bearer";
import { createReturnForUser } from "@/lib/returns/create";
import type { CreateReturnInput } from "@/lib/schemas/returns";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await getUserIdFromBearer(req);
  if (!userId) return NextResponse.json({ ok: false, error: "errors.unauthorized" }, { status: 401 });
  let body: CreateReturnInput;
  try { body = (await req.json()) as CreateReturnInput; }
  catch { return NextResponse.json({ ok: false, error: "errors.invalidData" }, { status: 400 }); }
  const result = await createReturnForUser(userId, body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
