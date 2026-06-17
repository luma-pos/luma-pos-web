import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Routes } from "@/lib/routes";
import { getCategoriesWithCounts } from "@/lib/data/categories";
import { Text } from "@/components/ui/text";
import { CategoriesManager } from "./categories-manager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [t, categories] = await Promise.all([getTranslations(), getCategoriesWithCounts()]);
  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-5 min-h-[58px] px-4 sm:px-6 py-2.5 bg-surface border-b border-border flex items-center gap-3">
        <Link href={Routes.Products} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><ArrowLeft className="w-4 h-4" /></Link>
        <Text as="h1" weight="bold" className="text-[17px]" text={t("categories.title")} />
      </div>
      <CategoriesManager categories={categories} />
    </div>
  );
}
