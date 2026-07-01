import { SettingsClient } from "./settings-client";
import { PromotionsTab } from "../sales/tabs/promotions";
import { getStoreSettings } from "@/lib/data/settings";
import { requireUser, getRole } from "@/lib/actions/common";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const storePromise = getStoreSettings();
  const params = await searchParams;
  let canManage = false;
  let canEditAi = false;
  try {
    const role = await getRole((await requireUser()).id);
    canManage = role === "owner" || role === "manager";
    canEditAi = role === "owner";
  } catch { /* layout handles auth */ }
  const store = await storePromise;
  return (
    <SettingsClient
      store={store}
      canManage={canManage}
      canEditAi={canEditAi}
      initialTab={params.tab}
      promotionsContent={<PromotionsTab />}
    />
  );
}
