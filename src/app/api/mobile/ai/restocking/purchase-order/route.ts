import { createDraftPurchaseForUser } from "@/lib/purchases/draft";
import { requireMobileStockAccess } from "@/lib/mobile/auth";
import { mobileAction, mobileGate, readJson } from "@/lib/mobile/response";

export async function POST(request: Request) {
  const gate = await requireMobileStockAccess();
  if (!gate.ok) return mobileGate(gate)!;

  const body = await readJson(request);
  if (!body) return mobileAction({ ok: false, error: "errors.invalidData" });

  return mobileAction(await createDraftPurchaseForUser(gate.userId, body));
}
