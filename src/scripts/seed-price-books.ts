/**
 * Seed bảng giá động lần đầu: tạo 4 bảng giá mặc định và chuyển dữ liệu
 * từ các cột giá cũ (wholesale/contractor/agent) sang product_prices.
 *
 * Chạy 1 lần sau khi `bun db:push` tạo bảng price_books / product_prices:
 *   bun run src/scripts/seed-price-books.ts
 *
 * An toàn chạy lại: nếu đã có bảng giá thì thoát, không seed trùng.
 */
import { db } from "../db";
import { priceBooks, productPrices, products } from "../db/schema";

async function main() {
  const existing = await db.select({ id: priceBooks.id }).from(priceBooks).limit(1);
  if (existing.length > 0) {
    console.log("⏭  Đã có bảng giá — bỏ qua seed.");
    return;
  }

  console.log("🌱 Tạo 4 bảng giá mặc định…");
  const [retail, wholesale, contractor, agent] = await db
    .insert(priceBooks)
    .values([
      { name: "Giá lẻ", isDefault: true, sortOrder: 0 },
      { name: "Giá sỉ", sortOrder: 1 },
      { name: "Giá thầu", sortOrder: 2 },
      { name: "Giá đại lý", sortOrder: 3 },
    ])
    .returning({ id: priceBooks.id, name: priceBooks.name });

  // Giá lẻ = retailPrice (đọc trực tiếp, không cần override).
  const rows = await db
    .select({
      id: products.id,
      wholesale: products.wholesalePrice,
      contractor: products.contractorPrice,
      agent: products.agentPrice,
    })
    .from(products);

  const overrides: { priceBookId: string; productId: string; price: string }[] = [];
  for (const r of rows) {
    if (r.wholesale != null) overrides.push({ priceBookId: wholesale.id, productId: r.id, price: r.wholesale });
    if (r.contractor != null) overrides.push({ priceBookId: contractor.id, productId: r.id, price: r.contractor });
    if (r.agent != null) overrides.push({ priceBookId: agent.id, productId: r.id, price: r.agent });
  }

  console.log(`📦 Chuyển ${overrides.length} dòng giá từ cột cũ…`);
  // chèn theo lô để tránh câu lệnh quá lớn
  const CHUNK = 500;
  for (let i = 0; i < overrides.length; i += CHUNK) {
    await db.insert(productPrices).values(overrides.slice(i, i + CHUNK)).onConflictDoNothing();
  }

  console.log(`✅ Xong. Bảng giá: ${retail.name}, ${wholesale.name}, ${contractor.name}, ${agent.name}.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
