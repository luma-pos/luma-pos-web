import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { cashTransactions, profiles, shifts } from "@/db/schema";

export type Shift = typeof shifts.$inferSelect;

/** Ca đang mở của user (hoặc null). */
export async function getCurrentShift(userId: string): Promise<Shift | null> {
  const [row] = await db.select().from(shifts)
    .where(and(eq(shifts.userId, userId), eq(shifts.status, "open")))
    .orderBy(desc(shifts.openedAt)).limit(1);
  return row ?? null;
}

/** Tiền mặt dự kiến = quỹ đầu ca + (thu − chi) quỹ tiền mặt trong khoảng ca. */
export async function shiftExpectedCash(opening: number, openedAt: Date, closedAt?: Date | null): Promise<number> {
  const conds = [eq(cashTransactions.fund, "cash"), gte(cashTransactions.createdAt, openedAt)];
  if (closedAt) conds.push(lte(cashTransactions.createdAt, closedAt));
  const [agg] = await db
    .select({ net: sql<string>`coalesce(sum(case when ${cashTransactions.type} = 'in' then ${cashTransactions.amount} else -${cashTransactions.amount} end), 0)` })
    .from(cashTransactions)
    .where(and(...conds));
  return opening + Number(agg.net);
}

/** Lịch sử ca — mới nhất trước. */
export async function getShifts(limit = 50) {
  const u = alias(profiles, "shift_user");
  return db
    .select({
      id: shifts.id, code: shifts.code, openingFloat: shifts.openingFloat,
      openedAt: shifts.openedAt, closedAt: shifts.closedAt,
      expectedCash: shifts.expectedCash, countedCash: shifts.countedCash, variance: shifts.variance,
      status: shifts.status, userName: u.fullName,
    })
    .from(shifts)
    .leftJoin(u, eq(shifts.userId, u.id))
    .orderBy(desc(shifts.openedAt)).limit(limit);
}
export type ShiftRow = Awaited<ReturnType<typeof getShifts>>[number];
