import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, stockLevels, stockMovements, warehouses } from "@/db/schema";
import { type ActionResult, getProfileId } from "@/lib/actions/common";
import { Routes } from "@/lib/routes";

/**
 * Tạo/sửa sản phẩm phiên bản RÚT GỌN cho mobile (các trường thiết yếu).
 * KHÔNG đụng tới web createProduct (vẫn giữ bản đầy đủ: units/attributes/NCC…).
 * Có id → sửa (không đổi tồn). Không id → tạo mới + tồn đầu vào kho mặc định.
 */
export const mobileProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  baseUnit: z.string().default("cái"),
  costPrice: z.number().min(0).default(0),
  retailPrice: z.number().min(0).default(0),
  wholesalePrice: z.number().nullable().optional(),
  contractorPrice: z.number().nullable().optional(),
  agentPrice: z.number().nullable().optional(),
  location: z.string().optional(),
  minStock: z.number().min(0).default(0),
  initialStock: z.number().min(0).default(0),
  imageUrls: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});
export type MobileProductInput = z.input<typeof mobileProductSchema>;

const money = (n: number | null | undefined) => (n == null ? null : String(n));
const genSku = () => `SP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

export async function upsertProductForUser(
  userId: string,
  input: MobileProductInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = mobileProductSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.invalidData" };
  const v = parsed.data;

  try {
    const profileId = await getProfileId(userId);

    const base = {
      name: v.name.trim(),
      barcode: v.barcode?.trim() || null,
      categoryId: v.categoryId || null,
      baseUnit: v.baseUnit || "cái",
      costPrice: String(v.costPrice),
      retailPrice: String(v.retailPrice),
      wholesalePrice: money(v.wholesalePrice),
      contractorPrice: money(v.contractorPrice),
      agentPrice: money(v.agentPrice),
      location: v.location?.trim() || null,
      imageUrls: v.imageUrls,
      isActive: v.isActive,
    };

    // ----- SỬA -----
    if (v.id) {
      await db.update(products).set({ ...base, updatedAt: sql`now()` }).where(eq(products.id, v.id));
      revalidatePath(Routes.Products);
      return { ok: true, data: { id: v.id } };
    }

    // ----- TẠO MỚI -----
    const id = await db.transaction(async (tx) => {
      const [p] = await tx.insert(products).values({
        ...base,
        sku: v.sku?.trim() || genSku(),
      }).returning({ id: products.id });

      const [wh] = await tx.select({ id: warehouses.id }).from(warehouses).where(eq(warehouses.isDefault, true)).limit(1);
      const whId = wh?.id ?? (await tx.select({ id: warehouses.id }).from(warehouses).limit(1))[0]?.id;
      if (whId) {
        await tx.insert(stockLevels).values({
          productId: p.id, warehouseId: whId,
          quantity: String(v.initialStock), minLevel: String(v.minStock),
        });
        if (v.initialStock > 0) {
          await tx.insert(stockMovements).values({
            productId: p.id, warehouseId: whId, type: "init",
            quantity: String(v.initialStock), unitCost: String(v.costPrice),
            refType: "product_init", refId: p.id, note: "Tồn đầu (mobile)", createdBy: profileId,
          });
        }
      }
      return p.id;
    });

    revalidatePath(Routes.Products);
    return { ok: true, data: { id } };
  } catch (e) {
    const cause = (e as { cause?: { code?: string } }).cause;
    if (cause?.code === "23505") return { ok: false, error: "products.errors.skuExists" };
    console.error("upsertProduct (mobile) failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}
