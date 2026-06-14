# Sales Mgmt — Mobile (Expo)

App mobile bằng **Expo + expo-router**, dùng **chung backend Supabase** với web (cùng project, cùng anon key). Nằm trong monorepo `sales-mgmt/mobile`, độc lập với app web (Next.js ở thư mục gốc) — không ảnh hưởng build web.

## Cấu trúc
```
mobile/
  app/
    _layout.tsx            # Stack gốc: index / login / (tabs) / product/[id]
    index.tsx              # cổng vào: có phiên -> /inventory, chưa -> /login
    login.tsx              # đăng nhập (supabase.auth)
    (tabs)/
      _layout.tsx          # 3 tab: Tồn kho · Sản phẩm · Bán hàng (+ nút Đăng xuất)
      inventory.tsx        # danh sách tồn kho (bấm -> chi tiết SP)
      products.tsx         # danh sách SP + giá; nút (+) thêm nhanh vào giỏ
      pos.tsx              # BÁN HÀNG: tìm/thêm SP, sửa SL, chọn hình thức TT, tạo đơn
    product/[id].tsx       # chi tiết SP (giá, tồn) + "Thêm vào giỏ bán hàng"
  lib/
    supabase.ts            # client Supabase (phiên lưu AsyncStorage)
    api.ts                 # gọi API tạo đơn của web (Bearer token) + makeClientId
    cart.ts                # giỏ hàng dùng chung (external store)
    types.ts               # type tối giản (sau nên gen từ supabase)
  app.json, package.json, tsconfig.json, babel.config.js
```

## Kiến trúc đọc/ghi (quan trọng)
- **ĐỌC** (tồn kho, sản phẩm, kho): mobile gọi thẳng Supabase (PostgREST, role `authenticated`) → **bị RLS chặn**, phải chạy `supabase/mobile-rls-policies.sql`.
- **GHI** (tạo đơn POS): mobile **KHÔNG** ghi thẳng DB. Nó gọi API web `POST /api/pos/order` kèm `Authorization: Bearer <access_token>`. API xác thực token rồi chạy **đúng `createOrder` của web** (Drizzle, role postgres) — tái dùng toàn bộ logic tính tiền/trừ kho/công nợ + **idempotent theo `clientId`** (gửi lại cùng clientId → trả về đơn cũ, không nhân đôi). Nhờ vậy **không cần mở quyền ghi RLS**.

## Chạy lần đầu (manual)
```bash
cd mobile
cp .env.example .env        # điền 3 biến: SUPABASE_URL, SUPABASE_ANON_KEY, API_URL
npm install
npx expo install --fix      # căn đúng version RN/Expo theo SDK máy bạn
npx expo start              # mở Expo Go (quét QR) hoặc nhấn i / a để mở simulator
```

`.env` cần:
```
EXPO_PUBLIC_SUPABASE_URL=...        # = NEXT_PUBLIC_SUPABASE_URL của web
EXPO_PUBLIC_SUPABASE_ANON_KEY=...   # = NEXT_PUBLIC_SUPABASE_ANON_KEY của web
EXPO_PUBLIC_API_URL=...             # URL web (Vercel). Dev cùng máy: http://<IP-LAN>:3000 (KHÔNG dùng localhost)
```

## Supabase — BẮT BUỘC chạy 1 lần (SQL Editor)
```
supabase/mobile-rls-policies.sql   # mở SELECT cho products + warehouses (user đã đăng nhập)
```
Chưa chạy thì màn Tồn kho/Sản phẩm trống và POS không tải được kho.

## Đăng nhập
Dùng đúng tài khoản đã tạo cho web (Supabase Auth).

## Định hướng tiếp theo
- Sinh type chuẩn: `npx supabase gen types typescript --project-id tjodugffqvihqwczqsjz > lib/database.types.ts`.
- POS offline trên mobile (queue đơn khi mất mạng + sync — clientId đã sẵn sàng cho việc này).
- Chọn khách hàng / bảng giá trong POS mobile (hiện bán giá lẻ, khách lẻ).
- Khi cần dùng chung types/theme/i18n với web: tách `packages/shared` + bật workspace (cấu hình Metro watchFolders).
- Build app thật: EAS Build (`npx eas build`).
```
Thư mục mobile/.trash/ chứa file cũ đã thay thế — có thể xoá tay.
```
