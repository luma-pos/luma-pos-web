import { db } from "./index";
import { categories, brands, warehouses } from "./schema";

async function seed() {
  console.log("🌱 Seeding...");

  // Warehouses
  await db.insert(warehouses).values([
    { name: "Kho chính", isDefault: true, address: "Cửa hàng" },
  ]).onConflictDoNothing();

  // Categories cho ngành VLXD
  const cats = [
    { name: "Gạch ốp lát" },
    { name: "Thiết bị vệ sinh" },
    { name: "Thiết bị điện" },
    { name: "Thiết bị nước" },
    { name: "Thiết bị nhà bếp" },
    { name: "Phụ kiện" },
  ];
  await db.insert(categories).values(cats).onConflictDoNothing();

  // Brands phổ biến
  const brandList = [
    "Viglacera", "Đồng Tâm", "Prime", "Taicera",
    "Toto", "Inax", "Caesar", "American Standard",
    "Panasonic", "Schneider", "Sino", "Cadivi",
    "Sơn Hà", "Tân Á", "Đại Thành",
    "Hafele", "Faber", "Bosch",
  ];
  await db.insert(brands).values(brandList.map(name => ({ name }))).onConflictDoNothing();

  console.log("✅ Seeded categories, brands, warehouses");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
