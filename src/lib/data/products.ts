import { and, asc, count, desc, eq, or, sql, type SQL } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { brands, categories, products, productUnits, productSuppliers, stockLevels, suppliers } from "@/db/schema";
import { accentInsensitiveLike } from "@/lib/search";
import { coercePageSize, DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export const PRODUCTS_PAGE_SIZE = 20;

/** active = chỉ đang bán (mặc định), inactive = ngừng bán, all = tất cả. */
export type ProductStatusFilter = "active" | "inactive" | "all";

export interface ProductListFilters {
  q?: string;
  categoryId?: string;
  status?: ProductStatusFilter;
  page?: number;
  pageSize?: number;
}

export async function getProducts(filters: ProductListFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const size = coercePageSize(filters.pageSize, DEFAULT_PAGE_SIZE);
  const status: ProductStatusFilter = filters.status ?? "active";
  const conditions: SQL[] = [];

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    const search = or(
      accentInsensitiveLike(products.name, q),
      accentInsensitiveLike(products.sku, q),
      accentInsensitiveLike(products.barcode, q)
    );
    if (search) conditions.push(search);
  }
  if (filters.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  // mặc định ẩn SP ngừng bán (gồm cả placeholder hàng đã xóa từ KiotViet)
  if (status === "active") conditions.push(eq(products.isActive, true));
  else if (status === "inactive") conditions.push(eq(products.isActive, false));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: products.id,
        sku: products.sku,
        barcode: products.barcode,
        name: products.name,
        baseUnit: products.baseUnit,
        costPrice: products.costPrice,
        lastPurchasePrice: products.lastPurchasePrice,
        retailPrice: products.retailPrice,
        wholesalePrice: products.wholesalePrice,
        contractorPrice: products.contractorPrice,
        agentPrice: products.agentPrice,
        isActive: products.isActive,
        createdAt: products.createdAt,
        categoryName: categories.name,
        totalStock: sql<string>`coalesce(sum(${stockLevels.quantity}), 0)`,
        minLevel: sql<string>`coalesce(max(${stockLevels.minLevel}), 0)`,
        unitNames: sql<string | null>`(
          select string_agg(${productUnits.unitName}, ', ' order by ${productUnits.sortOrder})
          from ${productUnits} where ${productUnits.productId} = ${products.id}
        )`,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(stockLevels, eq(stockLevels.productId, products.id))
      .where(where)
      .groupBy(products.id, categories.name)
      .orderBy(desc(products.createdAt))
      .limit(size)
      .offset((page - 1) * size),
    db.select({ total: count() }).from(products).where(where),
  ]);

  return {
    rows,
    total,
    page,
    pageSize: size,
    pageCount: Math.max(1, Math.ceil(total / size)),
  };
}

/** Chi tiết 1 SP cho trang xem/sửa (gồm đơn vị quy đổi + tồn kho). */
export async function getProduct(id: string) {
  const [p] = await db
    .select({
      id: products.id,
      sku: products.sku,
      barcode: products.barcode,
      name: products.name,
      description: products.description,
      categoryId: products.categoryId,
      brandId: products.brandId,
      supplierId: products.supplierId,
      categoryName: categories.name,
      brandName: brands.name,
      supplierName: suppliers.name,
      baseUnit: products.baseUnit,
      costPrice: products.costPrice,
      retailPrice: products.retailPrice,
      wholesalePrice: products.wholesalePrice,
      contractorPrice: products.contractorPrice,
      agentPrice: products.agentPrice,
      location: products.location,
      weight: products.weight,
      specs: products.specs,
      imageUrls: products.imageUrls,
      isActive: products.isActive,
      createdAt: products.createdAt,
      totalStock: sql<string>`(select coalesce(sum(${stockLevels.quantity}),0) from ${stockLevels} where ${stockLevels.productId} = ${products.id})`,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .where(eq(products.id, id))
    .limit(1);
  if (!p) return null;

  const units = await db
    .select({
      unitName: productUnits.unitName,
      multiplier: productUnits.multiplier,
      barcode: productUnits.barcode,
      priceOverride: productUnits.priceOverride,
    })
    .from(productUnits)
    .where(eq(productUnits.productId, id))
    .orderBy(asc(productUnits.sortOrder));

  // nhiều NCC (chính trước)
  const supplierRows = await db
    .select({ id: productSuppliers.supplierId, name: suppliers.name, isPrimary: productSuppliers.isPrimary })
    .from(productSuppliers)
    .leftJoin(suppliers, eq(productSuppliers.supplierId, suppliers.id))
    .where(eq(productSuppliers.productId, id))
    .orderBy(desc(productSuppliers.isPrimary));

  return { ...p, units, suppliers: supplierRows };
}
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

// Danh mục/thương hiệu/NCC cho dropdown — cache 60s (ít thay đổi), dùng chung
// nhiều trang (Sản phẩm, Thiết lập giá, Tồn kho) → đỡ query lặp.
export const getProductFormOptions = unstable_cache(
  async () => {
    const [cats, brandRows, supplierRows] = await Promise.all([
      db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
      db.select({ id: brands.id, name: brands.name }).from(brands).orderBy(asc(brands.name)),
      db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers).orderBy(asc(suppliers.name)),
    ]);
    return { categories: cats, brands: brandRows, suppliers: supplierRows };
  },
  ["product-form-options"],
  { revalidate: 60 }
);

export type ProductListResult = Awaited<ReturnType<typeof getProducts>>;
export type ProductFormOptions = Awaited<ReturnType<typeof getProductFormOptions>>;
