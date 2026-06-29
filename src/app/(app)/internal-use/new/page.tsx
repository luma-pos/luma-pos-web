import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Routes } from "@/lib/routes";
import { InternalUseForm } from "../../inventory/internal-use-form";

export const dynamic = "force-dynamic";

export default async function NewInternalUsePage() {
  const t = await getTranslations();

  return (
    <div className="min-h-dvh bg-canvas p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start gap-4">
        <Link
          href={`${Routes.Inventory}?tab=internal`}
          className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-card border border-border bg-surface text-slate-500 shadow-e1 transition hover:bg-surface-2 hover:text-foreground active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("internalUse.formTitle")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{t("internalUse.formSub")}</p>
        </div>
      </div>

      <InternalUseForm />
    </div>
  );
}
