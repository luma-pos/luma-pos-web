"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { trips, tripStops } from "@/db/schema";
import { type ActionResult, requireUser, getProfileId, generateCode } from "./common";
import { Routes } from "@/lib/routes";

const createTripSchema = z.object({
  vehicle: z.string().min(1, { error: "validation.required" }),
  driver: z.string().min(1, { error: "validation.required" }),
  note: z.string().optional(),
  orderIds: z.array(z.uuid()).min(1, { error: "delivery.errors.needOrders" }).max(20),
});
export type CreateTripInput = z.input<typeof createTripSchema>;

export async function createTrip(input: CreateTripInput): Promise<ActionResult<{ id: string }>> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: "errors.unauthorized" };
  }
  const parsed = createTripSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.invalidData" };
  const v = parsed.data;

  try {
    const profileId = await getProfileId(userId);
    const result = await db.transaction(async (tx) => {
      const [trip] = await tx.insert(trips).values({
        code: generateCode("CX"),
        vehicle: v.vehicle,
        driver: v.driver,
        status: "planned",
        note: v.note || null,
        createdBy: profileId,
      }).returning({ id: trips.id });

      await tx.insert(tripStops).values(
        v.orderIds.map((orderId, i) => ({ tripId: trip.id, orderId, sortOrder: i }))
      );
      return trip;
    });
    revalidatePath(Routes.Delivery);
    return { ok: true, data: result };
  } catch (e) {
    console.error("createTrip failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}

export async function startTrip(tripId: string): Promise<ActionResult> {
  try {
    await requireUser();
  } catch {
    return { ok: false, error: "errors.unauthorized" };
  }
  try {
    await db.update(trips).set({ status: "ongoing", departAt: sql`now()` }).where(eq(trips.id, tripId));
    revalidatePath(Routes.Delivery);
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("startTrip failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}

export async function markStopDelivered(stopId: string): Promise<ActionResult> {
  try {
    await requireUser();
  } catch {
    return { ok: false, error: "errors.unauthorized" };
  }
  try {
    await db.transaction(async (tx) => {
      const [stop] = await tx.update(tripStops)
        .set({ status: "delivered", deliveredAt: sql`now()` })
        .where(eq(tripStops.id, stopId))
        .returning({ tripId: tripStops.tripId });
      if (!stop) throw new Error("STOP_NOT_FOUND");

      // tất cả điểm xong → chuyến done
      const [pending] = await tx
        .select({ c: sql<number>`count(*)::int` })
        .from(tripStops)
        .where(sql`${tripStops.tripId} = ${stop.tripId} and ${tripStops.status} != 'delivered'`);
      if (pending.c === 0) {
        await tx.update(trips).set({ status: "done" }).where(eq(trips.id, stop.tripId));
      } else {
        await tx.update(trips).set({ status: "ongoing" }).where(eq(trips.id, stop.tripId));
      }
    });
    revalidatePath(Routes.Delivery);
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("markStopDelivered failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}
