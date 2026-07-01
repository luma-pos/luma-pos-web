import { getPurchaseReturnFormOptions } from "@/lib/data/purchase-returns";
import { PurchaseReturnForm } from "./purchase-return-form";

export default async function NewPurchaseReturnPage() {
  const options = await getPurchaseReturnFormOptions();
  return <PurchaseReturnForm options={options} />;
}
