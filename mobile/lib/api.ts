import { supabase } from "./supabase";
import {
  createOrderSchema, addPaymentSchema, mobileProductSchema, createPurchaseSchema, mobileStocktakeSchema, createReturnSchema, updateOrderSchema,
  type CreateOrderInput, type AddPaymentInput, type MobileProductInput, type CreatePurchaseInput,
  type MobileStocktakeInput, type CreateReturnInput, type UpdateOrderInput,
} from "./schemas";

/**
 * Base URL của app WEB (Next.js) — nơi đặt API /api/pos/order.
 * Đặt trong .env: EXPO_PUBLIC_API_URL=https://<domain-web>.vercel.app
 * Dev cùng máy: http://<IP-LAN>:3000 (không dùng localhost vì điện thoại không thấy).
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

/** Sinh clientId để khử trùng đơn (gửi 2 lần cùng id → server trả về đơn cũ). */
export function makeClientId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export type CreateOrderResult =
  | { ok: true; data: { id: string; code: string } }
  | { ok: false; error: string; network?: boolean };

export type SimpleResult = { ok: true } | { ok: false; error: string; network?: boolean };

/** POST JSON kèm Bearer token; phân biệt lỗi MẠNG (network:true) với lỗi server/validate. */
async function postJson<T>(path: string, body: unknown): Promise<T | { ok: false; error: string; network?: boolean }> {
  if (!API_URL) return { ok: false, error: "Chưa cấu hình EXPO_PUBLIC_API_URL trong .env" };
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, error: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại" };

  let res: Response;
  try {
    res = await fetch(`${API_URL.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: "Không kết nối được máy chủ", network: true };
  }
  try {
    return (await res.json()) as T;
  } catch {
    return { ok: false, error: `Máy chủ trả lỗi ${res.status}` };
  }
}

/**
 * Tạo đơn qua API web (tái dùng đúng logic createOrder: tính tiền, trừ kho,
 * công nợ, idempotent clientId). Validate payload bằng zod (giống web) trước khi gửi.
 */
export async function createOrderViaApi(payload: CreateOrderInput): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu đơn không hợp lệ" };
  }
  return postJson<CreateOrderResult>("/api/pos/order", parsed.data);
}

/** Thu nợ / thu tiền theo đơn qua API web. */
export async function addPaymentViaApi(payload: AddPaymentInput): Promise<SimpleResult> {
  const parsed = addPaymentSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu thu tiền không hợp lệ" };
  }
  return postJson<SimpleResult>("/api/pos/payment", parsed.data);
}

export type IdResult = { ok: true; data: { id: string } } | { ok: false; error: string; network?: boolean };

/** Tạo/sửa sản phẩm qua API web. */
export async function createProductViaApi(payload: MobileProductInput): Promise<IdResult> {
  const p = mobileProductSchema.safeParse(payload);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Dữ liệu sản phẩm không hợp lệ" };
  return postJson<IdResult>("/api/pos/product", p.data);
}

/** Tạo phiếu nhập hàng qua API web. */
export async function createPurchaseViaApi(payload: CreatePurchaseInput): Promise<CreateOrderResult> {
  const p = createPurchaseSchema.safeParse(payload);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Dữ liệu nhập hàng không hợp lệ" };
  return postJson<CreateOrderResult>("/api/pos/purchase", p.data);
}

/** Tạo phiếu kiểm kho (cân bằng) qua API web. */
export async function createStocktakeViaApi(payload: MobileStocktakeInput): Promise<CreateOrderResult> {
  const p = mobileStocktakeSchema.safeParse(payload);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Dữ liệu kiểm kho không hợp lệ" };
  return postJson<CreateOrderResult>("/api/pos/stocktake", p.data);
}

/** Trả hàng theo đơn qua API web. */
export async function createReturnViaApi(payload: CreateReturnInput): Promise<CreateOrderResult> {
  const p = createReturnSchema.safeParse(payload);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Dữ liệu trả hàng không hợp lệ" };
  return postJson<CreateOrderResult>("/api/pos/return", p.data);
}

export type CodeResult = { ok: true; data: { code: string } } | { ok: false; error: string; network?: boolean };

/** Chốt báo giá thành đơn qua API web. */
export async function convertQuoteViaApi(quoteId: string): Promise<CodeResult> {
  return postJson<CodeResult>("/api/pos/quote", { quoteId });
}

/** Sửa đơn qua API web. */
export async function updateOrderViaApi(payload: UpdateOrderInput): Promise<SimpleResult> {
  const p = updateOrderSchema.safeParse(payload);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Dữ liệu sửa đơn không hợp lệ" };
  return postJson<SimpleResult>("/api/pos/order/edit", p.data);
}

/** Gộp nhiều đơn cùng khách qua API web. */
export async function mergeOrdersViaApi(orderIds: string[]): Promise<CodeResult> {
  return postJson<CodeResult>("/api/pos/order/merge", { orderIds });
}
