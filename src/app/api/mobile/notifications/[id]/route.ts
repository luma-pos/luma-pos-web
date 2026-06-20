import { sql } from "drizzle-orm";
import { getProfileId } from "@/lib/actions/common";
import { db } from "@/db";
import { mobileNotificationStates } from "@/db/schema";
import { requireMobileUser } from "@/lib/mobile/auth";
import { mobileGate, mobileOk, readJson } from "@/lib/mobile/response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireMobileUser();
  if (!gate.ok) return mobileGate(gate);

  const { id } = await params;
  const body = await readJson(request);
  const profileId = await getProfileId(gate.userId);
  const stateUserId = profileId ?? gate.userId;
  const payload = body && typeof body === "object"
    ? body as { read?: unknown; dismissed?: unknown }
    : {};
  const read = payload.read !== false;
  const dismissed = payload.dismissed === true;

  await db
    .insert(mobileNotificationStates)
    .values({
      userId: stateUserId,
      notificationId: id,
      read,
      dismissed,
    })
    .onConflictDoUpdate({
      target: [
        mobileNotificationStates.userId,
        mobileNotificationStates.notificationId,
      ],
      set: {
        read,
        dismissed,
        updatedAt: sql`now()`,
      },
    });

  return mobileOk({
    id,
    applied: { read, dismissed, ...(body && typeof body === "object" ? body : {}) },
  });
}
