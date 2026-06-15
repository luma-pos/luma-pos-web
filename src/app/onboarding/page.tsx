import { redirect } from "next/navigation";
import { getStoreSettings } from "@/lib/data/settings";
import { OnboardingWizard } from "./onboarding-wizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const store = await getStoreSettings();
  if (store.onboarded) redirect("/dashboard");
  return <OnboardingWizard initial={store} />;
}
