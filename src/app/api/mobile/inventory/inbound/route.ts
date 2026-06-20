import { createPurchase } from "@/lib/actions/purchases";
import { requireMobileStockAccess } from "@/lib/mobile/auth";
import { mobileAction, mobileGate, readJson } from "@/lib/mobile/response";

export async function POST(request: Request) {
  const gate = await requireMobileStockAccess();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const body = await readJson(request);
  if (!body) return mobileAction({ ok: false, error: "errors.invalidData" });

  return mobileAction(
    await createPurchase(body as Parameters<typeof createPurchase>[0])
  );
}
