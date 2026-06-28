import { getAiUsageStatus } from "@/lib/ai/usage";
import { requireAiProviderConfigured } from "@/lib/ai/config";
import { requireMobileUser } from "@/lib/mobile/auth";
import { mobileGate, mobileOk } from "@/lib/mobile/response";

export async function GET() {
  const gate = await requireMobileUser();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;
  const aiBlocked = await requireAiProviderConfigured();
  if (aiBlocked) return aiBlocked;
  return mobileOk(await getAiUsageStatus());
}
