import { getProfileId } from "@/lib/actions/common";
import { db } from "@/db";
import { mobileNotificationStates } from "@/db/schema";
import { getRestockSuggestions } from "@/lib/data/ai-restock";
import { getCurrentShift } from "@/lib/data/shifts";
import { getStoreSettings } from "@/lib/data/settings";
import { requireMobileUser } from "@/lib/mobile/auth";
import { mobileGate, mobileOk } from "@/lib/mobile/response";
import { and, eq, inArray } from "drizzle-orm";

export async function GET() {
  const gate = await requireMobileUser();
  if (!gate.ok) return mobileGate(gate)!;

  const profileId = await getProfileId(gate.userId);
  const [store, restock, shift] = await Promise.all([
    getStoreSettings(),
    getRestockSuggestions(30),
    getCurrentShift(profileId ?? gate.userId),
  ]);
  const stateUserId = profileId ?? gate.userId;
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
  const ids = rows.map((row) => row.id);
  const states = ids.length
    ? await db
        .select({
          notificationId: mobileNotificationStates.notificationId,
          read: mobileNotificationStates.read,
          dismissed: mobileNotificationStates.dismissed,
        })
        .from(mobileNotificationStates)
        .where(
          and(
            eq(mobileNotificationStates.userId, stateUserId),
            inArray(mobileNotificationStates.notificationId, ids)
          )
        )
    : [];
  const stateById = new Map(states.map((state) => [state.notificationId, state]));
  const visibleRows = rows
    .filter((row) => stateById.get(row.id)?.dismissed !== true)
    .map((row) => ({
      ...row,
      unread: row.unread && stateById.get(row.id)?.read !== true,
    }));

  return mobileOk({
    rows: visibleRows,
    counts: {
      all: visibleRows.length,
      unread: visibleRows.filter((row) => row.unread).length,
      lowStock: restock.length,
      shiftClose: 1,
    },
    settings: store.prefs.notifications,
  });
}
