"use server";

import { getPurchaseProductRowsByIds, searchPurchaseProductRows, type PurchaseProductRow } from "@/lib/data/inventory";
import { createClient } from "@/lib/supabase/server";

/** Tìm sản phẩm cho phiếu nhập (server-side, bỏ dấu, quét toàn bộ). */
export async function searchPurchaseProducts(q: string): Promise<PurchaseProductRow[]> {
  if (!q.trim()) return [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return searchPurchaseProductRows(q.trim());
}

export async function getPurchaseProductsByIds(ids: string[]): Promise<PurchaseProductRow[]> {
  const safeIds = ids.filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(id));
  if (safeIds.length === 0) return [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return getPurchaseProductRowsByIds(safeIds);
}
