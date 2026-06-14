# Deploy lên Vercel

## Chuẩn bị (1 lần)

### 1. Lấy connection string dạng pooler

Supabase Dashboard → project → nút **Connect** (trên cùng) → tab **URI**:

- **Session pooler** (port `5432`, host `aws-*.pooler.supabase.com`) → dùng cho **local** (`bun db:push`, `bun dev`)
- **Transaction pooler** (port `6543`, cùng host) → dùng cho **Vercel** (env `DATABASE_URL`)

> ⚠️ KHÔNG dùng string "Direct connection" (`db.<ref>.supabase.co`) — host này chỉ có IPv6, mạng không có IPv6 sẽ lỗi `getaddrinfo ENOTFOUND`. Pooler hostname có IPv4, chạy được mọi nơi.
>
> Serverless mỗi invocation mở connection mới nên bắt buộc đi qua pooler. Code đã set `prepare: false` + `max: 1` cho production.

### 2. Apply migrations lên Supabase (từ máy local)

```bash
bun db:push   # apply drizzle/0000 → 0003
bun db:seed   # nếu DB mới
```

Migrations KHÔNG chạy lúc deploy — luôn chạy từ local trước khi deploy schema mới.

## Deploy

### Cách A — qua GitHub (khuyến nghị)

1. Push repo lên GitHub
2. [vercel.com/new](https://vercel.com/new) → Import repo → Vercel tự nhận Next.js + bun.lock
3. Khai báo **Environment Variables** (Production + Preview):

   | Tên | Giá trị |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service role key (Sensitive ✓) |
   | `DATABASE_URL` | **pooler string port 6543** (Sensitive ✓) |

4. Deploy. Region đã pin `sin1` (Singapore — cùng region Supabase) trong `vercel.json`.

### Cách B — Vercel CLI

```bash
npm i -g vercel
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production   # pooler 6543
vercel --prod
```

## Sau deploy — checklist

- [ ] Supabase → **Authentication → URL Configuration**: thêm `https://<app>.vercel.app` vào *Site URL* + *Redirect URLs* (không thêm thì login redirect fail)
- [ ] Đăng nhập thử, tạo 1 đơn POS, xem dashboard
- [ ] Link portal khách (`/portal/<token>`) hoạt động không cần đăng nhập
- [ ] In thử hóa đơn A4/A5/K80

## Ghi chú kỹ thuật

- **Build đã verify pass** (compile + TypeScript + prerender 20 trang). Lưu ý build cần đủ 4 env vars (`src/db/index.ts` đọc `DATABASE_URL` lúc import).
- Font dùng system stack (không phụ thuộc Google Fonts lúc build, render tiếng Việt chuẩn).
- `NEXT_DIST_DIR` (tùy chọn): đổi thư mục build output cho CI — Vercel không cần set.
- Khi đổi schema: `bun db:push` từ local **trước**, rồi mới deploy code.
