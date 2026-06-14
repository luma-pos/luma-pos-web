import { and, count, desc, eq, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders, suppliers } from "@/db/schema";
import { accentInsensitiveLike } from "@/lib/search";
import { coercePageSize } from "@/lib/pagination";

export const PARTNERS_PAGE_SIZE = 20;

export async function getCustomers(filters: { q?: string; type?: string; owing?: boolean; page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const size = coercePageSize(filters.pageSize);
  const conditions: SQL[] = [eq(customers.isActive, true)];

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    const c = or(accentInsensitiveLike(customers.name, q), accentInsensitiveLike(customers.phone, q), accentInsensitiveLike(customers.code, q));
    if (c) conditions.push(c);
  }
  if (filters.type && ["retail", "wholesale", "contractor", "agent"].includes(filters.type)) {
    conditions.push(eq(customers.type, filters.type as "retail"));
  }
  if (filters.owing) {
    conditions.push(sql`${customers.currentDebt} > 0`);
  }
  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(customers).where(where)
      .orderBy(desc(customers.currentDebt), desc(customers.createdAt))
      .limit(size).offset((page - 1) * size),
    db.select({ total: count() }).from(customers).where(where),
  ]);

  const [debtAgg] = await db
    .select({ totalDebt: sql<string>`coalesce(sum(${customers.currentDebt}), 0)` })
    .from(customers)
    .where(eq(customers.isActive, true));

  return {
    rows, total, page, pageSize: size,
    pageCount: Math.max(1, Math.ceil(total / size)),
    totalDebt: Number(debtAgg.totalDebt),
  };
}

export async function getCustomer(id: string) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer) return null;

  const customerOrders = await db
    .select({
      id: orders.id,
      code: orders.code,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      projectName: orders.projectName,
      total: orders.total,
      amountPaid: orders.amountPaid,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  return { ...customer, orders: customerOrders };
}

export async function getSupplier(id: string) {
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  if (!supplier) return null;
  return supplier;
}

export async function getSupplierPurchases(id: string) {
  const { purchaseOrders, purchaseOrderItems } = await import("@/db/schema");
  return db
    .select({
      id: purchaseOrders.id,
      code: purchaseOrders.code,
      status: purchaseOrders.status,
      total: purchaseOrders.total,
      amountPaid: purchaseOrders.amountPaid,
      createdAt: purchaseOrders.createdAt,
      itemCount: sql<number>`(select count(*)::int from ${purchaseOrderItems} where ${purchaseOrderItems.purchaseOrderId} = ${purchaseOrders.id})`,
    })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.supplierId, id))
    .orderBy(desc(purchaseOrders.createdAt))
    .limit(50);
}
export type SupplierDetail = NonNullable<Awaited<ReturnType<typeof getSupplier>>>;

export async function getSuppliers(filters: { q?: string; owing?: "owing" | "clear"; page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const size = coercePageSize(filters.pageSize);
  const conditions: SQL[] = [];
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    const c = or(accentInsensitiveLike(suppliers.name, q), accentInsensitiveLike(suppliers.phone, q), accentInsensitiveLike(suppliers.code, q));
    if (c) conditions.push(c);
  }
  if (filters.owing === "owing") conditions.push(sql`${suppliers.currentDebt} > 0`);
  else if (filters.owing === "clear") conditions.push(sql`${suppliers.currentDebt} <= 0`);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(suppliers).where(where)
      .orderBy(desc(suppliers.currentDebt), desc(suppliers.createdAt))
      .limit(size).offset((page - 1) * size),
    db.select({ total: count() }).from(suppliers).where(where),
  ]);

  return { rows, total, page, pageSize: size, pageCount: Math.max(1, Math.ceil(total / size)) };
}

export type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;
