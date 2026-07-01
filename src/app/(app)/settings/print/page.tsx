import { getAllPrintTemplates, getPrintTemplateStoreInfo } from "@/lib/print/template";
import { PrintSettingsForm } from "./print-settings-form";

export const dynamic = "force-dynamic";

export default async function PrintSettingsPage() {
  const [templates, storeDefaults] = await Promise.all([getAllPrintTemplates(), getPrintTemplateStoreInfo()]);
  return <PrintSettingsForm templates={templates} storeDefaults={storeDefaults} />;
}
