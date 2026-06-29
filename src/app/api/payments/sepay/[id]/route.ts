import { requireMobileSalesAccess } from "@/lib/mobile/auth";
import { mobileAction, mobileGate } from "@/lib/mobile/response";
import { getSepayPaymentStatus } from "@/lib/payments/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireMobileSalesAccess();
  if (!gate.ok) return mobileGate(gate)!;

  const { id } = await params;
  return mobileAction(await getSepayPaymentStatus(id));
}
