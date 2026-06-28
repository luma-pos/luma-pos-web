import { updateAiSettings } from "@/lib/actions/settings";
import { getStoreSettings } from "@/lib/data/settings";
import { requireMobileOwner, requireMobileUser } from "@/lib/mobile/auth";
import { mobileAction, mobileGate, mobileOk, readJson } from "@/lib/mobile/response";

export async function GET() {
  const gate = await requireMobileUser();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;
  const settings = await getStoreSettings();
  return mobileOk(settings.prefs.ai);
}

export async function PATCH(request: Request) {
  const gate = await requireMobileOwner();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;
  const body = await readJson(request);
  return mobileAction(await updateAiSettings(body));
}
