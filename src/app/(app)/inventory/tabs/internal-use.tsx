import { getTranslations } from "next-intl/server";
import { getInternalUseIssues } from "@/lib/data/internal-use";
import { InternalUseForm } from "../internal-use-form";
import { InternalUseTable } from "./internal-use-table";
import { ClipboardList } from "lucide-react";

export async function InternalUseTab() {
  const t = await getTranslations();
  const rows = await getInternalUseIssues(50);

  return (
    <>
      <InternalUseForm />

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-e2">
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-4 sm:px-5">
          <div>
            <div className="text-base font-extrabold">{t("internalUse.historyTitle")}</div>
            <div className="mt-px text-xs text-slate-400">{t("internalUse.formSub")}</div>
          </div>
          <span className="rounded-xl bg-canvas px-3 py-2 text-xs font-semibold text-slate-500">{t("internalUse.historyCount", { n: rows.length })}</span>
        </div>
        {rows.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center px-4 py-10 text-center">
            <ClipboardList className="mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">{t("internalUse.empty")}</p>
          </div>
        ) : (
          <InternalUseTable rows={rows} />
        )}
      </div>
    </>
  );
}
