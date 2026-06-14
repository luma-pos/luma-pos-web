"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { PAGE_SIZES } from "@/lib/pagination";
import { cn } from "@/lib/utils";

/**
 * Phân trang dùng chung (kiểu KiotViet): chọn số dòng + |< < [n] > >| + "X–Y trong N".
 * URL-based: cập nhật query `page` / `size`, giữ nguyên các query khác.
 */
export function Pagination({
  page, pageCount, total, pageSize, unitLabel,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  unitLabel?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const go = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    const s = sp.toString();
    router.push(s ? `${pathname}?${s}` : pathname);
  };

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const btn = "w-8 h-8 grid place-items-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800";

  return (
    <div className="flex items-center gap-x-4 gap-y-2 flex-wrap mt-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-slate-500">{t("pagination.show")}</span>
        <select
          value={pageSize}
          onChange={(e) => go({ size: e.target.value, page: undefined })}
          className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{t("pagination.rows", { n: s })}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button className={btn} disabled={page <= 1} onClick={() => go({ page: undefined })} title={t("pagination.first")}><ChevronsLeft className="w-4 h-4" /></button>
        <button className={btn} disabled={page <= 1} onClick={() => go({ page: page - 1 <= 1 ? undefined : String(page - 1) })} title={t("pagination.prev")}><ChevronLeft className="w-4 h-4" /></button>
        <input
          type="number" min={1} max={pageCount}
          value={page}
          onChange={(e) => {
            const p = Math.min(pageCount, Math.max(1, Number(e.target.value) || 1));
            go({ page: p <= 1 ? undefined : String(p) });
          }}
          className="no-spinner w-12 h-8 text-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 tabular-nums"
        />
        <button className={btn} disabled={page >= pageCount} onClick={() => go({ page: String(page + 1) })} title={t("pagination.next")}><ChevronRight className="w-4 h-4" /></button>
        <button className={btn} disabled={page >= pageCount} onClick={() => go({ page: String(pageCount) })} title={t("pagination.last")}><ChevronsRight className="w-4 h-4" /></button>
      </div>

      <div className={cn("text-slate-500 tabular-nums", "ml-auto sm:ml-0")}>
        {t("pagination.range", { start, end, total })}{unitLabel ? ` ${unitLabel}` : ""}
      </div>
    </div>
  );
}
