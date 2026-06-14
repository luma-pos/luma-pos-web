/* Smoke test: schema migration + createProduct transaction logic + getProducts query
   on PGlite (in-process Postgres). No external DB touched. */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { and, count, desc, eq, ilike, or, sql as dsql } from "drizzle-orm";

const PROJ = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const schema = await import(`${PROJ}/src/db/schema.ts`);
const { products, productUnits, stockLevels, stockMovements, warehouses, categories, brands } = schema;

const client = new PGlite();
const db = drizzle(client, { schema });

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
};

// ---------- 1. Apply project migration ----------
console.log("1) Apply migration drizzle/0000_*.sql");
const { readdirSync } = await import("node:fs");
for (const f of readdirSync(`${PROJ}/drizzle`).filter((x) => x.endsWith(".sql")).sort()) {
  for (const stmt of readFileSync(`${PROJ}/drizzle/${f}`, "utf8").split("--> statement-breakpoint")) {
    const s = stmt.trim();
    if (s && !/create extension/i.test(s)) await client.exec(s); // PGlite khong co unaccent
  }
}
ok("migration applied", true);

// ---------- 2. Seed (giống db:seed) ----------
await db.insert(warehouses).values({ name: "Kho chính", isDefault: true });
const [cat] = await db.insert(categories).values({ name: "Gạch ốp lát" }).returning();
const [brand] = await db.insert(brands).values({ name: "Đồng Tâm" }).returning();
ok("seed warehouse/category/brand", !!cat.id && !!brand.id);

// ---------- 3. createProduct transaction (đúng các bước trong action) ----------
console.log("2) createProduct transaction");
const v = {
  sku: "DT6060", barcode: "8934567001234", name: "Gạch lát 60×60 Đồng Tâm DT6060",
  categoryId: cat.id, brandId: brand.id, baseUnit: "viên",
  costPrice: 57750, retailPrice: 72000, contractorPrice: 66000,
  width: 600, length: 600, dimUnit: "mm",
  initialStock: 48, minLevel: 200,
  units: [
    { unitName: "hộp", multiplier: 4, priceOverride: 285000 },
    { unitName: "m²", multiplier: 2.78, priceOverride: 198000 },
  ],
};
const m2 = (600 * 0.001 * (600 * 0.001)).toFixed(4); // logic computeM2PerUnit

const result = await db.transaction(async (tx) => {
  const [p] = await tx.insert(products).values({
    sku: v.sku, barcode: v.barcode, name: v.name,
    categoryId: v.categoryId, brandId: v.brandId, baseUnit: v.baseUnit,
    costPrice: String(v.costPrice), retailPrice: String(v.retailPrice),
    contractorPrice: String(v.contractorPrice),
    m2PerUnit: m2, dimensions: "600×600mm", imageUrls: [], isActive: true,
  }).returning({ id: products.id });

  await tx.insert(productUnits).values(v.units.map((u, i) => ({
    productId: p.id, unitName: u.unitName, multiplier: String(u.multiplier),
    priceOverride: String(u.priceOverride), sortOrder: i,
  })));

  const [wh] = await tx.select({ id: warehouses.id }).from(warehouses)
    .where(eq(warehouses.isDefault, true)).limit(1);
  await tx.insert(stockLevels).values({
    productId: p.id, warehouseId: wh.id,
    quantity: String(v.initialStock), minLevel: String(v.minLevel),
  });
  await tx.insert(stockMovements).values({
    productId: p.id, warehouseId: wh.id, type: "init",
    quantity: String(v.initialStock), unitCost: String(v.costPrice),
    refType: "product_init", refId: p.id, note: "Tồn đầu khi tạo sản phẩm",
  });
  return p;
});
ok("product inserted", !!result.id);

const unitRows = await db.select().from(productUnits).where(eq(productUnits.productId, result.id));
ok("2 product_units saved", unitRows.length === 2, `got ${unitRows.length}`);
const [sl] = await db.select().from(stockLevels).where(eq(stockLevels.productId, result.id));
ok("stock_levels = 48, min 200", Number(sl.quantity) === 48 && Number(sl.minLevel) === 200);
const mv = await db.select().from(stockMovements).where(eq(stockMovements.productId, result.id));
ok("stock_movements 'init' logged", mv.length === 1 && mv[0].type === "init");

// SKU trùng phải fail — check theo cách action bắt lỗi (e.cause.code 23505)
let dupCaught = false;
try {
  await db.insert(products).values({ sku: "DT6060", name: "x", costPrice: "0", retailPrice: "0" });
} catch (e) {
  const cause = e.cause ?? e;
  dupCaught = cause?.code === "23505" || String(cause?.message).includes("duplicate");
}
ok("duplicate SKU rejected (detect via e.cause)", dupCaught);

// ---------- 4. getProducts query (copy đúng từ src/lib/data/products.ts) ----------
console.log("3) getProducts query");
// thêm 1 SP nữa không tồn kho để test aggregate
await db.insert(products).values({ sku: "HT-PCB40", name: "Xi măng Hà Tiên PCB40", baseUnit: "bao", costPrice: "84500", retailPrice: "92000" });

async function getProducts(filters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const conditions = [];
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(or(ilike(products.name, term), ilike(products.sku, term), ilike(products.barcode, term)));
  }
  if (filters.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: products.id, sku: products.sku, name: products.name, baseUnit: products.baseUnit,
      retailPrice: products.retailPrice, isActive: products.isActive,
      categoryName: categories.name,
      totalStock: dsql`coalesce(sum(${stockLevels.quantity}), 0)`,
      minLevel: dsql`coalesce(max(${stockLevels.minLevel}), 0)`,
      unitNames: dsql`(select string_agg(${productUnits.unitName}, ', ' order by ${productUnits.sortOrder}) from ${productUnits} where ${productUnits.productId} = ${products.id})`,
    }).from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(stockLevels, eq(stockLevels.productId, products.id))
      .where(where).groupBy(products.id, categories.name)
      .orderBy(desc(products.createdAt)).limit(20).offset((page - 1) * 20),
    db.select({ total: count() }).from(products).where(where),
  ]);
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / 20)) };
}

const all = await getProducts();
ok("list returns 2 products", all.total === 2, `got ${all.total}`);
const gach = all.rows.find((r) => r.sku === "DT6060");
ok("aggregate stock = 48", Number(gach.totalStock) === 48, `got ${gach?.totalStock}`);
ok("unitNames = 'hộp, m²'", gach.unitNames === "hộp, m²", `got '${gach?.unitNames}'`);
ok("category joined", gach.categoryName === "Gạch ốp lát");
ok("low-stock detectable (48 <= min 200)", Number(gach.totalStock) <= Number(gach.minLevel));

const searched = await getProducts({ q: "hà tiên" });
ok("search 'hà tiên' → 1 (ilike unicode)", searched.total === 1, `got ${searched.total}`);
const bySku = await getProducts({ q: "dt60" });
ok("search by sku 'dt60' → 1", bySku.total === 1, `got ${bySku.total}`);
const byCat = await getProducts({ categoryId: cat.id });
ok("filter by category → 1", byCat.total === 1, `got ${byCat.total}`);
const none = await getProducts({ q: "khongtontai" });
ok("no result + pageCount=1", none.total === 0 && none.pageCount === 1);

console.log(`\n${fail === 0 ? "🎉" : "⚠️"} ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
