import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { customerConsentEvents, customerConsents } from "@/db/schema";
import { type ActionResult, getProfileId } from "@/lib/actions/common";

const consentStatusSchema = z.enum(["pending", "granted", "withdrawn"]);

const updateCustomerConsentSchema = z.object({
  status: consentStatusSchema.optional(),
  purposes: z.record(z.string(), z.boolean()).default({}),
  source: z.string().trim().max(40).default("mobile"),
  note: z.string().trim().optional(),
});

export type UpdateCustomerConsentInput = z.input<
  typeof updateCustomerConsentSchema
>;

function normalizeConsent(input: z.output<typeof updateCustomerConsentSchema>) {
  const status =
    input.status ??
    (Object.values(input.purposes).some(Boolean) ? "granted" : "withdrawn");
  const purposes =
    status === "withdrawn"
      ? Object.fromEntries(Object.keys(input.purposes).map((key) => [key, false]))
      : input.purposes;

  return {
    status,
    purposes,
    source: input.source || "mobile",
    note: input.note || null,
  };
}

export async function updateCustomerConsentCore(
  customerId: string,
  input: UpdateCustomerConsentInput,
  userId: string,
): Promise<ActionResult<{ status: string; purposes: Record<string, boolean> }>> {
  const parsed = updateCustomerConsentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.invalidData" };

  const normalized = normalizeConsent(parsed.data);

  try {
    const profileId = await getProfileId(userId);

    await db.transaction(async (tx) => {
      await tx
        .insert(customerConsents)
        .values({
          customerId,
          status: normalized.status,
          purposes: normalized.purposes,
          source: normalized.source,
          note: normalized.note,
          updatedBy: profileId,
        })
        .onConflictDoUpdate({
          target: customerConsents.customerId,
          set: {
            status: normalized.status,
            purposes: normalized.purposes,
            source: normalized.source,
            note: normalized.note,
            updatedBy: profileId,
            updatedAt: sql`now()`,
          },
        });

      await tx.insert(customerConsentEvents).values({
        customerId,
        status: normalized.status,
        purposes: normalized.purposes,
        source: normalized.source,
        note: normalized.note,
        createdBy: profileId,
      });
    });

    return {
      ok: true,
      data: {
        status: normalized.status,
        purposes: normalized.purposes,
      },
    };
  } catch (e) {
    console.error("updateCustomerConsentCore failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}
