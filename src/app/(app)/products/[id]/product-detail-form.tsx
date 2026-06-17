"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Plus, Trash2, Loader2, Check } from "lucide-react";
import { updateProduct, type UpdateProductInput } from "@/lib/actions/products";
import { Routes } from "@/lib/routes";
import { formatCurrency, cn } from "@/lib/utils";
import { MoneyInput } from "@/components/ui/money-input";
import type { ProductDetail, ProductFormOptions } from "@/lib/data/products";

type UnitRow = { unitName: string; multiplier: string; barcode: string; priceOverride: string };
type SpecRow = { key: string; value: string };

const numOrNull = (s: string): number | null => {
  const n = Number(s);
  return s.trim() === "" || !Number.isFinite(n) ? null : n;
};

export function ProductDetailForm({
  product, categories, brands,
}: {
  product: ProductDetail;
  categories: ProductFormOptions["categories"];
  brands: ProductFormOptions["brands"];
}) {
  const t = useTranslations();
  const router = useRouter();

  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [barcode, setBarcode] = useState(product.barcode ?? "");
  const [categoryId, setCategoryId] = useState(product.categoryId ?? "");
  const [brandId, setBrandId] = useState(product.brandId ?? "");
  const [baseUnit, setBaseUnit] = useState(product.baseUnit);
  const [costPrice, setCostPrice] = useState(String(Number(product.costPrice)));
  const [retailPrice, setRetailPrice] = useState(String(Number(product.retailPrice)));
  const [wholesalePrice, setWholesalePrice] = useState(product.wholesalePrice != null ? String(Number(product.wholesalePrice)) : "");
  const [contractorPrice, setContractorPrice] = useState(product.contractorPrice != null ? String(Number(product.contractorPrice)) : "");
  const [agentPrice, setAgentPrice] = useState(product.agentPrice != null ? String(Number(product.agentPrice)) : "");
  const [location, setLocation] = useState(product.location ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [isActive, setIsActive] = useState(product.isActive);
  const [units, setUnits] = useState<UnitRow[]>(
    product.units.map((u) => ({
      unitName: u.unitName,
      multiplier: String(Number(u.multiplier)),
      barcode: u.barcode ?? "",
      priceOverride: u.priceOverride != null ? String(Number(u.priceOverride)) : "",
    }))
  );
  const [specs, setSpecs] = useState<SpecRow[]>(
    Object.entries((product.specs as Record<string, string[]>) ?? {}).map(([k, v]) => ({
      key: k, value: Array.isArray(v) ? v.join(", ") : String(v),
    }))
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    const specObj: Record<string, string[]> = {};
    for (const s of specs) {
      if (s.key.trim()) specObj[s.key.trim()] = s.value.split(",").map((x) => x.trim()).filter(Boolean);
    }
    const payload: UpdateProductInput = {
      id: product.id,
      sku: sku.trim(),
      barcode: barcode.trim() || undefined,
      name: name.trim(),
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      baseUnit: baseUnit.trim() || "cái",
      costPrice: Number(costPrice) || 0,
      retailPrice: Number(retailPrice) || 0,
      wholesalePrice: numOrNull(wholesalePrice),
      contractorPrice: numOrNull(contractorPrice),
      agentPrice: numOrNull(agentPrice),
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      isActive,
      specs: Object.keys(specObj).length > 0 ? specObj : null,
      units: units
        .filter((u) => u.unitName.trim() && Number(u.multiplier) > 0)
        .map((u) => ({
          unitName: u.unitName.trim(),
          multiplier: Number(u.multiplier),
          barcode: u.barcode.trim() || undefined,
          priceOverride: numOrNull(u.priceOverride),
        })),
    };
    const res = await updateProduct(payload);
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(t(res.error));
    }
  }

  const input = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900";
  const label = "text-xs font-medium text-slate-500 mb-1 block";

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={Routes.Products} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[17px] font-bold truncate">{name || t("products.title")}</h1>
            <p className="text-xs text-slate-400">{product.sku} · {t("products.list.colStock")}: {Number(product.totalStock).toLocaleString("vi-VN")} {product.baseUnit}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-emerald-600 inline-flex items-center gap-1"><Check className="w-4 h-4" />{t("common.saved")}</span>}
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("common.save")}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
        {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-4 py-2 text-sm text-red-700 dark:text-red-400">{error}</div>}

        {/* thông tin cơ bản */}
        <Card title={t("products.tabs.info")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={label}>{t("products.fields.name")}</label>
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className={label}>{t("products.fields.sku")}</label>
              <input className={input} value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div>
              <label className={label}>{t("products.fields.barcode")}</label>
              <input className={input} value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </div>
            <div>
              <label className={label}>{t("products.fields.category")}</label>
              <select className={input} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>{t("products.fields.brand")}</label>
              <select className={input} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                <option value="">—</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>{t("products.fields.baseUnit")}</label>
              <input className={input} value={baseUnit} onChange={(e) => setBaseUnit(e.target.value)} />
            </div>
            <div>
              <label className={label}>{t("products.physical.location")}</label>
              <input className={input} value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <label className="md:col-span-2 flex items-center gap-2 text-sm cursor-pointer mt-1">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded text-primary-600" />
              {t("products.list.statusActive")}
            </label>
          </div>
        </Card>

        {/* giá */}
        <Card title={t("products.sections.pricing")}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Money label={t("products.pricing.costPrice")} value={costPrice} onChange={setCostPrice} input={input} labelCls={label} />
            <Money label={t("products.pricing.retailPrice")} value={retailPrice} onChange={setRetailPrice} input={input} labelCls={label} />
            <Money label={t("products.pricing.wholesalePrice")} value={wholesalePrice} onChange={setWholesalePrice} input={input} labelCls={label} />
            <Money label={t("products.pricing.contractorPrice")} value={contractorPrice} onChange={setContractorPrice} input={input} labelCls={label} />
            <Money label={t("products.pricing.agentPrice")} value={agentPrice} onChange={setAgentPrice} input={input} labelCls={label} />
          </div>
        </Card>

        {/* đơn vị quy đổi */}
        <Card
          title={t("products.sections.units")}
          action={
            <button onClick={() => setUnits((u) => [...u, { unitName: "", multiplier: "", barcode: "", priceOverride: "" }])}
              className="text-sm text-primary-600 inline-flex items-center gap-1 hover:underline">
              <Plus className="w-4 h-4" />{t("common.add")}
            </button>
          }
        >
          {units.length === 0 ? (
            <p className="text-sm text-slate-400">{t("products.sections.unitsDesc")}</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_90px_1fr_36px] gap-2 text-xs text-slate-400 px-1">
                <span>{t("products.fields.unitName")}</span>
                <span>{t("products.fields.multiplier")}</span>
                <span>{t("products.pricing.retailPrice")}</span>
                <span />
              </div>
              {units.map((u, i) => (
                <div key={i} className="grid grid-cols-[1fr_90px_1fr_36px] gap-2 items-center">
                  <input className={input} placeholder="hộp, thùng…" value={u.unitName}
                    onChange={(e) => setUnits((arr) => arr.map((x, j) => j === i ? { ...x, unitName: e.target.value } : x))} />
                  <input className={cn(input, "no-spinner text-right")} type="number" value={u.multiplier}
                    onChange={(e) => setUnits((arr) => arr.map((x, j) => j === i ? { ...x, multiplier: e.target.value } : x))} />
                  <MoneyInput className={cn(input, "no-spinner text-right")} placeholder={formatCurrency(0)} value={u.priceOverride}
                    onChange={(v) => setUnits((arr) => arr.map((x, j) => j === i ? { ...x, priceOverride: v == null ? "" : String(v) } : x))} />
                  <button onClick={() => setUnits((arr) => arr.filter((_, j) => j !== i))}
                    className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <p className="text-xs text-slate-400">{t("products.fields.multiplierHint", { unit: baseUnit })}</p>
            </div>
          )}
        </Card>

        {/* thuộc tính */}
        <Card
          title={t("products.sections.attributes")}
          action={
            <button onClick={() => setSpecs((s) => [...s, { key: "", value: "" }])}
              className="text-sm text-primary-600 inline-flex items-center gap-1 hover:underline">
              <Plus className="w-4 h-4" />{t("common.add")}
            </button>
          }
        >
          {specs.length === 0 ? (
            <p className="text-sm text-slate-400">{t("products.sections.attributesDesc")}</p>
          ) : (
            <div className="space-y-2">
              {specs.map((s, i) => (
                <div key={i} className="grid grid-cols-[160px_1fr_36px] gap-2 items-center">
                  <input className={input} placeholder="SIZE, MÀU…" value={s.key}
                    onChange={(e) => setSpecs((arr) => arr.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} />
                  <input className={input} placeholder="21, Đỏ…" value={s.value}
                    onChange={(e) => setSpecs((arr) => arr.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} />
                  <button onClick={() => setSpecs((arr) => arr.filter((_, j) => j !== i))}
                    className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* mô tả */}
        <Card title={t("products.description.main")}>
          <textarea className={cn(input, "min-h-24")} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Money({ label, value, onChange, input, labelCls }: {
  label: string; value: string; onChange: (v: string) => void; input: string; labelCls: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <MoneyInput className={cn(input, "no-spinner text-right")} value={value} onChange={(v) => onChange(v == null ? "" : String(v))} placeholder="0" />
    </div>
  );
}
