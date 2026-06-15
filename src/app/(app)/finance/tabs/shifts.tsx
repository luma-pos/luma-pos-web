import { getTranslations } from "next-intl/server";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { requireUser, getProfileId } from "@/lib/actions/common";
import { getCurrentShift, shiftExpectedCash, getShifts } from "@/lib/data/shifts";
import { ShiftPanel } from "../shift-panel";

export async function ShiftsTab() {
  const t = await getTranslations();
  let openProps: { open: boolean; openingFloat?: number; expected?: number; openedAt?: string } = { open: false };
  try {
    const userId = (await requireUser()).id;
    const profileId = await getProfileId(userId);
    if (profileId) {
      const cur = await getCurrentShift(profileId);
      if (cur) {
        const expected = await shiftExpectedCash(Number(cur.openingFloat), cur.openedAt);
        openProps = { open: true, openingFloat: Number(cur.openingFloat), expected, openedAt: formatDate(cur.openedAt) };
      }
    }
  } catch { /* layout handles auth */ }

  const rows = await getShifts(50);

  return (
    <>
      <ShiftPanel {...openProps} />

      <div className="bg-surface border border-border rounded-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-bold text-sm">{t("shifts.historyTitle")}</div>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">{t("shifts.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-170">
              <thead>
                <tr className="bg-canvas text-left text-[10px] uppercase tracking-wide text-slate-400 border-b border-border">
                  <th className="px-4 py-2.5 font-bold">{t("shifts.cols.code")}</th>
                  <th className="px-4 py-2.5 font-bold">{t("shifts.cols.cashier")}</th>
                  <th className="px-4 py-2.5 font-bold">{t("shifts.cols.opened")}</th>
                  <th className="px-4 py-2.5 font-bold">{t("shifts.cols.closed")}</th>
                  <th className="px-4 py-2.5 font-bold text-right">{t("shifts.openFloat")}</th>
                  <th className="px-4 py-2.5 font-bold text-right">{t("shifts.expected")}</th>
                  <th className="px-4 py-2.5 font-bold text-right">{t("shifts.counted")}</th>
                  <th className="px-4 py-2.5 font-bold text-right">{t("shifts.variance")}</th>
                  <th className="px-4 py-2.5 font-bold">{t("orders.cols.status")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const v = r.variance != null ? Number(r.variance) : null;
                  return (
                    <tr key={r.id} className="border-b border-border-soft last:border-0 hover:bg-surface-2">
                      <td className="px-4 py-3 font-mono font-medium text-primary-600">{r.code}</td>
                      <td className="px-4 py-3">{r.userName ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(r.openedAt)}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.closedAt ? formatDate(r.closedAt) : "—"}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(Number(r.openingFloat))}</td>
                      <td className="px-4 py-3 text-right font-mono">{r.expectedCash != null ? formatCurrency(Number(r.expectedCash)) : "—"}</td>
                      <td className="px-4 py-3 text-right font-mono">{r.countedCash != null ? formatCurrency(Number(r.countedCash)) : "—"}</td>
                      <td className={cn("px-4 py-3 text-right font-mono font-bold", v == null ? "text-slate-400" : v === 0 ? "text-slate-500" : v > 0 ? "text-ok" : "text-er")}>
                        {v == null ? "—" : `${v > 0 ? "+" : ""}${formatCurrency(v)}`}
                      </td>
                      <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold", r.status === "open" ? "bg-ok-soft text-ok" : "bg-surface-2 text-slate-500")}>{r.status === "open" ? t("shifts.status.open") : t("shifts.status.closed")}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
