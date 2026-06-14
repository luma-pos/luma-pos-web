"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { balanceStocktake, cancelStocktake } from "@/lib/actions/stocktakes";

export function StocktakeRowActions({ id, status }: { id: string; status: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (status !== "draft") return null;

  async function balance() {
    if (!confirm(t("stocktakes.balanceConfirm")) || busy) return;
    setBusy(true);
    const res = await balanceStocktake(id);
    setBusy(false);
    if (res.ok) router.refresh();
    else alert(t(res.error as never));
  }

  async function cancel() {
    if (!confirm(t("stocktakes.cancelConfirm")) || busy) return;
    setBusy(true);
    const res = await cancelStocktake(id);
    setBusy(false);
    if (res.ok) router.refresh();
    else alert(t(res.error as never));
  }

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <button onClick={cancel} disabled={busy} className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50">
        {t("common.cancel")}
      </button>
      <button
        onClick={balance} disabled={busy}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-50"
      >
        {busy && <Loader2 className="w-3 h-3 animate-spin" />}
        {t("stocktakes.balance")}
      </button>
    </span>
  );
}
