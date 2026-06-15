"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface GroupTab {
  tab: string;
  labelKey: string;
  count?: number;
}

/** Thanh tab cho trang gộp (Bán hàng/Kho hàng/Đối tác/Tài chính) — đổi tab qua ?tab=. */
export function GroupTabs({ base, items }: { base: string; items: GroupTab[] }) {
  const t = useTranslations();
  const sp = useSearchParams();
  const active = sp.get("tab") ?? items[0]?.tab;

  return (
    <div className="flex items-center gap-1 overflow-x-auto -mx-6 px-6 [&::-webkit-scrollbar]:h-0">
      {items.map((it) => {
        const on = it.tab === active;
        return (
          <Link
            key={it.tab}
            href={`${base}?tab=${it.tab}`}
            className={cn(
              "shrink-0 inline-flex items-center gap-2 px-3.5 h-9 rounded-[10px] text-xs font-semibold transition-colors",
              on ? "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300" : "text-slate-500 hover:bg-surface-2 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            {t(it.labelKey)}
            {it.count != null && it.count > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-surface-2 text-[9px] font-bold font-mono grid place-items-center">{it.count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
