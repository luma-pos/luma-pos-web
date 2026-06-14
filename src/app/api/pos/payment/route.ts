import { NextResponse } from "next/server";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { addPaymentForUser } from "@/lib/orders/payment";
import type { AddPaymentInput } from "@/lib/schemas/order";

/**
 * API thu nợ / thu tiền theo đơn cho app mobile.
 * Auth: header `Authorization: Bearer <access_token Supabase>`.
 */
export const runtime = "nodejs";

function tokenClient() {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return NextResponse.json({ ok: false, error: "errors.unauthorized" }, { status: 401 });

  const { data, error } = await tokenClient().auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ ok: false, error: "errors.unauthorized" }, { status: 401 });

  let body: AddPaymentInput;
  try {
    body = (await req.json()) as AddPaymentInput;
  } catch {
    return NextResponse.json({ ok: false, error: "errors.invalidData" }, { status: 400 });
  }

  const result = await addPaymentForUser(data.user.id, body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
