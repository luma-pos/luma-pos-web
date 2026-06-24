import { getPurchaseFormOptions, getPurchaseProductRowsByIds } from "@/lib/data/inventory";
import { PurchaseForm } from "./purchase-form";

export const dynamic = "force-dynamic"; // không prerender (query DB lúc build → timeout)

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function NewPurchasePage({ searchParams }: Props) {
  const sp = await searchParams;
  const productId = typeof sp.productId === "string" && UUID_RE.test(sp.productId) ? sp.productId : null;
  const [options, initialProducts] = await Promise.all([
    getPurchaseFormOptions(),
    productId ? getPurchaseProductRowsByIds([productId]) : Promise.resolve([]),
  ]);
  return <PurchaseForm options={options} initialProducts={initialProducts} />;
}
