import {
  setStaffActive,
  updateStaffRole,
} from "@/lib/actions/settings";
import { getStaff } from "@/lib/data/settings";
import { requireMobileManager } from "@/lib/mobile/auth";
import {
  mobileAction,
  mobileGate,
  mobileOk,
  readJson,
} from "@/lib/mobile/response";
import type { StaffRole } from "@/lib/schemas/settings";

export async function GET() {
  const gate = await requireMobileManager();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  return mobileOk(await getStaff());
}

export async function PATCH(request: Request) {
  const gate = await requireMobileManager();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const body = await readJson(request);
  if (!body || typeof body !== "object") {
    return mobileAction({ ok: false, error: "errors.invalidData" });
  }

  const payload = body as { id?: unknown; role?: unknown; active?: unknown };
  if (typeof payload.id !== "string") {
    return mobileAction({ ok: false, error: "errors.invalidData" });
  }

  if (typeof payload.role === "string") {
    const result = await updateStaffRole(payload.id, payload.role as StaffRole);
    if (!result.ok) return mobileAction(result);
  }

  if (typeof payload.active === "boolean") {
    const result = await setStaffActive(payload.id, payload.active);
    if (!result.ok) return mobileAction(result);
  }

  return mobileOk({ id: payload.id });
}
