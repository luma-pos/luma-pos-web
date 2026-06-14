import { getAllPrintTemplates } from "@/lib/print/template";
import { PrintSettingsForm } from "./print-settings-form";

export const dynamic = "force-dynamic";

export default async function PrintSettingsPage() {
  const templates = await getAllPrintTemplates();
  return <PrintSettingsForm templates={templates} />;
}
