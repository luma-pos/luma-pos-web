-- ============================================================
-- Policy đọc cho MOBILE (và mọi client dùng Supabase API).
-- Web đọc DB qua Drizzle (role postgres, bỏ qua RLS) nên không cần policy;
-- nhưng mobile đọc qua PostgREST (role authenticated) → bị RLS chặn hết.
-- Thêm policy SELECT cho user đã đăng nhập trên các bảng mobile cần đọc.
--
-- Chạy trong Supabase SQL Editor. An toàn chạy lại.
-- Mở rộng dần khi mobile cần thêm bảng (customers, orders, ...).
-- ============================================================

-- Sản phẩm / tồn kho (màn Tồn kho)
drop policy if exists "products_auth_select" on products;
create policy "products_auth_select" on products
  for select to authenticated using (true);

-- Kho (màn POS cần chọn kho để tạo đơn)
drop policy if exists "warehouses_auth_select" on warehouses;
create policy "warehouses_auth_select" on warehouses
  for select to authenticated using (true);

-- Khách hàng (tab Khách + embed tên khách trong đơn + công nợ ở Trang chủ)
drop policy if exists "customers_auth_select" on customers;
create policy "customers_auth_select" on customers
  for select to authenticated using (true);

-- Đơn hàng (Trang chủ: doanh thu/đơn mới · tab Đơn hàng · Báo cáo)
drop policy if exists "orders_auth_select" on orders;
create policy "orders_auth_select" on orders
  for select to authenticated using (true);

-- Dòng hàng trong đơn (màn Chi tiết đơn)
drop policy if exists "order_items_auth_select" on order_items;
create policy "order_items_auth_select" on order_items
  for select to authenticated using (true);

-- Nhà cung cấp (tab/màn Nhà cung cấp)
drop policy if exists "suppliers_auth_select" on suppliers;
create policy "suppliers_auth_select" on suppliers
  for select to authenticated using (true);

-- Nhóm hàng (picker khi tạo/sửa sản phẩm)
drop policy if exists "categories_auth_select" on categories;
create policy "categories_auth_select" on categories
  for select to authenticated using (true);

-- Storage: cho user đã đăng nhập UPLOAD ảnh vào bucket "products" (mobile chụp/chọn ảnh)
-- Bucket products là public nên đọc (getPublicUrl) không cần policy.
drop policy if exists "products_bucket_insert" on storage.objects;
create policy "products_bucket_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'products');

-- Sổ quỹ (màn Sổ quỹ — thu/chi)
drop policy if exists "cash_transactions_auth_select" on cash_transactions;
create policy "cash_transactions_auth_select" on cash_transactions
  for select to authenticated using (true);

-- Bảng giá (POS chọn bảng giá để áp giá)
drop policy if exists "price_books_auth_select" on price_books;
create policy "price_books_auth_select" on price_books
  for select to authenticated using (true);

drop policy if exists "product_prices_auth_select" on product_prices;
create policy "product_prices_auth_select" on product_prices
  for select to authenticated using (true);

-- Mẫu in (mobile đọc store name/address/footer/khổ giấy để in chứng từ)
drop policy if exists "print_templates_auth_select" on print_templates;
create policy "print_templates_auth_select" on print_templates
  for select to authenticated using (true);

-- (Tùy chọn) nếu mobile cần đọc tồn theo từng kho:
-- drop policy if exists "stock_levels_auth_select" on stock_levels;
-- create policy "stock_levels_auth_select" on stock_levels
--   for select to authenticated using (true);

-- LƯU Ý: chỉ mở SELECT. Việc ghi (tạo đơn, nhập hàng…) nên đi qua web/server
-- hoặc viết policy/RPC riêng có kiểm soát — KHÔNG mở insert/update/delete tùy tiện.
