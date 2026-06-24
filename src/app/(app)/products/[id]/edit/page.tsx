import { notFound } from "next/navigation";
import { getProduct, getProductFormOptions } from "@/lib/data/products";
import { NewProductForm } from "../../new/product-form";
import { productToFormInitialValues } from "../../product-form-values";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, options] = await Promise.all([getProduct(id), getProductFormOptions()]);
  if (!product) notFound();

  return (
    <NewProductForm
      mode="edit"
      productId={id}
      isVariantChild={Boolean(product.parentProductId)}
      siblingCount={product.siblings.length}
      initialValues={productToFormInitialValues(product, "edit")}
      categories={options.categories}
      brands={options.brands}
      suppliers={options.suppliers}
    />
  );
}
