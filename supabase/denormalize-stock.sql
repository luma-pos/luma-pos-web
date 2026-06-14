-- ============================================================
-- Denormalize tồn kho: lưu sẵn tổng tồn + định mức vào products để trang Tồn kho
-- đọc thẳng (bỏ GROUP BY/SUM nặng → hết timeout). Trigger tự đồng bộ từ stock_levels
-- nên mọi đường code (nhập/bán/trả/kiểm kho) đều cập nhật đúng, không cần sửa app.
--
-- Chạy 1 lần trong Supabase SQL Editor. An toàn chạy lại.
-- ============================================================

-- 1) Cột denormalize
alter table products add column if not exists total_stock numeric(14,4) not null default 0;
alter table products add column if not exists min_stock   numeric(14,4) not null default 0;

-- 2) Hàm tính lại tồn cho 1 sản phẩm
create or replace function sync_product_stock(p uuid) returns void language sql as $$
  update products set
    total_stock = coalesce((select sum(quantity)  from stock_levels where product_id = p), 0),
    min_stock   = coalesce((select max(min_level) from stock_levels where product_id = p), 0)
  where id = p;
$$;

-- 3) Trigger trên stock_levels: bất kỳ thay đổi tồn nào cũng đồng bộ về products
create or replace function trg_sync_product_stock() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    perform sync_product_stock(old.product_id);
  else
    perform sync_product_stock(new.product_id);
    if tg_op = 'UPDATE' and new.product_id <> old.product_id then
      perform sync_product_stock(old.product_id);
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists stock_levels_sync on stock_levels;
create trigger stock_levels_sync
  after insert or update or delete on stock_levels
  for each row execute function trg_sync_product_stock();

-- 4) Index cho lọc/sắp xếp trang Tồn kho
create index if not exists products_total_stock_idx on products (total_stock);

-- 5) Backfill toàn bộ (tính lại từ stock_levels hiện có)
update products p set
  total_stock = coalesce((select sum(quantity)  from stock_levels where product_id = p.id), 0),
  min_stock   = coalesce((select max(min_level) from stock_levels where product_id = p.id), 0);

-- Kiểm tra nhanh (vài dòng đầu):
-- select id, name, total_stock, min_stock from products limit 5;
