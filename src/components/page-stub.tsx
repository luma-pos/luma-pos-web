import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Text } from "@/components/ui/text";

export async function PageStub({ titleKey }: { titleKey: string }) {
  const t = await getTranslations();
  return (
    <div>
      <PageHeader title={t(titleKey)} />
      <div className="p-4 sm:p-6">
        <div className="bg-surface border border-dashed border-border rounded-card p-12 text-center">
          <Text variant="muted" text={t("stub.wip")} />
        </div>
      </div>
    </div>
  );
}
