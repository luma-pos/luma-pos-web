"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, XCircle } from "lucide-react";
import { cancelPurchase } from "@/lib/actions/purchases";
import { cn } from "@/lib/utils";

export function PurchaseCancelButton({
  purchaseId,
  compact = false,
  className,
}: {
  purchaseId: string;
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onCancel() {
    if (busy || !confirm(t("purchases.cancelConfirm"))) return;
    setBusy(true);
    const res = await cancelPurchase(purchaseId);
    setBusy(false);
    if (res.ok) router.refresh();
    else alert(t(res.error as never));
  }

  return (
    <button
      type="button"
      onClick={onCancel}
      disabled={busy}
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg border border-red-200 font-medium text-er hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/40",
        compact ? "h-8 gap-1.5 px-3 text-xs" : "h-9 gap-2 px-3 text-sm",
        className,
      )}
    >
      {busy ? (
        <Loader2 className={cn("animate-spin", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
      ) : (
        <XCircle className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
      )}
      {t("purchases.cancel")}
    </button>
  );
}
