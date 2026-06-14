"use server";

import { searchPosProductRows } from "@/lib/data/pos";
import { createClient } from "@/lib/supabase/server";
import type { PosProduct } from "@/lib/data/pos";

/** Tìm sản phẩm cho POS (server-side, bỏ dấu). Trả [] nếu query rỗng. */
export async function searchPosProducts(q: string): Promise<PosProduct[]> {
  if (!q.trim()) return [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return searchPosProductRows(q.trim());
}
