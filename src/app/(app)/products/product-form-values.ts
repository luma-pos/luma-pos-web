import type { ProductDetail } from "@/lib/data/products";
import type { CreateProductInput } from "./new/schema";

type ProductSeedMode = "edit" | "copy" | "sameType";

export function productToFormInitialValues(
  product: ProductDetail,
  mode: ProductSeedMode = "edit",
  priceBookPrices: Record<string, string | number | null | undefined> = {}
): Partial<CreateProductInput> {
  const specs = (product.specs as Record<string, string[]> | null) ?? {};
  const shared: Partial<CreateProductInput> = {
    categoryId: product.categoryId ?? "",
    brandId: product.brandId ?? "",
    supplierIds: product.suppliers.map((s) => s.id),
    baseUnit: product.baseUnit,
    costPrice: Number(product.costPrice),
    retailPrice: Number(product.retailPrice),
    wholesalePrice: product.wholesalePrice != null ? Number(product.wholesalePrice) : null,
    contractorPrice: product.contractorPrice != null ? Number(product.contractorPrice) : null,
    agentPrice: product.agentPrice != null ? Number(product.agentPrice) : null,
    priceBookPrices: Object.fromEntries(
      Object.entries(priceBookPrices).map(([bookId, price]) => [
        bookId,
        price != null ? Number(price) : null,
      ])
    ),
    units: product.units.map((u) => ({
      unitName: u.unitName,
      multiplier: Number(u.multiplier),
      barcode: mode === "copy" ? "" : (u.barcode ?? ""),
      priceOverride: u.priceOverride != null ? Number(u.priceOverride) : null,
    })),
    attributes: Object.entries(specs).map(([name, values]) => ({
      name,
      values: Array.isArray(values) ? values : [String(values)],
      createsVariants: false,
    })),
  };

  if (mode === "sameType") {
    return {
      ...shared,
      sku: "",
      barcode: "",
      name: "",
      imageUrls: [],
      location: product.location ?? "",
      description: "",
      directSale: true,
      initialStock: 0,
    };
  }

  return {
    ...shared,
    sku: mode === "copy" ? "" : product.sku,
    barcode: mode === "copy" ? "" : (product.barcode ?? ""),
    name: product.name,
    imageUrls: product.imageUrls ?? [],
    location: product.location ?? "",
    description: product.description ?? "",
    directSale: product.isActive,
    initialStock: 0,
  };
}
