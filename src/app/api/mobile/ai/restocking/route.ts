import { getRestockSuggestions } from "@/lib/data/ai-restock";
import { requireAiProviderConfigured } from "@/lib/ai/config";
import { requireMobileStockAccess } from "@/lib/mobile/auth";
import { mobileGate, mobileOk, numberParam } from "@/lib/mobile/response";

export async function GET(request: Request) {
  const gate = await requireMobileStockAccess();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;
  const aiBlocked = await requireAiProviderConfigured();
  if (aiBlocked) return aiBlocked;

  return mobileOk({
    rows: await getRestockSuggestions(numberParam(request, "days", 30)),
  });
}
