"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, Trash2, Check, Loader2, AlertTriangle, ClipboardList, PackageSearch } from "lucide-react";
import { SearchableSelect } from "@/components/combobox";
import { searchPurchaseProducts } from "@/lib/actions/purchase-search";
import { createInternalUse } from "@/lib/actions/internal-use";
import { formatCurrency, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const APPROVAL_THRESHOLD = 500_000;

const DEPARTMENTS = [
  ["kitchen", "Kitchen", "Bếp"], ["office", "Office", "Văn phòng"], ["marketing", "Marketing", "Tiếp thị"],
  ["management", "Management", "Ban quản lý"], ["security", "Security", "Bảo vệ"], ["maintenance", "Maintenance", "Bảo trì"],
] as const;
const REASONS = [
  ["staff_meal", "Staff meals", "Bữa ăn nhân viên"], ["supplies", "Office supplies", "Vật tư văn phòng"],
  ["sample", "Marketing samples", "Mẫu tiếp thị"], ["display", "Store display", "Trưng bày"],
  ["cleaning", "Cleaning supplies", "Vệ sinh"], ["training", "Staff training", "Đào tạo nhân viên"],
  ["other", "Other", "Khác"],
] as const;

type Line = {
  key: string; productId: string; productName: string; baseUnit: string; costPrice: number;
  units: { name: string; mult: number }[]; unitName: string; unitMultiplier: number; quantity: number; unitCost: number;
};

export function InternalUseForm() {
  const t = useTranslations();
  const locale = useLocale();
  const L = locale === "vi";
  const router = useRouter();
  const [pending, start] = useTransition();

  const [department, setDepartment] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchPurchaseProducts>>>([]);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState("");
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deptOpts = DEPARTMENTS.map(([v, en, vi]) => ({ value: v, label: L ? vi : en }));
  const reasonOpts = REASONS.map(([v, en, vi]) => ({ value: v, label: L ? vi : en }));
  const labelOf = (opts: { value: string; label: string }[], v: string) => opts.find((o) => o.value === v)?.label ?? v;

  const totalCost = useMemo(() => lines.reduce((s, l) => s + l.unitCost * l.quantity, 0), [lines]);
  const needsApproval = totalCost > APPROVAL_THRESHOLD;

  function onSearch(val: string) {
    setQ(val);
    if (tRef.current) clearTimeout(tRef.current);
    if (!val.trim()) { setResults([]); return; }
    setSearching(true);
    tRef.current = setTimeout(async () => {
      const rows = await searchPurchaseProducts(val);
      setResults(rows); setSearching(false);
    }, 250);
  }

  function addItem(p: Awaited<ReturnType<typeof searchPurchaseProducts>>[number]) {
    const cost = Number(p.costPrice);
    const units = [{ name: p.baseUnit, mult: 1 }, ...p.units.map((u) => ({ name: u.unitName, mult: Number(u.multiplier) }))];
    setLines((ls) => {
      const ex = ls.findIndex((x) => x.productId === p.id);
      if (ex >= 0) { const c = [...ls]; c[ex] = { ...c[ex], quantity: c[ex].quantity + 1 }; return c; }
      return [...ls, { key: `${p.id}-${Date.now()}`, productId: p.id, productName: p.name, baseUnit: p.baseUnit, costPrice: cost, units, unitName: p.baseUnit, unitMultiplier: 1, quantity: 1, unitCost: cost }];
    });
    setQ(""); setResults([]);
  }
  const upd = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => l.key === key ? { ...l, ...patch } : l));
  const changeUnit = (l: Line, name: string) => {
    const u = l.units.find((x) => x.name === name) ?? l.units[0];
    upd(l.key, { unitName: u.name, unitMultiplier: u.mult, unitCost: Math.round(l.costPrice * u.mult) });
  };

  function submit() {
    if (lines.length === 0) return;
    start(async () => {
      const res = await createInternalUse({
        department: department ? labelOf(deptOpts, department) : undefined,
        reason: reason ? labelOf(reasonOpts, reason) : undefined,
        note: note || undefined,
        items: lines.map((l) => ({ productId: l.productId, productName: l.productName, unitName: l.unitName, unitMultiplier: l.unitMultiplier, quantity: l.quantity, unitCost: l.unitCost })),
      });
      if (res.ok) {
        setToast(res.data.status === "pending" ? t("internalUse.submittedPending") : t("internalUse.submitted"));
        setLines([]); setNote(""); setReason(""); setDepartment("");
        router.refresh();
        setTimeout(() => setToast(""), 3500);
      } else {
        setToast(t(res.error as never));
        setTimeout(() => setToast(""), 3500);
      }
    });
  }

  return (
    <div className="mb-5 overflow-hidden rounded-card border border-border bg-surface shadow-e2">
      <div className="border-b border-border bg-surface-2 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-200">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-extrabold">{t("internalUse.formTitle")}</div>
              <div className="mt-px text-xs text-slate-400">{t("internalUse.formSub")}</div>
            </div>
          </div>
          <div className={cn("rounded-xl px-3 py-2 text-sm font-bold tabular-nums", needsApproval ? "bg-warn-soft text-warn" : "bg-canvas text-slate-600 dark:text-slate-300")}>
            {formatCurrency(totalCost)}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">{t("internalUse.department")}</span>
            <SearchableSelect options={deptOpts} value={department} onChange={setDepartment} placeholder={t("internalUse.department")} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">{t("internalUse.reason")}</span>
            <SearchableSelect options={reasonOpts} value={reason} onChange={setReason} placeholder={t("internalUse.reason")} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">{t("internalUse.note")}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("internalUse.notePlaceholder")} className="h-11 w-full rounded-xl border border-border bg-canvas px-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-200" />
        </div>

        <div className="relative max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => onSearch(e.target.value)} placeholder={t("internalUse.searchProduct")} className="h-12 w-full rounded-xl border border-border bg-canvas pl-10 pr-3 text-sm shadow-e1 transition focus:outline-none focus:ring-2 focus:ring-primary-200" />
          {(results.length > 0 || searching) && q.trim() && (
            <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-e2">
              {searching ? <div className="px-4 py-4 text-center text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin inline" /></div>
                : results.map((p) => (
                  <button key={p.id} type="button" onClick={() => addItem(p)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-surface-2">
                    <div className="min-w-0 flex-1"><div className="truncate font-semibold">{p.name}</div><div className="font-mono text-xs text-slate-400">{p.sku} · {t("internalUse.cost")} {formatCurrency(Number(p.costPrice))}/{p.baseUnit}</div></div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {needsApproval && (
          <div className="flex items-start gap-2 rounded-xl border border-warn/25 bg-warn-soft px-3.5 py-2.5 text-xs text-warn">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
            <span>{t("internalUse.approvalBanner", { amount: formatCurrency(totalCost) })}</span>
          </div>
        )}

        {lines.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-canvas/60 px-4 py-8 text-center">
            <PackageSearch className="mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">{t("internalUse.emptyForm")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm min-w-150">
              <thead><tr className="border-b border-border bg-canvas text-left text-[11px] text-slate-500">
                <th className="px-3 py-3 font-semibold">{t("orders.cols.product")}</th>
                <th className="w-36 px-3 py-3 font-semibold">{t("internalUse.unit")}</th>
                <th className="w-24 px-3 py-3 text-center font-semibold">{t("internalUse.qty")}</th>
                <th className="w-32 px-3 py-3 text-right font-semibold">{t("internalUse.unitCost")}</th>
                <th className="w-32 px-3 py-3 text-right font-semibold">{t("internalUse.lineTotal")}</th>
                <th className="w-8" />
              </tr></thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.key} className="border-b border-border-soft transition last:border-0 hover:bg-surface-2/70">
                    <td className="px-3 py-3 font-semibold">{l.productName}</td>
                    <td className="px-3 py-2">
                      <select value={l.unitName} onChange={(e) => changeUnit(l, e.target.value)} className="w-full rounded-lg border border-border bg-canvas px-2 py-2 text-xs transition focus:outline-none focus:ring-2 focus:ring-primary-200">
                        {l.units.map((u) => <option key={u.name} value={u.name}>{u.name}{u.mult > 1 ? ` (×${u.mult})` : ""}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2"><input type="number" min={1} value={l.quantity} onChange={(e) => upd(l.key, { quantity: Math.max(1, Number(e.target.value) || 1) })} className="no-spinner w-full rounded-lg border border-border bg-canvas px-2 py-2 text-center font-mono text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-200" /></td>
                    <td className="px-3 py-2"><input type="number" min={0} value={l.unitCost} onChange={(e) => upd(l.key, { unitCost: Math.max(0, Number(e.target.value) || 0) })} className="no-spinner w-full rounded-lg border border-border bg-canvas px-2 py-2 text-right font-mono text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-200" /></td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-warn">{formatCurrency(l.unitCost * l.quantity)}</td>
                    <td className="px-3 py-2"><button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-er-soft hover:text-er active:scale-[0.98]"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lines.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas px-4 py-3">
            <span className="text-sm text-slate-500">{t("internalUse.totalCost")}: <span className="font-mono text-base font-extrabold text-warn">{formatCurrency(totalCost)}</span></span>
            <button type="button" disabled={pending} onClick={submit} className={cn("inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50", needsApproval ? "bg-warn hover:brightness-110" : "bg-primary-600 hover:brightness-110")}>
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {needsApproval ? t("internalUse.submitForApproval") : t("internalUse.confirm")}
            </button>
          </div>
        )}
      </div>

      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-ok-soft text-ok border border-ok/25 text-sm font-semibold shadow-e2 flex items-center gap-2"><Check className="w-4 h-4" />{toast}</div>}
    </div>
  );
}
