import { getTranslations } from "next-intl/server";

export async function PageStub({ titleKey }: { titleKey: string }) {
  const t = await getTranslations();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
      <div className="mt-8 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center text-slate-400">
        {t("stub.wip")}
      </div>
    </div>
  );
}
