"use server";

import { searchPurchaseProductRows, type PurchaseProductRow } from "@/lib/data/inventory";
import { createClient } from "@/lib/supabase/server";

/** Tìm sản phẩm cho phiếu nhập (server-side, bỏ dấu, quét toàn bộ). */
export async function searchPurchaseProducts(q: string): Promise<PurchaseProductRow[]> {
  if (!q.trim()) return [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return searchPurchaseProductRows(q.trim());
}
