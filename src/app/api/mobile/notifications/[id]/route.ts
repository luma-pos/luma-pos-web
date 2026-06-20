import { requireMobileUser } from "@/lib/mobile/auth";
import { mobileGate, mobileOk, readJson } from "@/lib/mobile/response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireMobileUser();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const { id } = await params;
  const body = await readJson(request);
  return mobileOk({
    id,
    applied: body ?? {},
  });
}
