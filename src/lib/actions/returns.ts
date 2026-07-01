"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  customers, orderItems, orders, returnItems, returns, stockLevels, stockMovements,
} from "@/db/schema";
import {
  createPosReturnSchema,
  createReturnSchema,
  type CreatePosReturnOutput,
  type CreateReturnOutput,
} from "@/lib/schemas/returns";
import { type ActionResult, requireManager, getProfileId, generateCode, toMoney, toQty } from "./common";
import { recordCashTx, fundForMethod } from "@/lib/cash";
import { Routes } from "@/lib/routes";
import { getCurrentShift } from "@/lib/data/shifts";
import { normalizeOrderItems, type NormalizedOrderItem } from "@/lib/orders/normalize";
import { accentInsensitiveLike } from "@/lib/search";

export type ReturnableOrderOption = {
  id: string;
  code: string;
  customerId: string | null;
  customerName: string | null;
  total: string;
  createdAt: Date;
};

export async function searchReturnableOrders(q: string): Promise<ReturnableOrderOption[]> {
  const gate = await requireManager();
  if (!gate.ok) return [];
  const query = q.trim();
  if (!query) return [];
  return db
    .select({
      id: orders.id,
      code: orders.code,
      customerId: orders.customerId,
      customerName: customers.name,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(and(
      eq(orders.status, "completed"),
      or(
        accentInsensitiveLike(orders.code, query),
        accentInsensitiveLike(customers.name, query),
        accentInsensitiveLike(customers.phone, query),
      ),
    ))
    .orderBy(desc(orders.createdAt))
    .limit(12);
}

/**
 * Trả hàng theo hóa đơn:
 * - SL trả ≤ SL mua − đã trả trước đó (check trong transaction)
 * - restock=true → cộng lại kho + movement 'return_in'
 * - refundMethod=debt_deduct → trừ công nợ khách; cash/CK chỉ ghi nhận chứng từ
 * - totalSpent của khách trừ theo giá trị trả
 */
export async function createReturn(
  input: CreateReturnOutput
): Promise<ActionResult<{ id: string; code: string }>> {
  const gate = await requireManager();
  if (!gate.ok) return gate;
  const userId = gate.userId;

  const parsed = createReturnSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.invalidData" };
  const v = parsed.data;

  try {
    const profileId = await getProfileId(userId);
    const currentShift = profileId ? await getCurrentShift(profileId) : null;

    const result = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, v.orderId)).limit(1);
      if (!order) throw new Error("ORDER_NOT_FOUND");
      // chỉ trả hàng trên đơn bán thật (không quote/merged/cancelled/draft)
      if (order.status !== "completed" && order.status !== "returned") throw new Error("ORDER_CANCELLED");

      const itemIds = v.items.map((i) => i.orderItemId);
      const sourceItems = await tx.select().from(orderItems).where(inArray(orderItems.id, itemIds));
      const sourceById = new Map(sourceItems.map((i) => [i.id, i]));

      // SL đã trả trước đó theo từng orderItem
      const prevReturned = await tx
        .select({
          orderItemId: returnItems.orderItemId,
          qty: sql<string>`coalesce(sum(${returnItems.quantity}), 0)`,
        })
        .from(returnItems)
        .where(inArray(returnItems.orderItemId, itemIds))
        .groupBy(returnItems.orderItemId);
      const prevByItem = new Map(prevReturned.map((r) => [r.orderItemId, Number(r.qty)]));

      let totalRefund = 0;
      const rows: (typeof returnItems.$inferInsert)[] = [];

      for (const i of v.items) {
        const src = sourceById.get(i.orderItemId);
        if (!src || src.orderId !== order.id) throw new Error("ITEM_NOT_IN_ORDER");
        const maxReturnable = Number(src.quantity) - (prevByItem.get(i.orderItemId) ?? 0);
        if (i.quantity > maxReturnable + 1e-9) throw new Error("QTY_EXCEEDS");

        const lineRefund = i.quantity * Number(src.unitPrice);
        totalRefund += lineRefund;
        rows.push({
          returnId: "", // gán sau khi có id
          orderItemId: src.id,
          productId: src.productId,
          productName: src.productName,
          unitName: src.unitName,
          unitMultiplier: src.unitMultiplier,
          quantity: toQty(i.quantity),
          unitPrice: src.unitPrice,
          total: toMoney(lineRefund),
          restock: i.restock,
        });
      }

      // Trừ nợ không vượt quá nợ hiện tại của khách
      if (v.refundMethod === "debt_deduct") {
        if (!order.customerId) throw new Error("DEBT_NEEDS_CUSTOMER");
        const [cust] = await tx.select({ debt: customers.currentDebt }).from(customers).where(eq(customers.id, order.customerId)).limit(1);
        if (Number(cust.debt) < totalRefund - 1e-9) throw new Error("DEBT_TOO_SMALL");
      }

      const [ret] = await tx.insert(returns).values({
        code: generateCode("TH"),
        orderId: order.id,
        customerId: order.customerId,
        warehouseId: order.warehouseId,
        reason: v.reason,
        refundMethod: v.refundMethod,
        totalRefund: toMoney(totalRefund),
        note: v.note || null,
        createdBy: profileId,
      }).returning({ id: returns.id, code: returns.code });

      await tx.insert(returnItems).values(rows.map((r) => ({ ...r, returnId: ret.id })));

      // Hoàn kho cho hàng restock
      if (order.warehouseId) {
        for (const r of rows.filter((x) => x.restock)) {
          const baseQty = Number(r.quantity) * Number(r.unitMultiplier);
          await tx
            .insert(stockLevels)
            .values({ productId: r.productId, warehouseId: order.warehouseId, quantity: toQty(baseQty) })
            .onConflictDoUpdate({
              target: [stockLevels.productId, stockLevels.warehouseId],
              set: {
                quantity: sql`${stockLevels.quantity} + ${toQty(baseQty)}`,
                updatedAt: sql`now()`,
              },
            });
          await tx.insert(stockMovements).values({
            productId: r.productId,
            warehouseId: order.warehouseId,
            type: "return_in",
            quantity: toQty(baseQty),
            refType: "return",
            refId: ret.id,
            note: `${ret.code} ← ${order.code}`,
            createdBy: profileId,
          });
        }
      }

      // Hoàn tiền mặt/CK → ghi phiếu chi
      if (v.refundMethod !== "debt_deduct") {
        await recordCashTx(tx, {
          type: "out", fund: fundForMethod(v.refundMethod), amount: totalRefund,
          category: "refund", refType: "return", refId: ret.id,
          note: `Hoàn trả ${ret.code}`, createdBy: profileId, shiftId: currentShift?.id ?? null,
        });
      }

      // Điều chỉnh công nợ / tổng mua của khách
      if (order.customerId) {
        if (v.refundMethod === "debt_deduct") {
          await tx.update(customers).set({
            currentDebt: sql`greatest(${customers.currentDebt} - ${toMoney(totalRefund)}, 0)`,
            totalSpent: sql`greatest(${customers.totalSpent} - ${toMoney(totalRefund)}, 0)`,
          }).where(eq(customers.id, order.customerId));
        } else {
          await tx.update(customers).set({
            totalSpent: sql`greatest(${customers.totalSpent} - ${toMoney(totalRefund)}, 0)`,
          }).where(eq(customers.id, order.customerId));
        }
      }

      // Đánh dấu đơn nếu trả toàn bộ
      const allItems = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const allReturned = await tx
        .select({
          orderItemId: returnItems.orderItemId,
          qty: sql<string>`coalesce(sum(${returnItems.quantity}), 0)`,
        })
        .from(returnItems)
        .innerJoin(orderItems, eq(returnItems.orderItemId, orderItems.id))
        .where(eq(orderItems.orderId, order.id))
        .groupBy(returnItems.orderItemId);
      const returnedByItem = new Map(allReturned.map((r) => [r.orderItemId, Number(r.qty)]));
      const fullyReturned = allItems.every(
        (i) => (returnedByItem.get(i.id) ?? 0) >= Number(i.quantity) - 1e-9
      );
      if (fullyReturned) {
        await tx.update(orders).set({ status: "returned", updatedAt: sql`now()` }).where(eq(orders.id, order.id));
      }

      return ret;
    });

    revalidatePath(Routes.order(v.orderId));
    revalidatePath(Routes.Orders);
    revalidatePath(Routes.Sales);
    revalidatePath(Routes.Inventory);
    revalidatePath(Routes.Customers);
    return { ok: true, data: result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const known: Record<string, string> = {
      ORDER_NOT_FOUND: "errors.invalidData",
      ORDER_CANCELLED: "returns.errors.orderCancelled",
      ITEM_NOT_IN_ORDER: "errors.invalidData",
      QTY_EXCEEDS: "returns.errors.qtyExceeds",
      DEBT_NEEDS_CUSTOMER: "returns.errors.debtNeedsCustomer",
      DEBT_TOO_SMALL: "returns.errors.debtTooSmall",
    };
    if (known[msg]) return { ok: false, error: known[msg] };
    console.error("createReturn failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}

export async function createPosReturn(
  input: CreatePosReturnOutput
): Promise<ActionResult<{ id: string; code: string }>> {
  const gate = await requireManager();
  if (!gate.ok) return gate;
  const parsed = createPosReturnSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.invalidData" };
  const v = parsed.data;

  try {
    const profileId = await getProfileId(gate.userId);
    const currentShift = profileId ? await getCurrentShift(profileId) : null;
    const trustedItems = await normalizeOrderItems(v.items, v.priceBookId);

    const result = await db.transaction(async (tx) => {
      const [order] = v.orderId
        ? await tx.select().from(orders).where(eq(orders.id, v.orderId)).limit(1)
        : [];
      if (v.orderId && !order) throw new Error("ORDER_NOT_FOUND");
      if (order && order.status !== "completed" && order.status !== "returned") throw new Error("ORDER_CANCELLED");

      const customerId = order?.customerId ?? v.customerId ?? null;
      const warehouseId = order?.warehouseId ?? v.warehouseId;
      const rows: (typeof returnItems.$inferInsert)[] = [];

      if (order) {
        const sourceItems = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        const sourceIds = sourceItems.map((item) => item.id);
        const prevReturned = sourceIds.length > 0
          ? await tx
              .select({
                orderItemId: returnItems.orderItemId,
                qty: sql<string>`coalesce(sum(${returnItems.quantity}), 0)`,
              })
              .from(returnItems)
              .where(inArray(returnItems.orderItemId, sourceIds))
              .groupBy(returnItems.orderItemId)
          : [];
        const prevByItem = new Map(prevReturned.map((r) => [r.orderItemId, Number(r.qty)]));

        trustedItems.forEach((item, index) => {
          let remainingQty = item.quantity;
          const matches = sourceItems.filter((source) => source.productId === item.productId && source.unitName === item.unitName);
          for (const source of matches) {
            if (remainingQty <= 1e-9) break;
            const returnable = Number(source.quantity) - (prevByItem.get(source.id) ?? 0);
            if (returnable <= 1e-9) continue;
            const qty = Math.min(returnable, remainingQty);
            rows.push(returnItemRowFromTrusted({
              item: {
                ...item,
                quantity: qty,
                unitPrice: Number(source.unitPrice),
                total: qty * Number(source.unitPrice),
              },
              orderItemId: source.id,
              restock: v.items[index]?.restock ?? true,
            }));
            remainingQty -= qty;
          }
          if (remainingQty > 1e-9) throw new Error("QTY_EXCEEDS");
        });
      } else {
        trustedItems.forEach((item, index) => {
          rows.push(returnItemRowFromTrusted({
            item,
            orderItemId: null,
            restock: v.items[index]?.restock ?? true,
          }));
        });
      }

      const totalRefund = rows.reduce((sum, item) => sum + Number(item.total), 0);
      if (v.refundMethod === "debt_deduct") {
        if (!customerId) throw new Error("DEBT_NEEDS_CUSTOMER");
        const [cust] = await tx.select({ debt: customers.currentDebt }).from(customers).where(eq(customers.id, customerId)).limit(1);
        if (!cust || Number(cust.debt) < totalRefund - 1e-9) throw new Error("DEBT_TOO_SMALL");
      }

      const [ret] = await tx.insert(returns).values({
        code: generateCode("TH"),
        orderId: order?.id ?? null,
        customerId,
        warehouseId,
        reason: v.reason,
        refundMethod: v.refundMethod,
        totalRefund: toMoney(totalRefund),
        note: v.note || null,
        createdBy: profileId,
      }).returning({ id: returns.id, code: returns.code });

      await tx.insert(returnItems).values(rows.map((r) => ({ ...r, returnId: ret.id })));

      for (const r of rows.filter((row) => row.restock)) {
        const baseQty = Number(r.quantity) * Number(r.unitMultiplier);
        await tx
          .insert(stockLevels)
          .values({ productId: r.productId, warehouseId, quantity: toQty(baseQty) })
          .onConflictDoUpdate({
            target: [stockLevels.productId, stockLevels.warehouseId],
            set: {
              quantity: sql`${stockLevels.quantity} + ${toQty(baseQty)}`,
              updatedAt: sql`now()`,
            },
          });
        await tx.insert(stockMovements).values({
          productId: r.productId,
          warehouseId,
          type: "return_in",
          quantity: toQty(baseQty),
          refType: "return",
          refId: ret.id,
          note: order ? `${ret.code} ← ${order.code}` : ret.code,
          createdBy: profileId,
        });
      }

      if (v.refundMethod !== "debt_deduct") {
        await recordCashTx(tx, {
          type: "out",
          fund: fundForMethod(v.refundMethod),
          amount: totalRefund,
          category: "refund",
          refType: "return",
          refId: ret.id,
          note: `Hoàn trả ${ret.code}`,
          createdBy: profileId,
          shiftId: currentShift?.id ?? null,
        });
      }

      if (customerId) {
        await tx.update(customers).set({
          currentDebt: v.refundMethod === "debt_deduct"
            ? sql`greatest(${customers.currentDebt} - ${toMoney(totalRefund)}, 0)`
            : customers.currentDebt,
          totalSpent: sql`greatest(${customers.totalSpent} - ${toMoney(totalRefund)}, 0)`,
        }).where(eq(customers.id, customerId));
      }

      if (order) {
        const allItems = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        const allReturned = await tx
          .select({
            orderItemId: returnItems.orderItemId,
            qty: sql<string>`coalesce(sum(${returnItems.quantity}), 0)`,
          })
          .from(returnItems)
          .innerJoin(orderItems, eq(returnItems.orderItemId, orderItems.id))
          .where(eq(orderItems.orderId, order.id))
          .groupBy(returnItems.orderItemId);
        const returnedByItem = new Map(allReturned.map((r) => [r.orderItemId, Number(r.qty)]));
        const fullyReturned = allItems.every(
          (i) => (returnedByItem.get(i.id) ?? 0) >= Number(i.quantity) - 1e-9
        );
        if (fullyReturned) {
          await tx.update(orders).set({ status: "returned", updatedAt: sql`now()` }).where(eq(orders.id, order.id));
        }
      }

      return ret;
    });

    revalidatePath(Routes.Sales);
    revalidatePath(Routes.Orders);
    if (v.orderId) revalidatePath(Routes.order(v.orderId));
    revalidatePath(Routes.Inventory);
    revalidatePath(Routes.Customers);
    return { ok: true, data: result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const known: Record<string, string> = {
      ORDER_NOT_FOUND: "errors.invalidData",
      ORDER_CANCELLED: "returns.errors.orderCancelled",
      QTY_EXCEEDS: "returns.errors.qtyExceeds",
      DEBT_NEEDS_CUSTOMER: "returns.errors.debtNeedsCustomer",
      DEBT_TOO_SMALL: "returns.errors.debtTooSmall",
    };
    if (known[msg]) return { ok: false, error: known[msg] };
    console.error("createPosReturn failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}

function returnItemRowFromTrusted({
  item,
  orderItemId,
  restock,
}: {
  item: NormalizedOrderItem;
  orderItemId: string | null;
  restock: boolean;
}): typeof returnItems.$inferInsert {
  return {
    returnId: "",
    orderItemId,
    productId: item.productId,
    productName: item.productName,
    unitName: item.unitName,
    unitMultiplier: toQty(item.unitMultiplier),
    quantity: toQty(item.quantity),
    unitPrice: toMoney(item.unitPrice),
    total: toMoney(item.total),
    restock,
  };
}
