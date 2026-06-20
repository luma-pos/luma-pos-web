import { getRestockSuggestions } from "@/lib/data/ai-restock";
import { requireMobileStockAccess } from "@/lib/mobile/auth";
import { mobileGate, mobileOk, numberParam } from "@/lib/mobile/response";

export async function GET(request: Request) {
  const gate = await requireMobileStockAccess();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  return mobileOk({
    rows: await getRestockSuggestions(numberParam(request, "days", 30)),
  });
}
