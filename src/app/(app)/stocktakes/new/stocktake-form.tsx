"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Check, ClipboardCheck, Loader2, PackageSearch, Save, Search, Trash2 } from "lucide-react";
import { useConfirmDialog } from "@/components/confirm-dialog-provider";
import { Routes } from "@/lib/routes";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { createStocktake } from "@/lib/actions/stocktakes";

interface ProductOption {
  id: string; sku: string; name: string; baseUnit: string; costPrice: number; stock: number;
}

interface Line {
  product: ProductOption;
  actualQty: number;
}

export function StocktakeForm({ activeWarehouseId, warehouses, products }: { activeWarehouseId: string; warehouses: { id: string; name: string }[]; products: ProductOption[] }) {
  const t = useTranslations();
  const router = useRouter();
  const dialog = useConfirmDialog();

  // tồn hệ thống hiển thị được load theo kho này — đổi kho sẽ reload trang
  const warehouseId = activeWarehouseId;
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"draft" | "balance" | null>(null);
  const [error, setError] = useState("");

  const added = useMemo(() => new Set(lines.map((l) => l.product.id)), [lines]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => !added.has(p.id) && (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [search, products, added]);

  function addLine(p: ProductOption) {
    setLines((ls) => [...ls, { product: p, actualQty: p.stock }]);
    setSearch("");
  }

  function setQty(id: string, qty: number) {
    setLines((ls) => ls.map((l) => (l.product.id === id ? { ...l, actualQty: Math.max(0, qty) } : l)));
  }

  const totals = useMemo(() => {
    let matched = 0, diffCount = 0, diffQty = 0, diffValue = 0;
    for (const l of lines) {
      const d = l.actualQty - l.product.stock;
      if (Math.abs(d) < 1e-9) matched++;
      else {
        diffCount++;
        diffQty += d;
        diffValue += d * l.product.costPrice;
      }
    }
    return { matched, diffCount, diffQty, diffValue };
  }, [lines]);

  async function submit(balanceNow: boolean) {
    if (lines.length === 0 || busy) return;
    if (balanceNow) {
      const ok = await dialog.confirm({
        description: t("stocktakes.balanceConfirm"),
        confirmLabel: t("stocktakes.balance"),
        variant: "warning",
      });
      if (!ok) return;
    }
    setBusy(balanceNow ? "balance" : "draft");
    setError("");
    const res = await createStocktake({
      warehouseId,
      note: note || undefined,
      balanceNow,
      items: lines.map((l) => ({ productId: l.product.id, actualQty: l.actualQty })),
    });
    setBusy(null);
    if (res.ok) router.push(Routes.Stocktakes);
    else setError(t(res.error as never));
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      <div className="mb-5 flex flex-wrap items-start gap-4">
        <button onClick={() => router.push(Routes.Stocktakes)} className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-slate-500 transition hover:bg-surface-2 hover:text-foreground active:scale-[0.98]">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold leading-tight">{t("stocktakes.createNew")}</h1>
            <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-200">{t("stocktakes.status.draft")}</span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{t("stocktakes.balanceHint")}</p>
        </div>
        <div>
          <select
            value={warehouseId}
            onChange={(e) => router.push(`${Routes.StocktakeNew}?wh=${e.target.value}`)}
            disabled={lines.length > 0}
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm font-medium shadow-e1 transition focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-60"
            title={lines.length > 0 ? t("stocktakes.warehouseLocked") : undefined}
          >
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-card border border-border bg-surface shadow-e2">
          <div className="border-b border-border bg-surface-2 px-4 py-4 sm:px-5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={t("stocktakes.searchPlaceholder")}
                className="h-12 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm shadow-e1 transition focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-e2">
                  {suggestions.map((p) => (
                    <button
                      key={p.id} onClick={() => addLine(p)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm transition hover:bg-surface-2"
                    >
                      <span className="min-w-0"><b className="block truncate">{p.name}</b><span className="font-mono text-xs text-slate-400">{p.sku}</span></span>
                      <span className="shrink-0 text-slate-500 tabular-nums">{t("pos.stockLabel")}: {formatNumber(p.stock)} {p.baseUnit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {lines.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-14 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-200">
                <PackageSearch className="h-7 w-7" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t("stocktakes.noLines")}</p>
              <p className="mt-1 max-w-sm text-xs text-slate-400">{t("stocktakes.emptyHint")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-210 text-sm">
                <thead>
                  <tr className="border-b border-border bg-canvas text-left text-[11px] text-slate-500">
                    <th className="px-4 py-3 font-semibold">{t("orders.cols.product")}</th>
                    <th className="px-4 py-3 font-semibold text-right">{t("stocktakes.cols.systemQty")}</th>
                    <th className="w-36 px-4 py-3 font-semibold text-right">{t("stocktakes.cols.actualQty")}</th>
                    <th className="px-4 py-3 font-semibold text-right">{t("stocktakes.cols.diff")}</th>
                    <th className="px-4 py-3 font-semibold text-right">{t("stocktakes.cols.diffValue")}</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {lines.map((l) => {
                    const diff = l.actualQty - l.product.stock;
                    return (
                      <tr key={l.product.id} className="transition hover:bg-surface-2/70">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{l.product.name}</div>
                          <div className="font-mono text-xs text-slate-400">{l.product.sku} · {l.product.baseUnit}</div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">{formatNumber(l.product.stock)}</td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number" min={0} value={l.actualQty}
                            onChange={(e) => setQty(l.product.id, Number(e.target.value))}
                            className="w-28 rounded-lg border border-border bg-surface px-2 py-2 text-right text-sm tabular-nums transition focus:outline-none focus:ring-2 focus:ring-primary-200"
                          />
                        </td>
                        <td className={cn("px-4 py-3 text-right tabular-nums font-semibold", diff > 0 ? "text-ok" : diff < 0 ? "text-er" : "text-slate-400")}>
                          {Math.abs(diff) < 1e-9 ? <Check className="inline h-4 w-4 text-ok" /> : `${diff > 0 ? "+" : ""}${formatNumber(diff)}`}
                        </td>
                        <td className={cn("px-4 py-3 text-right tabular-nums", diff !== 0 ? (diff > 0 ? "text-ok" : "text-er") : "text-slate-400")}>
                          {diff !== 0 ? formatCurrency(diff * l.product.costPrice) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setLines((ls) => ls.filter((x) => x.product.id !== l.product.id))} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-er-soft hover:text-er active:scale-[0.98]">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="rounded-card border border-border bg-surface p-5 shadow-e2 xl:sticky xl:top-24 xl:self-start">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-200">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">{t("stocktakes.balance")}</div>
              <div className="text-xs text-slate-400">{warehouses.find((w) => w.id === warehouseId)?.name}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-canvas p-3">
              <span className="text-xs text-slate-500">{t("stocktakes.summary.checked")}</span>
              <b className="mt-1 block text-xl tabular-nums">{lines.length}</b>
            </div>
            <div className="rounded-xl bg-ok-soft p-3">
              <span className="text-xs text-ok">{t("stocktakes.summary.matched")}</span>
              <b className="mt-1 block text-xl text-ok tabular-nums">{totals.matched}</b>
            </div>
            <div className="rounded-xl bg-warn-soft p-3">
              <span className="text-xs text-warn">{t("stocktakes.summary.diff")}</span>
              <b className="mt-1 block text-xl text-warn tabular-nums">{totals.diffCount}</b>
            </div>
            <div className="rounded-xl bg-canvas p-3">
              <span className="text-xs text-slate-500">{t("stocktakes.cols.diffValue")}</span>
              <b className={cn("mt-1 block text-sm tabular-nums", totals.diffValue > 0 ? "text-ok" : totals.diffValue < 0 ? "text-er" : "")}>{formatCurrency(totals.diffValue)}</b>
            </div>
          </div>

          <div className="mt-4">
            <input
              value={note} onChange={(e) => setNote(e.target.value)}
              placeholder={t("orders.detail.notePlaceholder")}
              className="h-11 w-full rounded-xl border border-border bg-canvas px-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            {error && <p className="mt-2 text-xs text-er">{error}</p>}
          </div>

          <div className="mt-4 grid gap-2">
            <button
              onClick={() => submit(true)} disabled={!!busy || lines.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {busy === "balance" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {t("stocktakes.complete")}
            </button>
            <button
              onClick={() => submit(false)} disabled={!!busy || lines.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium transition hover:bg-surface-2 active:scale-[0.98] disabled:opacity-50"
            >
              {busy === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("stocktakes.saveDraft")}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
