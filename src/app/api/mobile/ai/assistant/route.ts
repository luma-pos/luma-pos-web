import { getReports } from "@/lib/data/reports";
import { getRestockSuggestions } from "@/lib/data/ai-restock";
import { requireMobileManager } from "@/lib/mobile/auth";
import { mobileGate, mobileOk, readJson } from "@/lib/mobile/response";

export async function POST(request: Request) {
  const gate = await requireMobileManager();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const body = await readJson(request);
  const prompt =
    body && typeof body === "object" && "prompt" in body
      ? String((body as { prompt?: unknown }).prompt ?? "")
      : "";
  const [reports, restock] = await Promise.all([
    getReports(30),
    getRestockSuggestions(30),
  ]);

  return mobileOk({
    text:
      `Doanh thu 30 ngày: ${reports.summary.revenue}. ` +
      `Đã thu: ${reports.summary.collected}. ` +
      `Có ${restock.length} mặt hàng cần theo dõi nhập lại.`,
    prompt,
    actions: [
      { type: "open", target: "reports", label: "Open reports" },
      { type: "open", target: "aiRestocking", label: "Review restocking" },
    ],
    chart: {
      type: "revenueByDay",
      rows: reports.byDay,
    },
  });
}
