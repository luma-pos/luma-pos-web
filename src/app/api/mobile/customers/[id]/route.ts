import { updateCustomer } from "@/lib/actions/partners";
import { getCustomer } from "@/lib/data/partners";
import { requireMobileSalesAccess } from "@/lib/mobile/auth";
import {
  mobileAction,
  mobileError,
  mobileGate,
  mobileOk,
  readJson,
} from "@/lib/mobile/response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireMobileSalesAccess();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) return mobileError("errors.notFound", 404);
  return mobileOk(customer);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireMobileSalesAccess();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const { id } = await params;
  const body = await readJson(request);
  if (!body || typeof body !== "object") {
    return mobileAction({ ok: false, error: "errors.invalidData" });
  }

  return mobileAction(
    await updateCustomer({
      ...(body as Record<string, unknown>),
      id,
    } as Parameters<typeof updateCustomer>[0])
  );
}
