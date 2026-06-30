"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Printer } from "lucide-react";
import { useConfirmDialog } from "@/components/confirm-dialog-provider";
import { Routes } from "@/lib/routes";
import { convertQuoteToOrder, cancelQuote } from "@/lib/actions/orders";

export function QuoteActions({ quoteId }: { quoteId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const dialog = useConfirmDialog();
  const [busy, setBusy] = useState(false);

  async function convert() {
    if (busy) return;
    const ok = await dialog.confirm({
      description: t("quotes.convertConfirm"),
      confirmLabel: t("quotes.convert"),
    });
    if (!ok) return;
    setBusy(true);
    const res = await convertQuoteToOrder(quoteId);
    setBusy(false);
    if (res.ok) router.push(Routes.order(quoteId));
    else await dialog.alert({ description: t(res.error as never), variant: "destructive" });
  }

  async function cancel() {
    if (busy) return;
    const ok = await dialog.confirm({
      description: t("quotes.cancelConfirm"),
      confirmLabel: t("common.cancel"),
      variant: "destructive",
    });
    if (!ok) return;
    setBusy(true);
    const res = await cancelQuote(quoteId);
    setBusy(false);
    if (res.ok) router.refresh();
    else await dialog.alert({ description: t(res.error as never), variant: "destructive" });
  }

  return (
    <span className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
      <Link
        href={`${Routes.order(quoteId)}/print`}
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline"
      >
        <Printer className="h-3.5 w-3.5" />
        {t("print.printBtn")}
      </Link>
      <button type="button" onClick={cancel} disabled={busy} className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50">
        {t("common.cancel")}
      </button>
      <button
        type="button"
        onClick={convert}
        disabled={busy}
        className="inline-flex min-w-12 items-center justify-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
      >
        {busy && <Loader2 className="w-3 h-3 animate-spin" />}
        {t("quotes.convert")}
      </button>
    </span>
  );
}
