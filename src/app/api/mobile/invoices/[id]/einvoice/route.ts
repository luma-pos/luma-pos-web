import { issueEInvoice } from "@/lib/actions/einvoice";
import { requireMobileManager } from "@/lib/mobile/auth";
import {
  mobileAction,
  mobileGate,
  readJson,
} from "@/lib/mobile/response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireMobileManager();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const { id } = await params;
  const body = await readJson(request);
  if (!body || typeof body !== "object") {
    return mobileAction({ ok: false, error: "errors.invalidData" });
  }

  return mobileAction(
    await issueEInvoice({
      ...(body as Record<string, unknown>),
      orderId: id,
    } as Parameters<typeof issueEInvoice>[0])
  );
}
