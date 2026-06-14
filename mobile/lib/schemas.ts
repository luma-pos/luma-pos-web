import { z } from "zod";

/* ============================================================
   Zod schemas — dùng chung kiểu xác thực như web.
   - createOrderSchema: validate payload TRƯỚC khi gửi API (mirror web).
   - *Row: parse dữ liệu Supabase (decimal trả về dạng string → ép number).
   ============================================================ */

// ---- helpers: decimal Postgres trả về string ----
const dec = z.union([z.string(), z.number()]).transform((v) => Number(v));
const decN = z
  .union([z.string(), z.number()])
  .nullable()
  .transform((v) => (v == null ? null : Number(v)));

// ---- Tạo đơn: DÙNG LẠI schema thuần zod của web (single source of truth) ----
// File web chỉ import "zod" nên chia sẻ an toàn. Metro bundle được nhờ metro.config.js
// (watchFolders trỏ về repo gốc). Sửa schema 1 nơi → cả web lẫn mobile cùng đổi.
export {
  orderItemSchema,
  createOrderSchema,
  addPaymentSchema,
  createPurchaseSchema,
  updateOrderSchema,
  mergeOrdersSchema,
  type CreateOrderInput,
  type CreateOrderOutput,
  type AddPaymentInput,
  type CreatePurchaseInput,
  type UpdateOrderInput,
} from "../../src/lib/schemas/order";

export {
  createReturnSchema,
  type CreateReturnInput,
} from "../../src/lib/schemas/returns";

// ---- Tạo/sửa sản phẩm (mobile, rút gọn — khớp src/lib/products/write.ts) ----
export const mobileProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { error: "Tên sản phẩm bắt buộc" }),
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

// ---- Kiểm kho (mobile — khớp src/lib/stocktakes/create.ts) ----
export const mobileStocktakeSchema = z.object({
  warehouseId: z.uuid(),
  note: z.string().optional(),
  balanceNow: z.boolean().default(true),
  items: z.array(z.object({ productId: z.uuid(), actualQty: z.number().min(0) })).min(1, { error: "Chưa có sản phẩm" }),
});
export type MobileStocktakeInput = z.input<typeof mobileStocktakeSchema>;

// ---- Nhóm hàng (picker khi tạo SP) ----
export const categorySchema = z.object({ id: z.string(), name: z.string() });
export type Category = z.infer<typeof categorySchema>;

// ---- Row: Sản phẩm ----
export const productSchema = z.object({
  id: z.string(),
  sku: z.string(),
  barcode: z.string().nullable().optional(),
  name: z.string(),
  base_unit: z.string(),
  cost_price: dec,
  last_purchase_price: decN.optional(),
  retail_price: dec,
  wholesale_price: decN.optional(),
  contractor_price: decN.optional(),
  agent_price: decN.optional(),
  total_stock: dec,
  min_stock: dec,
  location: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  image_urls: z.array(z.string()).nullable().optional(),
  m2_per_unit: decN.optional(),
});
export type Product = z.infer<typeof productSchema>;

/** URL ảnh đầu tiên của sản phẩm (nếu có). */
export const firstImage = (p: { image_urls?: string[] | null }) =>
  p.image_urls && p.image_urls.length > 0 ? p.image_urls[0] : null;

// ---- Row: Khách hàng ----
export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  current_debt: dec,
  total_spent: dec.optional(),
  type: z.string().nullable().optional(), // retail | wholesale | contractor | agent
});
export type Customer = z.infer<typeof customerSchema>;

// ---- Row: Đơn hàng (kèm tên khách qua embed) ----
export const orderSchema = z.object({
  id: z.string(),
  code: z.string(),
  total: dec,
  amount_paid: dec.optional(),
  status: z.string(),
  payment_status: z.string(),
  created_at: z.string(),
  customer_id: z.string().nullable().optional(),
  customers: z.object({ name: z.string() }).nullable().optional(),
});
export type Order = z.infer<typeof orderSchema>;

export const warehouseSchema = z.object({ id: z.string(), name: z.string() });
export type Warehouse = z.infer<typeof warehouseSchema>;

export const priceBookSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_default: z.boolean().optional(),
  sort_order: z.number().optional(),
});
export type PriceBook = z.infer<typeof priceBookSchema>;

// ---- Nhà cung cấp ----
export const supplierSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  tax_code: z.string().nullable().optional(),
  current_debt: dec,
});
export type Supplier = z.infer<typeof supplierSchema>;

// ---- Giao dịch sổ quỹ ----
export const cashTxSchema = z.object({
  id: z.string(),
  code: z.string(),
  type: z.string(),       // in | out
  fund: z.string(),
  amount: dec,
  category: z.string(),
  note: z.string().nullable().optional(),
  created_at: z.string(),
});
export type CashTx = z.infer<typeof cashTxSchema>;

// ---- Dòng hàng trong đơn ----
export const orderLineSchema = z.object({
  id: z.string(),
  product_id: z.string().nullable().optional(),
  product_name: z.string(),
  unit_name: z.string(),
  quantity: dec,
  unit_price: dec,
  total: dec,
});
export type OrderLine = z.infer<typeof orderLineSchema>;

// ---- Chi tiết đơn (đơn + dòng hàng + khách) ----
export const orderDetailSchema = orderSchema.extend({
  subtotal: dec.optional(),
  discount: dec.optional(),
  shipping_fee: dec.optional(),
  note: z.string().nullable().optional(),
  order_items: z.array(orderLineSchema).default([]),
  customers: z.object({ name: z.string(), phone: z.string().nullable().optional() }).nullable().optional(),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

/** Parse mảng an toàn: bỏ qua dòng lỗi thay vì sập toàn bộ. */
export function parseRows<T>(schema: z.ZodType<T>, rows: unknown[]): T[] {
  const out: T[] = [];
  for (const r of rows) {
    const p = schema.safeParse(r);
    if (p.success) out.push(p.data);
  }
  return out;
}
