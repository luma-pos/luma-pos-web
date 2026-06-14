import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LayoutDashboard } from "lucide-react";
import { getPosData } from "@/lib/data/pos";
import { getPrintTemplate } from "@/lib/print/template";
import { Routes } from "@/lib/routes";
import { PosClient } from "./pos-client";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  const [data, t, printTemplate] = await Promise.all([getPosData(), getTranslations(), getPrintTemplate("order")]);
  return (
    <div className="h-full flex flex-col">
      {/* top bar gọn — thay cho sidebar admin (giống KiotViet) */}
      <header className="shrink-0 h-12 px-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg grid place-items-center text-white font-extrabold text-sm bg-gradient-to-br from-primary-600 to-primary-400">S</div>
          <span className="font-bold text-sm truncate">{t("common.appName")}</span>
          <span className="text-xs text-slate-400 hidden sm:inline">· {t("nav.pos")}</span>
        </div>
        <Link
          href={Routes.Dashboard}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="hidden sm:inline">{t("nav.dashboard")}</span>
        </Link>
      </header>
      <div className="flex-1 min-h-0">
        <PosClient data={data} printTemplate={printTemplate} />
      </div>
    </div>
  );
}
