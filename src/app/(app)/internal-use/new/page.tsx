import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Routes } from "@/lib/routes";
import { InternalUseForm } from "../../inventory/internal-use-form";

export const dynamic = "force-dynamic";

export default async function NewInternalUsePage() {
  const t = await getTranslations();

  return (
    <div className="h-dvh flex flex-col bg-canvas">
      <header className="shrink-0 min-h-12 px-4 flex items-center gap-3 bg-surface border-b border-border">
        <Link
          href={`${Routes.Inventory}?tab=internal`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-surface-2 hover:text-foreground active:scale-[0.98]"
          aria-label={t("common.back")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-[17px] font-bold">{t("internalUse.formTitle")}</h1>
      </header>

      <InternalUseForm />
    </div>
  );
}
