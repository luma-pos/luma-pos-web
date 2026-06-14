import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { stockLevels, stockMovements, stocktakeItems, stocktakes } from "@/db/schema";
import { type ActionResult, getProfileId, generateCode, toQty } from "@/lib/actions/common";
import { Routes } from "@/lib/routes";

export const mobileStocktakeSchema = z.object({
  warehouseId: z.uuid(),
  note: z.string().optional(),
  balanceNow: z.boolean().default(true),
  items: z.array(z.object({ productId: z.uuid(), actualQty: z.number().min(0) })).min(1),
});
export type MobileStocktakeInput = z.input<typeof mobileStocktakeSchema>;

/** Tạo phiếu kiểm kho + (tùy chọn) cân bằng kho ngay — gộp 1 transaction. */
export async function createStocktakeForUser(
  userId: string,
  input: MobileStocktakeInput
): Promise<ActionResult<{ id: string; code: string }>> {
  const parsed = mobileStocktakeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.invalidData" };
  const v = parsed.data;

  const ids = v.items.map((i) => i.productId);
  if (new Set(ids).size !== ids.length) return { ok: false, error: "errors.invalidData" };

  try {
    const profileId = await getProfileId(userId);

    const result = await db.transaction(async (tx) => {
      const [st] = await tx.insert(stocktakes).values({
        code: generateCode("KK"),
        warehouseId: v.warehouseId,
        status: v.balanceNow ? "balanced" : "draft",
        note: v.note || null,
        balancedAt: v.balanceNow ? sql`now()` : null,
        createdBy: profileId,
      }).returning({ id: stocktakes.id, code: stocktakes.code });

      const levels = await tx
        .select({ productId: stockLevels.productId, quantity: stockLevels.quantity })
        .from(stockLevels)
        .where(and(eq(stockLevels.warehouseId, v.warehouseId), inArray(stockLevels.productId, ids)));
      const sysByProduct = new Map(levels.map((l) => [l.productId, Number(l.quantity)]));

      await tx.insert(stocktakeItems).values(
        v.items.map((i) => ({
          stocktakeId: st.id,
          productId: i.productId,
          systemQty: toQty(sysByProduct.get(i.productId) ?? 0),
          actualQty: toQty(i.actualQty),
        }))
      );

      if (v.balanceNow) {
        for (const i of v.items) {
          const current = sysByProduct.get(i.productId) ?? 0;
          const diff = i.actualQty - current;
          await tx.insert(stockLevels)
            .values({ productId: i.productId, warehouseId: v.warehouseId, quantity: toQty(i.actualQty) })
            .onConflictDoUpdate({
              target: [stockLevels.productId, stockLevels.warehouseId],
              set: { quantity: toQty(i.actualQty), updatedAt: sql`now()` },
            });
          if (Math.abs(diff) > 1e-9) {
            await tx.insert(stockMovements).values({
              productId: i.productId, warehouseId: v.warehouseId, type: "adjust",
              quantity: toQty(diff), refType: "stocktake", refId: st.id,
              note: `${st.code} · cân bằng kho`, createdBy: profileId,
            });
          }
        }
      }
      return st;
    });

    revalidatePath(Routes.Stocktakes);
    revalidatePath(Routes.Inventory);
    return { ok: true, data: result };
  } catch (e) {
    console.error("createStocktake (core) failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}
