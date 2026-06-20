import { updateCustomerConsentCore } from "@/lib/customers/consent";
import { requireMobileSalesAccess } from "@/lib/mobile/auth";
import { mobileAction, mobileGate, readJson } from "@/lib/mobile/response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireMobileSalesAccess();
  if (!gate.ok) return mobileGate(gate)!;

  const { id } = await params;
  const body = await readJson(request);
  if (!body || typeof body !== "object") {
    return mobileAction({ ok: false, error: "errors.invalidData" });
  }

  return mobileAction(
    await updateCustomerConsentCore(id, body, gate.userId)
  );
}
