-- ============================================================
-- Index tăng tốc trang Sản phẩm / Thiết lập giá / Tồn kho.
-- Dùng CONCURRENTLY để KHÔNG khóa bảng (chạy được khi app đang chạy).
-- Chạy trong Supabase SQL Editor (từng câu một nếu báo lỗi "cannot run inside a transaction block").
-- An toàn chạy lại: IF NOT EXISTS.
-- ============================================================

-- Danh sách SP: lọc đang bán + sắp theo ngày tạo
create index concurrently if not exists products_active_created_idx
  on products (is_active, created_at);

-- Tra giá theo nhóm SP đang hiển thị (trang Thiết lập giá)
create index concurrently if not exists product_prices_product_idx
  on product_prices (product_id);
