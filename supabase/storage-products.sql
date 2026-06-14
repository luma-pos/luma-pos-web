-- ============================================================
-- Tạo Storage bucket "products" + policies cho upload ảnh sản phẩm
-- Chạy 1 lần trong Supabase Dashboard → SQL Editor → New query → Run
-- (an toàn để chạy lại: dùng on conflict / drop policy if exists)
-- ============================================================

-- 1) Bucket public tên "products"
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

-- 2) Policies trên storage.objects (chỉ áp cho bucket products)
drop policy if exists "products_public_read"        on storage.objects;
drop policy if exists "products_authenticated_write" on storage.objects;
drop policy if exists "products_authenticated_update" on storage.objects;
drop policy if exists "products_authenticated_delete" on storage.objects;

-- Đọc công khai (bucket public → ảnh hiển thị qua getPublicUrl)
create policy "products_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'products');

-- User đã đăng nhập được upload
create policy "products_authenticated_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'products');

-- ... được sửa
create policy "products_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'products')
  with check (bucket_id = 'products');

-- ... được xóa
create policy "products_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'products');
