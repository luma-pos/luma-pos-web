import { getProductFormOptions } from "@/lib/data/products";
import { NewProductForm } from "./product-form";

export default async function NewProductPage() {
  const { categories, brands, suppliers } = await getProductFormOptions();
  return <NewProductForm categories={categories} brands={brands} suppliers={suppliers} />;
}
