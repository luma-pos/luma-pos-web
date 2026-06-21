"use server";

import { revalidatePath } from "next/cache";
import {
  type CreateOrderInput, type AddPaymentInput,
} from "@/lib/schemas/order";
import {
  type ActionResult, requireSalesAccess, requireManager,
} from "./common";
import { Routes } from "@/lib/routes";
import { createOrderForUser } from "@/lib/orders/create";
import { addPaymentForUser } from "@/lib/orders/payment";
import { convertQuoteToOrderForUser } from "@/lib/orders/convert";
import { cancelOrderForUser, cancelQuoteForUser } from "@/lib/orders/cancel";

export async function createOrder(
  input: CreateOrderInput
): Promise<ActionResult<{ id: string; code: string }>> {
  const gate = await requireSalesAccess();
  if (!gate.ok) return gate;
  // Lõi tách riêng. Xem src/lib/orders/create.ts.
  return createOrderForUser(gate.userId, input);
}

export async function addPayment(input: AddPaymentInput): Promise<ActionResult> {
  const gate = await requireSalesAccess();
  if (!gate.ok) return gate;
  // Lõi tách riêng. Xem src/lib/orders/payment.ts.
  return addPaymentForUser(gate.userId, input);
}

/** Chốt báo giá thành đơn: trừ kho + ghi nợ. Thu tiền sau qua addPayment. */
export async function convertQuoteToOrder(quoteId: string): Promise<ActionResult<{ code: string }>> {
  const gate = await requireSalesAccess();
  if (!gate.ok) return gate;
  // Lõi tách riêng. Xem src/lib/orders/convert.ts.
  const result = await convertQuoteToOrderForUser(gate.userId, quoteId);
  if (result.ok) {
    revalidatePath(Routes.Orders);
    revalidatePath(Routes.Quotes);
    revalidatePath(Routes.order(quoteId));
  }
  return result;
}

/** Hủy báo giá (không ảnh hưởng kho/nợ). */
export async function cancelQuote(quoteId: string): Promise<ActionResult> {
  const gate = await requireSalesAccess();
  if (!gate.ok) return gate;
  const result = await cancelQuoteForUser(gate.userId, quoteId);
  if (result.ok) {
    revalidatePath(Routes.Quotes);
  }
  return result;
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const gate = await requireManager();
  if (!gate.ok) return gate;
  const result = await cancelOrderForUser(gate.userId, orderId);
  if (result.ok) {
    revalidatePath(Routes.Orders);
    revalidatePath(Routes.order(orderId));
  }
  return result;
}
