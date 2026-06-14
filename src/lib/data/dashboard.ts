import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, customers, orderItems, orders, products, stockLevels } from "@/db/schema";

export type DashboardRange = "today" | "7d" | "30d" | "month";

function rangeStart(range: DashboardRange): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === "7d") d.setDate(d.getDate() - 6);
  if (range === "30d") d.setDate(d.getDate() - 29);
  if (range === "month") d.setDate(1);
  return d;
}

export async function getDashboard(range: DashboardRange = "7d") {
  const since = rangeStart(range);
  // chỉ đơn bán thật: loại quote/merged/cancelled/draft
  const realSale = inArray(orders.status, ["completed", "returned"]);
  const inRange = and(realSale, gte(orders.createdAt, since));

  const [[agg], [profitAgg], [debtAgg], lowStock, recentOrders, topDebtors, revenueByDay] = await Promise.all([
    db.select({
      revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
      orderCount: sql<number>`count(*)::int`,
    }).from(orders).where(inRange),

    // lãi gộp = Σ(thành tiền − SL quy đổi × giá vốn hiện tại)
    db.select({
      profit: sql<string>`coalesce(sum(${orderItems.total} - (${orderItems.quantity} * ${orderItems.unitMultiplier} * ${products.costPrice})), 0)`,
    })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(inRange),

    db.select({
      totalDebt: sql<string>`coalesce(sum(${customers.currentDebt}), 0)`,
      debtors: sql<number>`count(*) filter (where ${customers.currentDebt} > 0)::int`,
    }).from(customers).where(eq(customers.isActive, true)),

    db.select({
      id: products.id,
      name: products.name,
      baseUnit: products.baseUnit,
      categoryName: categories.name,
      totalStock: sql<string>`coalesce(sum(${stockLevels.quantity}), 0)`,
      minLevel: sql<string>`coalesce(max(${stockLevels.minLevel}), 0)`,
    })
      .from(products)
      .leftJoin(stockLevels, eq(stockLevels.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isActive, true))
      .groupBy(products.id, categories.name)
      .having(sql`coalesce(sum(${stockLevels.quantity}), 0) <= coalesce(max(${stockLevels.minLevel}), 0) and coalesce(max(${stockLevels.minLevel}), 0) > 0`)
      .orderBy(sql`coalesce(sum(${stockLevels.quantity}), 0) / nullif(coalesce(max(${stockLevels.minLevel}), 0), 0)`)
      .limit(4),

    db.select({
      id: orders.id,
      code: orders.code,
      total: orders.total,
      amountPaid: orders.amountPaid,
      paymentStatus: orders.paymentStatus,
      status: orders.status,
      projectName: orders.projectName,
      createdAt: orders.createdAt,
      customerName: customers.name,
      customerType: customers.type,
    })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(realSale)
      .orderBy(desc(orders.createdAt))
      .limit(4),

    db.select({
      id: customers.id,
      name: customers.name,
      currentDebt: customers.currentDebt,
      debtLimit: customers.debtLimit,
    })
      .from(customers)
      .where(sql`${customers.currentDebt} > 0`)
      .orderBy(desc(customers.currentDebt))
      .limit(3),

    db.select({
      day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      dow: sql<number>`extract(isodow from ${orders.createdAt})::int`,
      revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
    })
      .from(orders)
      .where(inRange)
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`, sql`extract(isodow from ${orders.createdAt})`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`),
  ]);

  const revenue = Number(agg.revenue);
  const profit = Number(profitAgg.profit);

  return {
    range,
    revenue,
    orderCount: agg.orderCount,
    avgOrder: agg.orderCount > 0 ? revenue / agg.orderCount : 0,
    grossProfit: profit,
    marginPct: revenue > 0 ? (profit / revenue) * 100 : 0,
    debt: { total: Number(debtAgg.totalDebt), debtors: debtAgg.debtors },
    lowStock,
    recentOrders,
    topDebtors,
    revenueByDay,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

export { categoryEmoji } from "@/lib/category-emoji";
