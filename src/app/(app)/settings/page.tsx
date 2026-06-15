import { SettingsClient } from "./settings-client";
import { getStoreSettings, getStaff } from "@/lib/data/settings";
import { requireUser, getRole } from "@/lib/actions/common";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [store, staff] = await Promise.all([getStoreSettings(), getStaff()]);
  let canManage = false;
  try {
    const role = await getRole((await requireUser()).id);
    canManage = role === "owner" || role === "manager";
  } catch { /* layout handles auth */ }
  return <SettingsClient store={store} staff={staff} canManage={canManage} />;
}
