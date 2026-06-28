import { getAiUsageStatus } from "@/lib/ai/usage";
import { requireMobileUser } from "@/lib/mobile/auth";
import { mobileGate, mobileOk } from "@/lib/mobile/response";

export async function GET() {
  const gate = await requireMobileUser();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;
  return mobileOk(await getAiUsageStatus());
}
