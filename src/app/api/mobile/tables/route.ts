import { getTables } from "@/lib/data/tables";
import { requireMobileSalesAccess } from "@/lib/mobile/auth";
import { mobileGate, mobileOk } from "@/lib/mobile/response";

export async function GET() {
  const gate = await requireMobileSalesAccess();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  return mobileOk(await getTables());
}
