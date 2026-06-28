import { notFound } from "next/navigation";
import { getProduct, getProductFormOptions } from "@/lib/data/products";
import { getPriceBooks, getPriceOverridesForProducts } from "@/lib/data/price-books";
import { NewProductForm } from "./product-form";
import { productToFormInitialValues } from "../product-form-values";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function NewProductPage({ searchParams }: Props) {
  const sp = await searchParams;
  const copyFrom = typeof sp.copyFrom === "string" ? sp.copyFrom : undefined;
  const sameTypeAs = typeof sp.sameTypeAs === "string" ? sp.sameTypeAs : undefined;
  const aiPreview = sp.source === "ai-preview";
  const seedId = copyFrom ?? sameTypeAs;
  if (seedId && !UUID_RE.test(seedId)) notFound();

  const [options, priceBooks, seedProduct] = await Promise.all([
    getProductFormOptions(),
    getPriceBooks(),
    seedId ? getProduct(seedId) : Promise.resolve(null),
  ]);
  if (seedId && !seedProduct) notFound();
  const priceOverridesByBook = seedProduct ? await getPriceOverridesForProducts([seedProduct.id]) : {};
  const priceBookPrices = Object.fromEntries(
    Object.entries(priceOverridesByBook).map(([bookId, prices]) => [bookId, prices[seedProduct!.id]])
  );

  return (
    <NewProductForm
      categories={options.categories}
      brands={options.brands}
      suppliers={options.suppliers}
      priceBooks={priceBooks}
      initialValues={seedProduct ? productToFormInitialValues(seedProduct, copyFrom ? "copy" : "sameType", priceBookPrices) : undefined}
      aiPreview={aiPreview}
    />
  );
}
