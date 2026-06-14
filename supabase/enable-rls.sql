-- ============================================================
-- Bật Row-Level Security cho TẤT CẢ bảng trong schema public.
-- Vì sao an toàn cho app này:
--   • App không truy cập dữ liệu qua Supabase client / REST API.
--   • Mọi CRUD đi qua server action + Drizzle (DATABASE_URL, role postgres).
--   • Role chủ bảng (postgres) BỎ QUA RLS → app vẫn chạy như cũ.
--   • anon / authenticated (PostgREST) không có policy → bị từ chối hết.
--     → đóng đúng lỗ hổng "Table publicly accessible".
--
-- KHÔNG dùng FORCE ROW LEVEL SECURITY (sẽ áp cả lên role chủ bảng → hỏng app).
--
-- Chạy 1 lần trong Supabase Dashboard → SQL Editor → Run.
-- An toàn chạy lại nhiều lần.
-- ============================================================

do $$
declare r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', r.tablename);
  end loop;
end $$;

-- Kiểm tra: liệt kê bảng còn TẮT RLS (kỳ vọng: 0 dòng)
-- select tablename from pg_tables t
-- join pg_class c on c.relname = t.tablename
-- where t.schemaname = 'public' and c.relrowsecurity = false;
