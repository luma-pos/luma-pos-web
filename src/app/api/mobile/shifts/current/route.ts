import { getProfileId } from "@/lib/actions/common";
import { getCurrentShift, shiftExpectedCash } from "@/lib/data/shifts";
import { requireMobileUser } from "@/lib/mobile/auth";
import { mobileGate, mobileOk } from "@/lib/mobile/response";

export async function GET() {
  const gate = await requireMobileUser();
  if (!gate.ok) return mobileGate(gate)!;

  const profileId = await getProfileId(gate.userId);
  const shift = await getCurrentShift(profileId ?? gate.userId);
  const expectedCash = shift
    ? await shiftExpectedCash(Number(shift.openingFloat), shift.openedAt)
    : null;

  return mobileOk({
    shift,
    expectedCash,
  });
}
