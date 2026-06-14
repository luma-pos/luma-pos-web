import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";

export interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  productCount: number;
}

/** Danh mục kèm số SP (đếm trực tiếp theo categoryId, không gộp con). */
export async function getCategoriesWithCounts(): Promise<CategoryNode[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      parentId: categories.parentId,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return rows.map((r) => ({ ...r, productCount: Number(r.productCount) }));
}
