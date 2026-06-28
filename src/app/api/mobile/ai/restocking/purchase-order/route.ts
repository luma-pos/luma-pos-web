import { createDraftPurchaseForUser } from "@/lib/purchases/draft";
import { requireAiProviderConfigured } from "@/lib/ai/config";
import { requireMobileStockAccess } from "@/lib/mobile/auth";
import { mobileAction, mobileGate, readJson } from "@/lib/mobile/response";

export async function POST(request: Request) {
  const gate = await requireMobileStockAccess();
  if (!gate.ok) return mobileGate(gate)!;
  const aiBlocked = await requireAiProviderConfigured();
  if (aiBlocked) return aiBlocked;

  const body = await readJson(request);
  if (!body) return mobileAction({ ok: false, error: "errors.invalidData" });

  return mobileAction(await createDraftPurchaseForUser(gate.userId, body));
}
