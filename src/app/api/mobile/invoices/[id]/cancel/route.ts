import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { cancelOrderForUser, cancelQuoteForUser } from "@/lib/orders/cancel";
import {
  requireMobileManager,
  requireMobileSalesAccess,
} from "@/lib/mobile/auth";
import { mobileAction, mobileError, mobileGate } from "@/lib/mobile/response";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [order] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  if (!order) return mobileError("orders.errors.notFound", 404);

  if (order.status === "quote") {
    const gate = await requireMobileSalesAccess();
    if (!gate.ok) return mobileGate(gate)!;
    return mobileAction(await cancelQuoteForUser(gate.userId, id));
  }

  const gate = await requireMobileManager();
  if (!gate.ok) return mobileGate(gate)!;
  return mobileAction(await cancelOrderForUser(gate.userId, id));
}
