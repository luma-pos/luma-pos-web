import { getTranslations } from "next-intl/server";
import { Routes } from "@/lib/routes";
import { GroupTabs } from "@/components/group-tabs";
import { OrdersTab } from "./tabs/orders";
import { QuotesTab } from "./tabs/quotes";
import { PromotionsTab } from "./tabs/promotions";

export const dynamic = "force-dynamic";

const TABS = [
  { tab: "orders", labelKey: "nav.orders" },
  { tab: "quotes", labelKey: "nav.quotes" },
  { tab: "promotions", labelKey: "nav.promotions" },
];

export default async function SalesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const t = await getTranslations();
  const params = await searchParams;
  const tab = params.tab ?? "orders";

  return (
    <div className="p-6">
      <div className="sticky top-0 z-20 -mx-6 -mt-6 mb-5 bg-surface border-b border-border">
        <div className="min-h-[52px] px-6 pt-2.5 flex items-center">
          <h1 className="text-[17px] font-bold">{t("nav.groups.sales")}</h1>
        </div>
        <div className="px-6 pb-1.5"><GroupTabs base={Routes.Sales} items={TABS} /></div>
      </div>

      {tab === "quotes" ? <QuotesTab searchParams={params} />
        : tab === "promotions" ? <PromotionsTab />
        : <OrdersTab searchParams={params} />}
    </div>
  );
}
