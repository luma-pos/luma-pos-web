import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders, profiles, returnItems, returns, warehouses } from "@/db/schema";

/** Chi tiết phiếu trả hàng (cho trang in). */
export async function getReturn(id: string) {
  const [ret] = await db
    .select({
      id: returns.id,
      code: returns.code,
      reason: returns.reason,
      refundMethod: returns.refundMethod,
      totalRefund: returns.totalRefund,
      note: returns.note,
      createdAt: returns.createdAt,
      orderId: returns.orderId,
      orderCode: orders.code,
      customerName: customers.name,
      customerPhone: customers.phone,
      warehouseName: warehouses.name,
      createdByName: profiles.fullName,
    })
    .from(returns)
    .leftJoin(orders, eq(returns.orderId, orders.id)) // orderId nullable (trả nhanh)
    .leftJoin(customers, eq(returns.customerId, customers.id))
    .leftJoin(warehouses, eq(returns.warehouseId, warehouses.id))
    .leftJoin(profiles, eq(returns.createdBy, profiles.id))
    .where(eq(returns.id, id))
    .limit(1);
  if (!ret) return null;

  const items = await db.select().from(returnItems).where(eq(returnItems.returnId, id));
  return { ...ret, items };
}
