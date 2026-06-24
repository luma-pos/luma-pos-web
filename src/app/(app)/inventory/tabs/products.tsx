import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Plus, Search, PackageOpen } from "lucide-react";
import { Routes } from "@/lib/routes";
import { getProduct, getProducts, getProductFormOptions } from "@/lib/data/products";
import { getPriceBooks, getPriceOverridesForProducts } from "@/lib/data/price-books";
import { Pagination } from "@/components/pagination";
import { parsePageSize } from "@/lib/pagination";
import { TableSkeleton } from "@/components/table-skeleton";
import { ProductsTable } from "./products-table";
import { NewProductForm } from "../../products/new/product-form";
import { productToFormInitialValues } from "../../products/product-form-values";

type SP = Record<string, string | undefined>;
const STATUSES = ["active", "inactive", "all"] as const;
type Status = (typeof STATUSES)[number];
const VIEWS = ["grouped", "flat"] as const;
type View = (typeof VIEWS)[number];
const PRODUCT_MODAL_KEYS = ["productModal", "productId", "copyFrom", "sameTypeAs"] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function ProductsTab({ searchParams }: { searchParams: SP }) {
  const t = await getTranslations();
  const params = searchParams;
  const status: Status = STATUSES.includes(params.status as Status) ? (params.status as Status) : "active";
  const view: View = VIEWS.includes(params.view as View) ? (params.view as View) : "grouped";
  const { categories } = await getProductFormOptions();

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <Link href={Routes.Categories} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-surface-2">{t("categories.title")}</Link>
          <Link href={productModalHref(params, { productModal: "create" })} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600 hover:brightness-110 text-white text-sm font-medium transition active:scale-[0.98]"><Plus className="w-4 h-4" />{t("products.createNew")}</Link>
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-3 mb-4" action={Routes.Inventory}>
        <input type="hidden" name="tab" value="products" />
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" name="q" defaultValue={params.q ?? ""} placeholder={t("products.list.searchPlaceholder")} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface" />
        </div>
        <select name="category" defaultValue={params.category ?? ""} className="px-3 py-2 text-sm rounded-lg border border-border bg-surface">
          <option value="">{t("products.list.allCategories")}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={status} className="px-3 py-2 text-sm rounded-lg border border-border bg-surface">
          <option value="active">{t("products.list.statusActive")}</option>
          <option value="inactive">{t("products.list.statusInactive")}</option>
          <option value="all">{t("products.list.statusAll")}</option>
        </select>
        <select name="view" defaultValue={view} className="px-3 py-2 text-sm rounded-lg border border-border bg-surface">
          <option value="grouped">{t("products.list.viewGrouped")}</option>
          <option value="flat">{t("products.list.viewFlat")}</option>
        </select>
        <button type="submit" className="px-4 py-2 text-sm font-medium rounded-full border border-border bg-surface hover:bg-surface-2">{t("common.search")}</button>
      </form>

      <Suspense fallback={<TableSkeleton cols={8} rows={10} />}>
        <ProductsContent searchParams={searchParams} />
      </Suspense>

      <ProductEditorModal searchParams={params} />
    </>
  );
}

async function ProductEditorModal({ searchParams }: { searchParams: SP }) {
  const modal = searchParams.productModal;
  if (!modal) return null;
  if (!["create", "edit", "copy", "sameType"].includes(modal)) return null;

  const editId = modal === "edit" ? searchParams.productId : undefined;
  const copyFrom = modal === "copy" ? searchParams.copyFrom : undefined;
  const sameTypeAs = modal === "sameType" ? searchParams.sameTypeAs : undefined;
  const seedId = editId ?? copyFrom ?? sameTypeAs;
  if (seedId && !UUID_RE.test(seedId)) notFound();

  const [options, priceBooks, seedProduct] = await Promise.all([
    getProductFormOptions(),
    getPriceBooks(),
    seedId ? getProduct(seedId) : Promise.resolve(null),
  ]);
  if (seedId && !seedProduct) notFound();

  const priceOverridesByBook = seedProduct ? await getPriceOverridesForProducts([seedProduct.id]) : {};
  const priceBookPrices = seedProduct
    ? Object.fromEntries(Object.entries(priceOverridesByBook).map(([bookId, prices]) => [bookId, prices[seedProduct.id]]))
    : {};
  const closeHref = productModalHref(searchParams, {});
  const mode = modal === "edit" ? "edit" : "create";
  const initialValues = seedProduct
    ? productToFormInitialValues(seedProduct, modal === "copy" ? "copy" : modal === "sameType" ? "sameType" : "edit", priceBookPrices)
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-2 sm:p-5">
      <div className="h-[min(92dvh,920px)] w-full max-w-7xl overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <NewProductForm
          mode={mode}
          productId={editId}
          isVariantChild={Boolean(seedProduct?.parentProductId)}
          siblingCount={seedProduct?.siblings.length ?? 0}
          initialValues={initialValues}
          categories={options.categories}
          brands={options.brands}
          suppliers={options.suppliers}
          priceBooks={priceBooks}
          layout="modal"
          closeHref={closeHref}
        />
      </div>
    </div>
  );
}

function productModalHref(params: SP, patch: Record<string, string>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || PRODUCT_MODAL_KEYS.includes(key as (typeof PRODUCT_MODAL_KEYS)[number])) continue;
    sp.set(key, value);
  }
  sp.set("tab", "products");
  for (const [key, value] of Object.entries(patch)) sp.set(key, value);
  return `${Routes.Inventory}?${sp.toString()}`;
}

async function ProductsContent({ searchParams }: { searchParams: SP }) {
  const t = await getTranslations();
  const params = searchParams;
  const page = Number(params.page) || 1;
  const pageSize = parsePageSize(params.size);
  const status: Status = STATUSES.includes(params.status as Status) ? (params.status as Status) : "active";
  const view: View = VIEWS.includes(params.view as View) ? (params.view as View) : "grouped";

  const { rows, total, pageCount } = await getProducts({ q: params.q, categoryId: params.category, status, view, page, pageSize });

  return (
    <>
      <div className="mb-2">
        <span className="text-sm text-slate-500">{t("products.list.total", { total })}</span>
      </div>

      {rows.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-card p-12 text-center text-slate-400">
          <PackageOpen className="w-10 h-10 mx-auto mb-3 opacity-60" />
          <p className="font-medium">{t("products.list.empty")}</p>
          <p className="text-sm mt-1">{t("products.list.emptyHint")}</p>
        </div>
      ) : (
        <>
          <ProductsTable rows={rows} initialExpandedId={params.expanded} />
        </>
      )}

      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} unitLabel={t("products.unitLabel")} />
    </>
  );
}
