import { getOrders } from "@/lib/data/orders";
import type { OrderPaymentFilter, OrderStatusFilter } from "@/lib/data/orders";
import { createOrderForUser } from "@/lib/orders/create";
import { requireMobileSalesAccess } from "@/lib/mobile/auth";
import {
  mobileAction,
  mobileGate,
  mobileOk,
  numberParam,
  readJson,
  searchParam,
} from "@/lib/mobile/response";
import type { CreateOrderInput } from "@/lib/schemas/order";

export async function GET(request: Request) {
  const gate = await requireMobileSalesAccess();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  return mobileOk(
    await getOrders({
      q: searchParam(request, "q"),
      status: searchParam(request, "status") as OrderStatusFilter | undefined,
      payment: searchParam(request, "payment") as OrderPaymentFilter | undefined,
      from: searchParam(request, "from"),
      to: searchParam(request, "to"),
      page: numberParam(request, "page", 1),
      pageSize: numberParam(request, "pageSize", 20),
    })
  );
}

export async function POST(request: Request) {
  const gate = await requireMobileSalesAccess();
  if (!gate.ok) return mobileGate(gate)!;

  const body = (await readJson(request)) as CreateOrderInput | null;
  if (!body) return mobileAction({ ok: false, error: "errors.invalidData" });

  return mobileAction(await createOrderForUser(gate.userId, body));
}
