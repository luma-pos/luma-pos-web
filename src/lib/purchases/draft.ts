import { desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  products,
  productSuppliers,
  purchaseOrderItems,
  purchaseOrders,
  suppliers,
  warehouses,
} from "@/db/schema";
import {
  generateCode,
  getProfileId,
  toMoney,
  toQty,
  type ActionResult,
} from "@/lib/actions/common";

const draftPurchaseItemSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().positive(),
  unitCost: z.number().min(0).optional(),
  discount: z.number().min(0).default(0),
});

const createDraftPurchaseSchema = z.object({
  supplierId: z.uuid().optional(),
  warehouseId: z.uuid().optional(),
  note: z.string().trim().optional(),
  items: z.array(draftPurchaseItemSchema).min(1),
});

export type CreateDraftPurchaseInput = z.input<
  typeof createDraftPurchaseSchema
>;

async function defaultWarehouseId() {
  const [warehouse] = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .orderBy(desc(warehouses.isDefault))
    .limit(1);
  return warehouse?.id ?? null;
}

async function defaultSupplierId(productIds: string[]) {
  const [primary] = await db
    .select({ id: productSuppliers.supplierId })
    .from(productSuppliers)
    .where(inArray(productSuppliers.productId, productIds))
    .orderBy(desc(productSuppliers.isPrimary))
    .limit(1);
  if (primary) return primary.id;

  const [fallback] = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .orderBy(desc(suppliers.createdAt))
    .limit(1);
  return fallback?.id ?? null;
}

export async function createDraftPurchaseForUser(
  userId: string,
  input: CreateDraftPurchaseInput,
): Promise<ActionResult<{ id: string; code: string }>> {
  const parsed = createDraftPurchaseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.invalidData" };
  const v = parsed.data;
  const productIds = [...new Set(v.items.map((item) => item.productId))];

  try {
    const [productRows, warehouseId, supplierId, profileId] = await Promise.all([
      db
        .select({
          id: products.id,
          costPrice: products.costPrice,
          lastPurchasePrice: products.lastPurchasePrice,
        })
        .from(products)
        .where(inArray(products.id, productIds)),
      v.warehouseId ? Promise.resolve(v.warehouseId) : defaultWarehouseId(),
      v.supplierId ? Promise.resolve(v.supplierId) : defaultSupplierId(productIds),
      getProfileId(userId),
    ]);

    if (!warehouseId || !supplierId || productRows.length !== productIds.length) {
      return { ok: false, error: "errors.invalidData" };
    }

    const productById = new Map(productRows.map((row) => [row.id, row]));
    const lines = v.items.map((item) => {
      const product = productById.get(item.productId);
      const unitCost =
        item.unitCost ??
        Number(product?.lastPurchasePrice ?? product?.costPrice ?? 0);
      const total = Math.max(0, item.quantity * unitCost - item.discount);
      return { ...item, unitCost, total };
    });
    const subtotal = lines.reduce((sum, item) => sum + item.total, 0);

    const result = await db.transaction(async (tx) => {
      const [po] = await tx
        .insert(purchaseOrders)
        .values({
          code: generateCode("PN"),
          supplierId,
          warehouseId,
          status: "draft",
          subtotal: toMoney(subtotal),
          total: toMoney(subtotal),
          amountPaid: "0",
          note: v.note || "Draft from mobile AI restocking",
          createdBy: profileId,
        })
        .returning({ id: purchaseOrders.id, code: purchaseOrders.code });

      await tx.insert(purchaseOrderItems).values(
        lines.map((item) => ({
          purchaseOrderId: po.id,
          productId: item.productId,
          quantity: toQty(item.quantity),
          unitCost: toMoney(item.unitCost),
          discount: toMoney(item.discount),
          total: toMoney(item.total),
        })),
      );

      return po;
    });

    return { ok: true, data: result };
  } catch (e) {
    console.error("createDraftPurchaseForUser failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}
