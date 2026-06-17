"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { createPromotion, togglePromotion } from "@/lib/actions/extras";

interface ProductOption { id: string; name: string; sku: string; baseUnit: string }
type Tier = { minQty: number; discountPct: number };

export function PromoQuickCreate({ products }: { products: ProductOption[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [tiers, setTiers] = useState<Tier[]>([{ minQty: 50, discountPct: 3 }]);
  const [endsAt, setEndsAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const product = products.find((p) => p.id === productId);

  async function submit() {
    if (!name.trim() || !productId || tiers.length === 0 || busy) return;
    setBusy(true);
    setError("");
    const res = await createPromotion({
      name, productId,
      tiers: tiers.filter((tr) => tr.minQty > 0 && tr.discountPct > 0),
      endsAt: endsAt || undefined,
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false); setName(""); setTiers([{ minQty: 50, discountPct: 3 }]);
      router.refresh();
    } else setError(t(res.error as never));
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} tx="promos.createNew">
        <Plus className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-card p-4 w-full max-w-xl space-y-3">
      <div className="flex justify-between items-center">
        <Text as="span" weight="semibold" text={t("promos.createNew")} />
        <Button type="button" variant="ghost" size="iconSm" onClick={() => setOpen(false)}><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${t("promos.cols.name")} *`} className="flex-1 min-w-44" />
        <Input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} title={t("promos.endsAt")} />
      </div>
      <Select
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        options={[
          { value: "", label: t("purchases.pickProduct") },
          ...products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })),
        ]}
      />
      <div className="space-y-2">
        {tiers.map((tier, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <Text as="span" variant="muted" text="≥" />
            <Input type="number" min={1} value={tier.minQty}
              onChange={(e) => setTiers((ts) => ts.map((x, j) => j === i ? { ...x, minQty: Number(e.target.value) } : x))}
              className="w-24 text-right" />
            <Text as="span" variant="muted" text={`${product?.baseUnit ?? t("purchases.unitLabel")} → ${t("promos.discount")}`} />
            <Input type="number" min={0} max={100} step={0.5} value={tier.discountPct}
              onChange={(e) => setTiers((ts) => ts.map((x, j) => j === i ? { ...x, discountPct: Number(e.target.value) } : x))}
              className="w-20 text-right" />
            <Text as="span" variant="muted" text="%" />
            {tiers.length > 1 && (
              <Button type="button" variant="ghost" size="iconSm" onClick={() => setTiers((ts) => ts.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => setTiers((ts) => [...ts, { minQty: (ts[ts.length - 1]?.minQty ?? 0) * 2 || 100, discountPct: (ts[ts.length - 1]?.discountPct ?? 0) + 2 }])}
          className="h-auto px-0 text-xs"
          text={`+ ${t("promos.addTier")}`}
        />
      </div>
      {error && <Text as="p" variant="destructive" size="xs" text={error} />}
      <Button type="button" onClick={submit} disabled={busy || !name.trim() || !productId} loading={busy} tx="common.save" />
    </div>
  );
}

export function PromoToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await togglePromotion(id);
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <Button type="button" variant="link" size="sm" onClick={toggle} disabled={busy} className="h-auto px-0 text-xs" text={isActive ? t("promos.pause") : t("promos.resume")} />
  );
}
