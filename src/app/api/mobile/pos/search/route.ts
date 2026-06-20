import { searchPosProductRows } from "@/lib/data/pos";
import { requireMobileSalesAccess } from "@/lib/mobile/auth";
import { mobileGate, mobileOk, searchParam } from "@/lib/mobile/response";

export async function GET(request: Request) {
  const gate = await requireMobileSalesAccess();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const query = searchParam(request, "q", "") ?? "";
  return mobileOk(await searchPosProductRows(query));
}
