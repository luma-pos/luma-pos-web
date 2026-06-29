import { SettingsClient } from "./settings-client";
import { getPaymentBankAccounts, getStoreSettings, getStaff } from "@/lib/data/settings";
import { requireUser, getRole } from "@/lib/actions/common";
import { getAiUsageStatus } from "@/lib/ai/usage";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [store, staff, aiUsage, bankAccounts] = await Promise.all([
    getStoreSettings(),
    getStaff(),
    getAiUsageStatus(),
    getPaymentBankAccounts(),
  ]);
  let canManage = false;
  let canEditAi = false;
  try {
    const role = await getRole((await requireUser()).id);
    canManage = role === "owner" || role === "manager";
    canEditAi = role === "owner";
  } catch { /* layout handles auth */ }
  return <SettingsClient store={store} staff={staff} canManage={canManage} canEditAi={canEditAi} aiUsage={aiUsage} bankAccounts={bankAccounts} />;
}
