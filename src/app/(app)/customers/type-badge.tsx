import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  retail: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  wholesale: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  contractor: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  agent: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
};

export function CustomerTypeBadge({ type }: { type: string }) {
  const t = useTranslations();
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STYLES[type] ?? STYLES.retail)}>
      {t(`customers.types.${type}`)}
    </span>
  );
}
