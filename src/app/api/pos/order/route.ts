import { NextResponse } from "next/server";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { createOrderForUser } from "@/lib/orders/create";
import type { CreateOrderOutput } from "@/lib/schemas/order";

/**
 * API tạo đơn cho client ngoài web (app mobile Expo).
 * Auth: header `Authorization: Bearer <access_token Supabase>`.
 * Server tự xác thực token → lấy userId → gọi lõi createOrderForUser
 * (tái dùng đúng logic giao dịch + idempotent clientId của web).
 *
 * Toàn bộ tính tiền/trừ kho/công nợ chạy server-side; client chỉ gửi giỏ + clientId.
 */
export const runtime = "nodejs";

// Client chỉ để verify token (anon key, không giữ phiên).
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
  if (!token) {
    return NextResponse.json({ ok: false, error: "errors.unauthorized" }, { status: 401 });
  }

  const { data, error } = await tokenClient().auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "errors.unauthorized" }, { status: 401 });
  }

  let body: CreateOrderOutput;
  try {
    body = (await req.json()) as CreateOrderOutput;
  } catch {
    return NextResponse.json({ ok: false, error: "errors.invalidData" }, { status: 400 });
  }

  const result = await createOrderForUser(data.user.id, body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
