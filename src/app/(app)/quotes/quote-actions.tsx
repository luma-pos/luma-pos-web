"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Routes } from "@/lib/routes";
import { convertQuoteToOrder, cancelQuote } from "@/lib/actions/orders";

export function QuoteActions({ quoteId }: { quoteId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function convert() {
    if (!confirm(t("quotes.convertConfirm")) || busy) return;
    setBusy(true);
    const res = await convertQuoteToOrder(quoteId);
    setBusy(false);
    if (res.ok) router.push(Routes.order(quoteId));
    else alert(t(res.error as never));
  }

  async function cancel() {
    if (!confirm(t("quotes.cancelConfirm")) || busy) return;
    setBusy(true);
    const res = await cancelQuote(quoteId);
    setBusy(false);
    if (res.ok) router.refresh();
    else alert(t(res.error as never));
  }

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Link href={`${Routes.order(quoteId)}/print`} className="text-xs font-medium text-slate-500 hover:underline">
        🖨 {t("print.printBtn")}
      </Link>
      <button onClick={cancel} disabled={busy} className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50">
        {t("common.cancel")}
      </button>
      <button
        onClick={convert} disabled={busy}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium disabled:opacity-50"
      >
        {busy && <Loader2 className="w-3 h-3 animate-spin" />}
        {t("quotes.convert")}
      </button>
    </span>
  );
}
