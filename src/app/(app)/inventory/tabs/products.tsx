import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus, Search, PackageOpen } from "lucide-react";
import { Routes } from "@/lib/routes";
import { getProducts, getProductFormOptions } from "@/lib/data/products";
import { Pagination } from "@/components/pagination";
import { parsePageSize } from "@/lib/pagination";
import { TableSkeleton } from "@/components/table-skeleton";
import { ProductsTable } from "./products-table";

type SP = Record<string, string | undefined>;
const STATUSES = ["active", "inactive", "all"] as const;
type Status = (typeof STATUSES)[number];
const VIEWS = ["grouped", "flat"] as const;
type View = (typeof VIEWS)[number];

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
          <Link href={Routes.ProductNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600 hover:brightness-110 text-white text-sm font-medium transition active:scale-[0.98]"><Plus className="w-4 h-4" />{t("products.createNew")}</Link>
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
    </>
  );
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
