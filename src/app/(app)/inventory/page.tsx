import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Search, Truck, Warehouse } from "lucide-react";
import { Routes } from "@/lib/routes";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { getInventory, getRecentMovements, type StockFilter } from "@/lib/data/inventory";
import { Pagination } from "@/components/pagination";
import { parsePageSize } from "@/lib/pagination";
import { getProductFormOptions } from "@/lib/data/products";

interface PageProps {
  searchParams: Promise<{ q?: string; low?: string; stock?: string; category?: string; page?: string; size?: string }>;
}

const STOCKS: StockFilter[] = ["all", "instock", "low", "out"];

const MOVE_STYLES: Record<string, string> = {
  purchase: "text-emerald-600",
  sale: "text-red-600",
  return_in: "text-sky-600",
  return_out: "text-amber-600",
  transfer: "text-sky-600",
  adjust: "text-amber-600",
  init: "text-slate-500",
};

export default async function InventoryPage({ searchParams }: PageProps) {
  const t = await getTranslations();
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = parsePageSize(params.size);
  const stock: StockFilter = params.low === "1"
    ? "low"
    : (STOCKS.includes(params.stock as StockFilter) ? (params.stock as StockFilter) : "all");
  const category = params.category ?? "";

  const [{ rows, total, totalValue, lowCount, pageCount }, movements, { categories }] = await Promise.all([
    getInventory({ q: params.q, stock, categoryId: category || undefined, page, pageSize }),
    getRecentMovements(20),
    getProductFormOptions(),
  ]);

  return (
    <div className="p-6">
      <div className="sticky top-0 z-20 -mx-6 -mt-6 mb-5 min-h-[58px] px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-[17px] font-bold">{t("inventory.title")}</h1>
        <Link href={Routes.PurchaseNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium">
          <Truck className="w-4 h-4" />
          {t("purchases.createNew")}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">{t("inventory.totalValue")}</div>
          <div className="text-xl font-bold mt-1 tabular-nums">{formatCurrency(totalValue)}</div>
          <p className="text-xs text-slate-400 mt-0.5">{t("inventory.byCost")}</p>
        </div>
        <Link href={`${Routes.Inventory}?stock=low`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-red-300">
          <div className="text-xs font-medium text-slate-500">{t("inventory.lowStock")}</div>
          <div className={cn("text-xl font-bold mt-1", lowCount > 0 ? "text-red-600" : "text-emerald-600")}>{lowCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">{t("inventory.belowMin")}</p>
        </Link>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">{t("inventory.recentMoves")}</div>
          <div className="text-xl font-bold mt-1">{movements.length}</div>
          <p className="text-xs text-slate-400 mt-0.5">{t("inventory.last20")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
        <div>
          <form className="flex flex-wrap items-center gap-3 mb-3" action={Routes.Inventory}>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" name="q" defaultValue={params.q ?? ""}
                placeholder={t("inventory.searchPlaceholder")}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <select name="stock" defaultValue={stock} className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
              {STOCKS.map((s) => <option key={s} value={s}>{t(`inventory.stockFilter.${s}`)}</option>)}
            </select>
            <select name="category" defaultValue={category} className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
              <option value="">{t("products.list.allCategories")}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white">{t("common.search")}</button>
          </form>

          {/* mobile: card list */}
          {rows.length > 0 && (
            <div className="lg:hidden space-y-2 mb-3">
              {rows.map((r) => {
                const stock = Number(r.totalStock);
                const min = Number(r.minLevel);
                const isLow = min > 0 && stock <= min;
                return (
                  <Link key={r.id} href={Routes.product(r.id)} className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><div className="font-medium truncate">{r.name}</div><div className="text-xs text-slate-400">{r.sku}</div></div>
                      {isLow && <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400">{t("inventory.statusLow")}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className={cn("tabular-nums font-semibold", (isLow || stock < 0) ? "text-red-600" : "text-slate-700 dark:text-slate-300")}>{formatNumber(stock)} {r.baseUnit}</span>
                      <span className="text-slate-500 tabular-nums">{formatCurrency(Number(r.stockValue))}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* desktop: bảng */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            {rows.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Warehouse className="w-10 h-10 mx-auto mb-3 opacity-60" />
                <p className="font-medium">{t("inventory.empty")}</p>
              </div>
            ) : (
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-left text-xs uppercase text-slate-500">
                    <th className="px-4 py-3 font-semibold">{t("orders.cols.product")}</th>
                    <th className="px-4 py-3 font-semibold text-right">{t("inventory.cols.stock")}</th>
                    <th className="px-4 py-3 font-semibold text-right">{t("inventory.cols.min")}</th>
                    <th className="px-4 py-3 font-semibold text-right">{t("inventory.cols.value")}</th>
                    <th className="px-4 py-3 font-semibold">{t("orders.cols.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((r) => {
                    const stock = Number(r.totalStock);
                    const min = Number(r.minLevel);
                    const isLow = min > 0 && stock <= min;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-slate-400">{r.sku}</div>
                        </td>
                        <td className={cn("px-4 py-3 text-right tabular-nums font-semibold", isLow && "text-red-600", stock < 0 && "text-red-600")}>
                          {formatNumber(stock)} {r.baseUnit}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-400">{min > 0 ? formatNumber(min) : "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(Number(r.stockValue))}</td>
                        <td className="px-4 py-3">
                          {isLow ? (
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400">{t("inventory.statusLow")}</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">{t("inventory.statusOk")}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} unitLabel={t("products.unitLabel")} />
        </div>

        {/* movements */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto self-start">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-semibold text-sm">
            {t("inventory.movementsTitle")}
          </div>
          {movements.length === 0 ? (
            <p className="px-4 py-8 text-sm text-slate-400 text-center">{t("inventory.noMovements")}</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {movements.map((m) => {
                const qty = Number(m.quantity);
                return (
                  <div key={m.id} className="px-4 py-2.5 text-sm flex items-center gap-3">
                    <span className={cn("font-semibold tabular-nums w-24 shrink-0", MOVE_STYLES[m.type] ?? "")}>
                      {qty > 0 ? "+" : ""}{formatNumber(qty)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{m.productName}</div>
                      <div className="text-xs text-slate-400">
                        {t(`inventory.moveTypes.${m.type}` as never)} · {m.warehouseName} · {formatDate(m.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
