import { getPurchaseFormOptions } from "@/lib/data/inventory";
import { PurchaseForm } from "./purchase-form";

export const dynamic = "force-dynamic"; // không prerender (query DB lúc build → timeout)

export default async function NewPurchasePage() {
  const options = await getPurchaseFormOptions();
  return <PurchaseForm options={options} />;
}
