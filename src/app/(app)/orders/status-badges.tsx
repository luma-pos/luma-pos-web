import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const ORDER_STYLES: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  quote: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  confirmed: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  delivering: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  returned: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
};

const PAYMENT_STYLES: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  unpaid: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  deposit: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  partial: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  refunded: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations();
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", ORDER_STYLES[status] ?? ORDER_STYLES.draft)}>
      {t(`orders.status.${status}`)}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const t = useTranslations();
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", PAYMENT_STYLES[status] ?? PAYMENT_STYLES.unpaid)}>
      {t(`orders.paymentStatus.${status}`)}
    </span>
  );
}
