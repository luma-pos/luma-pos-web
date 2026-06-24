"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Ban, Barcode, ChevronDown, Copy, ImageIcon, PackagePlus, Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
import { Routes } from "@/lib/routes";
import { deleteProduct, setProductActive } from "@/lib/actions/products";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { ProductListResult } from "@/lib/data/products";

type ProductRow = ProductListResult["rows"][number];

export function ProductsTable({
  rows,
  initialExpandedId,
}: {
  rows: ProductListResult["rows"];
  initialExpandedId?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const expandedId = params.get("expanded") ?? initialExpandedId ?? null;

  function setExpanded(nextId: string | null) {
    const sp = new URLSearchParams(params.toString());
    if (nextId) sp.set("expanded", nextId);
    else sp.delete("expanded");
    const query = sp.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <>
      <div className="lg:hidden space-y-2">
        {rows.map((p) => {
          const expanded = expandedId === p.id;
          return (
            <div key={p.id} className={cn("bg-surface border rounded-card overflow-hidden", expanded ? "border-primary-300 shadow-e1" : "border-border")}>
              <button type="button" onClick={() => setExpanded(expanded ? null : p.id)} className="w-full p-3 text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.sku}{p.categoryName ? ` · ${p.categoryName}` : ""}</div>
                  </div>
                  <StatusBadge product={p} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <Metric label={t("products.list.colCost")} value={priceRange(p.minCostPrice, p.maxCostPrice, p.costPrice)} />
                  <Metric label={t("products.list.colSalePrice")} value={priceRange(p.minRetailPrice, p.maxRetailPrice, p.retailPrice)} />
                  <Metric label={t("products.list.colStock")} value={`${formatNumber(Number(p.totalStock))} ${p.baseUnit}`} />
                </div>
              </button>
              {expanded && <ExpandedProduct product={p} />}
            </div>
          );
        })}
      </div>

      <div className="hidden lg:block bg-surface border border-border rounded-card overflow-x-auto">
        <table className="w-full min-w-[1120px] text-sm">
          <thead>
            <tr className="bg-canvas text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">{t("products.list.colProduct")}</th>
              <th className="px-4 py-3 font-semibold">{t("products.list.colCategory")}</th>
              <th className="px-4 py-3 font-semibold">{t("products.list.colUnits")}</th>
              <th className="px-4 py-3 font-semibold text-right">{t("products.list.colCost")}</th>
              <th className="px-4 py-3 font-semibold text-right">{t("products.list.colSalePrice")}</th>
              <th className="px-4 py-3 font-semibold text-right">{t("products.list.colStock")}</th>
              <th className="px-4 py-3 font-semibold">{t("products.list.colStatus")}</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const expanded = expandedId === p.id;
              const stock = Number(p.totalStock);
              const min = Number(p.minLevel);
              const lowStock = min > 0 && stock <= min;
              return (
                <ProductRows
                  key={p.id}
                  product={p}
                  expanded={expanded}
                  lowStock={lowStock}
                  onToggle={() => setExpanded(expanded ? null : p.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ProductRows({
  product,
  expanded,
  lowStock,
  onToggle,
}: {
  product: ProductRow;
  expanded: boolean;
  lowStock: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations();

  return (
    <>
      <tr
        className={cn(
          "border-t border-border-soft cursor-pointer transition-colors",
          expanded ? "bg-primary-50/45 dark:bg-primary-950/15" : "hover:bg-surface-2"
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="font-medium text-slate-900 dark:text-slate-100">{product.name}</span>
            {product.isVariantParent && <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">{t("products.list.childSkuCount", { count: product.childCount })}</span>}
          </div>
          <div className="text-xs text-slate-400">{product.sku}{product.barcode ? ` · ${product.barcode}` : ""}</div>
        </td>
        <td className="px-4 py-3 text-slate-500">{product.categoryName ?? "—"}</td>
        <td className="px-4 py-3 text-slate-500">{product.baseUnit}{product.unitNames ? ` · ${product.unitNames}` : ""}</td>
        <td className="px-4 py-3 text-right tabular-nums font-medium">{priceRange(product.minCostPrice, product.maxCostPrice, product.costPrice)}</td>
        <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900 dark:text-slate-100">{priceRange(product.minRetailPrice, product.maxRetailPrice, product.retailPrice)}</td>
        <td className={cn("px-4 py-3 text-right tabular-nums font-semibold", lowStock ? "text-er" : "text-slate-700 dark:text-slate-300")}>{formatNumber(Number(product.totalStock))} {product.baseUnit}</td>
        <td className="px-4 py-3"><StatusBadge product={product} /></td>
        <td className="px-4 py-3 text-right">
          <ChevronDown className={cn("ml-auto h-4 w-4 text-slate-400 transition-transform", expanded && "rotate-180")} />
        </td>
      </tr>
      {expanded && (
        <tr className="border-t border-primary-100 dark:border-primary-900/50">
          <td colSpan={8} className="p-0">
            <ExpandedProduct product={product} />
          </td>
        </tr>
      )}
    </>
  );
}

function ExpandedProduct({ product }: { product: ProductRow }) {
  const t = useTranslations();
  const specs = specEntries(product.specs);
  const image = Array.isArray(product.imageUrls) ? product.imageUrls[0] : undefined;
  const effectiveActive = product.isVariantParent ? product.children.some((child) => child.isActive) : product.isActive;

  return (
    <div className="border-t border-border-soft bg-surface px-4 py-4">
      <div className="flex items-center gap-7 border-b border-border-soft text-sm font-semibold text-slate-500">
        <span className="border-b-2 border-primary-600 pb-2 text-primary-600">{t("products.expand.tabs.info")}</span>
        <span className="pb-2">{t("products.expand.tabs.description")}</span>
        <span className="pb-2">{t("products.expand.tabs.stockCard")}</span>
        <span className="pb-2">{t("products.expand.tabs.stock")}</span>
        <span className="pb-2">{t("products.expand.tabs.channels")}</span>
      </div>

      <div className="grid grid-cols-1 gap-5 pt-4 lg:grid-cols-[160px_1fr]">
        <div className="relative h-36 w-36 overflow-hidden rounded-card border border-border bg-primary-50/50">
          {image ? (
            <Image src={image} alt={product.name} fill sizes="144px" className="object-cover" unoptimized />
          ) : (
            <div className="grid h-full place-items-center text-primary-300">
              <ImageIcon className="h-12 w-12" />
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">{product.name}</h3>
              <div className="mt-1 text-sm text-slate-500">{t("products.fields.category")}: {product.categoryName ?? "—"}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge text={product.isVariantParent ? t("products.list.group") : t("products.expand.normalProduct")} />
                <Badge text={effectiveActive ? t("products.directSale") : t("products.list.inactive")} tone={effectiveActive ? "ok" : "muted"} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoItem label={t("products.fields.sku")} value={product.sku} />
            <InfoItem label={t("products.fields.barcode")} value={product.barcode} />
            <InfoItem label={t("products.pricing.costPrice")} value={formatCurrency(Number(product.costPrice))} />
            <InfoItem label={t("products.pricing.retailPrice")} value={formatCurrency(Number(product.retailPrice))} />
            <InfoItem label={t("products.stock.current")} value={`${formatNumber(Number(product.totalStock))} ${product.baseUnit}`} />
            <InfoItem label={t("products.stock.min")} value={Number(product.minLevel) > 0 ? formatNumber(Number(product.minLevel)) : undefined} />
            <InfoItem label={t("products.physical.location")} value={product.location} />
            <InfoItem label={t("products.fields.brand")} value={product.brandName} />
            <InfoItem label={t("products.physical.weight")} value={product.weight ? formatNumber(product.weight) : undefined} />
            <InfoItem label={t("products.physical.dimensions")} value={product.dimensions} />
          </div>

          {specs.length > 0 && (
            <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
              {specs.map(([key, value]) => <InfoItem key={key} label={key} value={value} />)}
            </div>
          )}

          {product.children.length > 0 && (
            <div className="rounded-card border border-border-soft">
              <div className="border-b border-border-soft px-3 py-2 text-sm font-semibold">{t("products.expand.childSkus")}</div>
              <div className="divide-y divide-border-soft">
                {product.children.map((child) => (
                  <Link key={child.id} href={Routes.product(child.id)} className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 text-sm hover:bg-surface-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{child.variantName ?? child.name}</span>
                      <span className="block text-xs text-slate-400">{child.sku}</span>
                    </span>
                    <span className="tabular-nums font-semibold">{formatCurrency(Number(child.retailPrice))}</span>
                    <span className="tabular-nums text-slate-500">{formatNumber(Number(child.totalStock))} {child.baseUnit}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <ProductActionBar product={product} />
        </div>
      </div>
    </div>
  );
}

function ProductActionBar({ product }: { product: ProductRow }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const effectiveActive = product.isVariantParent ? product.children.some((child) => child.isActive) : product.isActive;
  const nextActive = !effectiveActive;
  const sameTypeSourceId = product.parentProductId ?? product.id;

  function clearExpandedAndRefresh() {
    const sp = new URLSearchParams(params.toString());
    sp.delete("expanded");
    const query = sp.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    router.refresh();
  }

  function removeProduct() {
    if (pending || !window.confirm(t("products.confirm.delete"))) return;
    setError("");
    startTransition(async () => {
      const res = await deleteProduct(product.id);
      if (res.ok) clearExpandedAndRefresh();
      else setError(t(res.error as never));
    });
  }

  function toggleActive() {
    const confirmKey = nextActive ? "products.confirm.resumeSelling" : "products.confirm.stopSelling";
    if (pending || !window.confirm(t(confirmKey as never))) return;
    setError("");
    startTransition(async () => {
      const res = await setProductActive({ productId: product.id, isActive: nextActive });
      if (res.ok) router.refresh();
      else setError(t(res.error as never));
    });
  }

  function productModalHref(patch: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    sp.set("tab", "products");
    sp.delete("productId");
    sp.delete("copyFrom");
    sp.delete("sameTypeAs");
    for (const [key, value] of Object.entries(patch)) sp.set(key, value);
    return `${pathname}?${sp.toString()}`;
  }

  return (
    <div className="border-t border-border-soft pt-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          <ActionButton icon={Trash2} label={t("products.actions.delete")} onClick={removeProduct} disabled={pending} tone="danger" />
          <ActionLink icon={Copy} label={t("products.actions.copy")} href={productModalHref({ productModal: "copy", copyFrom: product.id })} />
        </div>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          <ActionLink icon={Pencil} label={t("products.actions.edit")} href={productModalHref({ productModal: "edit", productId: product.id })} tone="primary" />
          <ActionLink icon={Barcode} label={t("products.actions.printLabels")} href={Routes.productLabels(product.id)} />
          <ActionLink icon={Plus} label={t("products.actions.addSameType")} href={productModalHref({ productModal: "sameType", sameTypeAs: sameTypeSourceId })} />
          <ActionLink icon={PackagePlus} label={t("products.actions.purchase")} href={Routes.purchaseNewForProduct(product.id)} />
          <ActionButton
            icon={Ban}
            label={t((nextActive ? "products.actions.resumeSelling" : "products.actions.stopSelling") as never)}
            onClick={toggleActive}
            disabled={pending}
          />
        </div>
      </div>
      {error && <p className="mt-2 text-sm font-medium text-er">{error}</p>}
    </div>
  );
}

function ActionLink({
  href,
  icon: Icon,
  label,
  tone = "neutral",
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  tone?: "neutral" | "primary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        actionClassName,
        tone === "primary"
          ? "border-primary-600 bg-primary-600 text-white hover:border-primary-700 hover:bg-primary-700"
          : "border-border bg-surface text-slate-700 hover:bg-surface-2 dark:text-slate-200"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        actionClassName,
        tone === "danger"
          ? "border-transparent bg-transparent text-slate-600 hover:bg-red-50 hover:text-er dark:text-slate-300 dark:hover:bg-red-950/30"
          : "border-border bg-surface text-slate-700 hover:bg-surface-2 dark:text-slate-200"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

const actionClassName = "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";

function StatusBadge({ product }: { product: ProductRow }) {
  const t = useTranslations();
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      product.isVariantParent ? "bg-primary-50 text-primary-700" : product.isActive ? "bg-ok-soft text-ok" : "bg-surface-2 text-slate-500"
    )}>
      {product.isVariantParent ? t("products.list.group") : product.isActive ? t("products.list.active") : t("products.list.inactive")}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="block text-slate-400">{label}</span>
      <span className="mt-0.5 block truncate font-semibold tabular-nums text-slate-900 dark:text-slate-100">{value}</span>
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-border-soft pb-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 min-h-5 text-sm font-medium text-slate-800 dark:text-slate-100">{value || "—"}</div>
    </div>
  );
}

function Badge({ text, tone = "muted" }: { text: string; tone?: "muted" | "ok" }) {
  return (
    <span className={cn(
      "inline-flex rounded-md px-2 py-1 text-xs font-semibold",
      tone === "ok" ? "bg-ok-soft text-ok" : "bg-surface-2 text-slate-700 dark:text-slate-200"
    )}>
      {text}
    </span>
  );
}

function priceRange(minValue: string | number | null | undefined, maxValue: string | number | null | undefined, fallback: string | number) {
  const min = Number(minValue ?? fallback);
  const max = Number(maxValue ?? fallback);
  return min !== max ? `${formatCurrency(min)} - ${formatCurrency(max)}` : formatCurrency(max);
}

function specEntries(specs: unknown) {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return [];
  return Object.entries(specs as Record<string, unknown>).map(([key, value]) => [
    key,
    Array.isArray(value) ? value.join(", ") : String(value),
  ] as const);
}
