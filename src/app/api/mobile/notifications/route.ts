import { getProfileId } from "@/lib/actions/common";
import { getRestockSuggestions } from "@/lib/data/ai-restock";
import { getCurrentShift } from "@/lib/data/shifts";
import { getStoreSettings } from "@/lib/data/settings";
import { requireMobileUser } from "@/lib/mobile/auth";
import { mobileGate, mobileOk } from "@/lib/mobile/response";

export async function GET() {
  const gate = await requireMobileUser();
  if (!gate.ok) return mobileGate(gate)!;

  const profileId = await getProfileId(gate.userId);
  const [store, restock, shift] = await Promise.all([
    getStoreSettings(),
    getRestockSuggestions(30),
    getCurrentShift(profileId ?? gate.userId),
  ]);
  const rows = [
    ...restock.slice(0, 10).map((row) => ({
      id: `restock-${row.id}`,
      category: "lowStock",
      title: row.name,
      body: `Tồn ${row.stock} ${row.baseUnit}, bán TB ${row.velocity.toFixed(1)}/ngày`,
      unread: true,
      priority: row.priority,
      action: { type: "open", target: "aiRestocking", id: row.id },
    })),
    {
      id: shift ? `shift-${shift.id}` : "shift-open",
      category: "shiftClose",
      title: shift ? "Ca đang mở" : "Chưa mở ca",
      body: shift
        ? `Ca ${shift.code} mở từ ${shift.openedAt.toISOString()}`
        : "Mở ca trước khi bán hàng để chốt quỹ chính xác.",
      unread: !shift,
      priority: shift ? "low" : "medium",
      action: { type: "open", target: "shift" },
    },
  ];

  return mobileOk({
    rows,
    counts: {
      all: rows.length,
      unread: rows.filter((row) => row.unread).length,
      lowStock: restock.length,
      shiftClose: 1,
    },
    settings: store.prefs.notifications,
  });
}
