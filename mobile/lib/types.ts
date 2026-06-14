/**
 * Type tối giản cho mobile (đọc qua Supabase PostgREST).
 * Về sau nên sinh tự động: `npx supabase gen types typescript --project-id <ref> > lib/database.types.ts`
 * rồi thay các type thủ công này.
 */
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  base_unit: string;
  cost_price: string;
  total_stock: string;
  min_stock: string;
}

/** Sản phẩm (màn Sản phẩm + chi tiết + chọn vào giỏ POS). */
export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  base_unit: string;
  cost_price: string;
  last_purchase_price: string | null;
  retail_price: string;
  wholesale_price: string | null;
  contractor_price: string | null;
  agent_price: string | null;
  total_stock: string;
  min_stock: string;
  location: string | null;
  image_urls: string[] | null;
  is_active: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
}

/** 1 dòng trong giỏ POS mobile. */
export interface CartLine {
  productId: string;
  productName: string;
  unitName: string;      // base_unit (mobile bán theo đơn vị gốc)
  unitPrice: number;     // giá đang áp (có thể theo bảng giá)
  basePrice: number;     // giá lẻ gốc (để reset khi đổi/bỏ bảng giá)
  quantity: number;
  stock: number;         // tồn hiện tại (để cảnh báo)
  m2PerUnit?: number | null; // m²/đơn vị (gạch) — để tính theo m²
}
