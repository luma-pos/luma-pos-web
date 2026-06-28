import { requireMobileUser } from "@/lib/mobile/auth";
import { mobileError, mobileGate } from "@/lib/mobile/response";

export async function POST() {
  const gate = await requireMobileUser();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;
  return mobileError("ai.actions.unsupported", 410);
}
