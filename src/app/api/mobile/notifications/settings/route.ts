import { updateStorePrefs } from "@/lib/actions/settings";
import { getStoreSettings } from "@/lib/data/settings";
import { requireMobileManager, requireMobileUser } from "@/lib/mobile/auth";
import {
  mobileAction,
  mobileGate,
  mobileOk,
  readJson,
} from "@/lib/mobile/response";

export async function GET() {
  const gate = await requireMobileUser();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const store = await getStoreSettings();
  return mobileOk(store.prefs.notifications);
}

export async function PATCH(request: Request) {
  const gate = await requireMobileManager();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const body = await readJson(request);
  if (!body) return mobileAction({ ok: false, error: "errors.invalidData" });

  return mobileAction(
    await updateStorePrefs({
      notifications: body as Parameters<typeof updateStorePrefs>[0]["notifications"],
    })
  );
}
