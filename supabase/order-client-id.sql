-- ============================================================
-- Khử trùng đơn khi đồng bộ offline: thêm cột orders.client_id (unique).
-- Mỗi đơn từ POS mang 1 client_id; đồng bộ lại không tạo đơn trùng.
-- Chạy 1 lần trong Supabase SQL Editor. An toàn chạy lại.
-- ============================================================

alter table orders add column if not exists client_id varchar(40);

-- unique: cho phép nhiều NULL (đơn cũ không có client_id), nhưng client_id đã có thì không trùng
create unique index if not exists orders_client_id_key on orders (client_id);
